"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Check, CircleHelp, Clapperboard, Clock3, Film, Globe2, LoaderCircle, Radio, Search, ShieldAlert, Sparkles, Square, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import sites from "@/lib/sites.json";
import type { CheckResult } from "@/lib/check-types";

const STORAGE_KEY = "mercury-checks-v1";
const labels: Record<string, string> = { reachable: "请求成功", restricted: "访问受限", failed: "连接失败", error: "页面异常", review: "需人工确认", unchecked: "未检测" };
const categories = [{ id: "all", label: "全部站点", icon: Globe2 }, { id: "真人", label: "真人影视", icon: Film }, { id: "动画", label: "动画资源", icon: Sparkles }];
const isIssue = (r?: CheckResult) => !!r && r.state !== "reachable";
const timeLabel = (value: string) => new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [checking, setChecking] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [run, setRun] = useState<{ total: number; done: number; active: boolean; cancelled: boolean } | null>(null);
  const [ready, setReady] = useState(false);
  const [storageIssue, setStorageIssue] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const controllers = useRef(new Map<string, AbortController>());
  const batch = useRef<{ cancelled: boolean } | null>(null);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      const valid: Record<string, CheckResult> = {};
      for (const site of sites) {
        const item = raw?.[site.id];
        if (item && item.id === site.id && ["reachable", "restricted", "failed", "error", "review"].includes(item.state) && Number.isFinite(Date.parse(item.checkedAt)) && typeof item.reason === "string" && typeof item.location === "string" && typeof item.durationMs === "number") valid[site.id] = item;
      }
      setResults(valid);
    } catch { setStorageIssue(true); }
    setReady(true);
    return () => { if (batch.current) batch.current.cancelled = true; for (const controller of controllers.current.values()) controller.abort(); };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(results)); } catch { setStorageIssue(true); }
  }, [results, ready]);
  const visible = useMemo(() => sites.filter(site => {
    const textMatch = `${site.name} ${site.url} ${site.categories.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
    const categoryMatch = category === "all" || site.categories.includes(category);
    const result = results[site.id];
    const statusMatch = status === "all" || (status === "unchecked" ? !result : status === "issues" ? isIssue(result) : result?.state === status);
    return textMatch && categoryMatch && statusMatch;
  }), [query, category, status, results]);
  const goodCount = Object.values(results).filter(r => r.state === "reachable").length;
  const issueCount = Object.values(results).filter(isIssue).length;
  const issueSites = sites.filter(site => isIssue(results[site.id]) || errors[site.id]);
  const busy = checking.size > 0 || !!run?.active;
  async function checkOne(id: string) {
    if (controllers.current.has(id)) return;
    const controller = new AbortController(); controllers.current.set(id, controller);
    setChecking(prev => new Set([...prev, id]));
    setErrors(prev => { const next = { ...prev }; delete next[id]; return next; });
    const timer = setTimeout(() => controller.abort("timeout"), 18000);
    try {
      const response = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }), signal: controller.signal });
      let payload: CheckResult & { error?: string };
      try { payload = await response.json() as CheckResult & { error?: string }; }
      catch { throw new Error("检测服务暂时未返回结果，请稍后重试；这不代表目标网站失效"); }
      if (!response.ok) throw new Error(payload.error || "检测服务暂不可用，请稍后重试");
      if (payload.id !== id || !labels[payload.state] || !payload.checkedAt) throw new Error("检测服务返回异常，请重试");
      setResults(prev => ({ ...prev, [id]: payload }));
    } catch (error) {
      if (controller.signal.reason === "cancel") return;
      const message = controller.signal.aborted ? "检测服务响应超时，请重试；这不代表目标网站失效" : error instanceof Error ? error.message : "无法连接检测服务，请重试";
      setErrors(prev => ({ ...prev, [id]: message }));
    } finally {
      clearTimeout(timer); controllers.current.delete(id);
      setChecking(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  }
  async function checkMany(targets = sites) {
    if (busy || batch.current || !targets.length) return;
    const token = { cancelled: false }; batch.current = token;
    let next = 0;
    setRun({ total: targets.length, done: 0, active: true, cancelled: false });
    await Promise.all(Array.from({ length: Math.min(4, targets.length) }, async () => {
      while (!token.cancelled && next < targets.length) {
        const site = targets[next++]; await checkOne(site.id);
        if (!token.cancelled) setRun(prev => prev ? { ...prev, done: prev.done + 1 } : prev);
      }
    }));
    setRun(prev => prev ? { ...prev, active: false, cancelled: token.cancelled } : prev);
    batch.current = null;
  }
  function cancel() {
    if (batch.current) batch.current.cancelled = true;
    for (const controller of controllers.current.values()) controller.abort("cancel");
  }
  return <div className="app-shell">
    <header className="topbar"><a href="/" className="brand" aria-label="Mercury 影视资源导航首页"><span className="brand-icon"><Clapperboard size={23} /></span><span>Mercury<span className="brand-subtitle">影视资源导航</span></span></a><button className={`help-toggle ${showHelp ? "selected" : ""}`} onClick={() => setShowHelp(v => !v)} aria-expanded={showHelp} aria-controls="check-help"><CircleHelp size={17} /><span>检测说明</span></button></header>
    <main className="main-wrap">
      <section className="intro"><div><h1>找到入口，直达资源。</h1><p>你的影视站点，集中在这里。</p></div><div className="intro-count"><span>{sites.length}</span><span>个精选入口</span></div></section>
      {showHelp && <section id="check-help" className="help-panel"><h2>检测结果应该怎么看？</h2><p>检测从服务器发出，与您当前的网络、代理和登录状态可能不同。“请求成功”表示入口返回成功响应，不保证页面内容或下载资源可用。验证码、登录限制和自动请求拦截会单独提示。</p><p>同一入口的检测结果可能复用最近 60 秒的缓存。历史结果保存在当前浏览器，每条结果都保留原检测时间。跨域跳转需手动确认，原始入口始终可以直接打开。</p></section>}
      <section className="workspace" aria-label="站点导航与检测">
        <div className="action-row"><div className="search-wrap"><Search size={20} /><input aria-label="搜索站点名称或网址" placeholder="搜索站点名称或网址…" value={query} onChange={event => setQuery(event.target.value)} />{query && <button onClick={() => setQuery("")} aria-label="清空搜索"><X size={17} /></button>}</div><button className="primary-button" onClick={() => checkMany()} disabled={busy}>{run?.active ? <LoaderCircle className="spin" size={18} /> : <Radio size={18} />}{run?.active ? "正在检测" : "检测全部站点"}</button></div>
        <div className="filter-row"><Tabs value={category} onValueChange={setCategory} className="category-tabs"><TabsList aria-label="资源分类" className="category-list">{categories.map(item => <TabsTrigger key={item.id} value={item.id} className="category-tab"><item.icon size={17} /><span>{item.label}</span><span className="tab-count">{item.id === "all" ? sites.length : sites.filter(site => site.categories.includes(item.id)).length}</span></TabsTrigger>)}</TabsList></Tabs><Select value={status} onValueChange={setStatus}><SelectTrigger className="status-select" aria-label="筛选检测状态"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部状态</SelectItem><SelectItem value="reachable">请求成功</SelectItem><SelectItem value="issues">需要关注</SelectItem><SelectItem value="unchecked">尚未检测</SelectItem></SelectContent></Select></div>
        <div className="monitor-strip"><span className="network-label"><Globe2 size={16} />服务器检测</span><div className="status-summary"><span><i className="dot reachable" />成功 <b>{goodCount}</b></span><span><i className="dot restricted" />需关注 <b>{issueCount}</b></span><span><i className="dot unchecked" />未检测 <b>{sites.length - Object.keys(results).length}</b></span></div><span className="monitor-note">结果以检测时间为准</span></div>
        {run && <div className="batch-progress" role="status" aria-live="polite"><div><span>{run.active ? "正在检查入口" : run.cancelled ? "已取消，已完成的结果已保留" : "本轮检测已结束"} <b>{run.done}/{run.total}</b></span>{run.active ? <button onClick={cancel}><Square size={12} />取消检测</button> : issueSites.length > 0 ? <button disabled={busy} onClick={() => checkMany(issueSites)}>重试需关注项</button> : <Check size={17} />}</div><Progress value={run.done / run.total * 100} aria-label="批量检测进度" /></div>}
        {storageIssue && <p className="storage-notice" role="status">当前浏览器无法保存历史结果，检测和跳转仍可使用。</p>}
        <div className="list-heading"><h2>{category === "all" ? "所有站点" : category === "真人" ? "真人影视" : "动画资源"}<span>{visible.length}</span></h2><span>新标签页打开</span></div>
        <div className="site-grid">{visible.map(site => {
          const result = results[site.id], loading = checking.has(site.id);
          const stale = !!result && Date.now() - Date.parse(result.checkedAt) > 3600000;
          const state = result?.state ?? "unchecked";
          return <article key={site.id} className={`site-card ${loading ? "is-checking" : ""}`} data-site-id={site.id}>
            <div className="card-head"><div className={`site-mark tone-${site.categories.length === 2 ? "blue" : site.categories[0] === "动画" ? "violet" : "slate"}`} aria-hidden="true">{site.mark}</div><div className="site-title"><h3><a href={site.url} target="_blank" rel="noopener noreferrer">{site.name}</a></h3><span>{new URL(site.url).hostname.replace(/^www\./, "")}</span></div></div>
            <div className="site-tags">{site.categories.map(tag => <span key={tag}>{tag}</span>)}<span className="rating" title="推荐指数来自原表">原表推荐 {site.rating}/5</span></div>
            <div className="site-capacity"><span>片库容量 <small>原表记录</small></span><strong>{site.capacity.toLocaleString("zh-CN")}<small> 部</small></strong></div>
            <div className="check-area" aria-live="polite"><div className={`check-state ${loading ? "loading" : state}`}>{loading ? <LoaderCircle className="spin" size={15} /> : state === "reachable" ? <Check size={15} /> : ["restricted", "review", "error", "failed"].includes(state) ? <ShieldAlert size={15} /> : <Clock3 size={15} />}<span>{loading ? "正在检测…" : labels[state]}</span>{result && !loading && <span className="response-code">{result.statusCode ? `HTTP ${result.statusCode}` : ""}</span>}</div><p className="check-time">{result ? `${stale ? "历史 · " : ""}${timeLabel(result.checkedAt)}${result.cached ? " · 缓存" : ""}` : "点击检测，查看当前连接情况"}</p>{errors[site.id] && <p className="check-service-error">{errors[site.id]}{result ? "（上次结果保留）" : ""}</p>}</div>
            <div className="card-actions"><a className="open-button" href={site.url} target="_blank" rel="noopener noreferrer">打开网站<ArrowUpRight size={17} /></a><button className="check-button" onClick={() => checkOne(site.id)} disabled={loading || !!run?.active} aria-label={`检测 ${site.name}`}><Radio size={16} />检测</button></div>
            {result && <details className="result-details"><summary>检测详情</summary><p>{result.reason}</p><dl><div><dt>检测网络</dt><dd>{result.location}</dd></div><div><dt>请求耗时</dt><dd>{(result.durationMs / 1000).toFixed(2)} 秒</dd></div><div><dt>检查地址</dt><dd>{result.finalUrl}</dd></div></dl></details>}
          </article>;
        })}</div>
        {visible.length === 0 && <div className="empty-state"><Search size={28} /><h3>没有找到匹配的站点</h3><p>换个名称，或清除筛选再试。</p><button onClick={() => { setQuery(""); setCategory("all"); setStatus("all"); }}>清除全部筛选</button></div>}
      </section>
      <footer><span>Mercury · 影视资源导航</span><p>站点、容量与推荐指数来自原表。连接检测不代表资源可下载。</p></footer>
    </main>
  </div>;
}
