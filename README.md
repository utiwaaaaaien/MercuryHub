# MercuryHub 影视资源导航

公开页面：[MercuryHub](https://utiwaaaaaien.github.io/MercuryHub/)。原始清单来自父目录 Excel，18 条完整链接保存在 `lib/sites.json`。

## 发布与检测

GitHub Pages 提供网页和 `checks.json`。`.github/workflows/pages.yml` 在推送 `main`、手动运行，以及每天北京时间 11:17 时执行。工作流依次检测清单中的站点，生成结果并重新发布页面。定时和手动运行还会把检测记录提交到仓库，保持仓库有实际更新。GitHub 的定时任务可能延迟或漏跑；页面显示实际检测时间，超过 36 小时会提示结果过期。

网页加载时只读取同一 GitHub Pages 地址下的 `checks.json`，打开中的页面会定期读取更新。状态表示 GitHub Actions 服务器当时的访问结果，与访客当前网络、代理和登录状态可能不同。“请求成功”不保证页面内容或下载资源可用。跨域跳转、登录、验证码和访问受限需要手动确认。

在 `lib/sites.json` 修改站点数据后推送 `main`，工作流会重新检测并发布。`capacity` 和 `rating` 沿用原表，不是自动抓取或实时统计。原 Excel 未修改。

## 本地验证

需要 Node.js 22.13 以上和 pnpm 11.19：

```sh
pnpm install --frozen-lockfile
pnpm build:pages
node --experimental-strip-types scripts/generate-checks.mjs pages-dist/checks.json
pnpm exec vite preview --config pages.vite.config.ts
```

打开命令输出的本地网址。代码检查：`pnpm exec tsc --noEmit`；检测规则测试：`node --experimental-strip-types --test tests/check-link.test.mjs`。
