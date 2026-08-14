import { browser, $, expect } from '../utils/test-runtime.js'
import LoginPage from '../page-objects/login.page.js'
import WoodlandHomePage from '../page-objects/woodland.home.page.js'
import { step } from '../utils/report-step.js'

const RETURNED_APPLICATION_HEADING =
  'Your application has been returned to you to make amendments'

/**
 * Complete the Woodland Management Plan application journey via the UI.
 */
export async function loginAndRunWoodlandManagementJourney({
  username,
  password,
  applicationData
}) {
  await WoodlandHomePage.open()
  await step('Wait for login or check-details page', async () => {
    await loginAndValidate(username, password)
  })

  if (!applicationData) {
    throw new Error('applicationData is required for woodland journey')
  }

  await WoodlandHomePage.completeCheckDetails()
  await WoodlandHomePage.completeEligibility()
  await WoodlandHomePage.completeWoodlandDetails(applicationData)
  await WoodlandHomePage.submitApplication()

  return step('Read application reference from confirmation page', async () => {
    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/woodland/confirmation'),
      { timeout: 30000, timeoutMsg: 'Woodland confirmation page did not load' }
    )

    const appRefNum = await WoodlandHomePage.getApplicationReference()
    await browser.takeScreenshot()
    return { appRefNum }
  })
}

/**
 * Log in as the farmer, update a returned woodland application, and resubmit.
 */
export async function loginAndUpdateWoodlandApplication({
  username,
  password,
  applicationData
}) {
  if (!applicationData) {
    throw new Error('applicationData is required for woodland journey')
  }
  await browser.pause(3000)
  await WoodlandHomePage.openReturnedApplication()
  await step('Wait for login or returned-to-customer page', async () => {
    await loginForReturnedApplication(username, password)
  })

  await step(`Confirm heading: ${RETURNED_APPLICATION_HEADING}`, async () => {
    const returnedHeading = await $('h1.govuk-heading-l')
    await returnedHeading.waitForDisplayed({ timeout: 50000 })
    expect(await returnedHeading.getText()).toBe(RETURNED_APPLICATION_HEADING)
  })

  await WoodlandHomePage.clickButton('Continue')
  await WoodlandHomePage.updateWoodlandOverTenYearsOld(
    applicationData.hectaresTenOrOverYearsOld
  )
  await WoodlandHomePage.clickButton('Continue')
  await WoodlandHomePage.clickButton('Continue')
  await WoodlandHomePage.clickButton('Confirm and submit')

  return step(
    'Read updated application reference from confirmation page',
    async () => {
      await browser.waitUntil(
        async () => (await browser.getUrl()).includes('/woodland/confirmation'),
        {
          timeout: 30000,
          timeoutMsg: 'Woodland confirmation page did not load'
        }
      )

      const newAppRefNum = await WoodlandHomePage.getApplicationReference()
      await browser.takeScreenshot()
      return { newAppRefNum }
    }
  )
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

async function waitForLoginPageOrReturnedApplication() {
  let pageState

  await browser.waitUntil(
    async () => {
      const loginInput = await $('#crn')
      const returnedHeading = await $('h1.govuk-heading-l')

      if (await returnedHeading.isExisting()) {
        const headingText = await returnedHeading.getText()
        if (headingText === RETURNED_APPLICATION_HEADING) {
          pageState = 'returned'
          return true
        }
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
        'Neither login page nor returned-to-customer page loaded after opening woodland journey'
    }
  )

  return pageState
}

async function loginForReturnedApplication(username, password) {
  const pageState = await waitForLoginPageOrReturnedApplication()

  if (pageState === 'login') {
    await LoginPage.login(username, password)
  }

  await browser.waitUntil(
    async () => {
      const returnedHeading = await $('h1.govuk-heading-l')
      if (!(await returnedHeading.isExisting())) {
        return false
      }

      return (await returnedHeading.getText()) === RETURNED_APPLICATION_HEADING
    },
    {
      timeout: 50000,
      timeoutMsg: 'Returned to customer page did not load after login'
    }
  )
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
