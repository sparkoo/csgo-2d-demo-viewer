import { defineConfig, loadEnv } from "vite";
import preact from "@preact/preset-vite";
import fs from "fs";
import path from "path";

// Replaces __WASM_BASE_URL__ in the built worker.js with VITE_WASM_BASE_URL.
// worker.js lives in public/ so Vite copies it as-is; we patch it after the
// bundle is written.  Empty string is fine: the worker then uses relative paths
// (e.g. "wasm/csdemoparser.wasm") which resolve correctly from the origin.
function wasmBaseURLPlugin(wasmBaseURL) {
  return {
    name: "inject-wasm-base-url",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/worker.js") {
          const workerPath = path.resolve("public", "worker.js");
          const content = fs.readFileSync(workerPath, "utf-8");
          res.setHeader("Content-Type", "application/javascript");
          res.end(content.replaceAll("__WASM_BASE_URL__", wasmBaseURL));
          return;
        }
        next();
      });
    },
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

// Injects Google Analytics script tags into index.html if VITE_GA_MEASUREMENT_ID is set.
function googleAnalyticsPlugin(measurementId) {
  if (!measurementId) return null;
  const script = `
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    </script>`;
  return {
    name: "inject-google-analytics",
    transformIndexHtml(html) {
      return html.replace("</head>", `${script}\n  </head>`);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      preact(),
      googleAnalyticsPlugin(env.VITE_GA_MEASUREMENT_ID),
      wasmBaseURLPlugin(
        (() => {
          const u = env.VITE_WASM_BASE_URL || "";
          return u && !u.endsWith("/") ? u + "/" : u;
        })()
      ),
    ],
    open: true,
    port: 3000,
  };
});
