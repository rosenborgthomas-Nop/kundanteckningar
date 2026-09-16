import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "Inloggning.html"),
        journal: resolve(__dirname, "Journal.html"),
        settings: resolve(__dirname, "Inställningar.html"),
        start: resolve(__dirname, "Start.html"),
      },
    },
  },
  server: {
    port: 5173,
  },
});
