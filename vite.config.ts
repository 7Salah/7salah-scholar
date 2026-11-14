import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const gameRoot = fileURLToPath(new URL("./game", import.meta.url));
const platformRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ command }) => ({
  // In dev, serve the platform root so /game/ can read the existing config and return link.
  // Production builds stay rooted in game/ and emit game/dist/.
  root: command === "serve" ? platformRoot : gameRoot,
  // Relative URLs work both at a GitHub Pages project path and on a custom domain.
  base: "./",
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true
  },
  build: {
    outDir: fileURLToPath(new URL("./game/dist", import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL("./game/index.html", import.meta.url)),
        "academy-entry": fileURLToPath(new URL("./game/src/academy-entry.ts", import.meta.url))
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "academy-entry" ? "assets/academy-entry.js" : "assets/[name]-[hash].js",
        manualChunks(id) {
          if (id.includes("/@babylonjs/core/")) return "babylon";
        }
      }
    }
  }
}));
