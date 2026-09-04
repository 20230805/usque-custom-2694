(() => {
"use strict";
const $ = id => document.getElementById(id);
const q = v => JSON.stringify(String(v ?? ""));
const bool = v => v ? "true" : "false";

let source=null, sourceText="", currentFormat="native", helperText="", cooldownTimer=null;
let bridgeUuid=crypto.randomUUID?crypto.randomUUID():"11111111-1111-4111-8111-111111111111";

const ENDPOINTS={
  cf198:"162.159.198.2",
  cf198a:"162.159.198.1",
  cf199:"162.159.199.2",
  "v6-103":"2606:4700:103::2",
  "v6-103a":"2606:4700:103::1",
  "v6-104":"2606:4700:104::2",
  "v6-104a":"2606:4700:104::1",
  bestcf0:"masque.bestcf.eu.cc",
  bestcf1:"masque1.bestcf.eu.cc",
  bestcf2:"masque2.bestcf.eu.cc"
};
const DNS_PRESETS={
  "cf-google-dual":["1.1.1.1","8.8.8.8","2606:4700:4700::1111","2001:4860:4860::8888"],
  "cf-dual":["1.1.1.1","1.0.0.1","2606:4700:4700::1111","2606:4700:4700::1001"],
  cf1:["1.1.1.1"], google8:["8.8.8.8"], quad9:["9.9.9.9"],
  "cf-google":["1.1.1.1","8.8.8.8"], "cf-quad9":["1.1.1.1","9.9.9.9"],
  "cf-pair":["1.1.1.1","1.0.0.1"], triple:["1.1.1.1","8.8.8.8","9.9.9.9"],
  "cf-backup":["1.0.0.1"], "google-backup":["8.8.4.4"], "quad9-backup":["149.112.112.112"],
  "cf-v6":["2606:4700:4700::1111"], "google-v6":["2001:4860:4860::8888"]
};

const CLASH_DOMAIN_RULESETS=[
["bilibili","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/bilibili.mrs"],
["cn","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/cn.mrs"],
["tiktok","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/tiktok.mrs"],
["netflix","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/netflix.mrs"],
["disney","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/disney.mrs"],
["spotify","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/spotify.mrs"],
["github","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/github.mrs"],
["emby","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-emby.mrs"],
["telegram","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/telegram.mrs"],
["youtube","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/youtube.mrs"],
["google","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/google.mrs"],
["twitter","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/twitter.mrs"],
["instagram","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/instagram.mrs"],
["facebook","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/facebook.mrs"],
["steam@cn","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/steam@cn.mrs"],
["steam","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/steam.mrs"],
["apple@cn","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/apple@cn.mrs"],
["apple","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/apple.mrs"],
["microsoft@cn","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/microsoft@cn.mrs"],
["microsoft","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/microsoft.mrs"],
["xbox","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/xbox.mrs"],
["playstation","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/playstation.mrs"],
["nintendo@cn","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/nintendo@cn.mrs"],
["nintendo","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/nintendo.mrs"],
["category-porn","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-porn.mrs"],
["category-ai-!cn","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ai-!cn.mrs"],
["geolocation-!cn","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/geolocation-!cn.mrs"],
["category-ads-all","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ads-all.mrs"]
];
const CLASH_IP_RULESETS=[
["private_ip","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo-lite/geoip/private.mrs"],
["apple_ip","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo-lite/geoip/apple.mrs"],
["google_ip","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo-lite/geoip/google.mrs"],
["telegram_ip","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo-lite/geoip/telegram.mrs"],
["netflix_ip","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo-lite/geoip/netflix.mrs"],
["twitter_ip","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo-lite/geoip/twitter.mrs"],
["cn_ip","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo-lite/geoip/cn.mrs"],
["ad_ip","https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/ad.mrs"]
];

function download(name,text,type="text/plain"){
 try{
  const b=new Blob([text],{type:type+";charset=utf-8"}),u=URL.createObjectURL(b),a=document.createElement("a");
  a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),900);
  toast(`已开始下载：${name}`,"success","下载已触发");
 }catch(e){
  toast("下载失败："+e.message,"error","下载失败");
 }
}
async function copyText(text,btn){
 try{
  await navigator.clipboard.writeText(text);
  const old=btn.textContent;btn.textContent="已复制";
  toast("内容已经复制到剪贴板。","success","复制成功");
  setTimeout(()=>btn.textContent=old,900);
 }catch(e){toast("复制失败："+e.message,"error","复制失败")}
}
function setStatus(msg,kind=""){
 const el=$("regStatus");el.className="status"+(kind?" "+kind:"");el.innerHTML='<span class="dot"></span><span></span>';el.lastChild.textContent=msg;
}
function setNotice(html,kind=""){
 const el=$("compatNotice");el.className="compat-notice"+(kind?" "+kind:"");el.innerHTML=html;
}
function hideNotice(){$("compatNotice").className="compat-notice hidden"}

let settingsDirty=false;

function toast(message,type="success",title=""){
 const stack=$("toastStack"); if(!stack)return;
 const el=document.createElement("div"); el.className=`toast ${type}`;
 const icons={success:"✅",warning:"⚠️",error:"❌",info:"ℹ️"};
 const titles={success:"操作成功",warning:"需要注意",error:"操作失败",info:"提示"};
 el.innerHTML=`<span class="toast-icon">${icons[type]||"ℹ️"}</span><div class="toast-body"><strong>${title||titles[type]||"提示"}</strong><span></span></div><button class="toast-close" type="button" aria-label="关闭">×</button>`;
 el.querySelector(".toast-body span").textContent=String(message);
 el.querySelector(".toast-close").addEventListener("click",()=>el.remove());
 stack.appendChild(el); while(stack.children.length>4)stack.firstElementChild.remove();
 setTimeout(()=>{if(el.isConnected)el.remove()},type==="error"?6500:3500);
}
function setSettingsState(state,message){
 const box=$("settingsStatus"),txt=$("settingsStatusText"),btn=$("applySettings"); if(!box||!txt||!btn)return;
 box.className=`settings-status ${state}`; txt.textContent=message; btn.classList.toggle("pending",state==="dirty");
}
function settingLabel(id){
 const el=$(id),label=el?.closest("label"),span=label?.querySelector(":scope > span"); return span?.textContent?.trim()||id;
}
function settingValueText(id){
 const el=$(id); if(!el)return ""; if(el.type==="checkbox")return el.checked?"开启":"关闭";
 if(el.tagName==="SELECT")return el.selectedOptions?.[0]?.textContent?.trim()||el.value; return el.value||"(空)";
}
function markDirty(id,showToast=true){
 settingsDirty=true; const name=settingLabel(id),value=settingValueText(id);
 setSettingsState("dirty",`已修改：${name} → ${value}；点击“应用设置并重新生成”后生效`);
 if(showToast)toast(`${name} 已改为：${value}`,"info","设置已修改");
}
function pemBody(v){return String(v||"").replace(/-----BEGIN PUBLIC KEY-----/g,"").replace(/-----END PUBLIC KEY-----/g,"").replace(/\s+/g,"").trim()}
function cidr4(v){return !v?"":String(v).includes("/")?String(v):String(v)+"/32"}
function cidr6(v){return !v?"":String(v).includes("/")?String(v):String(v)+"/128"}
function uniq(a){return [...new Set(a.filter(Boolean))]}

