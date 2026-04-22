import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { enhanceAppWithOpenApi, OperationJumper, SearchTrigger } from 'vitepress-openapi-docs'
import specs, { defaults, prefixes } from 'virtual:vitepress-openapi-docs/specs'
import changelogs from 'virtual:vitepress-openapi-docs/changelogs'
import 'vue-api-playground/styles'
import 'vitepress-openapi-docs/styles'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(OperationJumper),
      'nav-bar-content-after': () => h(SearchTrigger),
    })
  },
  enhanceApp({ app }) {
    enhanceAppWithOpenApi({ app, specs, changelogs, defaults, prefixes })
  },
}
