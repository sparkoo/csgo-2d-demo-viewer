import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [preact()],
	open: true,
  port: 3000,
  define: {
    'import.meta.env.VITE_ASSETS_BASE_URL': JSON.stringify(process.env.VITE_ASSETS_BASE_URL || ''),
  },
});
