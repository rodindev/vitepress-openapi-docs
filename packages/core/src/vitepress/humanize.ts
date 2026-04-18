/**
 * Turn a machine-readable operationId into a human-readable label.
 * Handles snake_case, camelCase, and kebab-case.
 *
 * `appointments_confirmed_schedules_retrieve` → "Appointments confirmed schedules retrieve"
 * `getUserById` → "Get user by id"
 */
export function humanizeId(id: string): string {
  const spaced = id
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
  if (spaced.length === 0) return id
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
