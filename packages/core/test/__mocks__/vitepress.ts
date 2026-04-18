import { ref } from 'vue'

export function useRouter() {
  return {
    go(href: string) {
      if (typeof window !== 'undefined') {
        window.location.href = href
      }
    },
    route: ref({ path: '/' }),
  }
}

export function useRoute() {
  return ref({ path: '/' })
}

export function useData() {
  return {
    site: ref({}),
    page: ref({}),
    theme: ref({}),
    frontmatter: ref({}),
    lang: ref('en'),
    isDark: ref(false),
  }
}

export function withBase(path: string) {
  return path
}
