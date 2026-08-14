import { test } from '../../fixtures/base.fixture.js'
import {
  completeWoodlandJourney,
  completeWoodlandFCJourney
} from '../../journey-helpers/cw-journey-helper.js'
import { loginAndRunWoodlandManagementJourney } from '../../journey-helpers/woodland-journey-helper.js'
import { completeWoodlandAgreementJourney } from '../../journey-helpers/agreement-journey-helper.js'
import Backend from '../../utils/backend.js'

test.afterEach(async ({ context }) => {
  await context.clearCookies()
})

test.describe('Woodland Management Plan Happy E2E path', () => {
  test('The farmer is able to complete the woodland Management Plan application', async () => {
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

    await test.step('CW approves the application along with Agreement and the Forestry Commission journey', async () => {
      console.log('App Ref Num: ' + appRefNum)
      const { agreementId } = await completeWoodlandJourney(appRefNum)

      console.log('Agreement ID: ' + agreementId)
      await completeWoodlandAgreementJourney(agreementId, username, password)

      await completeWoodlandFCJourney(appRefNum)
    })
  })
})
