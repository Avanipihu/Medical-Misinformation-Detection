import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, forward /api to the local proxy server (node server.js, port 8080).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:8080" } },
});
