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
          return html
            .replace('%VITE_UMAMI_SCRIPT_URL%', env.VITE_UMAMI_SCRIPT_URL || '')
            .replace('%VITE_UMAMI_WEBSITE_ID%', env.VITE_UMAMI_WEBSITE_ID || '');
        },
      },
    ],
    open: true,
    port: 3000,
  };
});
