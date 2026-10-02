/**
 * Environment-scoped Playwright tags.
 *
 * Tag a test or describe with `{ tag: '@test' }` / `{ tag: '@ext-test' }` to
 * limit it to that ENVIRONMENT value. Untagged tests run on every environment.
 *
 * Add new CDP environment names here when needed (without the leading @).
 */
export const ENVIRONMENT_TAGS = ['test', 'ext-test']

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Builds a grepInvert pattern that skips tests tagged for other environments.
 *
 * @param {string | undefined} environment process.env.ENVIRONMENT
 * @returns {RegExp | undefined}
 */
export function resolveEnvironmentGrepInvert(
  environment = process.env.ENVIRONMENT
) {
  const tagsToSkip = ENVIRONMENT_TAGS.filter((tag) => tag !== environment).map(
    (tag) => `@${escapeRegExp(tag)}`
  )

  if (tagsToSkip.length === 0) {
    return undefined
  }

  return new RegExp(tagsToSkip.join('|'))
}
