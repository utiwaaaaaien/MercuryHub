import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve("github-pages"),
  base: "/MercuryHub/",
  publicDir: resolve("public"),
  resolve: { alias: { "@": resolve(".") } },
  plugins: [react()],
  build: { outDir: resolve("pages-dist"), emptyOutDir: true },
});