function parseUsque(text){
 const d=JSON.parse(text);
 if(!d.private_key||!d.endpoint_pub_key)throw new Error("config.json 缺少 private_key / endpoint_pub_key");
 if(!d.endpoint_v4&&!d.endpoint_v6&&!d.endpoint_h2_v4&&!d.endpoint_h2_v6)throw new Error("config.json 没有可用 endpoint");
 return d;
}
function enableOutputs(){
 ["fmtNative","fmtClash","fmtShadowrocket","fmtSingbox","fmtVless"].forEach(id=>$(id).disabled=false);
 ["downloadOriginal","showNative","copyNative","downloadNative2"].forEach(id=>$(id).disabled=false);
}
function nativeLoaded(label){
 enableOutputs();
 $("loadedFile").className="loaded-file";
 $("loadedFile").textContent="✓ "+label;
 $("filePill").className="file-pill hidden";
 updateEstimate();
 setFormat("native");
}

function selectedSni(){
 return $("sniPreset").value==="custom"?($("customSni").value.trim()||"consumer-masque.cloudflareclient.com"):$("sniPreset").value;
}
function selectedDns(){
 if($("dnsPreset").value==="custom")return uniq($("customDns").value.split(",").map(x=>x.trim()));
 return DNS_PRESETS[$("dnsPreset").value]||["1.1.1.1"];
}
function selectedMtu(){return Number($("mtuPreset").value==="custom"?$("customMtu").value:$("mtuPreset").value)||1280}

function extraEndpointList(){
 return uniq(
   String($("extraEndpoints")?.value||"")
     .split(/[\s,，;；]+/)
     .map(x=>x.trim())
 );
}

function endpointList(){
 const p=$("endpointPreset").value;
 const tests=$("includeTestEndpoints").checked;
 const extra=extraEndpointList();

 let list=[];
 if(p==="custom")list=[$("customEndpoint").value.trim()];
 else if(p==="source-auto")list=[source?.endpoint_v4,source?.endpoint_v6];
 else if(p==="auto-v4"){
   list=[source?.endpoint_v4,ENDPOINTS.cf198a,ENDPOINTS.cf198,ENDPOINTS.cf199];
 }
 else if(p==="auto-v6"){
   list=[source?.endpoint_v6,ENDPOINTS["v6-103a"],ENDPOINTS["v6-103"],ENDPOINTS["v6-104a"],ENDPOINTS["v6-104"]];
 }
 else if(p==="auto-curated"){
   // QUIC: include the measured ::1/::2 and 162.159.198.1/.2 candidates,
   // plus the account endpoints returned in config.json.
   list=[
     source?.endpoint_v4,
     source?.endpoint_v6,
     ENDPOINTS.cf198a,ENDPOINTS.cf198,
     ENDPOINTS["v6-103a"],ENDPOINTS["v6-103"],
     ENDPOINTS["v6-104a"],ENDPOINTS["v6-104"]
   ];
   // Community/test candidates remain optional because they are not guaranteed.
   if(tests)list.push(ENDPOINTS.cf199,ENDPOINTS.bestcf0,ENDPOINTS.bestcf1,ENDPOINTS.bestcf2);
 }else{
   list=[ENDPOINTS[p]];
 }

 return uniq([...list,...extra]);
}
function portList(){
 const p=$("portPreset").value;
 if(p==="recommended")return [500,4500,8095,443];
 if(p==="all")return [443,500,1701,4500,4443,8095,8443];
 if(p==="custom")return [Math.max(1,Math.min(65535,Number($("customPort").value)||443))];
 return [Number(p)||443];
}
function curatedPairs(){
 const pairs=[
  ["162.159.198.1",443],
  ["162.159.198.1",500],
  ["162.159.198.2",443],
  ["162.159.198.2",500],
  ["162.159.198.2",4500],
  ["162.159.198.2",8095],
  ["2606:4700:103::1",443],
  ["2606:4700:103::2",4500],
  ["2606:4700:104::1",500],
  ["2606:4700:104::2",443]
 ];
 if($("includeTestEndpoints").checked){
   pairs.push(
     ["162.159.199.2",443],
     ["masque.bestcf.eu.cc",500],
     ["masque1.bestcf.eu.cc",500]
   );
 }
 return pairs;
}

function targetNodeCount(){
 const mode=$("nodeCountMode")?.value||"13";
 if(mode==="custom"){
   return Math.max(1,Math.min(500,Number($("customNodeCount")?.value)||100));
 }
 return Math.max(1,Number(mode)||13);
}

function dedupePairs(pairs){
 const seen=new Set(),out=[];
 for(const pair of pairs){
   const server=String(pair?.[0]||"").trim();
   const port=Number(pair?.[1]||0);
   if(!server||!port)continue;
   const key=`${server.toLowerCase()}|${port}`;
   if(seen.has(key))continue;
   seen.add(key);
   out.push([server,port]);
 }
 return out;
}

function stableShuffle(arr){
 const out=[...arr];
 let seed=2166136261>>>0;
 const material=String($("profileName")?.value||"MASQUE-Pro")+"|"+String($("nodeTag")?.value||"CDN");
 for(let i=0;i<material.length;i++){
   seed^=material.charCodeAt(i);
   seed=Math.imul(seed,16777619)>>>0;
 }
 for(let i=out.length-1;i>0;i--){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const j=seed%(i+1);
   [out[i],out[j]]=[out[j],out[i]];
 }
 return out;
}

function expandedPortList(){
 const p=$("portPreset").value;
 const target=targetNodeCount();
 if(p==="recommended" && target>13){
   return [443,500,1701,4500,4443,8095,8443];
 }
 return portList();
}

function h2Ipv4Endpoints(limit=508){
 const out=[];
 // warpscout currently treats these two /24s as the H2 IPv4 pool.
 for(const prefix of ["162.159.198","162.159.199"]){
   for(let host=1;host<=254;host++){
     out.push(`${prefix}.${host}`);
     if(out.length>=limit)return out;
   }
 }
 return out;
}

function h2ConnectionPairs(target,build){
 const ports=expandedPortList();
 const sourceH2=uniq([source?.endpoint_h2_v4,source?.endpoint_v4]);
 let endpoints=[];

 if($("h2ExtendedPool")?.checked){
   endpoints=uniq([...sourceH2,...h2Ipv4Endpoints(508),...extraEndpointList()]);
 }else{
   endpoints=uniq([...sourceH2,...extraEndpointList()]);
 }

 let pairs=[];
 if(build==="balanced"){
   for(const port of ports){
     for(const endpoint of endpoints)pairs.push([endpoint,port]);
   }
 }else{
   for(const endpoint of endpoints){
     for(const port of ports)pairs.push([endpoint,port]);
   }
 }
 pairs=dedupePairs(pairs);
 if(build==="shuffle")pairs=stableShuffle(pairs);
 return pairs.slice(0,target);
}

