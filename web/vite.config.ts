/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // The browser only ever talks to 5173. /api is proxied to Express, so the
    // frontend and the API share an origin and cookies are first-party.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  test: {
    // Both projects run in a browser-shaped environment: the integration tests
    // render real pages, and a unit test reads a design token out of a
    // stylesheet. Neither reaches the network — see test/harness.tsx.
    environment: "jsdom",
    // A unit test reads a design token out of tokens.css, so stylesheets are
    // handed over as text rather than replaced with an empty module.
    css: true,
    projects: [
      {
        extends: true,
        test: {
          // Colocated: a unit test sits beside the module it describes.
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          // Rendered pages, driven through the app's own routes.
          name: "integration",
          include: ["test/**/*.integration.test.{ts,tsx}"],
        },
      },
    ],
  },
});
