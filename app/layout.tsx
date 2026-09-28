import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MercuryHub · 影视资源导航",
  description: "按推荐星级浏览影视资源站点，快速打开资源网站并查看服务器连接检测结果。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
