import corePkg from '../../packages/core/package.json'
import petstore from '../openapi/petstore.json'
import mock from '../openapi/mock.json'

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']

function countOperations(pathItems: unknown): number {
  if (!pathItems || typeof pathItems !== 'object') return 0
  let count = 0
  for (const item of Object.values(pathItems as Record<string, unknown>)) {
    if (!item || typeof item !== 'object') continue
    for (const method of Object.keys(item as Record<string, unknown>)) {
      if (HTTP_METHODS.includes(method.toLowerCase())) count++
    }
  }
  return count
}

function minVersion(range: string): string {
  const match = range.match(/(\d+)\.(\d+)/)
  return match ? `${match[1]}.${match[2]}` : range
}

function minNode(range: string): string {
  const match = range.match(/(\d+)/)
  return match ? match[1] : range
}

const peers = corePkg.peerDependencies
const clientBudget = corePkg['size-limit'].find((entry) => entry.name.includes('client bundle'))

export const facts = {
  node: minNode(corePkg.engines.node),
  vue: minVersion(peers.vue),
  vitepress: minVersion(peers.vitepress),
  vueApiPlayground: minVersion(peers['vue-api-playground']),
  vueApiPlaygroundRange: peers['vue-api-playground'],
  bundleBudget: clientBudget
    ? clientBudget.limit.replace(/\s+/g, ' ').replace(/kb$/i, 'KB').trim()
    : '',
  petstoreOps: countOperations(petstore.paths),
  mockOps: countOperations(mock.paths),
  mockWebhooks: countOperations((mock as { webhooks?: unknown }).webhooks),
}

export type Facts = typeof facts

declare module 'vue' {
  interface ComponentCustomProperties {
    $facts: Facts
  }
}
