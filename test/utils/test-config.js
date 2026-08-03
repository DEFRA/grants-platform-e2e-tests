const DEFAULT_WAIT_TIMEOUT = 10000

/**
 * Resolves journey test URLs and timeouts for the active Playwright profile.
 * Mirrors the custom properties previously set on WDIO config / browser.options.
 */
export function loadTestConfig(
  profile = process.env.PLAYWRIGHT_PROFILE || 'cdp'
) {
  const environment = process.env.ENVIRONMENT
  const grantsUiBase = environment
    ? `https://grants-ui.${environment}.cdp-int.defra.cloud`
    : 'http://localhost:3000'

  const shared = {
    waitforTimeout: DEFAULT_WAIT_TIMEOUT,
    waitforInterval: 200
  }

  if (profile === 'github') {
    return {
      ...shared,
      baseUrl: 'http://localhost:3000',
      cwUrl: undefined,
      agreementsUrl: undefined,
      gpsUrl: undefined,
      baseBackendUrl: undefined,
      proxy: undefined
    }
  }

  if (profile === 'local') {
    return {
      ...shared,
      baseUrl: grantsUiBase,
      cwUrl: `https://fg-cw-frontend.${environment}.cdp-int.defra.cloud/cases`,
      agreementsUrl: `${grantsUiBase}/agreement/`,
      gpsUrl: environment
        ? `https://ephemeral-protected.api.${environment}.cdp-int.defra.cloud/grants-payment-service/`
        : undefined,
      baseBackendUrl: environment
        ? `https://grants-ui-backend.${environment}.cdp-int.defra.cloud`
        : undefined,
      proxy: undefined
    }
  }

  return {
    ...shared,
    baseUrl: grantsUiBase,
    cwUrl: `https://fg-cw-frontend.${environment}.cdp-int.defra.cloud/cases`,
    agreementsUrl: `${grantsUiBase}/agreement/`,
    gpsUrl: environment
      ? `https://grants-payment-service.${environment}.cdp-int.defra.cloud/`
      : undefined,
    baseBackendUrl: undefined,
    proxy: {
      server: 'http://localhost:3128'
    }
  }
}

/** @deprecated Use loadTestConfig().waitforTimeout — kept for page object compatibility */
export const config = loadTestConfig()
