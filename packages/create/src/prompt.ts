import { createInterface } from 'node:readline/promises'

/**
 * Read a single line of user input from stdin. Falls back to `defaultValue`
 * when stdin is closed (e.g. piped/non-interactive shell), so the scaffolder
 * never hangs in CI.
 */
export async function prompt(question: string, defaultValue = ''): Promise<string> {
  const rl = createInterface({ input: globalThis.process.stdin, output: globalThis.process.stdout })
  try {
    const answer = await rl.question(question)
    return answer || defaultValue
  } catch {
    return defaultValue
  } finally {
    rl.close()
  }
}
