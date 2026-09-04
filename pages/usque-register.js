(() => {
"use strict";

/*
  Browser-side Usque-compatible single-account registration helper.
  - P-256 private key is generated locally with WebCrypto.
  - Only the temporary registration payload / device token / MASQUE public key
    are sent through this site's same-origin _worker.js relay to Cloudflare.
  - No localStorage/sessionStorage is used.
*/

const H2_V4 = "162.159.198.2";

function concatBytes(...parts) {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}

function derLength(n) {
  if (n < 128) return Uint8Array.of(n);
  const bytes = [];
  while (n > 0) { bytes.unshift(n & 255); n >>>= 8; }
  return Uint8Array.of(0x80 | bytes.length, ...bytes);
}

function der(tag, content) {
  return concatBytes(Uint8Array.of(tag), derLength(content.length), content);
}

function b64urlToBytes(s) {
  s = String(s).replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes) {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

function bytesToHex(bytes) {
  return [...bytes].map(v => v.toString(16).padStart(2, "0")).join("");
}

function randomBytes(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

function cfTimestamp(d = new Date()) {
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  const offMin = -d.getTimezoneOffset();
  const sign = offMin >= 0 ? "+" : "-";
  const abs = Math.abs(offMin);
  const oh = Math.floor(abs / 60);
  const om = abs % 60;
  return (
    `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.` +
    `${pad(d.getMilliseconds(),3)}${sign}${pad(oh)}:${pad(om)}`
  );
}

/*
  Go's x509.MarshalECPrivateKey(P-256) returns SEC1 ECPrivateKey DER:
  SEQUENCE {
    INTEGER 1
    OCTET STRING privateKey
    [0] OBJECT IDENTIFIER prime256v1
    [1] BIT STRING uncompressed public key
  }
*/
function buildSec1P256(privateD, x, y) {
  const version = Uint8Array.of(0x02, 0x01, 0x01);
  const privateOctet = der(0x04, privateD);
  const prime256v1Oid = Uint8Array.of(
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07
  );
  const params = der(0xa0, prime256v1Oid);
  const uncompressed = concatBytes(Uint8Array.of(0x04), x, y);
  const bitString = der(0x03, concatBytes(Uint8Array.of(0x00), uncompressed));
  const pub = der(0xa1, bitString);
  return der(0x30, concatBytes(version, privateOctet, params, pub));
}

async function generateMasqueKeyMaterial() {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
  const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const spki = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey));

  const d = b64urlToBytes(jwk.d);
  const x = b64urlToBytes(jwk.x);
  const y = b64urlToBytes(jwk.y);
  if (d.length !== 32 || x.length !== 32 || y.length !== 32) {
    throw new Error("浏览器生成的 P-256 密钥长度异常");
  }

  const sec1 = buildSec1P256(d, x, y);
  return {
    privateKeyB64: bytesToB64(sec1),
    publicKeyB64: bytesToB64(spki)
  };
}

function stripEndpoint(value) {
  let s = String(value || "").trim();
  if (!s) return "";
  const ipv6 = s.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (ipv6) return ipv6[1];
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(s)) return s.replace(/:\d+$/, "");
  return s;
}

async function apiJson(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Usque-Intent": "single-register"
    },
    body: JSON.stringify(body),
    cache: "no-store",
    credentials: "same-origin"
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      data?.errors?.[0]?.message ||
      `HTTP ${res.status}`;
    const err = new Error(String(msg));
    err.status = res.status;
    err.code = data?.code || null;
    err.retryAfter =
      Number(data?.retry_after || 0) ||
      Number.parseInt(res.headers.get("Retry-After") || "0", 10) ||
      0;
    throw err;
  }
  return data;
}

function requireField(obj, path, label) {
  let cur = obj;
  for (const k of path) cur = cur?.[k];
  if (cur === undefined || cur === null || cur === "") {
    throw new Error(`注册响应缺少 ${label}`);
  }
  return cur;
}

async function registerDevice({ deviceName = "Web-Usque", onStep } = {}) {
  const step = (n, msg) => onStep?.(n, msg);

  step(1, "创建 WARP 设备账户…");
  const reg = await apiJson("/api/warp/register", {
    key: bytesToB64(randomBytes(32)),
    serial_number: bytesToHex(randomBytes(8)),
    tos: cfTimestamp()
  });

  const id = requireField(reg, ["id"], "device id");
  const token = requireField(reg, ["token"], "access token");

  step(2, "在浏览器本地生成 P-256 MASQUE 密钥…");
  const keys = await generateMasqueKeyMaterial();

  step(3, "向 Cloudflare enroll MASQUE 公钥…");
  const updated = await apiJson("/api/warp/enroll", {
    id,
    token,
    public_key: keys.publicKeyB64,
    name: String(deviceName || "Web-Usque").slice(0, 64)
  });

  const peer = requireField(updated, ["config", "peers", 0], "MASQUE peer");
  const addresses = requireField(updated, ["config", "interface", "addresses"], "interface addresses");

  const config = {
    private_key: keys.privateKeyB64,
    endpoint_v4: stripEndpoint(peer?.endpoint?.v4),
    endpoint_v6: stripEndpoint(peer?.endpoint?.v6),
    endpoint_h2_v4: H2_V4,
    endpoint_h2_v6: "",
    endpoint_pub_key: requireField(peer, ["public_key"], "endpoint public key"),
    license: updated?.account?.license || reg?.account?.license || "",
    id: updated?.id || id,
    access_token: token,
    ipv4: addresses?.v4 || "",
    ipv6: addresses?.v6 || ""
  };

  if (!config.endpoint_v4 && !config.endpoint_v6) {
    throw new Error("注册成功，但响应中没有可用 MASQUE endpoint");
  }
  if (!config.ipv4 && !config.ipv6) {
    throw new Error("注册成功，但响应中没有 interface address");
  }

  step(4, "完成");
  return config;
}

window.UsqueRegister = {
  registerDevice,
  generateMasqueKeyMaterial,
  cfTimestamp,
  buildSec1P256
};
})();