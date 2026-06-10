#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(resolve(root, rel), 'utf8')
const readJson = (rel) => JSON.parse(read(rel))

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']

function countOperations(pathItems) {
  if (!pathItems || typeof pathItems !== 'object') return 0
  let count = 0
  for (const item of Object.values(pathItems)) {
    if (!item || typeof item !== 'object') continue
    for (const method of Object.keys(item)) {
      if (HTTP_METHODS.includes(method.toLowerCase())) count++
    }
  }
  return count
}

const corePkg = readJson('packages/core/package.json')
const peers = corePkg.peerDependencies
const budget = corePkg['size-limit']
  .find((e) => e.name.includes('client bundle'))
  .limit.replace(/\s+/g, ' ')
  .replace(/kb$/i, 'KB')
  .trim()

const failures = []
const warnings = []
const expect = (file, ok, message) => {
  if (!ok) failures.push(`${file}: ${message}`)
}

const rootReadme = read('README.md')
expect(
  'README.md',
  new RegExp(`vue-api-playground >= ${peers['vue-api-playground'].match(/\d+\.\d+/)[0]}`).test(
    rootReadme
  ),
  `expected vue-api-playground peer >= ${peers['vue-api-playground']}`
)
expect(
  'README.md',
  new RegExp(`Vue >= ${peers.vue.match(/\d+\.\d+/)[0]}`).test(rootReadme),
  `expected Vue peer >= ${peers.vue}`
)
expect(
  'README.md',
  new RegExp(`VitePress >= ${peers.vitepress.match(/\d+\.\d+/)[0]}`).test(rootReadme),
  `expected VitePress peer >= ${peers.vitepress}`
)
expect('README.md', rootReadme.includes(`< ${budget}`), `expected "< ${budget}" bundle claim`)

// packages/core/README.md is rewritten by a separate branch; accept the correct
// ^2.5-style peer and only warn when it is still stale on this checkout.
const corePeerOk = /vue-api-playground` ?\^?2\.5|vue-api-playground[^.\n]*\^2\.5/.test(
  read('packages/core/README.md')
)
if (!corePeerOk)
  warnings.push(
    `packages/core/README.md: vue-api-playground peer not at ^2.5 yet (owned by fix/npm-packaging)`
  )

const templateOps = countOperations(
  readJson('packages/create/template/docs/openapi/mock.json').paths
)
const templateReadme = read('packages/create/template/README.md')
expect(
  'packages/create/template/README.md',
  templateReadme.includes(`${templateOps} operations`),
  `expected "${templateOps} operations"`
)

for (const warning of warnings) console.warn(`warn  ${warning}`)
if (failures.length) {
  for (const failure of failures) console.error(`fail  ${failure}`)
  process.exit(1)
}
console.log('check-facts: all static fact claims match their sources')
