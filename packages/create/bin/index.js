#!/usr/bin/env node
import('../dist/index.js').then((m) => m.run(globalThis.process.argv.slice(2)))
