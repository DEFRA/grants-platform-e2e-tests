/**
 * Environment-scoped Playwright tags.
 *
 * Tag a test or describe with `{ tag: '@test' }` / `{ tag: '@ext-test' }` to
 * limit it to that ENVIRONMENT value. Untagged tests run on every environment.
 *
 * Add new CDP environment names here when needed (without the leading @).
 */
export const ENVIRONMENT_TAGS = ['test', 'ext-test']

const ENVIRONMENT_ALIASES = {
  test: 'test',
  'ext-test': 'ext-test',
  ext_test: 'ext-test',
  exttest: 'ext-test'
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Normalize ENVIRONMENT from CI / .env (trim, lowercase, aliases).
 *
 * @param {string | undefined} environment
 * @returns {string}
 */
export function normalizeEnvironment(environment = process.env.ENVIRONMENT) {
  const normalized = String(environment || '')
    .trim()
    .toLowerCase()

  if (!normalized) {
    return ''
  }

  return ENVIRONMENT_ALIASES[normalized] || normalized
}

/**
 * Resolve the active environment name for tag filtering.
 * Prefers ENVIRONMENT, then falls back to the grants-ui host in BASE_URL.
 *
 * @returns {string}
 */
export function resolveCurrentEnvironment() {
  const fromEnv = normalizeEnvironment(process.env.ENVIRONMENT)
  if (fromEnv) {
    return fromEnv
  }

  const baseUrl = process.env.BASE_URL || ''
  const hostMatch = baseUrl.match(/grants-ui\.([^.]+)\.cdp-int/i)
  if (hostMatch) {
    return normalizeEnvironment(hostMatch[1])
  }

  return ''
}

/**
 * Builds a grepInvert pattern that skips tests tagged for other environments.
 * Uses whole-token matching so `@test` does not match `@ext-test`.
 *
 * @param {string | undefined} environment
 * @returns {RegExp | undefined}
 */
export function resolveEnvironmentGrepInvert(
  environment = resolveCurrentEnvironment()
) {
  const current = normalizeEnvironment(environment)
  const tagsToSkip = ENVIRONMENT_TAGS.filter((tag) => tag !== current)

  if (tagsToSkip.length === 0) {
    return undefined
  }

  // Playwright joins suite titles + tags with spaces in _grepTitle().
  // Anchor as whole tokens so `@test` never matches `@ext-test`.
  const pattern = tagsToSkip
    .map((tag) => `(?:^|\\s)@${escapeRegExp(tag)}(?=\\s|$)`)
    .join('|')

  return new RegExp(pattern)
}

/**
 * @param {string[]} tags Playwright testInfo.tags values (e.g. ['@ext-test'])
 * @param {string} [environment]
 * @returns {{ run: boolean, reason?: string, envTags: string[] }}
 */
export function resolveEnvironmentTagDecision(
  tags,
  environment = resolveCurrentEnvironment()
) {
  const envTags = (tags || [])
    .map((tag) => String(tag).trim())
    .map((tag) => (tag.startsWith('@') ? tag.slice(1) : tag).toLowerCase())
    .filter((tag) => ENVIRONMENT_TAGS.includes(tag))

  if (envTags.length === 0) {
    return { run: true, envTags }
  }

  if (envTags.includes(environment)) {
    return { run: true, envTags }
  }

  return {
    run: false,
    envTags,
    reason: `Tagged ${envTags.map((tag) => `@${tag}`).join(', ')} but ENVIRONMENT=${environment || '(unset)'}`
  }
}
