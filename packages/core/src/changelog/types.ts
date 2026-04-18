export type ChangeKind = 'added' | 'removed' | 'renamed' | 'summary' | 'description'

export interface OperationChange {
  kind: ChangeKind
  /** Operation id as it appears in the NEW commit (or OLD for `removed`). */
  operationId: string
  /** Previous operation id for `renamed`. */
  previousOperationId?: string
  /** Present for `summary`/`description` to show the before→after. */
  before?: string
  after?: string
}

export interface InfoChange {
  kind: 'title' | 'version' | 'description'
  before?: string
  after?: string
}

export interface ChangelogEntry {
  /** Git commit short hash. */
  commit: string
  /** Author-date ISO string. */
  date: string
  /** First line of the commit subject. */
  subject: string
  /** Spec-level info changes between this commit and the previous one. */
  info: InfoChange[]
  /** Operation-level changes between this commit and the previous one. */
  operations: OperationChange[]
}

export interface SpecChangelog {
  /** Spec name from `OpenApiSpecConfig.name`. */
  specName: string
  /** Newest first. */
  entries: ChangelogEntry[]
  /** When `true`, the repo has fewer than 2 commits touching this spec file. */
  isEmpty: boolean
}
