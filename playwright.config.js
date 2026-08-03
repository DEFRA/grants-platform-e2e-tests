import {
  createPlaywrightConfig,
  fiveMinutes,
  getEnvironmentBaseUrl
} from './playwright.config.shared.js'

export default createPlaywrightConfig({
  profile: 'cdp',
  timeout: fiveMinutes,
  headless: true,
  baseURL: getEnvironmentBaseUrl(),
  proxy: { server: 'http://localhost:3128' }
})
