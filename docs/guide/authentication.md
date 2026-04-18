---
description: How authentication works in vitepress-openapi-docs — bearer, basic, API key, and OAuth2.
---

# Authentication

`<OpenApiEndpoint>` auto-detects the auth scheme from the spec's `securitySchemes` and renders an appropriate input.

## Supported schemes

| Scheme   | Input               | Header injected                          |
| -------- | ------------------- | ---------------------------------------- |
| `bearer` | Token (password)    | `Authorization: Bearer <token>`          |
| `basic`  | `username:password` | `Authorization: Basic <value>`           |
| `apikey` | Key (password)      | Custom header (from spec or `X-API-Key`) |
| `oauth2` | Token paste         | `Authorization: Bearer <token>`          |

## How it works

1. The parser reads `components.securitySchemes` from your spec
2. Each operation's `security` array references a scheme by name
3. `<OpenApiEndpoint>` resolves the scheme type and renders `<AuthControls>`
4. The user enters a credential — stored in `sessionStorage` under `vod:auth:{specName}`
5. The credential auto-injects into:
   - **SDK snippets** (curl, fetch, Python, Node) — visible and copy-pasteable
   - **Try-It panel** — via the `before-send` hook

## Session storage

Credentials persist across SPA navigation within the same tab. They clear when:

- The user clicks **Clear credentials**
- The browser tab is closed
- `sessionStorage` is cleared

Each spec has its own credential store — setting auth on one API doesn't affect another.

## Override per endpoint

Force a specific scheme:

```md
<OpenApiEndpoint id="api.users.list" auth="bearer" />
```

Disable auth entirely:

```md
<OpenApiEndpoint id="api.public.health" auth="none" />
```

## API key header name

For `apiKey` schemes, the header name is read from the spec:

```yaml
components:
  securitySchemes:
    api_key:
      type: apiKey
      name: X-Custom-Key
      in: header
```

Override per endpoint:

```md
<OpenApiEndpoint id="api.users.list" api-key-header-name="X-Override" />
```

## OAuth2

For `oauth2` schemes, the plugin renders:

- **Authorization URL** — clickable link
- **Token URL** — shown for reference
- **Scopes** — collapsible list with descriptions
- **Token paste input** — paste the token obtained from the OAuth2 flow

The pasted token is injected as a `Bearer` token in snippets and Try-It. This is a passthrough — the plugin does not perform the OAuth2 redirect flow itself.

```yaml
components:
  securitySchemes:
    oauth:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.example.com/authorize
          tokenUrl: https://auth.example.com/token
          scopes:
            read:users: Read user data
            write:users: Modify user data
```

## Programmatic access

For custom layouts or integrations outside of `<OpenApiEndpoint>`:

```ts
import { useAuthState, readStoredCredential } from 'vitepress-openapi-docs'

// Reactive (composable)
const auth = useAuthState('api')
auth.set({ scheme: 'bearer', value: 'my-token' })
auth.clear()

// Synchronous read
const cred = readStoredCredential('api')
```
