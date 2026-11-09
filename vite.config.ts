import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, the app runs on 5181 and `pnpm server:dev` serves the API and MCP on 8726.
const api = { target: "http://127.0.0.1:8726", changeOrigin: false };

export default defineConfig({
  plugins: [react()],
  server: { port: 5181, host: true, proxy: { "/api": api, "/mcp": api } },
  preview: { port: 4181, host: true },
});