function connectionPairs(){
 const ep=$("endpointPreset").value;
 const pp=$("portPreset").value;
 const net=$("networkMode").value;
 const build=$("nodeBuildMode")?.value||"balanced";
 const target=targetNodeCount();

 if(net==="h2"){
   return h2ConnectionPairs(target,build);
 }

 let pairs=[];

 // 13 节点推荐模式优先保持原来的精选组合。
 if(ep==="auto-curated" && pp==="recommended"){
   pairs.push(...curatedPairs());
 }

 // 目标超过精选池时，自动扩展为 Endpoint × 常用 Port。
 if(target>pairs.length || build==="full" || build==="shuffle"){
   const eps=endpointList();
   const ports=expandedPortList();
   const expanded=[];

   if(build==="balanced"){
     // 按端口轮询 Endpoint，避免前几十个节点全部挤在同一个入口。
     for(const port of ports){
       for(const endpoint of eps)expanded.push([endpoint,port]);
     }
   }else{
     for(const endpoint of eps){
       for(const port of ports)expanded.push([endpoint,port]);
     }
   }

   pairs.push(...expanded);
 }

 if($("dedupeNodes")?.checked!==false)pairs=dedupePairs(pairs);
 if(build==="shuffle")pairs=stableShuffle(pairs);

 // 不复制相同 Endpoint:Port 来伪造节点。
 return pairs.slice(0,target);
}
function nodeName(server,port,i){
 const tag=$("nodeTag").value.trim()||"CDN",mode=$("nodeNaming").value;
 if(mode==="index")return `${tag}-MASQUE-${String(i+1).padStart(2,"0")}`;
 if(mode==="short")return `${server}:${port}`;
 return `${tag} | ${server} | ${port}`;
}
function innerIps(){
 const mode=$("innerIpMode").value;
 if(mode==="custom")return {v4:cidr4($("customInner4").value.trim()),v6:cidr6($("customInner6").value.trim())};
 return {
   v4:mode==="v6"?"":cidr4(source?.ipv4||""),
   v6:mode==="v4"?"":cidr6(source?.ipv6||"")
 };
}
function opts(){
 return {
  sni:selectedSni(),dns:selectedDns(),mtu:selectedMtu(),network:$("networkMode").value,
  stack:$("stackMode").value,cc:$("ccMode").value,outerCc:$("outerCc").value,bbrProfile:$("bbrProfile").value,
  handshake:Number($("handshakeTimeout").value)||0,udp:$("udpForward").checked,remoteDns:$("remoteDns").checked,
  autoSelect:$("autoSelect").checked,icons:$("showIcons").checked,adBlock:$("adBlock").checked,
  ruleMode:$("ruleMode").value,healthUrl:$("healthUrl").value,healthInterval:Number($("healthInterval").value),
  tolerance:Number($("healthTolerance").value),aiHealth:$("aiHealthMode").value,
  chatgptRoute:$("chatgptRouteMode").value,
  otherAiRoute:$("otherAiRouteMode").value,
  chatgptDirectFallback:$("chatgptDirectFallback").checked,
  egressCountries:uniq([$("egressCountry1").value,$("egressCountry2").value,$("egressCountry3").value]),
  egressChatgptFirst:$("egressChatgptFirst").checked,
  egressApplyAll:$("egressApplyAll").checked,
  enableControllerApi:$("enableControllerApi").checked,
  controllerUrl:$("controllerUrl").value.trim()||"http://127.0.0.1:9090",
  controllerSecret:$("controllerSecret").value,
  localProxyUrl:$("localProxyUrl").value.trim()||"http://127.0.0.1:7890",
  profile:$("profileName").value.trim()||"MASQUE-Pro"
 };
}
function controllerHostPort(url){
 try{
   const u=new URL(url);
   return {
     host:u.hostname||"127.0.0.1",
     port:Number(u.port||9090)
   };
 }catch(e){
   return {host:"127.0.0.1",port:9090};
 }
}

function egressPreferences(){
 const countries=uniq([
   $("egressCountry1").value,
   $("egressCountry2").value,
   $("egressCountry3").value
 ]);
 return {
   version:"6.5",
   preferred_countries:countries,
   chatgpt_first:$("egressChatgptFirst").checked,
   apply_all:$("egressApplyAll").checked,
   controller:$("controllerUrl").value.trim()||"http://127.0.0.1:9090",
   secret:$("controllerSecret").value,
   proxy:$("localProxyUrl").value.trim()||"http://127.0.0.1:7890"
 };
}

function buildEgressBat(){
 const cfg=egressPreferences();
 const countries=(cfg.preferred_countries||[]).join(",");
 const secretArg=cfg.secret?` --secret "${cfg.secret.replace(/"/g,'""')}"`:"";
 const preferArg=countries?` --prefer "${countries}"`:"";
 const chatArg=cfg.chatgpt_first?" --chatgpt-first":"";
 const allArg=cfg.apply_all?" --apply-all":"";
 return `@echo off
chcp 65001 >nul
title Usque WARP Egress Selector v6.5
echo ==========================================
echo   WARP 出口国家/地区检测与优选 v6.5
echo ==========================================
echo.
where python >nul 2>nul
if errorlevel 1 (
  echo [错误] 没有找到 Python。
  echo 请先安装 Python 3，并勾选 Add Python to PATH。
  pause
  exit /b 1
)
if not exist "warp-egress-selector.py" (
  echo [错误] 当前目录找不到 warp-egress-selector.py
  pause
  exit /b 1
)
echo Controller: ${cfg.controller}
echo Local Proxy: ${cfg.proxy}
echo Preferred: ${countries||"ANY"}
echo.
python "warp-egress-selector.py" --controller "${cfg.controller}" --proxy "${cfg.proxy}"${secretArg}${preferArg}${chatArg}${allArg}
echo.
echo 检测完成后会在当前目录生成 JSON 和 CSV 报告。
pause
`;
}

function updateEstimate(){
 let actual=0,target=13;
 try{
   target=targetNodeCount();
   actual=connectionPairs().length;
 }catch(e){}
 const net=$("networkMode").value;
 let shortage=actual<target?` · 唯一组合不足：${actual}/${target}`:"";
 if(actual<target && net!=="h2"){
   shortage+=" · 想要 100+ 可切换 H2 / TCP 扩展池";
 }
 $("nodeEstimate").textContent=
   `预计生成：${actual} 个节点${shortage} · ${$("networkMode").selectedOptions[0].textContent} · ${$("ruleMode").selectedOptions[0].textContent}`;
}

function makeNode(a,name,server,port,o){
 const ips=innerIps();
 const udp=o.network==="h3-l4proxy"?false:o.udp;
 a.push(
  `  - name: ${q(name)}`,"    type: masque",`    server: ${q(server)}`,`    port: ${Number(port)}`,
  `    private-key: ${q(source.private_key)}`,`    public-key: ${q(pemBody(source.endpoint_pub_key))}`
 );
 if(ips.v4)a.push(`    ip: ${q(ips.v4)}`);
 if(ips.v6)a.push(`    ipv6: ${q(ips.v6)}`);
 a.push(`    mtu: ${o.mtu}`,`    udp: ${bool(udp)}`,`    sni: ${q(o.sni)}`);
 if(o.network!=="quic")a.push(`    network: ${o.network}`);
 a.push("    ip-stack:",`      mode: ${o.stack}`,`      congestion-controller: ${o.cc}`);
 if(o.remoteDns){
   a.push("    remote-dns-resolve: true","    dns:");
   for(const d of o.dns)a.push(`      - ${q(d)}`);
 }
 if(o.outerCc){
   a.push(`    congestion-controller: ${o.outerCc}`);
   if(o.outerCc==="bbr")a.push(`    bbr-profile: ${q(o.bbrProfile)}`);
 }
 if(o.handshake)a.push(`    handshake-timeout: ${o.handshake}`);
}

