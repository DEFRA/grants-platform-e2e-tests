import {
  createPlaywrightConfig,
  fiveMinutes,
  getEnvironmentBaseUrl
} from './playwright.config.shared.js'

const debug = process.env.DEBUG === 'true'

export default createPlaywrightConfig({
  profile: 'local',
  timeout: debug ? 60 * 60 * 1000 : fiveMinutes,
  // Headed by default for local runs — uses installed Google Chrome for reliable UI interaction
  headless: process.env.HEADLESS === 'true',
  channel: process.env.PW_CHANNEL || 'chrome',
  baseURL: getEnvironmentBaseUrl()
})
