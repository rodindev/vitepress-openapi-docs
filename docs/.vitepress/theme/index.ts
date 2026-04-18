import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { enhanceAppWithOpenApi, OperationJumper, SearchTrigger } from 'vitepress-openapi-docs'
import specs, { defaults } from 'virtual:vitepress-openapi-docs/specs'
import changelogs from 'virtual:vitepress-openapi-docs/changelogs'
import 'vue-api-playground/styles'
import 'vitepress-openapi-docs/styles'
import './custom.css'

const prefixes = {
  mock: '/api/mock',
  petstore: '/api/petstore',
}

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(OperationJumper, { prefixes }),
      'nav-bar-content-after': () => h(SearchTrigger),
    })
  },
  enhanceApp({ app }) {
    enhanceAppWithOpenApi({ app, specs, changelogs, defaults })
  },
}
