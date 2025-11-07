import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      preact(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          const umamiScriptUrl = env.VITE_UMAMI_SCRIPT_URL;
          const umamiWebsiteId = env.VITE_UMAMI_WEBSITE_ID;
          
          // Only inject Umami script if both variables are set
          if (umamiScriptUrl && umamiWebsiteId) {
            const umamiScript = `<!-- Umami Analytics -->
    <script defer src="${umamiScriptUrl}" data-website-id="${umamiWebsiteId}"></script>`;
            return html.replace('<!-- UMAMI_ANALYTICS_PLACEHOLDER -->', umamiScript);
          }
          
          // Remove placeholder if analytics is not configured
          return html.replace('<!-- UMAMI_ANALYTICS_PLACEHOLDER -->', '');
        },
      },
    ],
    open: true,
    port: 3000,
  };
});
