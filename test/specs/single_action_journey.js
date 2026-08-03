import { test, expect } from '../fixtures/base.fixture.js'
import { browser } from '../utils/test-runtime.js'
import { loginAndRunFundingApiJourney } from '../utils/land-grants-journey-helper.js'
import CWHomePage from '../page-objects/cw.home.page.js'
import CwTasksPage from '../page-objects/cw.tasks.page.js'
import CwTimelinePage from '../page-objects/cw.timeline.page.js'
import CWAgreementsPage from '../page-objects/cw.agreements.page.js'
import Backend from '../utils/backend.js'
import { completeSFIJourney } from '../utils/cw-journey-helper.js'
import { completeAgreementJourney } from '../utils/agreement-journey-helper.js'
import {
  clearExistingPayments,
  runGpsPaymentChecks
} from '../utils/gps_payment_helper.js'

test.afterEach(async ({ context }) => {
  await context.clearCookies()
})

test.describe('SFI Application E2E Tests for a normal land parcel with single action and no consent', () => {
  test('The farmer is able to complete the SFI application', async () => {
    const username = '1103623923'
    const sbi = '107365747'
    const selectedLandParcel = 'SD7858-1059'
    const landAction = 'CMOR1'
    const annualPaymentBreakdown =
      '£287.09 ( 1.4236 ha x £10.60 per ha, £272.00 per SFI agreement per year )'
    const expectedTotalParcelArea = '1.4236'
    const expectedAnnualPaymentValue = '£287.09'
    const consentRequired = false
    const password = process.env.DEFRA_ID_USER_PASSWORD
    await Backend.clearTestData(sbi, 'farm-payments')
    await clearExistingPayments(sbi)
    await browser.pause(5000)
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

    await CWAgreementsPage.viewAndValidateAgreementInNewTab({
      expectedTotalParcelArea,
      expectedAnnualPaymentValue
    })
    await browser.pause(10000)
    await runGpsPaymentChecks(sbi)
  })
})
