import { createPlaywrightConfig } from './playwright.config.shared.js'

export default createPlaywrightConfig({
  profile: 'github',
  timeout: 60 * 1000,
  headless: true,
  baseURL: 'http://localhost:3000'
})