function iconUrl(name){
 const base="https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/";
 const map={
  "自动选择":"Rocket.png","AI自动选择":"ChatGPT.png","地区优选":"Global.png","出口检测":"Speedtest.png","PROXY":"Proxy.png","AI":"ChatGPT.png","YouTube":"YouTube.png","Emby":"Emby.png","TikTok":"TikTok.png",
  "Netflix":"Netflix.png","Disney":"Disney.png","Spotify":"Spotify.png","GitHub":"GitHub.png","Telegram":"Telegram.png",
  "Google":"Google_Search.png","Twitter":"Twitter.png","Instagram":"Instagram.png","Facebook":"Facebook.png","Apple":"Apple_1.png",
  "Microsoft":"Microsoft.png","Steam":"Steam.png","Xbox":"Xbox.png","PlayStation":"PlayStation_1.png","Nintendo":"Nintendo.png",
  "Porn":"Pornhub_1.png","国外网站":"Global.png","🐟 漏网之鱼":"Final.png","Bilibili":"bilibili.png"
 };
 return base+(map[name]||"Proxy.png");
}
function groupHeader(a,name,type="select"){
 a.push(`  - name: ${q(name)}`,`    type: ${type}`);
 if(opts().icons)a.push(`    icon: ${q(iconUrl(name))}`);
}
function appendRawNodes(a,names,indent="      "){
 for(const n of names)a.push(`${indent}- ${q(n)}`);
}

function aiHealthUrl(mode){
 if(mode==="openai")return "https://openai.com/";
 return "https://chatgpt.com/";
}

function appendServiceSelector(a,name,names,o,{directFirst=false}={}){
 groupHeader(a,name);
 a.push("    proxies:");
 if(directFirst)a.push("      - DIRECT");
 if(name==="AI" && o.aiHealth!=="off")a.push('      - "AI自动选择"');
 a.push('      - "地区优选"');
 if(o.autoSelect)a.push('      - "自动选择"');
 a.push('      - "PROXY"');
 appendRawNodes(a,names);
 if(!directFirst)a.push("      - DIRECT");
}

function clashGroupsAndRules(names,o){
 const a=["","proxy-groups:"];

 // Hidden selector used by the local egress scanner. Its choice can be changed
 // through Mihomo's localhost REST API without affecting normal service groups.
 groupHeader(a,"出口检测");
 a.push("    hidden: true","    proxies:");
 appendRawNodes(a,names);

 // Visible selector that the scanner pins to the best real egress candidate.
 groupHeader(a,"地区优选");
 a.push("    proxies:");
 appendRawNodes(a,names);
 a.push("      - DIRECT");

 if(o.autoSelect){
   groupHeader(a,"自动选择","url-test");
   a.push(
     `    url: ${q(o.healthUrl)}`,
     `    interval: ${o.healthInterval}`,
     `    tolerance: ${o.tolerance}`,
     "    timeout: 5000",
     "    lazy: true",
     "    proxies:"
   );
   appendRawNodes(a,names);
 }

 if(o.aiHealth!=="off"){
   groupHeader(a,"AI自动选择","url-test");
   a.push(
     `    url: ${q(aiHealthUrl(o.aiHealth))}`,
     "    expected-status: 200-399",
     `    interval: ${Math.max(300,o.healthInterval)}`,
     `    tolerance: ${Math.max(50,o.tolerance)}`,
     "    timeout: 8000",
     "    lazy: false",
     "    proxies:"
   );
   appendRawNodes(a,names);
 }

 groupHeader(a,"PROXY");
 a.push("    proxies:");
 a.push('      - "地区优选"');
 if(o.aiHealth!=="off")a.push('      - "AI自动选择"');
 if(o.autoSelect)a.push('      - "自动选择"');
 appendRawNodes(a,names);
 a.push("      - DIRECT");

 if(o.ruleMode==="global"){
   a.push("","rules:","  - MATCH,PROXY","");
   return a;
 }

 if(o.ruleMode==="lite"){
   appendServiceSelector(a,"国外网站",names,o);
   a.push(
     "","rule-providers:",
     "  cn:","    type: http","    behavior: domain","    format: mrs",
     "    interval: 43200",
     "    url: https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/cn.mrs",
     "  cn_ip:","    type: http","    behavior: ipcidr","    format: mrs",
     "    interval: 43200",
     "    url: https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo-lite/geoip/cn.mrs",
     "","rules:",
     "  - RULE-SET,cn,DIRECT",
     "  - RULE-SET,cn_ip,DIRECT",
     "  - MATCH,国外网站",""
   );
   return a;
 }

 const groups=[
   "AI","YouTube","Emby","TikTok","Netflix","Disney","Spotify","GitHub",
   "Telegram","Google","Twitter","Instagram","Facebook","Apple","Microsoft",
   "Steam","Xbox","PlayStation","Nintendo","Porn","国外网站","🐟 漏网之鱼"
 ];
 for(const g of groups)appendServiceSelector(a,g,names,o);
 appendServiceSelector(a,"Bilibili",names,o,{directFirst:true});

 a.push(
   "",
   "rule-anchor:",
   "  ip: &ip {type: http, interval: 43200, behavior: ipcidr, format: mrs}",
   "  domain: &domain {type: http, interval: 43200, behavior: domain, format: mrs}",
   "",
   "rule-providers:"
 );
 for(const [tag,url] of CLASH_DOMAIN_RULESETS)a.push(`  ${tag}:`,`    <<: *domain`,`    url: ${url}`);
 for(const [tag,url] of CLASH_IP_RULESETS)a.push(`  ${tag}:`,`    <<: *ip`,`    url: ${url}`);

 a.push("","rules:");

 if(o.adBlock){
   a.push(
     "  - RULE-SET,category-ads-all,REJECT",
     "  - RULE-SET,ad_ip,REJECT,no-resolve"
   );
 }

 // Local egress scanner probe domains.
 a.push(
   "  # 本机出口检测器使用；出口检测组默认 hidden",
   "  - DOMAIN,ipinfo.io,出口检测",
   "  - DOMAIN,www.cloudflare.com,出口检测",
   ""
 );

 // OpenAI 官方列出的关键域名显式绑定 AI，避免被其它规则提前接管。
 const chatTarget=o.chatgptRoute||"DIRECT";
 const otherAiTarget=o.otherAiRoute||"AI";
 a.push(
   `  # ChatGPT / OpenAI 独立出口：${chatTarget}`,
   `  - DOMAIN-SUFFIX,chatgpt.com,${chatTarget}`,
   `  - DOMAIN-SUFFIX,openai.com,${chatTarget}`,
   `  - DOMAIN-SUFFIX,oaistatic.com,${chatTarget}`,
   `  - DOMAIN-SUFFIX,oaiusercontent.com,${chatTarget}`,
   `  - DOMAIN-SUFFIX,oaistatsig.com,${chatTarget}`,
   `  - DOMAIN-SUFFIX,openaimerge.com,${chatTarget}`,
   `  - DOMAIN-SUFFIX,workos.com,${chatTarget}`,
   `  - DOMAIN-SUFFIX,workoscdn.com,${chatTarget}`,
   `  - DOMAIN,challenges.cloudflare.com,${chatTarget}`,
   "",
   `  # 其它 AI 服务：${otherAiTarget}`,
   "  # 国内 / 私网",
   "  - RULE-SET,private_ip,DIRECT,no-resolve",
   "  - RULE-SET,steam@cn,DIRECT",
   "  - RULE-SET,microsoft@cn,DIRECT",
   "  - RULE-SET,nintendo@cn,DIRECT",
   "  - RULE-SET,bilibili,Bilibili",
   "",
   "  # AI / 流媒体 / 社交",
   `  - RULE-SET,category-ai-!cn,${otherAiTarget}`,
   "  - RULE-SET,youtube,YouTube",
   "  - RULE-SET,emby,Emby",
   "  - RULE-SET,tiktok,TikTok",
   "  - RULE-SET,netflix,Netflix",
   "  - RULE-SET,disney,Disney",
   "  - RULE-SET,spotify,Spotify",
   "  - RULE-SET,github,GitHub",
   "  - RULE-SET,telegram,Telegram",
   "  - RULE-SET,google,Google",
   "  - RULE-SET,twitter,Twitter",
   "  - RULE-SET,instagram,Instagram",
   "  - RULE-SET,facebook,Facebook",
   "  - RULE-SET,apple@cn,DIRECT",
   "  - RULE-SET,apple,Apple",
   "  - RULE-SET,microsoft,Microsoft",
   "  - RULE-SET,steam,Steam",
   "  - RULE-SET,xbox,Xbox",
   "  - RULE-SET,playstation,PlayStation",
   "  - RULE-SET,nintendo,Nintendo",
   "  - RULE-SET,category-porn,Porn",
   "",
   "  # IP rules",
   "  - RULE-SET,apple_ip,Apple,no-resolve",
   "  - RULE-SET,google_ip,Google,no-resolve",
   "  - RULE-SET,telegram_ip,Telegram,no-resolve",
   "  - RULE-SET,netflix_ip,Netflix,no-resolve",
   "  - RULE-SET,twitter_ip,Twitter,no-resolve",
   "",
   "  - RULE-SET,geolocation-!cn,国外网站",
   "  - RULE-SET,cn,DIRECT",
   "  - RULE-SET,cn_ip,DIRECT",
   "  - MATCH,🐟 漏网之鱼",
   ""
 );
 return a;
}

