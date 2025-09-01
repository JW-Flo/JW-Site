import js from "@eslint/js";

// Flat config array
export default [
  // Ignore build output and dependencies
  { ignores: ["dist/**", "dist-*/**", "**/node_modules/**"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Browser / DOM
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        location: "readonly",
        console: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        alert: "readonly",
        prompt: "readonly",
        CustomEvent: "readonly",
        // Timers
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        // Web / platform
        fetch: "readonly",
        Response: "readonly",
        Request: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        performance: "readonly",
        crypto: "readonly",
        structuredClone: "readonly",
        atob: "readonly",
        btoa: "readonly",
        // JS built-ins
        Date: "readonly",
        Math: "readonly",
        Array: "readonly",
        Object: "readonly",
        String: "readonly",
        Number: "readonly",
        Boolean: "readonly",
        RegExp: "readonly",
        Error: "readonly",
        Promise: "readonly",
        // Cloudflare Worker / Service Worker style
        self: "readonly",
        caches: "readonly",
        // Node (build / tests)
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
  module: "readonly",
  require: "readonly",
  global: "readonly",
  HTMLCanvasElement: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  // Vitest / test files overrides
  {
    files: ["**/*.test.*", "**/test/**"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
  },
  // Temporarily ignore TypeScript test files until TypeScript ESLint parser is added
  { ignores: ["src/test/**/*.ts"] },
];
