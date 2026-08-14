import { test } from '../../fixtures/base.fixture.js'
import {
  completeWoodlandFCJourney,
  completeWoodlandJourney,
  returnWoodlandApplication
} from '../../journey-helpers/cw-journey-helper.js'
import {
  loginAndRunWoodlandManagementJourney,
  loginAndUpdateWoodlandApplication
} from '../../journey-helpers/woodland-journey-helper.js'
import Backend from '../../utils/backend.js'
import { completeWoodlandAgreementJourney } from '../../journey-helpers/agreement-journey-helper.js'

test.afterEach(async ({ context }) => {
  await context.clearCookies()
})

test.describe('Return Application', () => {
  test('The case worked is able to return the  application back', async () => {
    const testUser = {
      username: '1106298365',
      password: process.env.DEFRA_ID_USER_PASSWORD
    }

    const woodlandApplicationData = {
      landParcelId: 'NT8701-9412',
      hectaresTenOrOverYearsOld: 50,
      centreGridReference: 'SP 4178 2432',
      woodlandName: 'Ashbrook WD',
      fcTeamCodeId: 'fcTeamCode-2'
    }

    const { username, password } = testUser
    const sbi = '106480734'
    await Backend.clearTestData(sbi, 'woodland')
    console.log('woodland application state cleared')

    const { appRefNum } =
      await test.step('Farmer submits the woodland Application', async () => {
        return loginAndRunWoodlandManagementJourney({
          username,
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
          username,
          password,
          applicationData: updatedWoodlandApplicationData
        })
      })

    await test.step('CW approves the application along with the Forestry Commission journey', async () => {
      console.log('New appRefNum: ' + newAppRefNum)
      const { agreementId } = await completeWoodlandJourney(newAppRefNum)

      console.log('Agreement ID: ' + agreementId)
      await completeWoodlandAgreementJourney(agreementId, username, password)

      await completeWoodlandFCJourney(newAppRefNum)
    })
  })
})
