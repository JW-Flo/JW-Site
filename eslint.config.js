import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import astro from "eslint-plugin-astro";
import sveltePlugin from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import vueParser from "vue-eslint-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";

const enableTypeAware = process.env.ESLINT_TYPEAWARE === "1";
const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default [
  {
    ignores: [
      "**/dist/**",
      "**/.svelte-kit/**",
      "**/.astro/**",
      // Temporarily ignore authored Astro pages until they are cleaned up
      "**/*.astro",
      "**/playwright-report/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/*.d.ts",
      "**/_worker.js/**",
    ],
  },
  js.configs.recommended,
  // Astro recommended base
  ...astro.configs.recommended,
  enableTypeAware
    ? {
        files: ["**/*.{ts,tsx}"],
        plugins: { "@typescript-eslint": tsPlugin },
        languageOptions: {
          parser: tsParser,
          parserOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            tsconfigRootDir: rootDir,
            project: [path.join(rootDir, "tsconfig.eslint.types.json")],
          },
        },
        rules: {
          // Typescript-aware checks handle undefineds better; avoid core false-positives
          "no-undef": "off",
          "no-console": ["warn", { allow: ["warn", "error"] }],
          // Use TS version only
          "no-unused-vars": "off",
          "prefer-const": "warn",
          "no-var": "error",
          "no-empty": "warn",
          "no-prototype-builtins": "warn",
          "@typescript-eslint/require-await": "warn",
          "@typescript-eslint/consistent-type-imports": [
            "warn",
            { prefer: "type-imports" },
          ],
          "@typescript-eslint/no-unused-vars": [
            "warn",
            { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
          ],
          "@typescript-eslint/no-floating-promises": "warn",
          "@typescript-eslint/no-misused-promises": "warn",
        },
      }
    : {
        files: ["**/*.{ts,tsx}"],
        plugins: { "@typescript-eslint": tsPlugin },
        languageOptions: {
          parser: tsParser,
          parserOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
          },
        },
        rules: {
          // Typescript-aware checks handle undefineds better; avoid core false-positives
          "no-undef": "off",
          "no-console": ["warn", { allow: ["warn", "error"] }],
          // Use TS version only
          "no-unused-vars": "off",
          "prefer-const": "warn",
          "no-var": "error",
          "no-empty": "warn",
          "no-prototype-builtins": "warn",
          "@typescript-eslint/require-await": "off",
          "@typescript-eslint/consistent-type-imports": [
            "warn",
            { prefer: "type-imports" },
          ],
          "@typescript-eslint/no-unused-vars": [
            "warn",
            { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
          ],
          // Keep disabled until type-aware mode activated
          "@typescript-eslint/no-floating-promises": "off",
          "@typescript-eslint/no-misused-promises": "off",
        },
      },
  {
    files: ["**/*.astro"],
    plugins: { astro },
    languageOptions: {
      parser: astro.parser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: [".astro"],
      },
    },
    rules: {},
  },
  {
    files: ["**/*.svelte"],
    plugins: { svelte: sveltePlugin },
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: [".svelte"],
      },
    },
    // Keep rules minimal for MVP; rely on plugin defaults
    rules: {
      "no-unused-vars": "warn",
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
      },
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: { sourceType: "module" },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": "warn",
      "no-prototype-builtins": "warn",
    },
  },
  {
    // Browser runtime globals for client-side/front-end code
    files: [
      "apps/**/*/src/**/*.{ts,tsx,js,svelte,vue}",
      "src/**/*.{ts,tsx,js,astro,vue,svelte}",
      "packages/**/*.{ts,tsx,js,vue,svelte}",
    ],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        fetch: "readonly",
        Request: "readonly",
        Response: "readonly",
        ResponseInit: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        CustomEvent: "readonly",
        Event: "readonly",
        alert: "readonly",
        confirm: "readonly",
        gtag: "readonly",
        Vue: "readonly",
      },
    },
  },
  {
    // Cloudflare Worker / edge runtime globals (fetch handlers, crypto, KV, D1, R2-like bindings)
    files: [
      "workers/**/*.{ts,tsx,js}",
      // SvelteKit server and hooks
      "apps/atlasit-sveltekit/src/routes/**/+server.ts",
      "apps/atlasit-sveltekit/src/routes/**/+server.tsx",
      "apps/atlasit-sveltekit/src/hooks.server.ts",
      "apps/atlasit-sveltekit/src/lib/server/**/*.{ts,tsx}",
      // Astro API routes under src/pages/api
      "src/pages/api/**/*.{ts,tsx}",
      "apps/**/src/pages/api/**/*.{ts,tsx}",
      // Generic edge/worker style utilities across repo
      "atlasit/**/src/**/*.{ts,tsx,js}",
      "workflows/**/*.{ts,tsx}",
      "packages/**/*.{ts,tsx,js}",
      "src/agent/**/*.{ts,tsx}",
      "src/utils/**/*.{ts,tsx}",
    ],
    languageOptions: {
      globals: {
        fetch: "readonly",
        Request: "readonly",
        Response: "readonly",
        Headers: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        crypto: "readonly",
        btoa: "readonly",
        atob: "readonly",
        performance: "readonly",
        // Cloudflare specific
        KVNamespace: "readonly",
        D1Database: "readonly",
        PagesFunction: "readonly",
        // common Node-ish globals sometimes polyfilled
        Buffer: "readonly",
      },
    },
  },
  {
    // Node-like globals for build-time config and Astro/Scripts using process/URL, etc.
    files: [
      "src/**/*.{ts,tsx,js,astro}",
      "apps/**/src/**/*.{ts,tsx,js,astro}",
      "packages/**/*.{ts,tsx,js,astro}",
    ],
    languageOptions: {
      globals: {
        process: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
        ResponseInit: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        crypto: "readonly",
        Buffer: "readonly",
        btoa: "readonly",
        atob: "readonly",
      },
    },
  },
  {
    // Node-style tooling scripts and config files (CJS/MJS/JS in scripts and root)
    files: [
      "scripts/**/*.{js,mjs,cjs,ts}",
      "**/*.{config,cfg,conf}.cjs",
      "**/*.config.{js,cjs,mjs,ts}",
      "tailwind.config.cjs",
      "apps/**/*/tailwind.config.cjs",
      "postcss.config.cjs",
      "apps/**/*/postcss.config.cjs",
      "vitest.config.{ts,js,mjs,cjs}",
      "apps/**/*/vitest.config.{ts,js,mjs,cjs}",
      // Node servers/utilities
      "**/server/**/*.{js,cjs,mjs}",
      "src/server/**/*.{js,cjs,mjs}",
    ],
    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        process: "readonly",
        Buffer: "readonly",
        URL: "readonly",
      },
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    files: [
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/test/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/require-await": "off",
    },
    languageOptions: {
      globals: {
        // Vitest globals
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        vi: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        // jsdom-like globals often used in tests
        window: "readonly",
        document: "readonly",
        HTMLElement: "readonly",
        HTMLCanvasElement: "readonly",
        Document: "readonly",
        Window: "readonly",
        // node-ish in tests
        process: "readonly",
        global: "readonly",
        URL: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
        Buffer: "readonly",
        RequestInit: "readonly",
        KVNamespace: "readonly",
        D1Database: "readonly",
      },
    },
  },
];
