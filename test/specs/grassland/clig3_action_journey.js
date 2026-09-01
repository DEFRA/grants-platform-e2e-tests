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

const crn = '1102838829'
test.use({ crn })

test.afterEach(async ({ context }) => {
  await context.clearCookies()
})

test.describe('CLIG3 action journey', () => {
  test('Farmer can apply for CLIG3 action on part available area as the only action', async () => {
    const password = process.env.DEFRA_ID_USER_PASSWORD

    const selectLandParcel = 'SD6843-2122'
    const totalParcelArea = '6.7943'
    const actionOne = 'CLIG3'

    const sbi = '106284736'
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

    await test.step('And selects CLIG3 action and its quantities', async () => {
      await selectLandActionsAndReturnToTasks([{ code: actionOne }])
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
        actions: [{ code: actionOne, quantity: '6.6884' }]
      })
    })
  })
})