function buildClash(){
 if(!source)throw new Error("请先加载原生 config.json");
 const o=opts(),pairs=connectionPairs(),names=[];
 const a=[
  `# ${o.profile} - Clash / Mihomo MASQUE v6.7`,
  "mixed-port: 7890","allow-lan: false","mode: rule","log-level: info","ipv6: true","unified-delay: true"
 ];
 if(o.enableControllerApi){
   const ctl=controllerHostPort(o.controllerUrl);
   a.push(`external-controller: ${ctl.host}:${ctl.port}`,`secret: ${q(o.controllerSecret)}`);
 }
 a.push("",
  "dns:","  enable: true","  ipv6: true","  enhanced-mode: fake-ip","  listen: 0.0.0.0:7874","  fake-ip-range: 198.18.0.1/16",
  "  fake-ip-filter:",'    - "*.lan"','    - "*.local"','    - "*.arpa"','    - "*.msftncsi.com"','    - "www.msftconnecttest.com"',
  "  default-nameserver:","    - 223.5.5.5","    - 223.6.6.6",
  "  nameserver:","    - https://doh.pub/dns-query","    - https://dns.alidns.com/dns-query",
  "","proxies:"
 );
 pairs.forEach(([server,port],i)=>{const n=nodeName(server,port,i);names.push(n);makeNode(a,n,server,port,o)});
 a.push(...clashGroupsAndRules(names,o));
 return a.join("\n");
}

function buildShadowrocket(){
 // Shadowrocket 2.2.90+ supports MASQUE and has improved Clash parsing.
 // Use a compact Clash-compatible YAML to avoid relying on undocumented native line syntax.
 const o=opts(),pairs=connectionPairs(),names=[];
 const a=[`# ${o.profile} - Shadowrocket 2.2.90+ MASQUE (Clash-compatible YAML)`,
 "mixed-port: 7890","mode: rule","ipv6: true","","proxies:"];
 pairs.forEach(([server,port],i)=>{const n=nodeName(server,port,i);names.push(n);makeNode(a,n,server,port,o)});
 a.push("","proxy-groups:",'  - name: "PROXY"',"    type: select","    proxies:");
 names.forEach(n=>a.push(`      - ${q(n)}`));a.push("      - DIRECT","","rules:","  - GEOIP,CN,DIRECT","  - MATCH,PROXY","");
 return a.join("\n");
}

function singRuleSet(tag,kind="geosite"){
 const repo=kind==="geosite"?"sing-geosite":"sing-geoip";
 return {type:"remote",tag:`${kind}-${tag}`,format:"binary",url:`https://raw.githubusercontent.com/SagerNet/${repo}/rule-set/${kind}-${tag}.srs`,http_client:"rule-download",update_interval:"1d"};
}
function buildSingbox(){
 const rs=[singRuleSet("category-ads-all"),singRuleSet("cn"),singRuleSet("geolocation-!cn"),singRuleSet("category-ai-!cn"),singRuleSet("youtube"),singRuleSet("google"),singRuleSet("telegram"),singRuleSet("netflix"),singRuleSet("github"),singRuleSet("private","geoip"),singRuleSet("cn","geoip")];
 return JSON.stringify({
  "$schema":"https://sing-box.sagernet.org/schema.json",
  log:{level:"info",timestamp:true},
  dns:{servers:[{type:"local",tag:"local-dns"},{type:"https",tag:"proxy-dns",server:"1.1.1.1",server_port:443,detour:"WARP-USQUE"}],rules:[{rule_set:["geosite-cn","geoip-cn"],action:"route",server:"local-dns"}],final:"proxy-dns"},
  http_clients:[{tag:"rule-download",engine:"go",version:2,detour:"direct"}],
  inbounds:[{type:"mixed",tag:"mixed-in",listen:"127.0.0.1",listen_port:2080}],
  outbounds:[{type:"socks",tag:"WARP-USQUE",server:"127.0.0.1",server_port:1080,version:"5"},{type:"direct",tag:"direct"}],
  route:{auto_detect_interface:true,default_domain_resolver:"local-dns",default_http_client:"rule-download",rule_set:rs,rules:[
   {rule_set:"geosite-category-ads-all",action:"reject"},
   {rule_set:"geoip-private",action:"route",outbound:"direct"},
   {rule_set:["geosite-cn","geoip-cn"],action:"route",outbound:"direct"},
   {rule_set:["geosite-category-ai-!cn","geosite-youtube","geosite-google","geosite-telegram","geosite-netflix","geosite-github","geosite-geolocation-!cn"],action:"route",outbound:"WARP-USQUE"}
  ],final:"WARP-USQUE"},experimental:{cache_file:{enabled:true}}
 },null,2);
}
function buildVlessBridge(){
 return JSON.stringify({"$schema":"https://sing-box.sagernet.org/schema.json",log:{level:"info",timestamp:true},
 inbounds:[{type:"vless",tag:"vless-local-in",listen:"127.0.0.1",listen_port:2081,users:[{uuid:bridgeUuid,name:"Usque-WARP-Local"}]}],
 outbounds:[{type:"socks",tag:"WARP-USQUE",server:"127.0.0.1",server_port:1080,version:"5"},{type:"direct",tag:"direct"}],route:{final:"WARP-USQUE"}},null,2);
}
function vlessUri(){return `vless://${bridgeUuid}@127.0.0.1:2081?encryption=none&type=tcp#Usque-WARP-Local-Bridge`}

