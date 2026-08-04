import { browser, $ } from '../utils/test-runtime.js'
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

async function waitForLoginPageOrCheckDetails() {
  let pageState

  await browser.waitUntil(
    async () => {
      const loginInput = await $('#crn')
      const detailsRadio = await $('#businessDetailsUpToDate')

      if (await detailsRadio.isExisting()) {
        pageState = 'authenticated'
        return true
      }

      if (await loginInput.isExisting()) {
        pageState = 'login'
        return true
      }

      return false
    },
    {
      timeout: 50000,
      timeoutMsg:
        'Neither login page nor check-details page loaded after opening woodland journey'
    }
  )

  return pageState
}

async function loginIfRequired(username, password) {
  const pageState = await waitForLoginPageOrCheckDetails()

  if (pageState === 'login') {
    await LoginPage.login(username, password)
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
