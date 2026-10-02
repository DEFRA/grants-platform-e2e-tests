import { test } from '../../fixtures/base.fixture.js'
import {
  loginAndCompleteGrasslandTasklistQuestions,
  selectLandParcelAndVerifyOnActionsPage,
  verifyActionNotAvailableOnActionsPage
} from '../../journey-helpers/grassland-journey-helper.js'
import Backend from '../../utils/backend.js'

const crn = '1103313150'
test.use({ crn })

test.afterEach(async ({ context }) => {
  await context.clearCookies()
})

test.describe('CNUM2 action', { tag: '@ext-test' }, () => {
  test('Farmer cannot apply for CNUM2 action, when he has an existing incompatible action CLIG3 on the same land parcel', async () => {
    const password = process.env.DEFRA_ID_USER_PASSWORD

    const selectLandParcel = 'SK0971-5761'
    const totalParcelArea = '0.6116'
    const actionOne = 'CNUM2'

    const sbi = '106514040'
    await Backend.clearTestData(sbi, 'grasslands')
    console.log('Grassland application state cleared')

    await test.step('Farmer completes the task list questions', async () => {
      await loginAndCompleteGrasslandTasklistQuestions({
        username: crn,
        password
      })
    })

    await test.step('Then the farmer is not shown the action that is incompatible with existing agreement', async () => {
      await selectLandParcelAndVerifyOnActionsPage({
        parcelId: selectLandParcel,
        areaHa: totalParcelArea
      })
      await verifyActionNotAvailableOnActionsPage(actionOne)
    })
  })
})
