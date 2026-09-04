# Usque MASQUE Pro v6.7 — Pages + Workers 双部署版

这个 ZIP 解压后有两个目录：

```text
pages/
workers/
```

## 方案 A：Cloudflare Pages

进入：

```text
pages/
```

把该目录中的文件作为 Pages 项目部署。

结构保持原来的：

```text
index.html
style.css
app.js
usque-register.js
_worker.js
_routes.json
_headers
warp-egress-selector.py
```

`_routes.json` 让 `/api/*` 才进入 `_worker.js`，静态首页直接由 Pages 提供。

## 方案 B：Cloudflare Workers

进入：

```text
workers/
```

Windows 最简单：

```text
双击 deploy-windows.bat
```

或者命令行：

```bash
npm install
npx wrangler login
npx wrangler deploy
```

Workers 版使用 Cloudflare 当前的 **Workers Static Assets**：

```text
public/*      → 静态页面
/api/*        → src/worker.js
```

## 功能完全一致

两种部署方式都保留 v6.6/v6.7 全部功能：

- Usque 一键注册
- 原始 config.json 自动保存 / 复用
- 13 / 32 / 64 / 100 / 500 节点
- QUIC / H2
- H2 大地址池
- Clash / Mihomo
- Shadowrocket
- sing-box
- VLESS 本地桥接
- 完整智能分流
- AI / ChatGPT DIRECT 简单模式
- 高级 WARP 出口国家检测
- 操作成功 / 失败 Toast

## 建议

如果你只是继续使用当前项目：

```text
Pages → 最省事
```

如果你希望以后把前端和 API 统一为一个 Worker 项目：

```text
Workers → 更适合继续维护
```
