import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "app",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-22",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      // vinext's data cache (kvDataAdapter in vite.config.ts); Cloudflare provisions it on deploy.
      VINEXT_KV_CACHE: bindings.kv(),
      // Optional. A Worker secret in production and a .dev.vars entry locally, never a plain variable.
      UNSPLASH_ACCESS_KEY: bindings.secret(),
      // Per-client throttle on /api/unsplash, so no one caller can spend the hourly Unsplash quota.
      // The namespace ID is any positive integer unique to the Cloudflare account.
      UNSPLASH_RATE_LIMIT: bindings.rateLimit({ namespace: "1031", simple: { limit: 10, period: 60 } }),
    },
  }),
});
