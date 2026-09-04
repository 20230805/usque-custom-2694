#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Usque / Mihomo WARP Egress Selector v6.5

What it does:
1. Connects to Mihomo's localhost REST API.
2. Enumerates MASQUE nodes.
3. Selects each node in the hidden "出口检测" selector.
4. Sends IP/country probes through the local mixed proxy.
5. Optionally tests ChatGPT HTTP reachability through the AI selector.
6. Ranks nodes by preferred country -> ChatGPT reachability -> latency.
7. Selects the winning node in "地区优选", "PROXY", "AI", optionally all service groups.
8. Writes JSON + CSV reports.

It DOES NOT force Cloudflare WARP to egress from a requested country.
It only selects among the real egress locations observed from your existing nodes.
"""

import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

DEFAULT_GROUPS = [
    "AI","YouTube","Emby","TikTok","Netflix","Disney","Spotify","GitHub",
    "Telegram","Google","Twitter","Instagram","Facebook","Apple","Microsoft",
    "Steam","Xbox","PlayStation","Nintendo","Porn","国外网站","🐟 漏网之鱼",
]

COUNTRY_NAMES = {
    "US":"美国","SG":"新加坡","JP":"日本","HK":"香港","TW":"台湾","KR":"韩国",
    "GB":"英国","DE":"德国","FR":"法国","NL":"荷兰","CA":"加拿大","AU":"澳大利亚",
    "CH":"瑞士","SE":"瑞典","FI":"芬兰","IT":"意大利","ES":"西班牙","PL":"波兰",
    "BR":"巴西","IN":"印度","ID":"印度尼西亚","MY":"马来西亚","TH":"泰国","VN":"越南",
}

def controller_request(base, path, method="GET", data=None, secret="", timeout=8):
    url = base.rstrip("/") + path
    headers = {"Accept": "application/json"}
    if secret:
        headers["Authorization"] = "Bearer " + secret
    body = None
    if data is not None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
        if not raw:
            return None
        return json.loads(raw.decode("utf-8", "replace"))

def select_proxy(base, group, node, secret):
    path = "/proxies/" + urllib.parse.quote(group, safe="")
    controller_request(base, path, method="PUT", data={"name": node}, secret=secret)

def delay_test(base, node, secret, timeout_ms=6000):
    path = "/proxies/{}/delay?url={}&timeout={}".format(
        urllib.parse.quote(node, safe=""),
        urllib.parse.quote("http://cp.cloudflare.com/generate_204", safe=""),
        int(timeout_ms),
    )
    try:
        data = controller_request(base, path, secret=secret, timeout=max(8, timeout_ms / 1000 + 3))
        return int((data or {}).get("delay") or 0)
    except Exception:
        return 0

def proxy_opener(proxy_url):
    return urllib.request.build_opener(
        urllib.request.ProxyHandler({"http": proxy_url, "https": proxy_url})
    )

def http_probe(opener, url, timeout=10, headers=None):
    hdr = {
        "User-Agent": "Mozilla/5.0 Usque-Egress-Selector/6.5",
        "Accept": "*/*",
    }
    if headers:
        hdr.update(headers)
    req = urllib.request.Request(url, headers=hdr, method="GET")
    try:
        with opener.open(req, timeout=timeout) as resp:
            body = resp.read(512 * 1024).decode("utf-8", "replace")
            return resp.status, body, dict(resp.headers)
    except urllib.error.HTTPError as e:
        body = e.read(512 * 1024).decode("utf-8", "replace")
        return e.code, body, dict(e.headers)
    except Exception as e:
        return 0, str(e), {}

def parse_cf_trace(text):
    out = {}
    for line in text.splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip()
    return out

def detect_location(opener):
    result = {
        "ip": "", "country": "", "region": "", "city": "", "colo": "", "org": "",
        "location_source": "",
    }

    # Cloudflare trace is lightweight and usually reliable for loc/colo/ip.
    status, body, _ = http_probe(opener, "https://www.cloudflare.com/cdn-cgi/trace", timeout=10)
    if 200 <= status < 400:
        t = parse_cf_trace(body)
        result["ip"] = t.get("ip", "")
        result["country"] = t.get("loc", "").upper()
        result["colo"] = t.get("colo", "")
        result["location_source"] = "cloudflare-trace"

    # Enrich with city/region/org if ipinfo is available.
    status2, body2, _ = http_probe(opener, "https://ipinfo.io/json", timeout=10)
    if 200 <= status2 < 400:
        try:
            j = json.loads(body2)
            result["ip"] = j.get("ip") or result["ip"]
            result["country"] = (j.get("country") or result["country"]).upper()
            result["region"] = j.get("region") or ""
            result["city"] = j.get("city") or ""
            result["org"] = j.get("org") or ""
            result["location_source"] = "ipinfo+cloudflare"
        except Exception:
            pass
    return result

def test_chatgpt(opener):
    status, body, _ = http_probe(
        opener,
        "https://chatgpt.com/",
        timeout=12,
        headers={"Accept": "text/html,application/xhtml+xml"},
    )
    low = body.lower()
    blocked_markers = [
        "unsupported_country",
        "unable to load site",
        "if you are using a vpn",
        "access denied",
    ]
    blocked = any(x in low for x in blocked_markers)
    # 403 can be a challenge/anti-bot response, so keep the raw status in report.
    ok = (200 <= status < 400) and not blocked
    return ok, status, ("blocked-marker" if blocked else "")

def get_raw_nodes(proxies):
    out = []
    for name, info in proxies.items():
        typ = str((info or {}).get("type", "")).lower()
        if typ == "masque":
            out.append(name)
    if out:
        return out

    # Fallback: use members of the hidden detection group, excluding groups/builtins.
    detector = proxies.get("出口检测") or {}
    candidates = detector.get("all") or []
    group_types = {"selector","urltest","fallback","loadbalance"}
    for name in candidates:
        info = proxies.get(name) or {}
        typ = str(info.get("type", "")).lower()
        if typ not in group_types and name not in {"DIRECT","REJECT","PASS","COMPATIBLE"}:
            out.append(name)
    return out

def rank_key(row, preferred, chatgpt_first):
    country = row.get("country", "")
    try:
        country_rank = preferred.index(country)
    except ValueError:
        country_rank = len(preferred) + (0 if not preferred else 10)

    chatgpt_rank = 0 if row.get("chatgpt_ok") else 1
    if not chatgpt_first:
        chatgpt_rank = 0

    delay = row.get("delay_ms") or 999999
    alive_rank = 0 if row.get("probe_ok") else 1
    return (alive_rank, country_rank, chatgpt_rank, delay)

def safe_select(base, proxies, group, node, secret):
    info = proxies.get(group)
    if not info:
        return False
    members = info.get("all") or []
    if node not in members:
        return False
    try:
        select_proxy(base, group, node, secret)
        return True
    except Exception:
        return False

def main():
    ap = argparse.ArgumentParser(description="Detect and select real WARP egress locations for Mihomo MASQUE nodes.")
    ap.add_argument("--controller", default="http://127.0.0.1:9090")
    ap.add_argument("--secret", default="")
    ap.add_argument("--proxy", default="http://127.0.0.1:7890")
    ap.add_argument("--prefer", default="", help="Country codes in priority order, e.g. US,SG,JP")
    ap.add_argument("--chatgpt-first", action="store_true")
    ap.add_argument("--apply-all", action="store_true")
    ap.add_argument("--no-apply", action="store_true")
    ap.add_argument("--config", default="", help="Optional JSON preferences file")
    ap.add_argument("--sleep", type=float, default=0.45, help="Pause between node switches")
    args = ap.parse_args()

    if args.config:
        try:
            with open(args.config, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            args.controller = cfg.get("controller") or args.controller
            args.secret = cfg.get("secret") or args.secret
            args.proxy = cfg.get("proxy") or args.proxy
            if cfg.get("preferred_countries"):
                args.prefer = ",".join(cfg["preferred_countries"])
            if cfg.get("chatgpt_first") is not None:
                args.chatgpt_first = bool(cfg["chatgpt_first"])
            if cfg.get("apply_all") is not None:
                args.apply_all = bool(cfg["apply_all"])
        except Exception as e:
            print("[WARN] 无法读取配置文件：", e)

    preferred = [x.strip().upper() for x in args.prefer.split(",") if x.strip()]
    print("=== Usque / Mihomo WARP 出口检测器 v6.5 ===")
    print("Controller:", args.controller)
    print("Local Proxy:", args.proxy)
    print("Preferred:", preferred or ["ANY"])
    print("ChatGPT first:", args.chatgpt_first)
    print()

    try:
        data = controller_request(args.controller, "/proxies", secret=args.secret)
    except Exception as e:
        print("[ERROR] 无法连接 Mihomo Controller:", e)
        print("请检查 Clash/Mihomo 是否正在运行，以及 Controller 地址/Secret 是否正确。")
        sys.exit(2)

    proxies = (data or {}).get("proxies") or {}
    nodes = get_raw_nodes(proxies)
    if not nodes:
        print("[ERROR] 没找到 MASQUE 节点。请先加载 v6.5 生成的 Clash 配置。")
        sys.exit(3)

    print(f"检测到 {len(nodes)} 个 MASQUE 节点。")
    opener = proxy_opener(args.proxy)
    rows = []

    for i, node in enumerate(nodes, 1):
        print(f"[{i}/{len(nodes)}] {node}")
        row = {
            "node": node,
            "delay_ms": 0,
            "ip": "",
            "country": "",
            "country_name": "",
            "region": "",
            "city": "",
            "colo": "",
            "org": "",
            "chatgpt_ok": False,
            "chatgpt_status": 0,
            "probe_ok": False,
            "error": "",
        }
        try:
            select_proxy(args.controller, "出口检测", node, args.secret)
            time.sleep(max(0.1, args.sleep))

            row["delay_ms"] = delay_test(args.controller, node, args.secret)

            loc = detect_location(opener)
            row.update(loc)
            row["country_name"] = COUNTRY_NAMES.get(row["country"], row["country"])
            row["probe_ok"] = bool(row.get("ip") or row.get("country"))

            # ChatGPT domain is routed to AI, so point AI directly at the same raw node for the test.
            if proxies.get("AI") and node in (proxies["AI"].get("all") or []):
                select_proxy(args.controller, "AI", node, args.secret)
                time.sleep(max(0.1, args.sleep / 2))
                ok, status, marker = test_chatgpt(opener)
                row["chatgpt_ok"] = ok
                row["chatgpt_status"] = status
                if marker:
                    row["chatgpt_note"] = marker

        except Exception as e:
            row["error"] = str(e)

        print(
            "   IP={}  {} {} {}  colo={}  delay={}ms  ChatGPT={}({})".format(
                row.get("ip") or "-",
                row.get("country") or "-",
                row.get("region") or "",
                row.get("city") or "",
                row.get("colo") or "-",
                row.get("delay_ms") or "-",
                "OK" if row.get("chatgpt_ok") else "NO",
                row.get("chatgpt_status") or "-",
            )
        )
        rows.append(row)

    rows_sorted = sorted(rows, key=lambda r: rank_key(r, preferred, args.chatgpt_first))
    best = rows_sorted[0] if rows_sorted else None

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    json_name = f"warp-egress-report-{stamp}.json"
    csv_name = f"warp-egress-report-{stamp}.csv"

    with open(json_name, "w", encoding="utf-8") as f:
        json.dump(
            {
                "generated_at_utc": datetime.now(timezone.utc).isoformat(),
                "preferred_countries": preferred,
                "chatgpt_first": args.chatgpt_first,
                "best": best,
                "results": rows_sorted,
            },
            f, ensure_ascii=False, indent=2
        )

    fields = [
        "node","delay_ms","ip","country","country_name","region","city","colo","org",
        "chatgpt_ok","chatgpt_status","probe_ok","error"
    ]
    with open(csv_name, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for row in rows_sorted:
            w.writerow(row)

    print()
    print("=== 检测完成 ===")
    print("JSON:", json_name)
    print("CSV :", csv_name)

    # Country summary
    counts = {}
    for r in rows:
        c = r.get("country") or "UNKNOWN"
        counts[c] = counts.get(c, 0) + 1
    print("出口分布:", ", ".join(f"{k}:{v}" for k,v in sorted(counts.items())))

    if best:
        print()
        print("最佳候选:")
        print("  节点:", best["node"])
        print("  出口:", best.get("country"), best.get("region"), best.get("city"))
        print("  IP  :", best.get("ip"))
        print("  Colo:", best.get("colo"))
        print("  Delay:", best.get("delay_ms"), "ms")
        print("  ChatGPT:", best.get("chatgpt_ok"), "HTTP", best.get("chatgpt_status"))

    if best and not args.no_apply:
        chosen = best["node"]
        # Refresh proxy state before applying.
        latest = controller_request(args.controller, "/proxies", secret=args.secret)
        pmap = (latest or {}).get("proxies") or {}

        selected = []
        for group in ["地区优选", "PROXY", "AI"]:
            if safe_select(args.controller, pmap, group, chosen, args.secret):
                selected.append(group)

        if args.apply_all:
            for group in DEFAULT_GROUPS:
                if safe_select(args.controller, pmap, group, chosen, args.secret):
                    selected.append(group)

        print()
        print("[APPLY] 已把最佳节点应用到:", ", ".join(selected) if selected else "(无可写策略组)")
        print("[APPLY] 节点:", chosen)
    else:
        print("[INFO] --no-apply 已启用，仅检测，不修改策略组。")

if __name__ == "__main__":
    main()
