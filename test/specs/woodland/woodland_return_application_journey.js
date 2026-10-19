import { test } from '../../fixtures/base.fixture.js'
import {
  updateCRMAndCompleteForestryCommissionJourney,
  createDraftWoodlandAgreement,
  returnWoodlandApplication,
  checkApplicationStatusOnCW
} from '../../journey-helpers/cw-journey-helper.js'
import {
  loginAndRunWoodlandManagementJourney,
  loginAndUpdateWoodlandApplication,
  submitClaimForWoodlandApplication
} from '../../journey-helpers/woodland-journey-helper.js'
import Backend from '../../utils/backend.js'
import { completeWoodlandAgreementJourney } from '../../journey-helpers/agreement-journey-helper.js'
import { approveClaimAsGrantsPlatformAdministrator } from '~/test/journey-helpers/grants-platform-admin-helper.js'
import { claimsStep } from '~/test/utils/featureFlags.js'
import { runGpsPaymentChecksForWMP } from '~/test/utils/gps_payment_helper.js'

const crn = '1106298365'
test.use({ crn })

test.afterEach(async ({ context }) => {
  await context.clearCookies()
})

test.describe('Return Application; decrease area and hence the payment value', () => {
  test('The case worked is able to return the  application back', async () => {
    const password = process.env.DEFRA_ID_USER_PASSWORD

    const woodlandApplicationData = {
      landParcelIdOne: 'NT8701-9412',
      landParcelIdTwo: ' NT8108-1434',
      WoodlandAreaTenOrOverYearsOld: 500,
      WoodlandAreaUnderTenYearsOld: 20,
      centreGridReference: 'SP 4178 2432',
      woodlandName: 'Ashbrook WD',
      fcTeamCodeId: 'fcTeamCode-2'
    }

    const sbi = '106480734'
    const code = 'woodland'
    const expectedPaymentAmount = 1530
    let agreementId
    const initialExpectedPaymentAmount = 9300
    const revisedExpectedPaymentAmount = 1530

    await Backend.clearTestData(sbi, 'woodland')
    console.log('woodland application state cleared')

    const { appRefNum } =
      await test.step('Farmer submits the woodland Application', async () => {
        return loginAndRunWoodlandManagementJourney({
          username: crn,
          password,
          applicationData: woodlandApplicationData,
          initialExpectedPaymentAmount
        })
      })

    await test.step('Case Worked return the application back to farmer', async () => {
      console.log('App Ref Num: ' + appRefNum)
      await returnWoodlandApplication(appRefNum)
    })

    const updatedWoodlandApplicationData = {
      landParcelIdOne: 'NT8701-9412',
      WoodlandAreaTenOrOverYearsOld: 50,
      WoodlandAreaUnderTenYearsOld: 1,
      centreGridReference: 'SP 4178 2432',
      woodlandName: 'Ashbrook WD',
      fcTeamCodeId: 'fcTeamCode-2'
    }

    const totalAreaForClaim =
      Number(
        updatedWoodlandApplicationData.WoodlandAreaTenOrOverYearsOld ?? 0
      ) +
      Number(updatedWoodlandApplicationData.WoodlandAreaUnderTenYearsOld ?? 0)

    const { newAppRefNum } =
      await test.step('Farmer updates the application with reduced area and resubmit', async () => {
        return loginAndUpdateWoodlandApplication({
          username: crn,
          password,
          applicationData: updatedWoodlandApplicationData,
          revisedExpectedPaymentAmount
        })
      })

    await test.step('Case worker creates a draft agreement', async () => {
      console.log('App Ref Num: ' + newAppRefNum)
      const createdAgreement = await createDraftWoodlandAgreement(newAppRefNum)
      agreementId = createdAgreement.agreementId
      console.log('Agreement ID: ' + agreementId)
    })

    await test.step('Farmer reviews and accepts the offer agreement sent to them by Case working team', async () => {
      await completeWoodlandAgreementJourney(agreementId, code, crn, password)
    })

    await test.step('Case worker updates CRM and Forestry Commission completes the review process', async () => {
      await updateCRMAndCompleteForestryCommissionJourney(newAppRefNum)
    })

    await claimsStep(
      test,
      'Grants Platform Administrator approves the claim',
      async () => {
        await approveClaimAsGrantsPlatformAdministrator(
          newAppRefNum,
          totalAreaForClaim
        )
      }
    )

    await claimsStep(
      test,
      'As a farmer you make a claim for Woodlands application',
      async () => {
        await submitClaimForWoodlandApplication(newAppRefNum)
      }
    )

    await claimsStep(
      test,
      'Grants Payment Service is able to send payment details to Payment Hub',
      async () => {
        await runGpsPaymentChecksForWMP(sbi, expectedPaymentAmount)
      }
    )

    await claimsStep(
      test,
      'Application status on CW should be Claim complete',
      async () => {
        console.log('App Ref Num: ' + newAppRefNum)
        await checkApplicationStatusOnCW(newAppRefNum, 'Claim Completed')
      }
    )
  })
})
