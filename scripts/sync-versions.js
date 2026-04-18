#!/usr/bin/env node

/**
 * Sync version numbers across the monorepo:
 * - packages/core/package.json  → source of truth
 * - packages/create/package.json  → same version
 * - packages/create/template/package.json  → dep range `^<version>`
 *
 * Run before tagging a release:
 *   node scripts/sync-versions.js
 *   node scripts/sync-versions.js 1.0.0   # override version
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function readJson(rel) {
  const path = resolve(root, rel)
  return { path, data: JSON.parse(readFileSync(path, 'utf8')) }
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

const core = readJson('packages/core/package.json')
const create = readJson('packages/create/package.json')
const template = readJson('packages/create/template/package.json')

const version = process.argv[2] || core.data.version
const range = `^${version}`

let changed = 0

if (core.data.version !== version) {
  core.data.version = version
  writeJson(core.path, core.data)
  console.log(`  packages/core/package.json → ${version}`)
  changed++
}

if (create.data.version !== version) {
  create.data.version = version
  writeJson(create.path, create.data)
  console.log(`  packages/create/package.json → ${version}`)
  changed++
}

const currentPin = template.data.dependencies?.['vitepress-openapi-docs']
if (currentPin !== range) {
  template.data.dependencies['vitepress-openapi-docs'] = range
  writeJson(template.path, template.data)
  console.log(`  packages/create/template/package.json → ${range}`)
  changed++
}

if (changed === 0) {
  console.log(`All packages already at ${version}`)
} else {
  console.log(`\nSynced ${changed} file(s) to ${version}`)
}
