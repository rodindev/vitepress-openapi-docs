import js from '@eslint/js'
import ts from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'

export default ts.config(
  {
    ignores: [
      '**/dist/',
      '**/node_modules/',
      '**/coverage/',
      'docs/.vitepress/cache/',
      'docs/.vitepress/dist/',
      'docs/.vitepress/*.timestamp-*',
      'test-results/',
      'playwright-report/',
      'scripts/',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/essential'],
  prettier,
  {
    files: ['**/*.vue', '**/*.ts'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
  {
    rules: {
      quotes: ['error', 'single', { avoidEscape: true }],
      'vue/multi-word-component-names': 'off',
    },
  }
)
