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
  runGpsPaymentChecksForWMP
} from '../../utils/gps_payment_helper.js'
import Backend from '../../utils/backend.js'

const crn = '1103171356'
test.use({ crn })

test.afterEach(async ({ context }) => {
  await context.clearCookies()
})

test.describe('WMP UAT Scenario 8', () => {
  test('The farmer is able to complete the claim process for WMP', async () => {
    const password = process.env.DEFRA_ID_USER_PASSWORD

    const woodlandApplicationData = {
      landParcelIdOne: 'SD8545-7357',
      landParcelIdTwo: 'SD8645-3465',
      landParcelIdThree: 'SD8645-0948',
      WoodlandAreaTenOrOverYearsOld: 15,
      WoodlandAreaUnderTenYearsOld: 6.1667,
      centreGridReference: 'SP 4178 2438',
      woodlandName: 'Ashbrook WZ',
      fcTeamCodeId: 'fcTeamCode-2'
    }

    const sbi = '107214733'
    const code = 'woodland'
    const expectedPaymentAmount = 1500
    const totalAreaForClaim =
      Number(woodlandApplicationData.WoodlandAreaTenOrOverYearsOld ?? 0) +
      Number(woodlandApplicationData.WoodlandAreaUnderTenYearsOld ?? 0)
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
          applicationData: woodlandApplicationData,
          expectedPaymentAmount
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
      await approveClaimAsGrantsPlatformAdministrator(
        appRefNum,
        totalAreaForClaim
      )
    })

    await test.step('As a farmer you make a claim for Woodlands application', async () => {
      await submitClaimForWoodlandApplication(appRefNum)
    })

    await test.step('Grants Payment Service is able to send payment details to Payment Hub', async () => {
      await runGpsPaymentChecksForWMP(sbi, expectedPaymentAmount)
    })
  })
})