function buildVlessWindowsBat(){
 return `@echo off
chcp 65001 >nul
title Usque WARP VLESS Local Bridge

echo ==========================================
echo   Usque WARP - VLESS 本地桥接启动器
echo ==========================================
echo.

if not exist "usque.exe" (
  echo [错误] 当前目录找不到 usque.exe
  echo 请把 usque.exe 放到本 BAT 同一目录。
  pause
  exit /b 1
)

if not exist "sing-box.exe" (
  echo [错误] 当前目录找不到 sing-box.exe
  echo 请把 sing-box.exe 放到本 BAT 同一目录。
  pause
  exit /b 1
)

if not exist "usque-config.json" (
  echo [错误] 当前目录找不到 usque-config.json
  pause
  exit /b 1
)

if not exist "usque-vless-bridge.json" (
  echo [错误] 当前目录找不到 usque-vless-bridge.json
  pause
  exit /b 1
)

echo [1/2] 启动 Usque SOCKS 127.0.0.1:1080...
start "Usque SOCKS" cmd /k ""%cd%\\usque.exe" -c "%cd%\\usque-config.json" socks -b 127.0.0.1 -p 1080"

timeout /t 2 /nobreak >nul

echo [2/2] 启动 sing-box VLESS 127.0.0.1:2081...
start "VLESS Bridge" cmd /k ""%cd%\\sing-box.exe" run -c "%cd%\\usque-vless-bridge.json""

echo.
echo 已启动。
echo 现在 v2rayN 中的 127.0.0.1:2081 才能正常连接/测速。
echo 两个黑色窗口都不要关闭。
pause
`;
}

function setFormat(fmt){
 if(!source)return;
 currentFormat=fmt;helperText="";
 document.querySelectorAll(".format-card").forEach(x=>x.classList.remove("active"));
 ({native:"fmtNative",clash:"fmtClash",shadowrocket:"fmtShadowrocket",singbox:"fmtSingbox",vless:"fmtVless"}[fmt]&&$(({native:"fmtNative",clash:"fmtClash",shadowrocket:"fmtShadowrocket",singbox:"fmtSingbox",vless:"fmtVless"})[fmt]).classList.add("active"));
 $("downloadHelper").className="hidden";$("downloadVlessBat").className="hidden";$("runGuide").className="run-guide hidden";hideNotice();

 if(fmt==="native"){
  $("outputTitle").textContent="原生 Usque config.json";$("outputDesc").textContent="所有转换的源文件，建议优先备份。";$("mainOutput").value=sourceText;
 }
 if(fmt==="clash"){
  $("outputTitle").textContent="Clash / Mihomo 完整智能分流";$("outputDesc").textContent=`${connectionPairs().length} 个 MASQUE 节点；ChatGPT/OpenAI 当前出口：${$("chatgptRouteMode").selectedOptions[0].textContent}。`;
  $("mainOutput").value=buildClash();setNotice(
   $("chatgptRouteMode").value==="DIRECT"
   ? "<b>AI 简单模式：</b>ChatGPT/OpenAI 已单独走 DIRECT；YouTube/Netflix/Google 等仍按原 WARP 分流。无需运行 Python/BAT 出口检测器。"
   : "<b>AI 出口模式：</b>ChatGPT/OpenAI 当前使用所选 WARP/AI 策略。若仍出现 Unable to load site，可切回 DIRECT，或使用高级出口检测器筛选可用 WARP 出口。",
   "ok"
  );
 }
 if(fmt==="shadowrocket"){
  $("outputTitle").textContent="小火箭 / Shadowrocket 2.2.90+";$("outputDesc").textContent="MASQUE H3/H2 + Clash 兼容 YAML。";
  $("mainOutput").value=buildShadowrocket();setNotice("<b>Shadowrocket 2.2.90+：</b>当前版本已加入 MASQUE outbound（H3/H2）和自定义 SNI。这里导出简化 Clash-compatible YAML，减少 Mihomo 专属 rule-provider 兼容问题。","ok");
 }
 if(fmt==="singbox"){
  $("outputTitle").textContent="sing-box 官方版兼容配置";$("outputDesc").textContent="sing-box → 本机 Usque SOCKS5 → WARP MASQUE。";
  $("mainOutput").value=buildSingbox();setNotice("<b>官方 sing-box 当前没有 MASQUE outbound。</b>因此这里使用本地 Usque SOCKS5 作为真实上游，不伪造不存在的 type: masque。");
  $("runGuide").className="run-guide";$("runCommands").textContent=`1) 启动 Usque SOCKS:\nWindows: usque.exe -c usque-config.json socks -b 127.0.0.1 -p 1080\nLinux/macOS: ./usque -c usque-config.json socks -b 127.0.0.1 -p 1080\n\n2) sing-box run -c sing-box-usque.json`;
 }
 if(fmt==="vless"){
  $("outputTitle").textContent="VLESS 本地桥接链接";$("outputDesc").textContent="VLESS → sing-box 本地 inbound → Usque SOCKS → WARP MASQUE。";
  $("mainOutput").value=vlessUri();helperText=buildVlessBridge();$("downloadHelper").className="";$("downloadHelper").textContent="下载 VLESS 桥接 JSON";
  $("downloadVlessBat").className="";$("downloadVlessBat").textContent="下载 Windows 一键启动 BAT";
  setNotice("<b>为什么直接测速是 -1：</b>这个节点地址是 127.0.0.1:2081，只在你的电脑本地有效。必须先启动 Usque SOCKS 和 sing-box Bridge，让 1080/2081 端口开始监听；只导入 vless:// 而不启动桥接，v2rayN 一定显示 -1。");
  $("compatNotice").classList.add("local-bridge-warning");
  $("runGuide").className="run-guide";$("runCommands").textContent=`Windows 最简单：\n1) 下载 usque-config.json\n2) 下载 usque-vless-bridge.json\n3) 下载 Windows 一键启动 BAT\n4) 把 usque.exe、sing-box.exe 和这 3 个文件放在同一文件夹\n5) 双击 BAT\n6) 两个窗口都运行后，再在 v2rayN 测速 127.0.0.1:2081\n\n手动启动：\nusque.exe -c usque-config.json socks -b 127.0.0.1 -p 1080\nsing-box.exe run -c usque-vless-bridge.json`;
 }
 const ok=!!$("mainOutput").value;$("copyMain").disabled=!ok;$("downloadMain").disabled=!ok;
}

function loadSource(text,label){
 source=parseUsque(text);sourceText=JSON.stringify(source,null,2);enableOutputs();nativeLoaded(label);
 $("regSummary").classList.remove("hidden");$("regSummary").textContent=`已加载：${label}\nendpoint_v4: ${source.endpoint_v4||"(无)"}\nendpoint_v6: ${source.endpoint_v6||"(无)"}\nipv4: ${source.ipv4||"(无)"}\nipv6: ${source.ipv6||"(无)"}`;
 setStatus("原生 config.json 已加载，可以直接自定义和转换。","ok");
 settingsDirty=false;setSettingsState("clean","原生配置加载成功，当前设置已应用");
 toast(`已加载 ${label}，无需重新注册。`,"success","原生配置加载成功");
}

