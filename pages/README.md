# v6.7 Pages 版

Pages 目录可直接按原来的方式上传 Cloudflare Pages。

---

# Usque MASQUE Pro v6.6 — AI 简单模式

## v6.6 最重要变化

不再要求新手为了 ChatGPT 去跑 WARP 国家扫描。

默认：

```text
ChatGPT / OpenAI
        ↓
DIRECT

其它 AI
        ↓
AI 策略组

YouTube / Netflix / Google / Telegram...
        ↓
原有 WARP / MASQUE 分流
```

网页新增：

```text
🤖 ChatGPT / OpenAI 最简单出口设置

ChatGPT / OpenAI 出口：
- DIRECT 直连（默认/推荐）
- WARP · AI 自动选择
- WARP · 地区优选
- WARP · PROXY
- AI 策略组

其它 AI 服务：
- AI 策略组
- DIRECT
- PROXY
- 地区优选
```

### 默认规则

```yaml
- DOMAIN-SUFFIX,chatgpt.com,DIRECT
- DOMAIN-SUFFIX,openai.com,DIRECT
- DOMAIN-SUFFIX,oaistatic.com,DIRECT
- DOMAIN-SUFFIX,oaiusercontent.com,DIRECT
- DOMAIN-SUFFIX,oaistatsig.com,DIRECT
- DOMAIN-SUFFIX,openaimerge.com,DIRECT
- DOMAIN-SUFFIX,workos.com,DIRECT
- DOMAIN-SUFFIX,workoscdn.com,DIRECT
- DOMAIN,challenges.cloudflare.com,DIRECT
```

其它 AI：

```yaml
- RULE-SET,category-ai-!cn,AI
```

## 为什么更简单

如果你本地正常网络本身能访问 ChatGPT，那么：

```text
ChatGPT → DIRECT
```

通常比：

```text
ChatGPT → WARP → 扫 64/100 个节点 → 找国家出口
```

简单得多。

国家出口检测功能没有删除，只是移到：

```text
高级：WARP 出口国家 / 地区检测与优选（可选）
```

默认折叠。

## 推荐使用

普通新手：

```text
ChatGPT / OpenAI 出口 → DIRECT
其它 AI → AI
节点数量 → 13 或 32
完整智能分流 → 开
```

如果 DIRECT 不可用：

```text
ChatGPT / OpenAI 出口 → AI自动选择
```

再不行：

```text
打开高级 WARP 出口检测
```

使用国家 / ChatGPT 可达性扫描器。

## 仍然保留

- 原生 Usque config.json
- Clash / Mihomo
- Shadowrocket
- sing-box
- VLESS 本地桥接
- 13 / 32 / 64 / 100 / 500 节点
- QUIC / H2
- H2 大地址池
- 自动测速
- AI 专用测速
- Emby / YouTube / TikTok / Netflix 等图标分流
- WARP 出口国家检测
- JSON / CSV 报告
- 操作 Toast 提示


---

# Usque MASQUE Pro v6.5 — WARP 出口国家 / 地区检测与优选

## 先说结论

普通 Cloudflare WARP / Usque MASQUE **不能通过一个参数直接强制指定美国、日本、新加坡等出口国家**。

v6.5 做的是更实际的方案：

```text
生成很多 MASQUE 候选节点
        ↓
Mihomo 正常运行
        ↓
本地检测器逐个切换节点
        ↓
实际查询出口 IP / 国家 / 地区 / Cloudflare PoP
        ↓
测试 ChatGPT HTTP 可达性
        ↓
按“首选国家 → 备用国家 → ChatGPT → 延迟”排序
        ↓
自动设置 地区优选 / PROXY / AI
```

所以“美国优选”表示：

```text
从你当前真正检测到的美国 WARP 出口里选最好的一条
```

而不是：

```text
要求 Cloudflare 必须给你一个美国出口
```

---

## v6.5 新增网页设置

```text
首选出口国家 / 地区
备用出口 1
备用出口 2

Mihomo Controller
Controller Secret
本地 Mixed Proxy

优先 ChatGPT 可达节点
将优选出口应用到全部服务分组
生成 Clash 时启用本机 Controller API
```

支持常用地区：

