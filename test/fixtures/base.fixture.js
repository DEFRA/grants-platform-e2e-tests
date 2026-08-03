import '../utils/load-env.js'
import { test as base } from '@playwright/test'
import { initBridge, clearBridge } from '../utils/playwright-bridge.js'
import { loadTestConfig } from '../utils/test-config.js'

export { expect } from '../utils/playwright-bridge.js'

export const test = base.extend({
  bridge: [
    async ({ page, context }, use) => {
      const profile = process.env.PLAYWRIGHT_PROFILE || 'local'
      initBridge({ page, context, config: loadTestConfig(profile) })
      await page.bringToFront()
      await use()
      clearBridge()
    },
    { auto: true }
  ]
})
