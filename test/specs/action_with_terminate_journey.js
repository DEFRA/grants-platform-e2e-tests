import { test, expect } from '../fixtures/base.fixture.js'
import { browser } from '../utils/test-runtime.js'
import { loginAndRunFundingApiJourney } from '../utils/land-grants-journey-helper.js'
import CWHomePage from '../page-objects/cw.home.page.js'
import CwTasksPage from '../page-objects/cw.tasks.page.js'
import CwTimelinePage from '../page-objects/cw.timeline.page.js'
import CWAgreementsPage from '../page-objects/cw.agreements.page.js'
import Backend from '../utils/backend.js'
import {
  completeSFIJourney,
  initiateTerminateSFIJourney
} from '../utils/cw-journey-helper.js'
import {
  completeAgreementJourney,
  terminatedAgreementJourney
} from '../utils/agreement-journey-helper.js'

test.afterEach(async ({ context }) => {
  await context.clearCookies()
})

test.describe('SFI Application E2E Tests for a terminate journey', () => {
  test('Caseworker able to terminate a case after customer accepted the agreement', async () => {
    const username = '1103171356'
    const sbi = '107214733'
    const selectedLandParcel = 'SD8545-9935'
    const landAction = 'CMOR1'
    const annualPaymentBreakdown =
      '£272.34 ( 0.0321 ha x £10.60 per ha, £272.00 per SFI agreement per year )'
    const consentRequired = false
    const password = process.env.DEFRA_ID_USER_PASSWORD
    await Backend.clearTestData(sbi, 'farm-payments')

    const { appRefNum } = await loginAndRunFundingApiJourney({
      username,
      password,
      sbi,
      selectedLandParcel,
      landAction,
      consentRequired
    })
    console.log('App Ref Num: ' + appRefNum)
    await completeSFIJourney(appRefNum, consentRequired, annualPaymentBreakdown)

    const agreementsPageTitle = await CWAgreementsPage.headerH2()
    expect(agreementsPageTitle).toEqual('Customer Agreement Review')
    await CwTasksPage.clickLinkByText('Agreements')
    const agreementIdInitialJourney =
      await CWAgreementsPage.getFirstAgreementReferenceText()
    expect(await CWAgreementsPage.getFirstAgreementStatusText()).toBe('Offered')
    await browser.takeScreenshot()
    await browser.pause(5000)
    console.log(`agreementId :`, agreementIdInitialJourney)

    await completeAgreementJourney()
    await browser.pause(5000)
    await browser.url(browser.options.cwUrl)
    await CWHomePage.clickLinkByText(appRefNum)
    await browser.pause(5000)
    await CwTimelinePage.clickLinkByText('Agreements')
    await browser.pause(5000)
    const agreementIdOnReturn =
      await CWAgreementsPage.getFirstAgreementReferenceText()
    expect(agreementIdInitialJourney).toBe(agreementIdOnReturn)
    expect(await CWAgreementsPage.getFirstAgreementStatusText()).toBe(
      'Accepted'
    )
    await browser.pause(5000)

    await CwTimelinePage.clickLinkByText('Tasks')
    await initiateTerminateSFIJourney()
    await CwTimelinePage.clickLinkByText('Agreements')

    await CWAgreementsPage.waitForAgreementToBeTerminated({
      status: 'Terminated'
    })
    expect(await CWAgreementsPage.getFirstAgreementStatusText()).toBe(
      'Terminated'
    )
    await terminatedAgreementJourney()
  })
})
