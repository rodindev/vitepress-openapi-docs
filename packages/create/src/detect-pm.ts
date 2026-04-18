export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

/**
 * Read the `npm_config_user_agent` env var that npm/pnpm/yarn/bun set on the
 * `npm create …` invocation, and pick the matching package manager. Falls
 * back to `npm` when the var is absent or unrecognised.
 */
export function detectPackageManager(): PackageManager {
  const ua = process.env.npm_config_user_agent ?? ''
  if (ua.startsWith('pnpm')) return 'pnpm'
  if (ua.startsWith('yarn')) return 'yarn'
  if (ua.startsWith('bun')) return 'bun'
  return 'npm'
}
