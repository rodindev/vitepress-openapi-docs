import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/**/*.spec.ts'],
      outDir: 'dist',
      copyDtsFiles: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: {
        'vitepress-openapi-docs': resolve(__dirname, 'src/index.ts'),
        'vitepress-openapi-docs-vitepress': resolve(__dirname, 'src/vitepress/index.ts'),
      },
      name: 'VitepressOpenapiDocs',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'vue',
        'vitepress',
        'vue-api-playground',
        '@scalar/openapi-parser',
        'marked',
        'dompurify',
        'jsdom',
        /^node:/,
        /^virtual:vitepress-openapi-docs\//,
      ],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
