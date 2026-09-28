# Mercury 影视资源导航
<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
公开网站访客；需要直观找到影视资源站点，并一键检测网站链接。

## Product Purpose
将用户提供的 18 个网站入口按原表推荐星级从高到低展示，提供准确跳转与服务器 HTTP 连通性检测。

## Capabilities and Constraints
名称搜索、真人/动画分类和逐站检测。应用户对代理封锁风险的反馈，批量检测已关闭；新请求至少间隔 30 秒，同一入口 15 分钟内复用结果。检测结果明确标注服务器网络与时间，不能当作本地浏览器可访问性或资源下载验证。原表容量和推荐指数标注为原表记录。用户要求先保证功能与基础美学，后续再优化美学；视觉细节采用可逆的暂定设计。

## Evidence on Hand
父目录 影视资源站点_202609.xlsx，工作表1 A1:E19。18 条网址原样导入。

## Stack
本轮实现选择：Sites Vinext/React 与 Cloudflare Worker；不是用户永久技术偏好。

## Open Decisions
当前站点名为 MercuryHub，界面采用用户指定的 Apple 风格参考。自定义域名仍待确定。
