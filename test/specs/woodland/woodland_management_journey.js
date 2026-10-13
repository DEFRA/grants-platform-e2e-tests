import { test } from '../../fixtures/base.fixture.js'
import {
  createDraftWoodlandAgreement,
  updateCRMAndCompleteForestryCommissionJourney
} from '../../journey-helpers/cw-journey-helper.js'
import {
  loginAndRunWoodlandManagementJourney,
  submitClaimForWoodlandApplication
} from '../../journey-helpers/woodland-journey-helper.js'
import { completeWoodlandAgreementJourney } from '../../journey-helpers/agreement-journey-helper.js'
import { approveClaimAsGrantsPlatformAdministrator } from '../../journey-helpers/grants-platform-admin-helper.js'
import {
  clearExistingPayments,
  runGpsPaymentChecks
} from '../../utils/gps_payment_helper.js'
import Backend from '../../utils/backend.js'

const crn = '1106298365'
test.use({ crn })

test.afterEach(async ({ context }) => {
  await context.clearCookies()
})

test.describe('Woodland Management Plan Claim Journey', () => {
  test('The farmer is able to complete the claim process for WMP', async () => {
    const password = process.env.DEFRA_ID_USER_PASSWORD

    const woodlandApplicationData = {
      landParcelId: 'NT8701-9412',
      hectaresTenOrOverYearsOld: 50,
      centreGridReference: 'SP 4178 2432',
      woodlandName: 'Ashbrook WD',
      fcTeamCodeId: 'fcTeamCode-2'
    }

    const sbi = '106480734'
    const code = 'woodland'
    let agreementId

    await Backend.clearTestData(sbi, 'woodland')
    console.log('woodland application state cleared')
    await clearExistingPayments(sbi)
    console.log('Existing payments cleared')

    const { appRefNum } =
      await test.step('Farmer submits the woodland Application', async () => {
        return loginAndRunWoodlandManagementJourney({
          username: crn,
          password,
          applicationData: woodlandApplicationData
        })
      })

    await test.step('Case worker creates a draft agreement', async () => {
      console.log('App Ref Num: ' + appRefNum)
      const createdAgreement = await createDraftWoodlandAgreement(appRefNum)
      agreementId = createdAgreement.agreementId
      console.log('Agreement ID: ' + agreementId)
    })

    await test.step('Farmer reviews and accepts the offer agreement sent to them by Case working team', async () => {
      await completeWoodlandAgreementJourney(agreementId, code, crn, password)
    })

    await test.step('Case worker updates CRM and Forestry Commission completes the review process', async () => {
      await updateCRMAndCompleteForestryCommissionJourney(appRefNum)
    })

    await test.step('Grants Platform Administrator approves the claim', async () => {
      await approveClaimAsGrantsPlatformAdministrator(appRefNum)
    })

    await test.step('As a farmer you make a claim for Woodlands application', async () => {
      await submitClaimForWoodlandApplication(appRefNum)
    })

    await test.step('Grants Payment Service is able to send payment details to Payment Hub', async () => {
      await runGpsPaymentChecks(sbi)
    })
  })
})
