import { test, expect } from '../fixtures/base.fixture.js'
import { browser } from '../utils/test-runtime.js'
import { loginAndRunFundingApiJourney } from '../utils/land-grants-journey-helper.js'
import CWHomePage from '../page-objects/cw.home.page.js'
import CwTimelinePage from '../page-objects/cw.timeline.page.js'
import CWAgreementsPage from '../page-objects/cw.agreements.page.js'
import Backend from '../utils/backend.js'
import { isEnvTrue } from '../utils/env-flags.js'
import { completeSFIJourney } from '../utils/cw-journey-helper.js'
import { completeAgreementJourney } from '../utils/agreement-journey-helper.js'
import CwTasksPage from '../page-objects/cw.tasks.page.js'

test.afterEach(async ({ context }) => {
  await context.clearCookies()
})

const heferEnabled = isEnvTrue('ENABLE_LAND_GRANT_HEFER_20260219')
const heferDescribe = heferEnabled ? test.describe : test.describe.skip

heferDescribe('SFI Application E2E Tests with HEFER consent @hefer', () => {
  test('The farmer is able to complete the SFI application', async () => {
    const username = '1106298365'
    const sbi = '106480734'
    const selectedLandParcel = 'NT8109-6898'
    const landAction = 'CMOR1'
    const annualPaymentBreakdown =
      '£272.84 ( 0.0795 ha x £10.60 per ha, £272.00 per SFI agreement per year )'
    const expectedTotalParcelArea = '0.0795'
    const expectedAnnualPaymentValue = '£272.84'
    const consentRequired = true
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
    await completeSFIJourney(appRefNum, false, annualPaymentBreakdown)
    const agreementsPageTitle = await CWAgreementsPage.headerH2()
    expect(agreementsPageTitle).toEqual('Customer Agreement Review')
    await CwTasksPage.clickLinkByText('Agreements')
    const agreementIdInitialJourney =
      await CWAgreementsPage.getFirstAgreementReferenceText()
    expect(await CWAgreementsPage.getFirstAgreementStatusText()).toBe('Offered')
    await browser.takeScreenshot()
    await browser.pause(5000)
    console.log(`agreementId :`, agreementIdInitialJourney)

    await completeAgreementJourney('hefer')
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
  })
})
