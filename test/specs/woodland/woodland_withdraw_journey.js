import { test } from '../../fixtures/base.fixture.js'
import {
  completeWoodlandJourney,
  completeWithdrawJourney
} from '../../journey-helpers/cw-journey-helper.js'
import { loginAndRunWoodlandManagementJourney } from '../../journey-helpers/woodland-journey-helper.js'
import { checkAgreementIsWithdraw } from '../../journey-helpers/agreement-journey-helper.js'
import Backend from '../../utils/backend.js'

const crn = '1106298365'
test.use({ crn })

test.afterEach(async ({ context }) => {
  await context.clearCookies()
})

test.describe('Woodland Management Plan Happy E2E path', () => {
  test('Casework able to  withdraw the application after agreement is generated', async () => {
    const password = process.env.DEFRA_ID_USER_PASSWORD

    const woodlandApplicationData = {
      landParcelId: 'NT8701-9412',
      hectaresTenOrOverYearsOld: 50,
      centreGridReference: 'SP 4178 2432',
      woodlandName: 'Ashbrook WD',
      fcTeamCodeId: 'fcTeamCode-2'
    }

    const sbi = '106480734'
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

    await test.step('CW approves the application along with Agreement and the Forestry Commission journey', async () => {
      console.log('App Ref Num: ' + appRefNum)
      const { agreementId } = await completeWoodlandJourney(appRefNum)
      const code = 'woodland'

      await completeWithdrawJourney(appRefNum)

      await checkAgreementIsWithdraw(agreementId, code, crn, password)
    })
  })
})
