import * as clack from '@clack/prompts'

export { clack }

export function handleCancel(value: unknown): void {
  if (clack.isCancel(value)) {
    clack.cancel('Aborted.')
    globalThis.process.exit(0)
  }
}
