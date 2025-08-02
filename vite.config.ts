import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["lucide-react"], // Include instead of exclude to pre-bundle
  },
  server: {
    host: true, // Allow external connections
    port: 5173,
    hmr: {
      port: 5173,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "lucide-react": ["lucide-react"],
        },
      },
    },
  },
});
