import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import astro from 'eslint-plugin-astro';
import vueParser from 'vue-eslint-parser';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/.svelte-kit/**',
      '**/.astro/**',
      '**/playwright-report/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/*.d.ts',
      '**/_worker.js/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // Temporarily omit project for performance / unresolved path issues; re-enable when per-package configs stabilized
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
  '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  // Temporarily disabled type-aware rules until project references stabilized:
  '@typescript-eslint/no-floating-promises': 'off',
  '@typescript-eslint/no-misused-promises': 'off'
    }
  },
  {
    files: ['**/*.astro'],
    plugins: { astro },
    languageOptions: {
      parser: astro.parser,
      parserOptions: {
        parser: tsParser
      }
    },
    rules: {}
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser
      }
    },
    rules: {}
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: { sourceType: 'module' },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },
  {
    // Browser runtime globals for client-side/front-end code
    files: [
      'apps/**/src/**/*.{ts,tsx,js}',
      'src/**/*.{ts,tsx,js}',
      'packages/ui/**/*.{ts,tsx,js}'
    ],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly'
      }
    }
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off'
    }
  }
];
