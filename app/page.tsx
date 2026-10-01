"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, CircleHelp, Clapperboard, Clock3, Film, Globe2, Search, ShieldAlert, Sparkles, Star, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import sites from "@/lib/sites.json";
import type { CheckResult } from "@/lib/check-types";

const STALE_MS = 36 * 60 * 60_000;
const REFRESH_MS = 30 * 60_000;
const labels: Record<string, string> = { reachable: "请求成功", restricted: "访问受限", failed: "连接失败", error: "页面异常", review: "需人工确认", unchecked: "未检测" };
const categories = [{ id: "all", label: "全部站点", icon: Globe2 }, { id: "真人", label: "真人影视", icon: Film }, { id: "动画", label: "动画资源", icon: Sparkles }];
const rankedSites = [...sites].sort((a, b) => b.rating - a.rating);
const isIssue = (r?: CheckResult) => !!r && r.state !== "reachable";
const timeLabel = (value: string) => new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });

// Only the GitHub Pages deployment sends analytics. Event names are a fixed allowlist.
const ANALYTICS_HOST = "utiwaaaaaien.github.io";
const ANALYTICS_WEBSITE = "9922916c-ac5b-49bc-84fe-58e9569ae938";
const ANALYTICS_OPT_OUT = "mercuryhub.analytics.disabled";
const categoryEvents: Record<string, string> = { all: "分类 · 全部站点", 真人: "分类 · 真人影视", 动画: "分类 · 动画资源" };
const statusEvents: Record<string, string> = { all: "状态 · 全部状态", reachable: "状态 · 请求成功", issues: "状态 · 需要关注", unchecked: "状态 · 尚未检测" };
const allowedEvents = new Set([...sites.map(site => `打开资源 · ${site.name}`), ...Object.values(categoryEvents), ...Object.values(statusEvents)]);
type AnalyticsWindow = Window & {
  umami?: { track: (name?: string) => Promise<unknown> };
  mercuryHubBeforeSend?: (type: string, payload: Record<string, unknown>) => Record<string, unknown> | false;
};
let analyticsDisabled = false;

function browserDeclinesAnalytics() {
  return navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}
function readAnalyticsOptOut() {
  try { return localStorage.getItem(ANALYTICS_OPT_OUT) === "true"; } catch { return true; }
}
function canSendAnalytics() {
  return window.location.hostname === ANALYTICS_HOST && window.location.pathname.startsWith("/MercuryHub/") && !analyticsDisabled && !browserDeclinesAnalytics();
}
function trackAnalytics(name?: string) {
  if (!canSendAnalytics() || (name !== undefined && !allowedEvents.has(name))) return;
  try { void (window as AnalyticsWindow).umami?.track(name)?.catch(() => {}); } catch { /* Analytics must never interrupt navigation. */ }
}
function startAnalytics() {
  if (!canSendAnalytics() || document.getElementById("mercuryhub-analytics")) return;
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.mercuryHubBeforeSend = (type, payload) => {
    if (type !== "event" || !canSendAnalytics() || (payload.name !== undefined && !allowedEvents.has(String(payload.name)))) return false;
    let referrer = "";
    try {
      // Keep only an external origin; discard paths, queries, fragments and credentials.
      const source = new URL(document.referrer);
      if (["https:", "http:"].includes(source.protocol) && source.hostname !== ANALYTICS_HOST) referrer = source.origin;
    } catch { /* Direct visits have no referrer. */ }
    return {
      website: ANALYTICS_WEBSITE,
      hostname: ANALYTICS_HOST,
      url: "/MercuryHub/",
      title: "MercuryHub · 影视资源导航",
      referrer,
      ...(payload.name !== undefined ? { name: String(payload.name) } : {}),
    };
  };
  const script = document.createElement("script");
  script.id = "mercuryhub-analytics";
  script.src = "https://cloud.umami.is/script.js";
  script.defer = true;
  script.referrerPolicy = "no-referrer";
  script.dataset.websiteId = ANALYTICS_WEBSITE;
  script.dataset.domains = ANALYTICS_HOST;
  script.dataset.autoTrack = "false";
  script.dataset.doNotTrack = "true";
  script.dataset.excludeSearch = "true";
  script.dataset.excludeHash = "true";
  script.dataset.beforeSend = "mercuryHubBeforeSend";
  script.onload = () => trackAnalytics();
  // A blocked or unavailable statistics service does not affect the website.
  script.onerror = () => {};
  document.head.appendChild(script);
}

