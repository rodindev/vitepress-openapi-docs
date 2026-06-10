# create-vitepress-openapi-docs

Scaffold an interactive OpenAPI documentation site with VitePress.

[Documentation](https://rodindev.github.io/vitepress-openapi-docs/)

## Usage

```bash
npm create vitepress-openapi-docs@latest my-api-docs
```

Run without arguments for an interactive setup, or pass flags to skip the
prompts. The scaffold ships with a demo OpenAPI spec; point `--spec` at your own
file or URL to start from it.

## Flags

| Flag                          | Description                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| `--spec <path>`               | OpenAPI spec path or URL to scaffold from                     |
| `--title <title>`             | Site title                                                    |
| `--server <url>`              | Default server base URL                                       |
| `--body-inputs`               | Use form inputs for request bodies instead of a JSON textarea |
| `--pm <npm\|pnpm\|yarn\|bun>` | Package manager for install                                   |
| `--skip-install`              | Skip dependency installation                                  |
| `--no-git`                    | Skip git init                                                 |
| `-y`, `--no-interactive`      | Run non-interactively                                         |
| `-f`, `--force`               | Scaffold into a non-empty directory                           |

## License

MIT