```text
US 美国
SG 新加坡
JP 日本
HK 香港
TW 台湾
KR 韩国
GB 英国
DE 德国
FR 法国
NL 荷兰
CA 加拿大
AU 澳大利亚
```

---

## Clash 配置新增两个组

### 地区优选

可见：

```text
地区优选
```

包含所有原始 MASQUE 节点。

检测脚本完成后，会把它切换到最符合你国家偏好的节点。

### 出口检测

隐藏：

```text
出口检测
```

脚本通过 Mihomo Controller API 临时切换这个组，然后让：

```text
ipinfo.io
www.cloudflare.com/cdn-cgi/trace
```

走当前被测节点。

不会影响你正常的 YouTube / Netflix 等分流。

---

## 本机 Controller

生成 Clash 配置时默认加入：

```yaml
external-controller: 127.0.0.1:9090
secret: ""
```

只监听本机地址。

如果 Clash Verge Rev 覆写了 Controller 地址或 Secret，请在网页“WARP 出口国家 / 地区检测与优选”中填写 Clash Verge 实际使用的 Controller。

Mihomo REST API 支持：

```text
GET /proxies
PUT /proxies/<group>
GET /proxies/<node>/delay
```

检测器就是通过这些官方 API 完成节点切换和延迟测试。

---

## 使用步骤

### 1. 生成 Clash

网页选择：

```text
Clash / Mihomo
```

下载并导入。

建议先用：

```text
64 或 100 节点
自动测速选择：开启
AI 专用测速：ChatGPT
```

### 2. 启动 Clash / Mihomo

确保本地 Mixed Proxy 和 Controller 正常。

网页默认：

```text
Mixed Proxy:
http://127.0.0.1:7890

Controller:
http://127.0.0.1:9090
```

如果 Clash Verge 使用其它端口，请改成实际值。

### 3. 下载

网页点击：

```text
下载出口检测脚本
下载 Windows 一键检测 BAT
```

把：

```text
warp-egress-selector.py
run-warp-egress-selector.bat
```

放同一文件夹。

Windows 安装 Python 3 后双击 BAT。

### 4. 检测结果

会生成：

```text
warp-egress-report-日期时间.json
warp-egress-report-日期时间.csv
```

每个节点包含：

```text
节点名称
延迟
出口 IP
国家
地区
城市
Cloudflare colo / PoP
运营组织
ChatGPT HTTP 状态
ChatGPT 可达结果
```

### 5. 自动应用

默认把最佳节点应用到：

```text
地区优选
PROXY
AI
```

如果勾选：

```text
将优选出口应用到全部服务分组
```

还会尝试设置：

```text
YouTube
Emby
TikTok
Netflix
Disney
Spotify
GitHub
Telegram
Google
Twitter
Instagram
Facebook
Apple
Microsoft
Steam
Xbox
PlayStation
Nintendo
国外网站
漏网之鱼
```

---

## ChatGPT 注意

脚本对 `https://chatgpt.com/` 做 HTTP 可达性测试。

但 ChatGPT / Cloudflare 还可能根据：

```text
浏览器环境
登录状态
Cookie
风控
IP 信誉
地区支持
```

做进一步判断。

所以脚本的 `chatgpt_ok` 是非常有用的网络层筛选指标，但不能保证登录后的所有 ChatGPT 功能一定可用。

---

## 文件

Cloudflare Pages ZIP 包含：

```text
README.md
_headers
_routes.json
_worker.js
app.js
index.html
style.css
usque-register.js
warp-egress-selector.py
```


---

# v6.4 — 全节点分流 + AI 专用选择

## 为什么以前 AI / YouTube 只有 3 个

v6.3 的服务策略组结构是：

```text
AI
├─ 自动选择
├─ PROXY
└─ DIRECT
```

所以 Clash Verge 右侧显示 `3`。

v6.4 改成：

```text
AI
├─ AI自动选择
├─ 自动选择
├─ PROXY
├─ 原始 MASQUE 节点 01
├─ 原始 MASQUE 节点 02
├─ ...
└─ DIRECT
```

因此如果生成 64 个原始节点，AI / YouTube / Netflix 等策略组会有约 67～68 个可选项。

这更接近 m2c 风格，也方便手动逐个切换节点测试。

## 新增 Emby

新增：

```text
Emby 策略组
category-emby.mrs
Emby 图标
```

## ChatGPT / OpenAI

