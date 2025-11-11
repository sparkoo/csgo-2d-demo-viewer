import { defineConfig, loadEnv } from "vite";
import preact from "@preact/preset-vite";

// https://vitejs.dev/config/
export default defineConfig(({}) => {
  return {
    plugins: [preact()],
    open: true,
    port: 3000,
  };
});
