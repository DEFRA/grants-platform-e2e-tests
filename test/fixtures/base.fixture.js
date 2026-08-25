import '../utils/load-env.js'
import path from 'node:path'
import * as allure from 'allure-js-commons'
import { test as base } from '@playwright/test'
import { initBridge, clearBridge } from '../utils/playwright-bridge.js'
import { loadTestConfig } from '../utils/test-config.js'
import { acquireSerialLock, releaseSerialLock } from '../utils/serial-lock.js'

export { expect } from '../utils/playwright-bridge.js'

function formatSuiteName(folderName) {
  return folderName
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export const test = base.extend({
  // Specs that share a farmer CRN must not overlap. Set this in each spec:
  //   const crn = '1106298365'
  //   test.use({ crn })
  crn: [undefined, { option: true }],
  bridge: [
    async ({ page, context }, use) => {
      const profile = process.env.PLAYWRIGHT_PROFILE || 'local'
      initBridge({ page, context, config: loadTestConfig(profile) })
      await page.bringToFront()
      await use()
      clearBridge()
    },
    { auto: true }
  ],
  allureSuiteFromFolder: [
    async ({}, use, testInfo) => {
      const relativePath = path.relative(
        testInfo.project.testDir,
        testInfo.file
      )
      const [folderName] = relativePath.split(path.sep)

      if (folderName && folderName !== relativePath) {
        await allure.parentSuite(formatSuiteName(folderName))
      }

      await use()
    },
    { auto: true }
  ],
  crnSerialGate: [
    async ({ crn }, use) => {
      const lockKey = crn || 'unscoped'
      await acquireSerialLock(lockKey)
      try {
        await use()
      } finally {
        await releaseSerialLock(lockKey)
      }
    },
    { auto: true }
  ]
})
