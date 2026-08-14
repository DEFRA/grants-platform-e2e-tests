import { browser, $, expect } from '../utils/test-runtime.js'
import LoginPage from '../page-objects/login.page.js'
import GrasslandPage from '../page-objects/grassland.page.js'
import { step } from '../utils/report-step.js'

/**
 * Log in to grasslands and complete the Check before you start questions.
 */
export async function loginAndCompleteGrasslandCheckBeforeYouStartQuestions({
  username,
  password
}) {
  await GrasslandPage.open()
  await step('Wait for login or grasslands tasks page', async () => {
    await loginAndValidate(username, password)
  })

  await GrasslandPage.waitForTasksPage()
  await GrasslandPage.completeCheckBeforeYouStartQuestions()

  await GrasslandPage.waitForTasksPage()
  await GrasslandPage.clickSelectLandAndActions()

  await step('Confirm select land parcel page is shown', async () => {
    await GrasslandPage.waitForUrlIncludes('/grasslands/select-land-parcel')
    expect(await browser.getUrl()).toContain('/grasslands/select-land-parcel')
    await browser.takeScreenshot()
  })
}

/**
 * Select a land parcel on the map and verify it on the actions page.
 */
export async function selectLandParcelAndVerifyOnActionsPage({
  parcelId,
  areaHa
}) {
  await GrasslandPage.waitForUrlIncludes('/grasslands/select-land-parcel')
  await GrasslandPage.selectParcelOnMap(parcelId, areaHa)
  await GrasslandPage.continueFromMapSelection()
  await GrasslandPage.verifySelectedParcelOnActionsPage(parcelId, areaHa)
}

/**
 * Select actions and quantities, then return to the grasslands tasks page.
 */
export async function selectLandActionsAndReturnToTasks(actions) {
  await GrasslandPage.selectActionsWithQuantities(actions)

  await step('Confirm grasslands tasks page is shown', async () => {
    await GrasslandPage.waitForTasksPage()
    expect(await browser.getUrl()).toContain('/grasslands/tasks')
    await browser.takeScreenshot()
  })
}

/**
 * Review answers and submit the grasslands application.
 */
export async function checkAnswersAndSubmitApplication() {
  await GrasslandPage.checkAnswersAndSubmitApplication()

  // await step('Confirm grasslands confirmation page is shown', async () => {
  //   await GrasslandPage.waitForUrlIncludes('/grasslands/confirmation')
  //   expect(await browser.getUrl()).toContain('/grasslands/confirmation')
  //   await browser.takeScreenshot()
  // })
}

async function waitForLoginPageOrTasks() {
  let pageState

  await browser.waitUntil(
    async () => {
      const loginInput = await $('#crn')

      if ((await browser.getUrl()).includes('/grasslands/tasks')) {
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
        'Neither login page nor grasslands tasks page loaded after opening /grasslands'
    }
  )

  return pageState
}

async function loginAndValidate(username, password) {
  const pageState = await waitForLoginPageOrTasks()

  if (pageState === 'login') {
    await LoginPage.login(username, password)
  }

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

  await GrasslandPage.waitForTasksPage()
}
