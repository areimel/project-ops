import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { brand } from "./shared/brand";

const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, "package.json"), "utf8")) as { version: string; author: string };

export default defineConfig({
  root: resolve(import.meta.dirname, "renderer"),
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_AUTHOR__: JSON.stringify(pkg.author),
  },
  plugins: [
    react(),
    // The Content-Security-Policy is a response header set by the main process (shared/csp.ts), not a <meta> tag.
    {
      name: "app-title",
      transformIndexHtml: (html) => html.replace(/<title>.*?<\/title>/, `<title>${brand.name}</title>`),
    },
  ],
  build: {
    outDir: resolve(import.meta.dirname, "dist-renderer"), emptyOutDir: true,
    // The CSP has no data: font-src: never inline font files (small subsets fall under the 4 KB default).
    assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined),
  },
  server: { port: Number(process.env.APP_DEV_PORT) || 5173, strictPort: true },
  test: { root: resolve(import.meta.dirname), include: ["tests/**/*.test.ts"] },
});
