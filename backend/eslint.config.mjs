// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  [{
    rules:  {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": ["error", { 
      "varsIgnorePattern": "^_", 
      "argsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_"
    }]
  },
  ignores: [
    '/dist',
    'node_modules',
    'build',
    'coverage',
    'logs',
    'public',
    'src/types',
  ],}]
);