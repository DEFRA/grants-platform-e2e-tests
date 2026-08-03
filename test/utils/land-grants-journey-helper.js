import { browser, expect, getContext } from './test-runtime.js'
import HomePage from '../page-objects/home.page.js'
import LoginPage from '../page-objects/login.page.js'
import { SERVICE_NAME } from './config.js'
import { runFundingApiJourney } from './land-grants-journey-api.js'

/** Farmer UI login, then HTTP funding journey; returns refs and leaves the app on home. */
export async function loginAndRunFundingApiJourney({
  username,
  password,
  sbi,
  selectedLandParcel,
  landAction,
  consentRequired
}) {
  await HomePage.open()
  // await expect(browser).toHaveTitle(`Sign in to your acccount`)
  await LoginPage.login(username, password)
  await expect(browser).toHaveTitle(new RegExp(`${SERVICE_NAME}`))
  const appRef = await runFundingApiJourney({
    browser: getContext(),
    username,
    sbi,
    selectedLandParcel,
    landAction,
    consentRequired
  })
  const appRefNum = appRef.referenceNumber.toString().toLowerCase()
  await HomePage.open()
  await browser.pause(5000)
  await browser.takeScreenshot()
  console.log(`Application Reference Number:`, appRefNum)
  return { appRef, appRefNum }
}
