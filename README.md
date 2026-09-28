# Mercury 影视资源导航

公开导航原型。原始清单来自父目录 Excel，18 条完整链接保存在 `lib/sites.json`。

## 本地运行

Node.js 22.13 以上，pnpm 11.19：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

打开开发命令打印的地址。生产构建：`pnpm build`。检查：`pnpm exec tsc --noEmit`、`node --experimental-strip-types --test tests/check-link.test.mjs`。

## 检测规则

`POST /api/check` 仅接收清单内的 `id`，不接受任意 URL。GET 请求保留完整入口路径，最多跟随 4 次同域或 www 变体的跳转。跨域跳转、协议降级、凭证与非标准端口需人工确认。总请求超时 10 秒，正文最多读取 64 KiB；不执行站点脚本，不登录，不绕过验证码。

状态区分 HTTP 成功、访问受限、页面异常、网络失败与需人工确认。正文识别仅为启发式，不能验证下载资源或完整页面功能。开发环境标注本机预览服务网络；公开部署从 Cloudflare 服务器检测。

为了避免公开站点连续向代理和托管服务发送请求，页面只支持逐站检测，浏览器端两次新请求至少间隔 30 秒。同一入口 15 分钟内复用最近结果，浏览器不会再次请求检测接口。结果保存在访客浏览器，保留原检测时间。服务端也为每个 IP 设置 30 秒间隔、15 分钟站点缓存、相同请求合并与并发上限 2；这些限制仅在单个 Worker isolate 内有效，不能保证全局限流或完全避免代理封锁。本原型没有数据库和账号系统。

## 内容维护

在 `lib/sites.json` 修改站点数据后重新构建发布。`capacity` 和 `rating` 沿用原表，不是自动抓取或实时统计。原 Excel 未修改。

## GitHub Pages

公开页面位于 `https://utiwaaaaaien.github.io/MercuryHub/`。推送 `main` 后，`.github/workflows/pages.yml` 用 `pnpm build:pages` 构建并发布静态页面。`github-pages/index.html` 指向现有 Sites 检测接口；GitHub Pages 只提供页面文件，检测请求从原有服务器发出。

## 检测服务

`.openai/hosting.json` 保存 Sites 项目 ID。生成的 Cloudflare Worker 位于 `dist/server/index.js`，静态资产位于 `dist/client`。检测接口只接受同源或 `https://utiwaaaaaien.github.io` 的浏览器请求。修改检测服务后，需通过 Sites 的版本与部署工具更新；发布前将源码推送到 Sites 源仓库。不要在源码或命令行写入凭证。
