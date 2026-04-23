import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseSpec } from '../src/parser/index'
import { buildSnippets } from '../src/snippets/index'

interface Fixture {
  /** Short name used in the spec registry (and in snippet ids). */
  name: string
  /** Path relative to this file. */
  file: string
  /** Minimum number of operations we expect to parse out. */
  minOperations: number
  /** At least one operationId we expect to find — asserts the parser kept it. */
  expectOperationId: string
}

const FIXTURES: Fixture[] = [
  {
    name: 'petstore',
    file: 'fixtures/specs/petstore.yaml',
    minOperations: 7,
    expectOperationId: 'addPet',
  },
  {
    name: 'github',
    file: 'fixtures/specs/github-minimal.yaml',
    minOperations: 4,
    expectOperationId: 'users/get-authenticated',
  },
  {
    name: 'twilio',
    file: 'fixtures/specs/twilio-minimal.yaml',
    minOperations: 2,
    expectOperationId: 'createMessage',
  },
  {
    name: 'openai',
    file: 'fixtures/specs/openai-minimal.yaml',
    minOperations: 2,
    expectOperationId: 'createChatCompletion',
  },
  {
    name: 'stripe',
    file: 'fixtures/specs/stripe-minimal.yaml',
    minOperations: 4,
    expectOperationId: 'postPaymentIntents',
  },
]

describe('spec matrix', () => {
  for (const fixture of FIXTURES) {
    describe(fixture.name, () => {
      it('parses without errors and retains the expected operations', async () => {
        const yaml = await readFile(resolve(__dirname, fixture.file), 'utf8')
        const spec = await parseSpec(yaml, { name: fixture.name })
        expect(spec.operations.length).toBeGreaterThanOrEqual(fixture.minOperations)
        expect(spec.operations.some((op) => op.operationId === fixture.expectOperationId)).toBe(
          true
        )
      })

      it('renders curl + fetch + python snippets for every operation with auth injected', async () => {
        const yaml = await readFile(resolve(__dirname, fixture.file), 'utf8')
        const spec = await parseSpec(yaml, { name: fixture.name })
        for (const op of spec.operations) {
          const snippets = buildSnippets(op, {
            baseUrl: spec.servers[0],
            auth: { scheme: 'bearer', value: 'TOKEN' },
          })
          expect(snippets.map((s) => s.language)).toEqual(['curl', 'fetch', 'python'])
          for (const s of snippets) {
            expect(s.code.length).toBeGreaterThan(0)
          }
        }
      })
    })
  }
})
