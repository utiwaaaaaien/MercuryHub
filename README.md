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

页面每批并发 4 个；取消停止排队并中断前端等待，已发出的服务器检查可能继续到其 10 秒截止。结果保存在访客浏览器，保留检测时间。服务端仅作单 Worker isolate 内的 60 秒短缓存、相同请求合并、并发上限 6 和每 IP 每分钟 36 次基础限流；这些不是全球共享限流，面向较大流量时需扩充平台级限流和共享缓存。本原型没有数据库和账号系统。

## 内容维护

在 `lib/sites.json` 修改站点数据后重新构建发布。`capacity` 和 `rating` 沿用原表，不是自动抓取或实时统计。原 Excel 未修改。

## 发布

`.openai/hosting.json` 保存唯一 Sites 项目 ID。生成的 Cloudflare Worker 位于 `dist/server/index.js`，静态资产位于 `dist/client`。保留这两个目录与部署清单组成发布包。仅通过 Sites 的版本与部署工具发布，勿在源码或命令行写入凭证。
