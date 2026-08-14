import { test } from '../../fixtures/base.fixture.js'
import {
  loginAndCompleteGrasslandCheckBeforeYouStartQuestions,
  selectLandParcelAndVerifyOnActionsPage,
  selectLandActionsAndReturnToTasks,
  checkAnswersAndSubmitApplication
} from '../../journey-helpers/grassland-journey-helper.js'
import Backend from '../../utils/backend.js'

test.afterEach(async ({ context }) => {
  await context.clearCookies()
})

test.describe('Multi actions journey', () => {
  test('The farmer can apply for multiple actions on selected land parcel', async () => {
    const testUser = {
      username: '1102838829',
      password: process.env.DEFRA_ID_USER_PASSWORD
    }

    const selectLandParcel = 'SD6843-2122'
    const totalParcelArea = '6.7943'
    const actionOne = 'CSAM3'
    const actionOneArea = '3'
    const actionTwo = 'SCR2'
    const actionTwoArea = '2'
    const actionThree = 'CLIG3'

    const { username, password } = testUser
    const sbi = '106284736'
    await Backend.clearTestData(sbi, 'grasslands')
    console.log('Grassland application state cleared')

    await test.step('Farmer completes Check before you start task list questions on grasslands', async () => {
      await loginAndCompleteGrasslandCheckBeforeYouStartQuestions({
        username,
        password
      })
    })

    await test.step('And selects the land parcel and verifies it on the actions page', async () => {
      await selectLandParcelAndVerifyOnActionsPage({
        parcelId: selectLandParcel,
        areaHa: totalParcelArea
      })
    })

    await test.step('And selects multiple actions and its quantities', async () => {
      await selectLandActionsAndReturnToTasks([
        { code: actionOne, quantity: actionOneArea },
        { code: actionTwo, quantity: actionTwoArea },
        { code: actionThree }
      ])
    })

    await test.step('And checks answers then submits the application', async () => {
      await checkAnswersAndSubmitApplication()
    })
  })
})
