import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["**/.kilo/**", "**/node_modules/**"],
    setupFiles: ["./vitest.setup.mjs"],
  },
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./frontend"),
      "@/server": resolve(__dirname, "./backend"),
      "@/server/lib": resolve(__dirname, "./backend/lib"),
      "@/server/actions": resolve(__dirname, "./backend/actions"),
      "@/lib": resolve(__dirname, "./frontend/lib"),
    },
  },
});
