import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { ParseError, parseSpec } from './index'

async function parseFixture(file: string) {
  const yaml = await readFile(resolve(__dirname, '../test/fixtures/specs', file), 'utf8')
  return parseSpec(yaml, { name: file.replace(/\.yaml$/, '') })
}

const minimal = {
  openapi: '3.1.0',
  info: { title: 'Test API', version: '1.0.0', description: 'desc' },
  servers: [{ url: 'https://api.example.com' }, { url: 'https://staging.example.com' }],
  paths: {
    '/users': {
      get: {
        operationId: 'users.list',
        summary: 'List users',
        tags: ['users'],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'cursor', in: 'query', required: false },
        ],
        responses: {
          '200': { description: 'ok' },
          '400': { description: 'bad request' },
        },
      },
      post: {
        operationId: 'users.create',
        tags: ['users'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '201': { description: 'created' } },
        security: [{ bearer: [] }],
      },
    },
    '/users/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        operationId: 'users.get',
        tags: ['users'],
        responses: { '200': { description: 'ok' } },
      },
      delete: {
        tags: ['users'],
        deprecated: true,
        responses: { '204': { description: 'no content' } },
      },
    },
    '/health': {
      get: {
        responses: { '200': { description: 'ok' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearer: { type: 'http', scheme: 'bearer' },
    },
  },
}

describe('parseSpec', () => {
  it('parses title, version and description from info', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    expect(spec.title).toBe('Test API')
    expect(spec.version).toBe('1.0.0')
    expect(spec.description).toBe('desc')
  })

  it('extracts every server URL in declared order', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    expect(spec.servers).toEqual(['https://api.example.com', 'https://staging.example.com'])
  })

  it('returns one operation per (path, method) pair', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    expect(spec.operations).toHaveLength(5)
  })

  it('uses operationId as id when present', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    const list = spec.operations.find((o) => o.path === '/users' && o.method === 'get')
    expect(list?.id).toBe('users.list')
    expect(list?.operationId).toBe('users.list')
  })

  it('synthesises a fallback id when operationId is missing', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    const del = spec.operations.find((o) => o.path === '/users/{id}' && o.method === 'delete')
    expect(del?.operationId).toBeUndefined()
    expect(del?.id).toBe('delete_users_id')
  })

  it('strips trailing period from operation summaries', async () => {
    const spec = await parseSpec(
      {
        openapi: '3.0.3',
        info: { title: 'T', version: '1' },
        paths: {
          '/pets': {
            get: {
              operationId: 'listPets',
              summary: 'List all pets.',
              responses: { '200': { description: 'ok' } },
            },
          },
        },
      },
      { name: 'test' }
    )
    expect(spec.operations[0]?.summary).toBe('List all pets')
  })

  it('inherits path-level parameters into each operation', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    const getOne = spec.operations.find((o) => o.path === '/users/{id}' && o.method === 'get')
    expect(getOne?.parameters.find((p) => p.name === 'id' && p.in === 'path')).toBeDefined()
  })

  it('marks path parameters as required even if not declared so', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    const getOne = spec.operations.find((o) => o.path === '/users/{id}' && o.method === 'get')
    expect(getOne?.parameters.find((p) => p.in === 'path')?.required).toBe(true)
  })

  it('captures requestBody with content and required flag', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    const post = spec.operations.find((o) => o.method === 'post')
    expect(post?.requestBody?.required).toBe(true)
    expect(post?.requestBody?.content['application/json']).toBeDefined()
  })

  it('sorts responses by status code', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    const list = spec.operations.find((o) => o.id === 'users.list')
    expect(list?.responses.map((r) => r.status)).toEqual(['200', '400'])
  })

  it('flattens security requirement names', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    const post = spec.operations.find((o) => o.method === 'post')
    expect(post?.security).toEqual(['bearer'])
  })

  it('marks deprecated operations', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    const del = spec.operations.find((o) => o.method === 'delete')
    expect(del?.deprecated).toBe(true)
  })

  it('parses http/bearer security scheme into structured form', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    expect(spec.securitySchemes.bearer).toEqual({
      type: 'bearer',
      rawType: 'http',
    })
  })

  it('parses apiKey security scheme with name and in', async () => {
    const yaml = [
      'openapi: 3.0.3',
      'info: { title: t, version: 1 }',
      'paths: {}',
      'components:',
      '  securitySchemes:',
      '    api_key:',
      '      type: apiKey',
      '      name: X-Custom-Key',
      '      in: header',
    ].join('\n')
    const spec = await parseSpec(yaml, { name: 'test' })
    expect(spec.securitySchemes.api_key).toEqual({
      type: 'apikey',
      rawType: 'apiKey',
      name: 'X-Custom-Key',
      in: 'header',
    })
  })

  it('resolves every standard security scheme type without silent drops', async () => {
    const yaml = [
      'openapi: 3.0.3',
      'info: { title: t, version: 1 }',
      'paths:',
      '  /a:',
      '    get:',
      '      operationId: a',
      '      security:',
      '        - bearer_auth: []',
      '        - basic_auth: []',
      '        - api_key: []',
      '        - oauth: []',
      "      responses: { '200': { description: ok } }",
      'components:',
      '  securitySchemes:',
      '    bearer_auth:',
      '      type: http',
      '      scheme: bearer',
      '    basic_auth:',
      '      type: http',
      '      scheme: basic',
      '    api_key:',
      '      type: apiKey',
      '      name: X-API-Key',
      '      in: header',
      '    oauth:',
      '      type: oauth2',
      '      flows:',
      '        implicit:',
      '          authorizationUrl: https://example.com/auth',
      '          scopes:',
      '            read: Read access',
    ].join('\n')
    const spec = await parseSpec(yaml, { name: 'test' })
    const types = Object.values(spec.securitySchemes).map((s) => s.type)
    expect(types).not.toContain('unknown')
    expect(types.sort()).toEqual(['apikey', 'basic', 'bearer', 'oauth2'])
    const op = spec.operations.find((o) => o.id === 'a')
    expect(op?.security).toEqual(['bearer_auth', 'basic_auth', 'api_key', 'oauth'])
  })

  it('parses oauth2 security scheme with flows, URLs, and scopes', async () => {
    const yaml = [
      'openapi: 3.0.3',
      'info: { title: t, version: 1 }',
      'paths: {}',
      'components:',
      '  securitySchemes:',
      '    oauth:',
      '      type: oauth2',
      '      flows:',
      '        authorizationCode:',
      '          authorizationUrl: https://auth.example.com/authorize',
      '          tokenUrl: https://auth.example.com/token',
      '          scopes:',
      '            read:users: Read user data',
      '            write:users: Modify user data',
    ].join('\n')
    const spec = await parseSpec(yaml, { name: 'test' })
    const scheme = spec.securitySchemes.oauth
    expect(scheme.type).toBe('oauth2')
    expect(scheme.rawType).toBe('oauth2')
    expect(scheme.oauth2Flows?.authorizationCode).toEqual({
      authorizationUrl: 'https://auth.example.com/authorize',
      tokenUrl: 'https://auth.example.com/token',
      refreshUrl: undefined,
      scopes: {
        'read:users': 'Read user data',
        'write:users': 'Modify user data',
      },
    })
  })

  it('extracts named component schemas', async () => {
    const yaml = [
      'openapi: 3.0.3',
      'info: { title: t, version: 1 }',
      'paths: {}',
      'components:',
      '  schemas:',
      '    User:',
      '      type: object',
      '      description: A user account',
      '      properties:',
      '        id: { type: integer }',
      '    Pet:',
      '      type: object',
    ].join('\n')
    const spec = await parseSpec(yaml, { name: 'test' })
    expect(Object.keys(spec.componentSchemas).sort()).toEqual(['Pet', 'User'])
    expect(spec.componentSchemas.User?.description).toBe('A user account')
  })

  it('captures the request body schema $ref name before dereferencing', async () => {
    const yaml = [
      'openapi: 3.0.3',
      'info: { title: t, version: 1 }',
      'paths:',
      '  /pets:',
      '    post:',
      '      operationId: createPet',
      '      requestBody:',
      '        content:',
      '          application/json:',
      '            schema:',
      "              $ref: '#/components/schemas/Pet'",
      "      responses: { '201': { description: ok } }",
      'components:',
      '  schemas:',
      '    Pet:',
      '      type: object',
    ].join('\n')
    const spec = await parseSpec(yaml, { name: 'test' })
    const op = spec.operations.find((o) => o.operationId === 'createPet')
    expect(op?.requestSchemaRefs['application/json']?.name).toBe('Pet')
  })

  it('captures response body schema $ref names per status + content type', async () => {
    const yaml = [
      'openapi: 3.0.3',
      'info: { title: t, version: 1 }',
      'paths:',
      '  /pets:',
      '    get:',
      '      operationId: listPets',
      '      responses:',
      "        '200':",
      '          description: ok',
      '          content:',
      '            application/json:',
      '              schema:',
      '                type: array',
      "                items: { $ref: '#/components/schemas/Pet' }",
      'components:',
      '  schemas:',
      '    Pet:',
      '      type: object',
    ].join('\n')
    const spec = await parseSpec(yaml, { name: 'test' })
    const op = spec.operations.find((o) => o.operationId === 'listPets')
    expect(op?.responseSchemaRefs['200']?.['application/json']?.name).toBe('Pet')
  })

  it('leaves response refs empty for inline schemas', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    const list = spec.operations.find((o) => o.id === 'users.list')
    expect(list?.responseSchemaRefs).toEqual({})
    expect(list?.requestSchemaRefs).toEqual({})
  })

  it('tags regular path operations with kind: "path"', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    expect(spec.operations.every((op) => op.kind === 'path')).toBe(true)
  })

  it('parses OpenAPI 3.1 top-level webhooks as operations with kind: "webhook"', async () => {
    const yaml = [
      'openapi: 3.1.0',
      'info: { title: Events, version: 1 }',
      'paths:',
      '  /ping:',
      '    get:',
      '      operationId: ping',
      "      responses: { '200': { description: ok } }",
      'webhooks:',
      '  pet.created:',
      '    post:',
      '      operationId: petCreated',
      '      summary: A pet was added',
      "      responses: { '200': { description: ack } }",
      '  order.placed:',
      '    post:',
      "      responses: { '200': { description: ack } }",
    ].join('\n')
    const spec = await parseSpec(yaml, { name: 'events' })
    const webhookOps = spec.operations.filter((op) => op.kind === 'webhook')
    expect(webhookOps).toHaveLength(2)
    const created = webhookOps.find((op) => op.operationId === 'petCreated')
    expect(created?.path).toBe('pet.created')
    expect(created?.summary).toBe('A pet was added')
    const orderPlaced = webhookOps.find((op) => op.path === 'order.placed')
    expect(orderPlaced?.id).toBe('webhook_post_order_placed')
    expect(spec.operations.some((op) => op.kind === 'path' && op.id === 'ping')).toBe(true)
  })

  it('orders operations by tag, then path, then method', async () => {
    const spec = await parseSpec(minimal, { name: 'test' })
    // health has no tag → '' sorts before 'users'
    const ids = spec.operations.map((o) => `${o.method} ${o.path}`)
    expect(ids[0]).toBe('get /health')
    expect(ids.slice(1)).toEqual([
      'get /users',
      'post /users',
      'get /users/{id}',
      'delete /users/{id}',
    ])
  })

  it('throws ParseError for an unparseable spec', async () => {
    await expect(parseSpec('not yaml: : :', { name: 'broken' })).rejects.toBeInstanceOf(ParseError)
  })

  it('accepts a YAML string', async () => {
    const yaml = [
      'openapi: 3.0.3',
      'info:',
      '  title: From YAML',
      '  version: 0.1.0',
      'paths:',
      '  /ping:',
      '    get:',
      '      responses:',
      "        '200': { description: ok }",
    ].join('\n')
    const spec = await parseSpec(yaml, { name: 'yaml-test' })
    expect(spec.title).toBe('From YAML')
    expect(spec.operations).toHaveLength(1)
  })

  it('inherits top-level security when an operation has no own security block', async () => {
    const yaml = [
      'openapi: 3.0.3',
      'info: { title: t, version: 1 }',
      'security:',
      '  - bearerAuth: []',
      'paths:',
      '  /protected:',
      '    get:',
      '      operationId: protectedRoute',
      "      responses: { '200': { description: ok } }",
      '  /public:',
      '    get:',
      '      operationId: publicRoute',
      '      security: []',
      "      responses: { '200': { description: ok } }",
      '  /custom:',
      '    get:',
      '      operationId: customRoute',
      '      security:',
      '        - apiKeyAuth: []',
      "      responses: { '200': { description: ok } }",
      'components:',
      '  securitySchemes:',
      '    bearerAuth: { type: http, scheme: bearer }',
      '    apiKeyAuth: { type: apiKey, name: X-Key, in: header }',
    ].join('\n')
    const spec = await parseSpec(yaml, { name: 'test' })
    const protectedOp = spec.operations.find((o) => o.id === 'protectedRoute')
    expect(protectedOp?.security).toEqual(['bearerAuth'])
    const publicOp = spec.operations.find((o) => o.id === 'publicRoute')
    expect(publicOp?.security).toEqual([])
    const customOp = spec.operations.find((o) => o.id === 'customRoute')
    expect(customOp?.security).toEqual(['apiKeyAuth'])
  })

  it('sanitizes markdown descriptions to prevent XSS', async () => {
    const spec = await parseSpec(
      {
        openapi: '3.1.0',
        info: {
          title: 'XSS test',
          version: '1.0.0',
          description: 'Hello <script>alert(1)</script> world <img onerror="alert(2)" src="x">',
        },
        paths: {},
      },
      { name: 'test' }
    )
    expect(spec.descriptionHtml).not.toContain('<script>')
    expect(spec.descriptionHtml).not.toContain('onerror')
    expect(spec.descriptionHtml).toContain('Hello')
    expect(spec.descriptionHtml).toContain('world')
  })

  it('handles an empty spec with zero operations', async () => {
    const spec = await parseSpec(
      {
        openapi: '3.1.0',
        info: { title: 'Empty API', version: '0.0.1' },
        paths: {},
      },
      { name: 'empty' }
    )
    expect(spec.operations).toHaveLength(0)
    expect(spec.title).toBe('Empty API')
    expect(spec.version).toBe('0.0.1')
    expect(Object.keys(spec.componentSchemas)).toHaveLength(0)
  })

  it('handles a webhook-only spec with no paths', async () => {
    const spec = await parseSpec(
      {
        openapi: '3.1.0',
        info: { title: 'Webhooks Only', version: '1.0.0' },
        webhooks: {
          orderCreated: {
            post: {
              operationId: 'webhook.orderCreated',
              summary: 'Order created webhook',
              responses: { '200': { description: 'ok' } },
            },
          },
          orderCancelled: {
            post: {
              summary: 'Order cancelled',
              responses: { '200': { description: 'ok' } },
            },
          },
        },
      },
      { name: 'webhooks' }
    )
    expect(spec.operations).toHaveLength(2)
    expect(spec.operations.every((op) => op.kind === 'webhook')).toBe(true)
    expect(spec.operations.find((op) => op.operationId === 'webhook.orderCreated')).toBeDefined()
    const unnamed = spec.operations.find((op) => !op.operationId)
    expect(unnamed).toBeDefined()
    expect(unnamed!.id).toMatch(/post.orderCancelled/i)
  })

  it('dereferences parameter schemas so typeLabel and defaultExample are set', async () => {
    const spec = await parseFixture('dereference.yaml')
    const op = spec.operations.find((o) => o.operationId === 'getPet')
    const petId = op?.parameters.find((p) => p.name === 'petId')
    expect(petId?.required).toBe(true)
    expect(petId?.typeLabel).toBe('integer')
    expect(petId?.defaultExample).toBe('7')
    const verbose = op?.parameters.find((p) => p.name === 'verbose')
    expect(verbose?.typeLabel).toBe('boolean')
    expect(verbose?.defaultExample).toBe('false')
  })

  it('resolves path-item-level $refs into operations', async () => {
    const spec = await parseFixture('dereference.yaml')
    const op = spec.operations.find((o) => o.operationId === 'listPets')
    expect(op).toBeDefined()
    expect(op?.path).toBe('/pets')
    expect(op?.method).toBe('get')
  })

  it('resolves $refs inside securitySchemes', async () => {
    const spec = await parseFixture('dereference.yaml')
    expect(spec.securitySchemes.legacyAuth).toEqual({
      type: 'bearer',
      rawType: 'http',
    })
  })

  it('merges allOf request bodies into ordered json fields', async () => {
    const spec = await parseFixture('allof.yaml')
    const op = spec.operations.find((o) => o.operationId === 'createPet')
    const fields = op?.requestBody?.jsonFields ?? []
    expect(fields.map((f) => f.name)).toEqual(['name', 'id', 'tag'])
    expect(fields.find((f) => f.name === 'name')?.required).toBe(true)
    expect(fields.find((f) => f.name === 'id')?.required).toBe(true)
    expect(fields.find((f) => f.name === 'tag')?.required).toBe(false)
  })

  it('merges allOf component schemas into an object property list', async () => {
    const spec = await parseFixture('allof.yaml')
    const pet = spec.componentSchemas.Pet
    expect(pet?.typeLabel).toBe('object')
    expect(pet?.properties.map((p) => p.name)).toEqual(['name', 'tag', 'id'])
    expect(pet?.properties.find((p) => p.name === 'name')?.required).toBe(true)
    expect(pet?.properties.find((p) => p.name === 'id')?.required).toBe(true)
  })

  it('sets refTarget for properties pointing at component schemas', async () => {
    const spec = await parseFixture('schema-refs.yaml')
    const user = spec.componentSchemas.User
    const pet = user?.properties.find((p) => p.name === 'pet')
    expect(pet?.refTarget).toBe('Pet')
    expect(pet?.typeLabel).toBe('Pet')
    const pets = user?.properties.find((p) => p.name === 'pets')
    expect(pets?.refTarget).toBe('Pet')
    expect(pets?.typeLabel).toBe('Pet[]')
  })

  it('sets refTarget on request body json fields', async () => {
    const spec = await parseFixture('schema-refs.yaml')
    const op = spec.operations.find((o) => o.operationId === 'createUser')
    const pet = op?.requestBody?.jsonFields.find((f) => f.name === 'pet')
    expect(pet?.refTarget).toBe('Pet')
    const pets = op?.requestBody?.jsonFields.find((f) => f.name === 'pets')
    expect(pets?.typeLabel).toBe('Pet[]')
  })

  it('parses a circular schema into serialisable output', async () => {
    const spec = await parseFixture('circular.yaml')
    expect(() => JSON.stringify(spec)).not.toThrow()
    const person = spec.componentSchemas.Person
    expect(person?.typeLabel).toBe('object')
    const friend = person?.properties.find((p) => p.name === 'friend')
    expect(friend?.refTarget).toBe('Person')
    const op = spec.operations.find((o) => o.operationId === 'createPerson')
    expect(op?.requestBody?.jsonFields.map((f) => f.name)).toEqual(['name', 'friend'])
  })

  it('leaves dotted and underscored operation ids byte-identical', async () => {
    const spec = await parseSpec(
      {
        openapi: '3.1.0',
        info: { title: 'T', version: '1' },
        paths: {
          '/users': {
            get: { operationId: 'users.list', responses: { '200': { description: 'ok' } } },
          },
          '/auth': {
            post: { operationId: 'auth.login', responses: { '200': { description: 'ok' } } },
          },
        },
        webhooks: {
          payment: {
            post: {
              operationId: 'webhook_post_payment',
              responses: { '200': { description: 'ok' } },
            },
          },
        },
      },
      { name: 'test' }
    )
    expect(spec.operations.map((o) => o.id).sort()).toEqual([
      'auth.login',
      'users.list',
      'webhook_post_payment',
    ])
  })

  it('sanitises path separators and parent traversal out of operation ids', async () => {
    const spec = await parseSpec(
      {
        openapi: '3.1.0',
        info: { title: 'T', version: '1' },
        paths: {
          '/evil': {
            get: { operationId: '../../../tmp/evil', responses: { '200': { description: 'ok' } } },
          },
        },
      },
      { name: 'test' }
    )
    const id = spec.operations[0]!.id
    expect(id).not.toContain('/')
    expect(id).not.toContain('..')
    expect(id.startsWith('.')).toBe(false)
  })

  it('sanitises component schema names the same way', async () => {
    const spec = await parseSpec(
      {
        openapi: '3.1.0',
        info: { title: 'T', version: '1' },
        paths: {},
        components: {
          schemas: {
            User: { type: 'object' },
            '../escape': { type: 'object' },
          },
        },
      },
      { name: 'test' }
    )
    expect(spec.componentSchemas.User?.name).toBe('User')
    const escaped = Object.keys(spec.componentSchemas).find((n) => n !== 'User')!
    expect(escaped).not.toContain('/')
    expect(escaped.startsWith('.')).toBe(false)
  })

  it('suffixes duplicate operation ids and warns about both routes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const spec = await parseSpec(
      {
        openapi: '3.1.0',
        info: { title: 'T', version: '1' },
        paths: {
          '/a': { get: { operationId: 'dupe', responses: { '200': { description: 'ok' } } } },
          '/b': { get: { operationId: 'dupe', responses: { '200': { description: 'ok' } } } },
        },
      },
      { name: 'public' }
    )
    const ids = spec.operations.map((o) => o.id).sort()
    expect(ids).toEqual(['dupe', 'dupe-2'])
    expect(warn).toHaveBeenCalledTimes(1)
    const message = warn.mock.calls[0]![0] as string
    expect(message).toContain('public.dupe')
    expect(message).toContain('public.dupe-2')
    warn.mockRestore()
  })
})
