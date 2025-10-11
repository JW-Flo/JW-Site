/* Root ESLint config for monorepo (type-aware) */
module.exports = {
  root: true,
  ignorePatterns: ["dist", "build", "coverage", "*.config.cjs"],
  env: {
    es2023: true,
    node: true,
    browser: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.eslint.json"],
    tsconfigRootDir: __dirname,
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:astro/recommended",
    "plugin:vue/vue3-recommended",
  ],
  overrides: [
    {
      files: ["*.js", "*.cjs", "*.mjs"],
      parser: "@typescript-eslint/parser",
      parserOptions: { project: null },
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
    {
      files: ["**/*.spec.{ts,tsx}", "**/*.test.{ts,tsx}"],
      env: { jest: true, node: true },
      rules: {
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
      },
    },
    {
      // Astro specific parsing
      files: ["**/*.astro"],
      parser: "astro-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        project: "./tsconfig.eslint.json",
        extraFileExtensions: [".astro"],
      },
      rules: {},
    },
    {
      files: ["**/*.vue"],
      parser: "vue-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        project: "./tsconfig.eslint.json",
      },
    },
  ],
  rules: {
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "@typescript-eslint/require-await": "error",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      { prefer: "type-imports" },
    ],
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": [
      "error",
      { checksVoidReturn: { attributes: false } },
    ],
  },
};