export default function Home() {
  const [analyticsOptOut, setAnalyticsOptOut] = useState(false);
  const [privacySignal, setPrivacySignal] = useState(false);
  const [analyticsPreferenceMessage, setAnalyticsPreferenceMessage] = useState("");
  useEffect(() => {
    analyticsDisabled = readAnalyticsOptOut();
    setAnalyticsOptOut(analyticsDisabled);
    setPrivacySignal(browserDeclinesAnalytics());
    startAnalytics();
    function syncPreference(event: StorageEvent) {
      if (event.key !== ANALYTICS_OPT_OUT && event.key !== null) return;
      analyticsDisabled = readAnalyticsOptOut();
      setAnalyticsOptOut(analyticsDisabled);
      startAnalytics();
    }
    window.addEventListener("storage", syncPreference);
    return () => window.removeEventListener("storage", syncPreference);
  }, []);
  function toggleAnalytics() {
    analyticsDisabled = !analyticsDisabled;
    setAnalyticsOptOut(analyticsDisabled);
    try {
      localStorage.setItem(ANALYTICS_OPT_OUT, String(analyticsDisabled));
      setAnalyticsPreferenceMessage("");
    } catch {
      setAnalyticsPreferenceMessage("浏览器无法保存设置；本次选择仅在当前页面有效，刷新后将默认关闭统计。");
    }
    startAnalytics();
  }
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [snapshotError, setSnapshotError] = useState(false);
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    let lastFetchedAt = 0;
    async function loadSnapshot() {
      if (inFlight || controller.signal.aborted) return;
      inFlight = true;
      try {
        const response = await fetch(`./checks.json?t=${Date.now()}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("检测结果未发布");
        const snapshot = await response.json() as { generatedAt?: string; results?: Record<string, CheckResult> };
        if (!snapshot.generatedAt || !Number.isFinite(Date.parse(snapshot.generatedAt)) || !snapshot.results) throw new Error("检测结果格式异常");
        const valid: Record<string, CheckResult> = {};
        for (const site of sites) {
          const item = snapshot.results[site.id];
          if (item && item.id === site.id && ["reachable", "restricted", "failed", "error", "review"].includes(item.state) && Number.isFinite(Date.parse(item.checkedAt)) && typeof item.reason === "string" && typeof item.location === "string" && typeof item.durationMs === "number") valid[site.id] = item;
        }
        if (Object.keys(valid).length !== sites.length) throw new Error("检测结果不完整");
        setResults(valid);
        setSnapshotAt(snapshot.generatedAt);
        setSnapshotError(false);
      } catch {
        if (!controller.signal.aborted) setSnapshotError(true);
      } finally {
        lastFetchedAt = Date.now();
        inFlight = false;
        if (!controller.signal.aborted) setLoadingSnapshot(false);
      }
    }
    function refreshIfVisible() {
      setNow(Date.now());
      if (document.visibilityState === "visible" && Date.now() - lastFetchedAt >= REFRESH_MS) void loadSnapshot();
    }
    void loadSnapshot();
    const timer = window.setInterval(refreshIfVisible, 60_000);
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, []);
  const visible = useMemo(() => rankedSites.filter(site => {
    const textMatch = `${site.name} ${site.url} ${site.categories.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
    const categoryMatch = category === "all" || site.categories.includes(category);
    const result = results[site.id];
    const statusMatch = status === "all" || (status === "unchecked" ? !result : status === "issues" ? isIssue(result) : result?.state === status);
    return textMatch && categoryMatch && statusMatch;
  }), [query, category, status, results]);
  const goodCount = Object.values(results).filter(r => r.state === "reachable").length;
  const issueCount = Object.values(results).filter(isIssue).length;
  const snapshotStale = !!snapshotAt && now - Date.parse(snapshotAt) > STALE_MS;
  return <div className="app-shell">
    <header className="topbar"><a href="./" className="brand" aria-label="MercuryHub 首页"><span className="brand-icon"><Clapperboard size={20} /></span><span>MercuryHub</span></a><span className="brand-subtitle">影视资源导航</span><button className={`help-toggle ${showHelp ? "selected" : ""}`} onClick={() => setShowHelp(v => !v)} aria-expanded={showHelp} aria-controls="check-help"><CircleHelp size={17} /><span>检测说明</span></button></header>
    <main className="main-wrap">
      <section className="intro"><h1>好资源，直接抵达。</h1><p>按星级浏览 {sites.length} 个影视资源站点，选择入口即可打开。</p></section>
      {showHelp && <section id="check-help" className="help-panel"><h2>检测结果应该怎么看？</h2><p>GitHub Actions 每天从服务器检测一次清单中的站点，页面显示最近一次发布的结果。检测可能因 GitHub 任务延迟或网站防护而晚于计划时间，请以页面上的检测时间为准。</p><p>检测网络与您当前的网络、代理和登录状态可能不同。“请求成功”只表示入口返回成功响应，不保证资源可下载。受限、超时和跨域跳转请手动打开确认。</p></section>}
      <section className="workspace" aria-label="站点导航与检测">
        <div className="action-row"><div className="search-wrap"><Search size={20} /><input aria-label="搜索站点名称或网址" placeholder="搜索站点名称或网址…" value={query} onChange={event => setQuery(event.target.value)} />{query && <button onClick={() => setQuery("")} aria-label="清空搜索"><X size={17} /></button>}</div><p className="check-policy">{snapshotAt ? `每日检测 · ${timeLabel(snapshotAt)} 更新` : loadingSnapshot ? "正在读取检测结果…" : "每日检测 · 暂无结果"}</p></div>
        <div className="filter-row"><Tabs value={category} onValueChange={value => { setCategory(value); if (value !== category) trackAnalytics(categoryEvents[value]); }} className="category-tabs"><TabsList aria-label="资源分类" className="category-list">{categories.map(item => <TabsTrigger key={item.id} value={item.id} className="category-tab"><item.icon size={17} /><span>{item.label}</span><span className="tab-count">{item.id === "all" ? sites.length : sites.filter(site => site.categories.includes(item.id)).length}</span></TabsTrigger>)}</TabsList></Tabs><Select value={status} onValueChange={value => { setStatus(value); if (value !== status) trackAnalytics(statusEvents[value]); }}><SelectTrigger className="status-select" aria-label="筛选检测状态"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部状态</SelectItem><SelectItem value="reachable">请求成功</SelectItem><SelectItem value="issues">需要关注</SelectItem><SelectItem value="unchecked">尚未检测</SelectItem></SelectContent></Select></div>
        <div className="monitor-strip"><span className="network-label"><Globe2 size={16} />GitHub 定时检测</span><div className="status-summary"><span><i className="dot reachable" />成功 <b>{goodCount}</b></span><span><i className="dot restricted" />需关注 <b>{issueCount}</b></span><span><i className="dot unchecked" />未检测 <b>{sites.length - Object.keys(results).length}</b></span></div><span className="monitor-note">结果以检测时间为准</span></div>
        {snapshotError && <p className="storage-notice" role="status">{snapshotAt ? "暂时无法获取最新检测结果，当前显示上次读取的结果。" : "检测结果暂不可用，请稍后刷新页面；站点链接仍可打开。"}</p>}
        {snapshotStale && <p className="storage-notice" role="status">最近一次检测已超过 36 小时，结果可能过期，请手动打开网站核实。</p>}
        <div className="list-heading"><h2>{category === "all" ? "全部资源网站" : category === "真人" ? "真人影视" : "动画资源"}<span>{visible.length}</span></h2><span>按星级从高到低 · 新标签页打开</span></div>
        <div className="site-grid">{visible.map(site => {
          const result = results[site.id];
          const stale = !!result && now - Date.parse(result.checkedAt) > STALE_MS;
          const state = result?.state ?? "unchecked";
          return <article key={site.id} className="site-card" data-site-id={site.id}>
            <div className="card-head"><div className="site-title"><h3><a href={site.url} onClick={() => trackAnalytics(`打开资源 · ${site.name}`)} onAuxClick={event => { if (event.button === 1) trackAnalytics(`打开资源 · ${site.name}`); }} target="_blank" rel="noopener noreferrer">{site.name}</a></h3><span>{new URL(site.url).hostname.replace(/^www\./, "")}</span></div></div>
            <div className="rating" aria-label={`站点星级 ${site.rating} 星，满分 5 星`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} strokeWidth={1.8} fill={index < site.rating ? "currentColor" : "none"} className={index < site.rating ? "star-filled" : "star-empty"} />)}<span>{site.rating} 星</span></div>
            <div className="site-tags">{site.categories.map(tag => <span key={tag}>{tag}</span>)}</div>
            <div className="site-capacity">片库容量 <strong>{site.capacity.toLocaleString("zh-CN")} 部</strong></div>
            <div className="card-actions"><a className="open-button" href={site.url} onClick={() => trackAnalytics(`打开资源 · ${site.name}`)} onAuxClick={event => { if (event.button === 1) trackAnalytics(`打开资源 · ${site.name}`); }} target="_blank" rel="noopener noreferrer">打开网站<ArrowUpRight size={18} /></a></div>
            <div className="check-area" aria-live="polite"><div className={`check-state ${state}`}>{state === "reachable" ? <Check size={15} /> : ["restricted", "review", "error", "failed"].includes(state) ? <ShieldAlert size={15} /> : <Clock3 size={15} />}<span>{labels[state]}</span>{result && <span className="response-code">{result.statusCode ? `HTTP ${result.statusCode}` : ""}</span>}</div><p className="check-time">{result ? `${stale ? "历史 · " : ""}${timeLabel(result.checkedAt)}` : loadingSnapshot ? "正在读取检测结果" : "暂无检测结果"}</p></div>
            {result && <details className="result-details"><summary>检测详情</summary><p>{result.reason}</p><dl><div><dt>检测网络</dt><dd>{result.location}</dd></div><div><dt>请求耗时</dt><dd>{(result.durationMs / 1000).toFixed(2)} 秒</dd></div><div><dt>检查地址</dt><dd>{result.finalUrl}</dd></div></dl></details>}
          </article>;
        })}</div>
        {visible.length === 0 && <div className="empty-state"><Search size={28} /><h3>没有找到匹配的站点</h3><p>换个名称，或清除筛选再试。</p><button onClick={() => { setQuery(""); setCategory("all"); setStatus("all"); }}>清除全部筛选</button></div>}
      </section>
      <footer><span>MercuryHub</span><p>星级与容量为收录时记录。连接检测不代表资源可下载。</p></footer>
      <details className="help-panel">
        <summary style={{ cursor: "pointer", fontSize: 13 }}>隐私与统计设置</summary>
        <p>本站使用 Umami 统计访问量、资源入口点击与筛选操作，帮助改进导航。不记录搜索内容、账号信息或网址参数，不使用追踪 Cookie，不启用会话录像或跨站追踪。来源只保留网站域名。</p>
        <p>统计请求会发送至 Umami 云端服务（服务器位于美国及欧盟）。服务会处理连接 IP 等信息以生成统计；本站后台不显示完整 IP 或个人身份。统计数据仅供站点维护者查看。</p>
        <p>浏览器启用“不追踪”或全局隐私控制时，本站自动停止统计。您也可以在此关闭；选择仅保存在当前浏览器，供以后访问时使用。</p>
        <p role="status">{privacySignal ? "当前浏览器已要求停止追踪，统计已关闭。" : analyticsOptOut ? "您已关闭此浏览器的统计。" : "统计已开启。"}{analyticsPreferenceMessage && ` ${analyticsPreferenceMessage}`}</p>
        <button type="button" className="help-toggle" disabled={privacySignal} onClick={toggleAnalytics} style={{ marginLeft: 0, background: "#fff" }}>{analyticsOptOut ? "开启统计" : "关闭统计"}</button>
      </details>
    </main>
  </div>;
}
