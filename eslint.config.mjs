import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The splash renderer must use plain <img>, never next/image.
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // vinext and Cloudflare build output:
    "dist/**",
    ".vinext/**",
    ".cloudflare/**",
    // Agent worktrees: flat config lints dot-directories and ignores .gitignore.
    ".claude/**",
  ]),
]);

export default eslintConfig;
