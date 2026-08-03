import { browser, expect, $ } from './test-runtime.js'
import { entraLogin } from '../utils/cw-login-helper.js'
import CwBasePage from '../page-objects/cw.base.page.js'
import CwTasksPage from '../page-objects/cw.tasks.page.js'
import CWAgreementsPage from '../page-objects/cw.agreements.page.js'

const cwPage = new CwBasePage()

export async function completeWoodlandJourney(appRefNum) {
  await loginToCwAndOpenCase(appRefNum)

  // ── Reviewing Application ──────────────────────────────────────────────────
  await CwTasksPage.clickButtonByText('Start')
  await CwTasksPage.selectRadioByValue('ACTION_APPROVE_APPLICATION')
  await CwTasksPage.clickButtonByText('Confirm')

  // Wait for 'Notify customer that draft agreement is ready' task to appear
  await CwTasksPage.waitForElement(
    'Notify customer that draft agreement is ready'
  )

  // Notify customer that draft agreement is ready → Send
  await CwTasksPage.handleTask(
    'Notify customer that draft agreement is ready',
    'STATUS_AGREEMENT_SENT_TO_APPLICANT'
  )

  // Confirm agreement sent
  await CwTasksPage.enterText(
    'ACTION_CONFIRM_AGREEMENT_SENT-comment',
    'Agreement sent to applicant'
  )
  await CwTasksPage.clickButtonByText('Confirm agreement sent')

  // Navigate to Agreements tab and get agreement ID
  await CwTasksPage.waitForElement('Agreements')
  await CwTasksPage.clickLinkByText('Agreements')
  await browser.pause(2000)
  const agreementId = await CWAgreementsPage.getFirstAgreementReferenceText()
  expect(await CWAgreementsPage.getFirstAgreementStatusText()).toBe('Offered')

  await browser.takeScreenshot()
  return { agreementId }
}

export async function completeWoodlandFCJourney(appRefNum) {
  // Navigate back to the case (CW session still active)
  await browser.url(browser.options.cwUrl)
  await cwPage.clickLinkByText(appRefNum)
  await browser.pause(3000)

  // Wait for Create CRM record task to appear
  await CwTasksPage.waitForElement('Create CRM record')

  // Create CRM record task
  const crmRecordLink = await $('a[href*="TASK_CRM_RECORD_CREATION"]')
  await crmRecordLink.waitForClickable({ timeout: 10000 })
  await crmRecordLink.scrollIntoView()
  await crmRecordLink.click()
  await browser.pause(2000)
  await CwTasksPage.selectRadioByValue('STATUS_CRM_RECORD_CREATED')
  await CwTasksPage.enterText(
    '#STATUS_CRM_RECORD_CREATED-comment',
    'Create a CRM record for this application'
  )
  await CwTasksPage.clickButtonByText('Confirm')
  await browser.pause(2000)

  // Forward to FC
  await CwTasksPage.enterText(
    '#ACTION_FORWARD_TO_FC-comment',
    'Forward to Forestry Commission'
  )
  await CwTasksPage.clickButtonByText('Forestry Commission has been notified')
  await browser.pause(2000)

  // FC Review task
  const fcReviewLink = await $('a[href*="TASK_FC_REVIEW_OUTCOME"]')
  await fcReviewLink.waitForClickable({ timeout: 10000 })
  await fcReviewLink.scrollIntoView()
  await fcReviewLink.click()
  await browser.pause(2000)
  await CwTasksPage.selectRadioByValue('STATUS_FC_REVIEW_SUCCESSFUL')
  await CwTasksPage.enterText(
    '#STATUS_FC_REVIEW_SUCCESSFUL-comment',
    'The Forestry Commission has completed their review of the application'
  )
  await CwTasksPage.clickButtonByText('Confirm')
  await browser.pause(2000)

  // FC Approve
  await CwTasksPage.enterText(
    '#ACTION_APPROVE_FC_REVIEW-comment',
    "Forestry Commission's decision approved"
  )
  await CwTasksPage.clickButtonByText('Approve Forestry Commission review')
  await browser.pause(2000)

  // Verify agreement status is Accepted on the Agreements tab
  await CwTasksPage.clickLinkByText('Agreements')
  await browser.pause(2000)
  expect(await CWAgreementsPage.getFirstAgreementStatusText()).toBe('Accepted')

  await browser.takeScreenshot()
}

async function loginToCwAndOpenCase(appRefNum) {
  await browser.url(browser.options.cwUrl)
  const cwUsername = process.env.ENTRA_ID_ADMIN_USER
  const cwPassword = process.env.ENTRA_ID_USER_PASSWORD
  await entraLogin(cwUsername, cwPassword)

  const isReferenceInTable = await cwPage.waitUntilVisible(appRefNum)
  await expect(isReferenceInTable).toBe(true)

  await browser.pause(2000)
  await cwPage.clickLinkByText(appRefNum)
  await browser.pause(5000)
}
