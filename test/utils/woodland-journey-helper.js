import { browser, $ } from './test-runtime.js'
import LoginPage from '../page-objects/login.page.js'
import WoodlandHomePage from '../page-objects/woodland.home.page.js'

/**
 * Complete the Woodland Management Plan application journey via the UI.
 */
export async function loginAndRunWoodlandManagementJourney({
  username,
  password,
  applicationData
}) {
  await WoodlandHomePage.open()
  await loginAndValidate(username, password)

  if (!applicationData) {
    throw new Error('applicationData is required for woodland journey')
  }

  await WoodlandHomePage.completeCheckDetails()
  await WoodlandHomePage.completeEligibility()
  await WoodlandHomePage.completeWoodlandDetails(applicationData)
  await WoodlandHomePage.submitApplication()

  // ── Confirmation ───────────────────────────────────────────────────────────
  await browser.waitUntil(
    async () => (await browser.getUrl()).includes('/woodland/confirmation'),
    { timeout: 30000, timeoutMsg: 'Woodland confirmation page did not load' }
  )

  const appRefNum = await WoodlandHomePage.getApplicationReference()
  await browser.takeScreenshot()
  return { appRefNum }
}

async function loginIfRequired(username, password) {
  const loginInput = await $('#crn')

  if (await loginInput.isExisting()) {
    await LoginPage.login(username, password)
    return
  }

  try {
    await loginInput.waitForExist({ timeout: 5000 })
    await LoginPage.login(username, password)
  } catch {
    // Already authenticated — no login form shown
  }
}

async function loginAndValidate(username, password) {
  await loginIfRequired(username, password)

  await browser.waitUntil(
    async () => {
      const loginInput = await $('#crn')
      return !(await loginInput.isExisting())
    },
    {
      timeout: 50000,
      timeoutMsg: 'Login validation failed: still on login page'
    }
  )

  const detailsRadio = await $('#businessDetailsUpToDate')
  await detailsRadio.waitForExist({
    timeout: 50000,
    timeoutMsg: 'Login validation failed: check-details page did not load'
  })
}
