/**
 * Resolves the grants-ui-backend base URL for API calls.
 *
 * Priority:
 * 1. BASE_BACKEND_URL env override
 * 2. Local runs against CDP (RUN_ENV=local + ENVIRONMENT) → ephemeral-protected API
 * 3. WDIO baseBackendUrl option
 * 4. ENVIRONMENT-based default or localhost fallback
 */
export function resolveBackendUrl({ baseBackendUrl } = {}) {
  if (process.env.BASE_BACKEND_URL) {
    return process.env.BASE_BACKEND_URL
  }

  if (process.env.RUN_ENV === 'local' && process.env.ENVIRONMENT) {
    return `https://ephemeral-protected.api.${process.env.ENVIRONMENT}.cdp-int.defra.cloud/grants-ui-backend`
  }

  if (baseBackendUrl) {
    return baseBackendUrl
  }

  return process.env.ENVIRONMENT
    ? `https://grants-ui-backend.${process.env.ENVIRONMENT}.cdp-int.defra.cloud`
    : 'http://localhost:3001'
}
