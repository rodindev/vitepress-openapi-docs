import { defineConfig } from 'vitepress'
import { openApiDocs } from 'vitepress-openapi-docs/vitepress'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../packages/core/package.json', import.meta.url)), 'utf8')
) as { version: string }

const siteUrl = 'https://rodindev.github.io/vitepress-openapi-docs/'
const ogImage = `${siteUrl}og-image.png`
const title = 'VitePress OpenAPI Docs'
const tagline = 'OpenAPI docs, written in markdown'
const description =
  'Interactive OpenAPI documentation for VitePress. A Vue-native, composable alternative to Swagger UI, Scalar, RapiDoc and Stoplight Elements — drop OpenAPI 3.0 / 3.1 endpoints inline in markdown. Multi-API support, auto-generated pages, SDK snippets, auth controls. Zero iframes, no web components.'

const schemaOrgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: title,
  description:
    'Interactive OpenAPI documentation generator for VitePress. Vue-native alternative to Swagger UI, Scalar and RapiDoc.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Cross-platform',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  softwareVersion: pkg.version,
  license: 'https://opensource.org/licenses/MIT',
  url: siteUrl,
  codeRepository: 'https://github.com/rodindev/vitepress-openapi-docs',
  programmingLanguage: ['TypeScript', 'Vue'],
  runtimePlatform: 'Node.js',
  keywords: ['vitepress', 'openapi', 'api documentation', 'vue', 'typescript', 'openapi 3.1'],
}

const docsSidebar = [
  {
    text: 'Start here',
    items: [
      { text: 'Quick Start', link: '/guide/' },
      { text: 'Add to existing site', link: '/guide/existing-site' },
      { text: 'Composing endpoints', link: '/guide/composing-endpoints' },
    ],
  },
  {
    text: 'Features',
    items: [
      { text: 'Multiple APIs', link: '/guide/multiple-apis' },
      { text: 'Authentication', link: '/guide/authentication' },
      { text: 'Theming', link: '/guide/theming' },
    ],
  },
  {
    text: 'Reference',
    items: [
      { text: 'Configuration', link: '/reference/configuration' },
      { text: 'Components', link: '/reference/components' },
      { text: 'CSS Variables', link: '/reference/css-variables' },
      { text: 'CLI', link: '/reference/cli' },
      { text: 'Playground', link: '/reference/playground' },
    ],
  },
  {
    text: 'More',
    items: [
      { text: 'Comparison', link: '/guide/comparison' },
      { text: 'Troubleshooting', link: '/troubleshooting' },
    ],
  },
]

export default defineConfig({
  title,
  titleTemplate: `:title · ${title}`,
  description,
  base: '/vitepress-openapi-docs/',
  cleanUrls: true,
  lang: 'en-US',
  lastUpdated: true,

  sitemap: {
    hostname: siteUrl,
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'alternate icon', type: 'image/x-icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
    ['link', { rel: 'mask-icon', href: '/favicon.svg', color: '#2563eb' }],
    ['link', { rel: 'canonical', href: siteUrl }],

    ['meta', { name: 'theme-color', content: '#2563eb' }],
    ['meta', { name: 'author', content: 'vitepress-openapi-docs contributors' }],
    ['meta', { name: 'robots', content: 'index, follow, max-image-preview:large' }],
    [
      'meta',
      {
        name: 'keywords',
        content: 'vitepress openapi, openapi vue, api documentation, vitepress plugin, openapi 3.1',
      },
    ],

    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en_US' }],
    ['meta', { property: 'og:site_name', content: title }],
    ['meta', { property: 'og:title', content: `${title} — ${tagline}` }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: siteUrl }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { property: 'og:image:type', content: 'image/png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: `${title} — ${tagline}` }],

    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: `${title} — ${tagline}` }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: ogImage }],
    ['meta', { name: 'twitter:image:alt', content: `${title} — ${tagline}` }],

    ['script', { type: 'application/ld+json' }, JSON.stringify(schemaOrgJsonLd)],
  ],

  themeConfig: {
    logo: { src: '/logo.svg', width: 24, height: 24 },
    siteTitle: title,

    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '/guide/' },
      { text: 'Reference', link: '/reference/configuration', activeMatch: '/reference/' },
      {
        text: 'Live demo',
        activeMatch: '/api/',
        items: [
          { text: 'Petstore API', link: '/api/petstore/' },
          { text: 'Mock API', link: '/api/mock/' },
        ],
      },
      {
        text: `v${pkg.version}`,
        items: [
          {
            text: 'Changelog',
            link: 'https://github.com/rodindev/vitepress-openapi-docs/blob/main/CHANGELOG.md',
          },
          {
            text: 'Releases',
            link: 'https://github.com/rodindev/vitepress-openapi-docs/releases',
          },
          {
            text: 'npm',
            link: 'https://www.npmjs.com/package/vitepress-openapi-docs',
          },
        ],
      },
    ],

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/rodindev/vitepress-openapi-docs',
        ariaLabel: 'GitHub repository',
      },
      {
        icon: {
          svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>npm</title><path fill="currentColor" d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>',
        },
        link: 'https://www.npmjs.com/package/vitepress-openapi-docs',
        ariaLabel: 'npm package',
      },
    ],

    editLink: {
      pattern: 'https://github.com/rodindev/vitepress-openapi-docs/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present vitepress-openapi-docs contributors',
    },

    sidebar: {
      '/guide/': docsSidebar,
      '/reference/': docsSidebar,
      '/troubleshooting': docsSidebar,
    },

    outline: {
      level: [2, 3],
      label: 'On this page',
    },
  },

  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
    },
    // Workspace-linked core package: its dist lives under packages/core/dist
    // via the symlink in node_modules. Vite ignores node_modules by default,
    // so an `npm run dev:core` rebuild would not trigger HMR in the docs
    // server. The rules below un-ignore the core dist folder and tell
    // dep-optimizer to treat it as source, not a pre-bundled dep.
    optimizeDeps: {
      exclude: ['vitepress-openapi-docs'],
    },
    server: {
      watch: {
        ignored: ['!**/packages/core/dist/**'],
      },
    },
  },

  extends: await openApiDocs(
    {
      specs: [
        {
          name: 'mock',
          spec: 'docs/openapi/mock.json',
          prefix: '/api/mock',
        },
        {
          name: 'petstore',
          spec: 'docs/openapi/petstore.json',
          label: 'Petstore',
          prefix: '/api/petstore',
        },
      ],
    },
    { verbose: true }
  ),
})
