import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mercury 影视资源导航",
  description: "集中浏览影视资源站点，一键跳转与服务器链接检测。",
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
