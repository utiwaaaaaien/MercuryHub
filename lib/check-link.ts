import type { CheckResult } from "./check-types";
type Options = { fetcher?: typeof fetch; timeoutMs?: number; location?: string };
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

// Only server-owned catalog targets are accepted by the API.
export async function checkLink(target: { id: string; url: string }, options: Options = {}): Promise<CheckResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);
  const fetcher = options.fetcher ?? fetch;
  const initial = new URL(target.url);
  let current = initial;
  const result = (state: CheckResult["state"], reason: string, statusCode?: number): CheckResult => ({
    id: target.id, state, reason, statusCode, finalUrl: current.href,
    checkedAt: new Date().toISOString(), durationMs: Date.now() - started,
    location: options.location ?? "服务器网络",
  });
  const baseHost = (host: string) => host.replace(/^www\./, "");
  try {
    for (let hop = 0; hop <= 4; hop++) {
      const response = await fetcher(current.href, {
        method: "GET", redirect: "manual", signal: controller.signal,
        headers: { "User-Agent": "MercuryLinkChecker/1.0 (website availability check)", Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1" },
      });
      if (REDIRECTS.has(response.status)) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location) return result("review", "收到跳转响应，但未提供目标地址", response.status);
        let next: URL;
        try { next = new URL(location, current); } catch { return result("review", "跳转地址格式异常，请手动打开确认", response.status); }
        if (!["http:", "https:"].includes(next.protocol) || next.username || next.password || next.port || baseHost(next.hostname) !== baseHost(initial.hostname)) return result("review", "跳转到其他域名或受限地址，请手动打开确认", response.status);
        if (current.protocol === "https:" && next.protocol === "http:") return result("review", "跳转降为 HTTP，请手动确认", response.status);
        if (hop === 4) return result("review", "跳转次数过多，请手动打开确认", response.status);
        current = next;
        continue;
      }
      // Cloudflare distinguishes an actual interstitial from passive detection scripts.
      if (response.headers.get("cf-mitigated")?.trim().toLowerCase() === "challenge") {
        await response.body?.cancel();
        return result("restricted", "自动检测遇到安全验证，浏览器可能仍可打开，请手动确认", response.status);
      }
      if ([401, 403, 407, 429, 451].includes(response.status)) {
        await response.body?.cancel();
        return result("restricted", response.status === 429 ? "网站限制了请求频率，请稍后重试" : response.status === 401 ? "网站要求身份验证" : "网站拒绝本次自动请求，可尝试手动打开", response.status);
      }
      if (!response.ok) {
        await response.body?.cancel();
        return result("error", [404, 410].includes(response.status) ? "当前入口页面不存在，网站其他页面可能仍可用" : "网站返回异常响应，请稍后重试", response.status);
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let sample = "", bytes = 0;
      if (reader) {
        try {
          while (bytes < 65536) {
            const { value, done } = await reader.read();
            if (done) break;
            const take = value.subarray(0, 65536 - bytes);
            sample += decoder.decode(take, { stream: true }); bytes += take.length;
          }
        } finally { await reader.cancel().catch(() => {}); }
      }
      const title = sample.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
      // A challenge-platform URL can also appear on a normal page (JSD/Precursor).
      // Require a challenge title, an actual challenge form, or interstitial options.
      const challengePage = /just a moment|attention required|access denied|verify you are human|安全验证|人机验证|访问验证/i.test(title)
        || /<form\b[^>]*\bid\s*=\s*["']challenge-form["']/i.test(sample)
        || /(?:window\.)?_cf_chl_opt\s*=\s*\{/i.test(sample);
      if (challengePage) return result("restricted", "自动检测遇到安全验证，浏览器可能仍可打开，请手动确认", response.status);
      if (/\b(sign in|log in|login)\b|登录|登入/i.test(title) || /\/(login|signin)(\/|\?|$)/i.test(current.href)) return result("restricted", "入口跳转或返回登录页，请登录后确认", response.status);
      if (/domain (is )?for sale|buy this domain|域名出售|网站已关闭|站点已关闭/i.test(title)) return result("review", "页面可能已停用或域名正在出售，请手动确认", response.status);
      if (response.status === 204 || !sample.trim()) return result("review", "服务器响应成功，但未返回可核验的页面内容", response.status);
      return result("reachable", "入口返回成功响应；页面内容及下载资源需自行确认", response.status);
    }
    return result("review", "请手动打开确认");
  } catch (error) {
    if (controller.signal.aborted) return result("failed", "本次请求超时，可重试或手动打开");
    const message = error instanceof Error ? error.message : "";
    if (/dns|enotfound|getaddrinfo/i.test(message)) return result("failed", "服务器本次无法解析域名，可稍后重试");
    if (/ssl|tls|certificate|cert_/i.test(message)) return result("failed", "本次安全连接或证书校验失败");
    return result("failed", "服务器本次未能连接；可能受网络或网站防护影响");
  } finally { clearTimeout(timer); }
}