async function register(){
 if(!$("regTos").checked){setStatus("请先勾选条款确认框","error");return}
 if(!window.UsqueRegister){setStatus("注册模块未加载","error");return}
 $("regStart").disabled=true;
 try{
  const d=await window.UsqueRegister.registerDevice({deviceName:$("regDeviceName").value.trim()||"Web-Usque",onStep:(n,msg)=>setStatus(`步骤 ${n}/4：${msg}`,"working")});
  source=d;sourceText=JSON.stringify(d,null,2);enableOutputs();nativeLoaded("网页注册生成的 usque-config.json");
  $("regSummary").classList.remove("hidden");$("regSummary").textContent=`注册成功\nendpoint_v4: ${d.endpoint_v4||"(无)"}\nendpoint_v6: ${d.endpoint_v6||"(无)"}\nipv4: ${d.ipv4||"(无)"}\nipv6: ${d.ipv6||"(无)"}`;
  setStatus("注册成功！已先生成原生 config.json。保存后以后无需再次注册。","ok");
  settingsDirty=false;setSettingsState("clean","注册成功，当前设置已应用");
  toast("Usque 注册成功，原生 config.json 已生成。","success","注册成功");
  $("regStart").textContent="✅ 本次注册完成";
  if($("autoDownloadConfig").checked)setTimeout(()=>download("usque-config.json",sourceText,"application/json"),180);
 }catch(e){
  if(e?.status===429||e?.code===1015||/1015|rate.?limit|限流/i.test(String(e?.message||""))){startCooldown(e?.retryAfter||30);return}
  setStatus("注册失败："+e.message,"error");toast("注册失败："+e.message,"error","注册失败");$("regStart").disabled=false;
 }
}
function startCooldown(seconds){
 let left=Math.max(1,Number(seconds)||30);const b=$("regStart");b.disabled=true;if(cooldownTimer)clearInterval(cooldownTimer);
 toast(`Cloudflare 注册接口触发限流，请等待约 ${left} 秒后再试。`,"warning","接口限流");
 const tick=()=>{b.textContent=`⏳ 限流中，${left} 秒后可重试`;setStatus(`Cloudflare WARP 注册接口限流，请等待 ${left} 秒。`,"error");left--;if(left<0){clearInterval(cooldownTimer);cooldownTimer=null;b.textContent="🚀 一键注册";b.disabled=false;setStatus("等待结束，可以手动再试一次。","")}};
 tick();cooldownTimer=setInterval(tick,1000);
}

function updateChatgptRouteHint(){
 const mode=$("chatgptRouteMode").value;
 const labels={
   "DIRECT":"DIRECT 直连",
   "AI自动选择":"WARP · AI 自动选择",
   "地区优选":"WARP · 地区优选",
   "PROXY":"WARP · PROXY",
   "AI":"AI 策略组"
 };
 const other=$("otherAiRouteMode").selectedOptions?.[0]?.textContent||$("otherAiRouteMode").value;
 $("chatgptRouteHint").textContent=
   `当前：ChatGPT/OpenAI → ${labels[mode]||mode}；其它 AI → ${other}。`+
   (mode==="DIRECT"?" 这是最简单方案，不需要运行出口检测脚本。":"");
}

function resetRecommended(){
 $("endpointPreset").value="auto-curated";$("portPreset").value="recommended";$("sniPreset").value="www.microsoft.com";$("dnsPreset").value="cf-google-dual";
 $("innerIpMode").value="dual";$("networkMode").value="quic";$("stackMode").value="auto";$("ccMode").value="cubic";$("outerCc").value="";$("bbrProfile").value="standard";
 $("mtuPreset").value="1280";$("handshakeTimeout").value="0";$("ruleMode").value="smart";$("healthUrl").value="http://cp.cloudflare.com/generate_204";
 $("healthInterval").value="300";$("healthTolerance").value="30";$("aiHealthMode").value="chatgpt";
 $("chatgptRouteMode").value="DIRECT";$("otherAiRouteMode").value="AI";$("chatgptDirectFallback").checked=true;
 $("egressCountry1").value="";$("egressCountry2").value="";$("egressCountry3").value="";
 $("controllerUrl").value="http://127.0.0.1:9090";$("controllerSecret").value="";$("localProxyUrl").value="http://127.0.0.1:7890";
 $("egressChatgptFirst").checked=true;$("egressApplyAll").checked=false;$("enableControllerApi").checked=true;
 $("nodeTag").value="CDN";$("profileName").value="MASQUE-Pro";$("nodeCountMode").value="13";$("customNodeCount").value="100";$("nodeBuildMode").value="balanced";$("extraEndpoints").value="";$("nodeNaming").value="detail";
 $("udpForward").checked=true;$("remoteDns").checked=true;$("autoSelect").checked=true;$("showIcons").checked=true;$("adBlock").checked=true;$("includeTestEndpoints").checked=true;$("dedupeNodes").checked=true;$("h2ExtendedPool").checked=true;
 syncConditional();updateEstimate();
}
function preset(name){
 resetRecommended();
 document.querySelectorAll(".preset").forEach(x=>x.classList.remove("active"));
 if(name==="recommended")$("presetRecommended").classList.add("active");
 if(name==="ipv4"){$("endpointPreset").value="auto-v4";$("presetIpv4").classList.add("active")}
 if(name==="ipv6"){$("endpointPreset").value="auto-v6";$("innerIpMode").value="v6";$("presetIpv6").classList.add("active")}
 if(name==="all"){$("endpointPreset").value="auto-curated";$("portPreset").value="all";$("nodeCountMode").value="64";$("nodeBuildMode").value="balanced";$("presetAll").classList.add("active")}
 if(name==="h2"){$("endpointPreset").value="source-auto";$("portPreset").value="all";$("networkMode").value="h2";$("nodeCountMode").value="100";$("h2ExtendedPool").checked=true;$("presetH2").classList.add("active")}
 syncConditional();updateEstimate();settingsDirty=true;setSettingsState("dirty","预设已载入，点击“应用设置并重新生成”后生效");
 const presetNames={recommended:"新手推荐",ipv4:"IPv4 稳定",ipv6:"IPv6 优先",all:"全节点测速",h2:"H2 备用"};
 toast(`已载入“${presetNames[name]||name}”预设。`,"info","预设已切换");
}
function syncConditional(){
 $("customEndpointWrap").className=$("endpointPreset").value==="custom"?"":"hidden";
 $("customPortWrap").className=$("portPreset").value==="custom"?"":"hidden";
 $("customSniWrap").className=$("sniPreset").value==="custom"?"":"hidden";
 $("customDnsWrap").className=$("dnsPreset").value==="custom"?"":"hidden";
 const ci=$("innerIpMode").value==="custom";
 $("customInner4Wrap").className=ci?"":"hidden";$("customInner6Wrap").className=ci?"":"hidden";
 $("customMtuWrap").className=$("mtuPreset").value==="custom"?"":"hidden";
 $("customNodeCountWrap").className=$("nodeCountMode").value==="custom"?"":"hidden";
 if($("networkMode").value==="h3-l4proxy")$("udpForward").checked=false;
}

