import { defineConfig } from 'vitepress'
import { openApiDocs } from 'vitepress-openapi-docs/vitepress'

export default defineConfig({
  title: 'My API',
  description: 'Interactive OpenAPI documentation',
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide' },
      { text: 'API Reference', link: '/api/mock/' },
    ],

    sidebar: {
      '/guide': [
        {
          text: 'Getting Started',
          items: [{ text: 'Introduction', link: '/guide' }],
        },
      ],
    },

    footer: {
      message: 'Built with vitepress-openapi-docs',
    },
  },

  extends: await openApiDocs({
    specs: [{ name: 'mock', spec: 'docs/openapi/mock.json', prefix: '/api/mock' }],
  }),
})
