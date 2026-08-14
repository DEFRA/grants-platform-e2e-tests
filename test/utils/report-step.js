import { test } from '@playwright/test'

/**
 * Named Allure / Playwright report step. Use this around page and journey
 * actions so reports show the current page or element instead of raw locators.
 */
export function step(title, fn) {
  return test.step(title, fn)
}
