# Mercury 影视资源导航
<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
公开网站访客；需要直观找到影视资源站点，并一键检测网站链接。

## Product Purpose
将用户提供的 18 个网站入口按星级从高到低展示，提供准确跳转与服务器 HTTP 连通性检测。

## Capabilities and Constraints
名称搜索、真人/动画分类和逐站检测。批量检测已关闭；新请求至少间隔 30 秒，同一入口 15 分钟内复用结果。检测结果明确标注服务器网络与时间，不能当作本地浏览器可访问性或资源下载验证。星级与容量为收录时记录。站点卡片不展示缩略图或字母图标；名称以目标页面的主名称为准。

## Evidence on Hand
父目录 影视资源站点_202609.xlsx，工作表1 A1:E19。18 条网址原样导入。

## Stack
本轮实现选择：Sites Vinext/React 与 Cloudflare Worker；不是用户永久技术偏好。

## Open Decisions
当前站点名为 MercuryHub，界面采用用户指定的 Apple 风格参考。自定义域名仍待确定。