新增 `AI自动选择`：

```yaml
type: url-test
url: https://chatgpt.com/
expected-status: 200-399
```

它只在真正能够以预期 HTTP 状态访问 ChatGPT 时把节点视为可用。

同时显式加入 OpenAI 官方网络域名相关规则：

```text
chatgpt.com
openai.com
oaistatic.com
oaiusercontent.com
oaistatsig.com
openaimerge.com
workos.com
workoscdn.com
challenges.cloudflare.com
```

这些都统一走 AI 策略组。

### 重要限制

如果你的 WARP 出口 IP 本身被 ChatGPT 拒绝：

```text
Unable to load site
If you are using a VPN, try turning it off
```

那么“规则匹配正确”也不能把这个出口变成可用出口。

此时进入：

```text
Clash Verge
→ 代理
→ AI
```

手动切换不同原始 MASQUE 节点，观察是否有某个入口对应的 WARP 出口可以正常访问。

如果所有节点都失败，问题是 WARP 出口，而不是分流规则数量。


---

# v6.3 — 解决 VLESS -1 + H2 100～500 节点

## VLESS 为什么显示 -1

网页生成的是：

```text
vless://...@127.0.0.1:2081
```

`127.0.0.1` 是本机地址。

它不是一个 Cloudflare 远程 VLESS 节点。

必须先运行：

```text
v2rayN
  ↓
127.0.0.1:2081
  ↓
sing-box VLESS inbound
  ↓
127.0.0.1:1080
  ↓
Usque SOCKS
  ↓
Cloudflare WARP MASQUE
```

所以没有运行 `usque.exe` 和 `sing-box.exe` 时，测速显示 `-1` 是正常结果。

v6.3 新增：

```text
下载 Windows 一键启动 BAT
```

把下面文件放在同一个目录：

```text
usque.exe
sing-box.exe
usque-config.json
usque-vless-bridge.json
start-usque-vless-windows.bat
```

双击 BAT，再去 v2rayN 测速。

---

## 为什么 v6.2 只有 49 个节点

你截图的设置相当于：

```text
7 个唯一 Endpoint × 7 个 Port = 49
```

自动去重开启，所以不会复制同一个 Endpoint:Port 来凑 64。

## v6.3 QUIC 节点池

补充了当前公开实测项目使用的 QUIC MASQUE 候选：

```text
162.159.198.1
162.159.198.2

2606:4700:103::1
2606:4700:103::2
2606:4700:104::1
2606:4700:104::2
```

再叠加 config.json 返回的 endpoint 和可选社区测试 Endpoint。

QUIC 节点数量仍然受到真实可用入口数量限制。

---

## 100～500 节点：使用 H2 扩展池

当前公开测试项目 warpscout 将 H2 IPv4 MASQUE 池定义为：

```text
162.159.198.0/24
162.159.199.0/24
```

v6.3 在：

```text
网络 / 传输
→ H2 / TCP（支持 100～500 节点扩展池）
```

时，会从这两个地址池生成不同 IP:Port 候选。

端口：

```text
443
500
1701
4500
4443
8443
8095
```

所以候选数量远高于 500。

建议：

```text
13 / 32：QUIC
64：QUIC 扩展或 H2
100：H2
200～500：H2，只适合大规模测速筛选
```

节点多不代表全部都能在你的网络中连接，必须配合 Clash/Mihomo `url-test` 自动测速。


---

# Usque MASQUE Pro v6.2 — 节点数量增强版

## v6.2 新增

节点数量可直接选择：

```text
精选 13 节点
增强 32 节点
全量 64 节点
超全量 100 节点
自定义 1～500
```

新增节点生成策略：

```text
均衡分布
Endpoint × Port 全排列
全排列后稳定打散
```

新增：

```text
附加 Endpoint
节点自动去重
唯一组合不足提示
```

### 重要：不会用重复节点凑数量

真实可生成数量取决于：

```text
唯一 Endpoint × 唯一 Port
```

例如当前只有 9 个 Endpoint、7 个端口：

```text
9 × 7 = 63 个唯一节点
```

即使你选择 100，网页也只生成真实的唯一组合，并提示：

```text
目标 100，当前只有 63 个唯一组合
```

要达到 100+，可以在“附加 Endpoint”中加入你自己已经验证可用的更多 MASQUE Endpoint。

