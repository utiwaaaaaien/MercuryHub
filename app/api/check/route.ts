import sites from "@/lib/sites.json";
import { checkLink } from "@/lib/check-link";
import type { CheckResult } from "@/lib/check-types";
const catalog = new Map(sites.map(site => [site.id, site]));
const cache = new Map<string, { at: number; result: CheckResult }>();
const pending = new Map<string, Promise<CheckResult>>();
const limits = new Map<string, { at: number; count: number }>();
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const RESULT_CACHE_MS = 15 * 60_000;
const REQUEST_INTERVAL_MS = 30_000;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "请求来源不匹配" }, { status: 403, headers });
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "请求格式不正确" }, { status: 415, headers });
  let body = "", size = 0;
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "缺少站点编号" }, { status: 400, headers });
  try {
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 256) { await reader.cancel(); return Response.json({ error: "请求过大" }, { status: 413, headers }); }
      body += decoder.decode(value, { stream: true });
    }
  } catch { return Response.json({ error: "读取请求失败" }, { status: 400, headers }); }
  let id: unknown;
  try { id = JSON.parse(body).id; } catch { return Response.json({ error: "请求格式不正确" }, { status: 400, headers }); }
  const site = typeof id === "string" ? catalog.get(id) : undefined;
  if (!site) return Response.json({ error: "站点不在导航清单中" }, { status: 400, headers });
  const now = Date.now();
  const saved = cache.get(site.id);
  if (saved && now - saved.at < RESULT_CACHE_MS) return Response.json({ ...saved.result, cached: true }, { headers });
  const active = pending.get(site.id);
  if (active) return Response.json(await active, { headers });
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  for (const [key, limit] of limits) if (now - limit.at >= REQUEST_INTERVAL_MS) limits.delete(key);
  const limit = limits.get(ip);
  if (limit) return Response.json({ error: "为减少连续请求，请 30 秒后再检测其他站点" }, { status: 429, headers: { ...headers, "Retry-After": String(Math.max(1, Math.ceil((REQUEST_INTERVAL_MS - (now - limit.at)) / 1000))) } });
  if (limits.size >= 2048 || pending.size >= 2) return Response.json({ error: "检测服务繁忙，请稍后重试" }, { status: 503, headers });
  limits.set(ip, { at: now, count: 1 });
  const cf = (request as Request & { cf?: { colo?: string } }).cf;
  const location = process.env.NODE_ENV === "development" ? "本机预览服务网络" : cf?.colo ? `服务器网络 · ${cf.colo}` : "服务器网络";
  const job = checkLink(site, { location }); pending.set(site.id, job);
  try {
    const result = await job; cache.set(site.id, { at: Date.now(), result });
    return Response.json(result, { headers });
  } finally { pending.delete(site.id); }
}
