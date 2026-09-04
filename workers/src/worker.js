/**
 * Usque MASQUE Pro v6.7 - Cloudflare Workers edition
 *
 * Static frontend: Workers Static Assets (./public)
 * API routes: /api/health, /api/warp/register, /api/warp/enroll
 *
 * Do not put secrets in this source file.
 */

const API_ORIGIN = "https://api.cloudflareclient.com";
const API_VERSION = "v0a4471";

const CF_HEADERS = {
  "User-Agent": "WARP for Android",
  "CF-Client-Version": "a-6.35-4471",
  "Content-Type": "application/json; charset=UTF-8",
  "Accept": "application/json"
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra
    }
  });
}

function allowedSameOrigin(request) {
  const target = new URL(request.url);
  const origin = request.headers.get("Origin");

  if (origin) {
    try {
      if (new URL(origin).origin !== target.origin) return false;
    } catch {
      return false;
    }
  }

  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin" && site !== "none") return false;
  return true;
}

async function readSmallJson(request) {
  const type = request.headers.get("Content-Type") || "";
  if (!type.toLowerCase().includes("application/json")) {
    throw new Error("Content-Type 必须为 application/json");
  }

  const text = await request.text();
  if (text.length > 16384) throw new Error("请求体过大");

  try {
    return JSON.parse(text || "{}");
  } catch {
    throw new Error("JSON 格式无效");
  }
}

function validB64(s, max = 4096) {
  return typeof s === "string" &&
    s.length > 0 &&
    s.length <= max &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(s);
}

async function upstreamJson(url, init) {
  let res;
  try {
    res = await fetch(url, init);
  } catch (e) {
    return json({
      message: "无法连接 Cloudflare WARP 上游 API",
      detail: String(e?.message || e)
    }, 502);
  }

  const body = await res.text();
  const retryAfterHeader = res.headers.get("Retry-After");
  const retryAfter = Math.max(
    0,
    Number.parseInt(retryAfterHeader || "0", 10) || 0
  );

  // Cloudflare's 1015 page may be HTML/plain text rather than JSON.
  const is1015 =
    res.status === 429 ||
    /\b1015\b/i.test(body) ||
    /rate\s*limit/i.test(body);

  if (is1015) {
    const wait = retryAfter || 30;
    return json({
      error: "rate_limited",
      code: 1015,
      retry_after: wait,
      message: `Cloudflare WARP 注册接口触发限流，请等待 ${wait} 秒后再试。不要连续点击注册。`
    }, 429, {
      "Retry-After": String(wait)
    });
  }

  const headers = {
    "Content-Type": res.headers.get("Content-Type") || "application/json; charset=UTF-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  };
  if (retryAfterHeader) headers["Retry-After"] = retryAfterHeader;

  return new Response(body, {
    status: res.status,
    headers
  });
}
async function relayRegister(request) {
  if (!allowedSameOrigin(request)) {
    return json({ message: "跨站请求已拒绝" }, 403);
  }

  if (request.headers.get("X-Usque-Intent") !== "single-register") {
    return json({ message: "缺少注册意图标记" }, 400);
  }

  let b;
  try {
    b = await readSmallJson(request);
  } catch (e) {
    return json({ message: e.message }, 400);
  }

  if (!validB64(b.key, 256)) {
    return json({ message: "key 无效" }, 400);
  }

  if (!/^[0-9a-f]{16}$/i.test(String(b.serial_number || ""))) {
    return json({ message: "serial_number 无效" }, 400);
  }

  if (typeof b.tos !== "string" || b.tos.length < 20 || b.tos.length > 64) {
    return json({ message: "tos 时间无效" }, 400);
  }

  const payload = {
    key: b.key,
    install_id: "",
    fcm_token: "",
    tos: b.tos,
    model: "PC",
    serial_number: b.serial_number,
    os_version: "",
    key_type: "curve25519",
    tunnel_type: "wireguard",
    locale: "en_US"
  };

  return upstreamJson(`${API_ORIGIN}/${API_VERSION}/reg`, {
    method: "POST",
    headers: CF_HEADERS,
    body: JSON.stringify(payload),
    redirect: "manual"
  });
}

async function relayEnroll(request) {
  if (!allowedSameOrigin(request)) {
    return json({ message: "跨站请求已拒绝" }, 403);
  }

  if (request.headers.get("X-Usque-Intent") !== "single-register") {
    return json({ message: "缺少注册意图标记" }, 400);
  }

  let b;
  try {
    b = await readSmallJson(request);
  } catch (e) {
    return json({ message: e.message }, 400);
  }

  const id = String(b.id || "");
  const token = String(b.token || "");
  const publicKey = String(b.public_key || "");
  const name = String(b.name || "Web-Usque").slice(0, 64);

  if (!/^[A-Za-z0-9._:-]{4,256}$/.test(id)) {
    return json({ message: "device id 无效" }, 400);
  }

  if (token.length < 8 || token.length > 4096 || /[\r\n]/.test(token)) {
    return json({ message: "token 无效" }, 400);
  }

  if (!validB64(publicKey, 4096)) {
    return json({ message: "P-256 public_key 无效" }, 400);
  }

  const payload = {
    key: publicKey,
    key_type: "secp256r1",
    tunnel_type: "masque",
    name
  };

  return upstreamJson(
    `${API_ORIGIN}/${API_VERSION}/reg/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        ...CF_HEADERS,
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
      redirect: "manual"
    }
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Quick deployment test:
    // https://YOUR-PROJECT.pages.dev/api/health
    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "usque-register-relay",
        worker: "running"
      });
    }

    if (url.pathname === "/api/warp/register") {
      if (request.method !== "POST") {
        return json({ message: "Method Not Allowed" }, 405, { "Allow": "POST" });
      }
      return relayRegister(request);
    }

    if (url.pathname === "/api/warp/enroll") {
      if (request.method !== "POST") {
        return json({ message: "Method Not Allowed" }, 405, { "Allow": "POST" });
      }
      return relayEnroll(request);
    }

    // With assets.run_worker_first set to ["/api/*"], normal files are
    // served directly by Workers Static Assets. This fallback keeps the
    // project robust if routing settings are changed later.
    if (env?.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return json({ message: "Not Found" }, 404);
  }
};