const selectSettingIds=["endpointPreset","portPreset","sniPreset","dnsPreset","innerIpMode","networkMode","stackMode","ccMode","outerCc","bbrProfile","mtuPreset","handshakeTimeout","ruleMode","healthUrl","healthInterval","healthTolerance","aiHealthMode","chatgptRouteMode","otherAiRouteMode","chatgptDirectFallback","egressCountry1","egressCountry2","egressCountry3","egressChatgptFirst","egressApplyAll","enableControllerApi","nodeCountMode","nodeBuildMode","nodeNaming","udpForward","remoteDns","autoSelect","showIcons","adBlock","includeTestEndpoints","dedupeNodes","h2ExtendedPool"];
selectSettingIds.forEach(id=>$(id).addEventListener("change",()=>{
 syncConditional();updateEstimate();
 if(id==="chatgptRouteMode"||id==="otherAiRouteMode")updateChatgptRouteHint();
 markDirty(id,true);
 if(id==="nodeCountMode"){
   const target=targetNodeCount(),actual=connectionPairs().length;
   if(actual<target){
     toast(`目标 ${target} 个节点，但当前只有 ${actual} 个唯一 Endpoint × Port 组合。可在“附加 Endpoint”中增加入口。`,"warning","节点数量受限");
   }else{
     toast(`节点数量模式已切换：应用后生成 ${actual} 个节点。`,"info","节点模式");
   }
 }
}));
const textSettingIds=["customEndpoint","customPort","customSni","customDns","customInner4","customInner6","customMtu","customNodeCount","extraEndpoints","controllerUrl","controllerSecret","localProxyUrl","nodeTag","profileName"];
textSettingIds.forEach(id=>$(id).addEventListener("change",()=>{updateEstimate();markDirty(id,true)}));

$("presetRecommended").addEventListener("click",()=>preset("recommended"));
$("presetIpv4").addEventListener("click",()=>preset("ipv4"));
$("presetIpv6").addEventListener("click",()=>preset("ipv6"));
$("presetAll").addEventListener("click",()=>preset("all"));
$("presetH2").addEventListener("click",()=>preset("h2"));
$("resetSettings").addEventListener("click",()=>{resetRecommended();settingsDirty=true;setSettingsState("dirty","已恢复推荐设置，点击“应用设置并重新生成”后生效");toast("所有高级设置已恢复为推荐值。","success","恢复成功")});
$("applySettings").addEventListener("click",()=>{
 if(!source){setStatus("请先注册或导入 config.json","error");setSettingsState("error","应用失败：尚未加载原生 config.json");toast("请先注册 Usque 或导入已有 config.json。","error","无法应用设置");return}
 try{
  const target=currentFormat==="native"?"clash":currentFormat;setFormat(target);
  const n=connectionPairs().length,targetCount=targetNodeCount();settingsDirty=false;
  setSettingsState("clean",`✅ 设置已成功应用 · ${n} 个节点 · ChatGPT → ${$("chatgptRouteMode").selectedOptions[0].textContent}`);
  if(n<targetCount){
    toast(`设置已应用。目标 ${targetCount} 个，当前可生成 ${n} 个唯一节点；没有复制重复节点。`,"warning","重新生成完成");
  }else{
    toast(`设置已应用并重新生成成功，共 ${n} 个节点。`,"success","重新生成成功");
  }
  const b=$("applySettings"),old=b.textContent;b.textContent="✅ 已应用";setTimeout(()=>b.textContent=old,1200);
 }catch(e){setSettingsState("error","应用失败："+e.message);toast("重新生成失败："+e.message,"error","设置应用失败")}
});

$("regStart").addEventListener("click",register);
$("downloadOriginal").addEventListener("click",()=>sourceText&&download("usque-config.json",sourceText,"application/json"));
$("copyCli").addEventListener("click",()=>copyText("./usque register",$("copyCli")));
$("showNative").addEventListener("click",()=>source&&setFormat("native"));
$("copyNative").addEventListener("click",()=>sourceText&&copyText(sourceText,$("copyNative")));
$("downloadNative2").addEventListener("click",()=>sourceText&&download("usque-config.json",sourceText,"application/json"));

async function filePicked(f){if(!f)return;try{loadSource(await f.text(),f.name)}catch(e){setStatus("读取失败："+e.message,"error");toast("配置文件读取失败："+e.message,"error","导入失败")}}
$("masqueFile").addEventListener("change",e=>filePicked(e.target.files?.[0]));
$("masqueFileTop").addEventListener("change",e=>filePicked(e.target.files?.[0]));
const drop=$("configDrop");
["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.style.borderColor="#64ded5"}));
["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.style.borderColor=""}));
drop.addEventListener("drop",e=>filePicked(e.dataTransfer.files?.[0]));

$("fmtNative").addEventListener("click",()=>{setFormat("native");toast("已切换到原生 Usque config.json。","success","格式已生成")});
$("fmtClash").addEventListener("click",()=>{try{setFormat("clash");toast(`Clash / Mihomo 配置已生成，共 ${connectionPairs().length} 个节点。`,"success","格式已生成")}catch(e){toast(e.message,"error","生成失败")}});
$("fmtShadowrocket").addEventListener("click",()=>{try{setFormat("shadowrocket");toast(`Shadowrocket 配置已生成，共 ${connectionPairs().length} 个节点。`,"success","格式已生成")}catch(e){toast(e.message,"error","生成失败")}});
$("fmtSingbox").addEventListener("click",()=>{try{setFormat("singbox");toast("sing-box 兼容配置已生成。","success","格式已生成")}catch(e){toast(e.message,"error","生成失败")}});
$("fmtVless").addEventListener("click",()=>{try{setFormat("vless");toast("VLESS 本地桥接配置已生成。","success","格式已生成")}catch(e){toast(e.message,"error","生成失败")}});
$("copyMain").addEventListener("click",()=>copyText($("mainOutput").value,$("copyMain")));
$("downloadMain").addEventListener("click",()=>{
 if(currentFormat==="native")download("usque-config.json",$("mainOutput").value,"application/json");
 if(currentFormat==="clash")download("masque-clash-smart.yaml",$("mainOutput").value,"text/yaml");
 if(currentFormat==="shadowrocket")download("masque-shadowrocket.yaml",$("mainOutput").value,"text/yaml");
 if(currentFormat==="singbox")download("sing-box-usque.json",$("mainOutput").value,"application/json");
 if(currentFormat==="vless")download("usque-vless-local.txt",$("mainOutput").value,"text/plain");
});
$("downloadHelper").addEventListener("click",()=>{if(currentFormat==="vless"&&helperText)download("usque-vless-bridge.json",helperText,"application/json")});
$("downloadVlessBat").addEventListener("click",()=>{if(currentFormat==="vless")download("start-usque-vless-windows.bat",buildVlessWindowsBat(),"text/plain")});

$("downloadEgressScanner").addEventListener("click",()=>{
  window.location.href="./warp-egress-selector.py?v=65";
  toast("出口检测脚本下载已触发。","success","下载已触发");
});
$("downloadEgressBat").addEventListener("click",()=>{
  download("run-warp-egress-selector.bat",buildEgressBat(),"text/plain");
});
$("downloadEgressConfig").addEventListener("click",()=>{
  download("warp-egress-preference.json",JSON.stringify(egressPreferences(),null,2),"application/json");
});

resetRecommended();syncConditional();updateEstimate();setSettingsState("clean","当前设置已应用");
})();