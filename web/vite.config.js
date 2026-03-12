import { defineConfig, loadEnv } from "vite";
import preact from "@preact/preset-vite";
import fs from "fs";
import path from "path";

// Replaces <!-- UMAMI_ANALYTICS_PLACEHOLDER --> in index.html at build time.
// When env vars are not set the placeholder is simply removed.
function analyticsPlugin(scriptURL, websiteID) {
  return {
    name: "inject-analytics",
    transformIndexHtml(html) {
      const script =
        scriptURL && websiteID
          ? `<script defer src="${scriptURL}" data-website-id="${websiteID}"></script>`
          : "";
      return html.replace("<!-- UMAMI_ANALYTICS_PLACEHOLDER -->", script);
    },
  };
}

// Replaces __WASM_BASE_URL__ in the built worker.js with VITE_WASM_BASE_URL.
// worker.js lives in public/ so Vite copies it as-is; we patch it after the
// bundle is written.  Empty string is fine: the worker then uses relative paths
// (e.g. "wasm/csdemoparser.wasm") which resolve correctly from the origin.
function wasmBaseURLPlugin(wasmBaseURL) {
  return {
    name: "inject-wasm-base-url",
    closeBundle() {
      const workerPath = path.resolve("dist", "worker.js");
      if (fs.existsSync(workerPath)) {
        const content = fs.readFileSync(workerPath, "utf-8");
        fs.writeFileSync(
          workerPath,
          content.replaceAll("__WASM_BASE_URL__", wasmBaseURL)
        );
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      preact(),
      analyticsPlugin(env.VITE_UMAMI_SCRIPT_URL, env.VITE_UMAMI_WEBSITE_ID),
      wasmBaseURLPlugin(env.VITE_WASM_BASE_URL || ""),
    ],
    open: true,
    port: 3000,
  };
});
