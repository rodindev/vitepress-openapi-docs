import { clack, handleCancel } from './prompt.js'
import { deriveSpecName, isGitAvailable, isInsideGitRepo } from './scaffolder.js'
import type { SpecEntry } from './generators.js'

export async function promptTitle(): Promise<string | undefined> {
  const value = await clack.text({
    message: 'Site title',
    placeholder: 'My API',
  })
  handleCancel(value)
  return (value as string).trim() || undefined
}

export async function promptServer(): Promise<string | undefined> {
  const value = await clack.text({
    message: 'API server base URL',
    placeholder: 'leave blank to use servers from the spec',
    validate(input = '') {
      if (!input.trim()) return undefined
      if (!/^https?:\/\//i.test(input.trim())) return 'Must be an HTTP(S) URL'
      return undefined
    },
  })
  handleCancel(value)
  return (value as string).trim() || undefined
}

export async function promptBodyInputs(): Promise<boolean> {
  const value = await clack.select({
    message: 'Request body style',
    options: [
      { value: false, label: 'JSON textarea', hint: 'default' },
      { value: true, label: 'Form inputs' },
    ],
    initialValue: false,
  })
  handleCancel(value)
  return value as boolean
}

export async function promptGitInit(targetDir: string): Promise<boolean> {
  if (!(await isGitAvailable())) return false
  if (await isInsideGitRepo(targetDir)) return false

  const value = await clack.confirm({
    message: 'Initialize a git repository?',
    initialValue: true,
  })
  handleCancel(value)
  return value as boolean
}

export async function promptSpecs(): Promise<SpecEntry[] | undefined> {
  const specs: SpecEntry[] = []

  const first = await clack.text({
    message: 'Path or URL to your OpenAPI spec',
    placeholder: 'leave blank for the bundled demo',
  })
  handleCancel(first)
  if (!(first as string).trim()) return undefined

  const firstName = await promptSpecName((first as string).trim())
  specs.push({ name: firstName, source: (first as string).trim() })

  while (true) {
    const more = await clack.confirm({
      message: 'Add another API spec?',
      initialValue: false,
    })
    handleCancel(more)
    if (!more) break

    const source = await clack.text({
      message: 'Path or URL to OpenAPI spec',
    })
    handleCancel(source)
    if (!(source as string).trim()) break

    const taken = specs.map((s) => s.name)
    const specName = await promptSpecName((source as string).trim(), taken)
    specs.push({ name: specName, source: (source as string).trim() })
  }

  return specs
}

async function promptSpecName(source: string, taken: string[] = []): Promise<string> {
  const suggested = deriveSpecName(source)
  const value = await clack.text({
    message: 'Short name for this API',
    placeholder: suggested,
    validate(input = '') {
      const raw = input.trim() || suggested
      const name =
        raw
          .toLowerCase()
          .replace(/[^\w-]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'api'
      if (taken.includes(name)) return `Name "${name}" is already used`
      return undefined
    },
  })
  handleCancel(value)
  const raw = (value as string).trim() || suggested
  return (
    raw
      .toLowerCase()
      .replace(/[^\w-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'api'
  )
}