自定义数量最高允许填写：

```text
500
```

但这只是输出数量上限，不会复制相同 Endpoint:Port 伪造节点。

推荐：

- 日常使用：13
- 更高覆盖：32
- 批量测速：64
- 大规模测试：100
- 200～500：仅建议在你有大量真实 Endpoint 时使用

---

# v6.1 — 操作反馈增强版

新增：每个高级设置修改后都会提示“已修改，尚未应用”；点击“应用设置并重新生成”后会明确显示成功/失败、当前节点数量和传输模式。导入、预设、恢复、格式切换、复制、下载也都会弹出 Toast 提示。

---

# Usque MASQUE Pro v6.0

这是按 `m2c.pages.dev/custom` 截图结构重新扩展的版本，并在此基础上继续增加功能。

## 页面结构

```text
第 1 步：Usque 一键注册
第 2 步：原生 config.json 导入 / 复用
第 3 步：高级自定义设置
第 4 步：多格式转换
```

## 自定义项目

### Endpoint

- IPv4 + IPv6 多端点自动选择
- 仅 IPv4
- 仅 IPv6
- config.json 原始 Endpoint
- 162.159.198.2
- 162.159.199.2
- 2606:4700:103::2
- 2606:4700:104::2
- masque.bestcf.eu.cc
- masque1.bestcf.eu.cc
- masque2.bestcf.eu.cc
- 162.159.198.1
- 162.159.199.1
- 自定义 Endpoint

### 端口

- 推荐组合：500 / 4500 / 8095 / 443
- 全部常用：443 / 500 / 1701 / 4500 / 4443 / 8095 / 8443
- 任意单端口
- 自定义端口

### SNI

内置：

- Microsoft
- Wikipedia
- Unilever
- Luckin Coffee
- 澳门大学
- 香港大学
- 南洋理工
- Harvard
- MIT
- Stanford
- jsDelivr
- Speedtest
- Cloudflare 官网
- Cloudflare Speed
- cloudflare.dev
- research.cloudflare.com
- consumer-masque.cloudflareclient.com
- zt-masque.cloudflareclient.com
- 自定义

### DNS

包含 Cloudflare / Google / Quad9 的 IPv4、IPv6 与组合模式，也支持自定义逗号列表。

### 内部 IP

- IPv4 + IPv6
- IPv4 only
- IPv6 only
- 自定义 IPv4 / IPv6

### Mihomo MASQUE 高级字段

- QUIC / H2 / H3 L4Proxy
- ip-stack: auto / mips / gvisor
- congestion-controller: cubic / reno / bbr / bbr3
- 外层 congestion-controller
- BBR Profile
- MTU
- handshake-timeout
- UDP
- remote-dns-resolve

这些字段基于 Mihomo 当前 MASQUE 配置结构。

### 节点 / 策略功能

- 节点标识
- 配置名称
- 3 种节点命名方式
- 自动 url-test
- 测速 URL
- 测速间隔
- tolerance
- Qure 策略组图标
- 广告拦截
- 完整智能分流
- 轻量分流
- 全局代理
- 是否包含测试 Endpoint

## 输出

### 原生 Usque

`usque-config.json`

### Clash / Mihomo

`masque-clash-smart.yaml`

Mihomo 原生支持 MASQUE，可以直接使用 Usque P-256 参数。

### Shadowrocket

`masque-shadowrocket.yaml`

Shadowrocket 2.2.90+ 已加入 MASQUE H3/H2 outbound 与自定义 SNI。
本工具输出紧凑的 Clash-compatible YAML，避免依赖 Mihomo 专属 MRS rule-provider。

### sing-box

官方 sing-box 当前没有标准 MASQUE outbound，因此输出：

```text
sing-box -> socks://127.0.0.1:1080 -> usque socks -> WARP MASQUE
```

### VLESS

MASQUE 不能直接改协议成为远程 VLESS。本工具提供真实的本地桥接：

```text
VLESS localhost:2081
-> sing-box VLESS inbound
-> Usque SOCKS localhost:1080
-> WARP MASQUE
```

## Cloudflare Pages

ZIP 根目录直接上传即可：

```text
index.html
style.css
app.js
usque-register.js
_worker.js
_routes.json
_headers
README.md
```
