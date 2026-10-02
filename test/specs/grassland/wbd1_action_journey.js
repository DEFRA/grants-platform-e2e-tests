import { test } from '../../fixtures/base.fixture.js'
import {
  loginAndCompleteGrasslandTasklistQuestions,
  selectLandParcelAndVerifyOnActionsPage,
  selectLandActionsAndReturnToTasks,
  checkAnswersAndSubmitApplication
} from '../../journey-helpers/grassland-journey-helper.js'
import Backend from '../../utils/backend.js'
import {
  loginToCwAndOpenCase,
  verifyCaseApplicationActions
} from '~/test/journey-helpers/cw-journey-helper.js'

const crn = '1106298365'
test.use({ crn })

test.afterEach(async ({ context }) => {
  await context.clearCookies()
})

test.describe('WBD1 action journey', () => {
  test('Farmer can apply for WBD1 action on part available area as the only action', async () => {
    const password = process.env.DEFRA_ID_USER_PASSWORD

    const selectLandParcel = 'NU0001-6274'
    const totalParcelArea = '12.4986'
    const actionOne = 'WBD1'
    const actionOneArea = '2'

    const sbi = '106480734'
    await Backend.clearTestData(sbi, 'grasslands')
    console.log('Grassland application state cleared')

    await test.step('Farmer completes Check before you start task list questions on grasslands', async () => {
      await loginAndCompleteGrasslandTasklistQuestions({
        username: crn,
        password
      })
    })

    await test.step('And selects the land parcel and verifies it on the actions page', async () => {
      await selectLandParcelAndVerifyOnActionsPage({
        parcelId: selectLandParcel,
        areaHa: totalParcelArea
      })
    })

    await test.step('And selects WBD1 action and its quantities', async () => {
      await selectLandActionsAndReturnToTasks([
        { code: actionOne, quantity: actionOneArea }
      ])
    })

    const { appRefNum } =
      await test.step('And checks answers then submits the application', async () => {
        return checkAnswersAndSubmitApplication()
      })

    await test.step('Then Case Worker can see the submitted application with parcel and actions', async () => {
      console.log('Application reference number: ' + appRefNum)
      await loginToCwAndOpenCase(appRefNum)
      await verifyCaseApplicationActions({
        parcelId: selectLandParcel,
        actions: [{ code: actionOne, quantity: actionOneArea }]
      })
    })
  })
})
