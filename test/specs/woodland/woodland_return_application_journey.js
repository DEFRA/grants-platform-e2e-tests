import { test } from '../../fixtures/base.fixture.js'
import {
  updateCRMAndCompleteForestryCommissionJourney,
  createDraftWoodlandAgreement,
  returnWoodlandApplication
} from '../../journey-helpers/cw-journey-helper.js'
import {
  loginAndRunWoodlandManagementJourney,
  loginAndUpdateWoodlandApplication,
  submitClaimForWoodlandApplication
} from '../../journey-helpers/woodland-journey-helper.js'
import Backend from '../../utils/backend.js'
import { completeWoodlandAgreementJourney } from '../../journey-helpers/agreement-journey-helper.js'
import { approveClaimAsGrantsPlatformAdministrator } from '~/test/journey-helpers/grants-platform-admin-helper.js'

const crn = '1106298365'
test.use({ crn })

test.afterEach(async ({ context }) => {
  await context.clearCookies()
})

test.describe('Return Application', () => {
  test('The case worked is able to return the  application back', async () => {
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

    const { appRefNum } =
      await test.step('Farmer submits the woodland Application', async () => {
        return loginAndRunWoodlandManagementJourney({
          username: crn,
          password,
          applicationData: woodlandApplicationData
        })
      })

    await test.step('Case Worked return the application back to farmer', async () => {
      console.log('App Ref Num: ' + appRefNum)
      await returnWoodlandApplication(appRefNum)
    })

    const updatedWoodlandApplicationData = {
      landParcelId: 'NT8701-9412',
      hectaresTenOrOverYearsOld: 35,
      centreGridReference: 'SP 4178 2432',
      woodlandName: 'Ashbrook WD',
      fcTeamCodeId: 'fcTeamCode-2'
    }

    const { newAppRefNum } =
      await test.step('Farmer updates the application and resubmit', async () => {
        return loginAndUpdateWoodlandApplication({
          username: crn,
          password,
          applicationData: updatedWoodlandApplicationData
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

    await test.step('Grants Platform Administrator approves the claim', async () => {
      await approveClaimAsGrantsPlatformAdministrator(newAppRefNum)
    })

    await test.step('As a farmer you make a claim for Woodlands application', async () => {
      await submitClaimForWoodlandApplication(newAppRefNum)
    })
  })
})
