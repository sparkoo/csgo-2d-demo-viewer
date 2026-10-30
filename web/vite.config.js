import { defineConfig, loadEnv } from "vite";
import preact from "@preact/preset-vite";

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
    ],
    server: {
      open: true,
      port: 3000,
      // Route linked-demo downloads through the local Go server.
      proxy: {
        "/download": "http://localhost:8080",
      },
    },
  };
});
