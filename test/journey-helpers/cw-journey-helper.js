import { browser, expect, $, getPage } from '../utils/test-runtime.js'
import {
  entraLogin,
  isCaseworkerPortalUrl,
  waitForCaseworkerPortalOrLogin
} from './cw-login-helper.js'
import CwBasePage from '../page-objects/cw.base.page.js'
import CwTasksPage from '../page-objects/cw.tasks.page.js'
import CWAgreementsPage from '../page-objects/cw.agreements.page.js'
import { step } from '../utils/report-step.js'

const cwPage = new CwBasePage()

export async function returnWoodlandApplication(appRefNum) {
  await loginToCwAndOpenCase(appRefNum)

  await step('Return application to customer', async () => {
    await CwTasksPage.clickButtonByText('Start')
    await CwTasksPage.selectRadioByValue('ACTION_RETURN_TO_CUSTOMER')

    await CwTasksPage.enterText(
      'ACTION_RETURN_TO_CUSTOMER-comment',
      'Returning Application as more info required'
    )

    await CwTasksPage.clickButtonByText('Confirm')
    await CwTasksPage.selectRadioByValue('yes')
    await CwTasksPage.clickButtonByText('Confirm')
  })

  await step('Assert application status is Returned to customer', async () => {
    await browser.waitUntil(
      async () =>
        (await cwPage.getApplicationStatusText()) === 'Returned to customer',
      {
        timeout: 30000,
        timeoutMsg:
          'Application status did not update to "Returned to customer"'
      }
    )
    expect(await cwPage.getApplicationStatusText()).toBe('Returned to customer')
    await browser.takeScreenshot()
  })
}

export async function createDraftWoodlandAgreement(appRefNum) {
  await loginToCwAndOpenCase(appRefNum)

  await step('Approve draft woodland application', async () => {
    await CwTasksPage.clickButtonByText('Start')
    await CwTasksPage.selectRadioByValue('ACTION_APPROVE_APPLICATION')
    await CwTasksPage.clickButtonByText('Confirm')
  })

  await step('Notify customer that draft agreement is ready', async () => {
    await CwTasksPage.waitForElement(
      'Notify customer that draft agreement is ready'
    )
    await CwTasksPage.handleTask(
      'Notify customer that draft agreement is ready',
      'STATUS_AGREEMENT_SENT_TO_APPLICANT'
    )
  })

  await step('Confirm agreement sent', async () => {
    await CwTasksPage.enterText(
      'ACTION_CONFIRM_AGREEMENT_SENT-comment',
      'Agreement sent to applicant'
    )
    await CwTasksPage.clickButtonByText('Confirm agreement sent')
  })

  return step('Get offered agreement ID', async () => {
    await CwTasksPage.waitForElement('Agreements')
    await CwTasksPage.clickLinkByText('Agreements')
    await browser.pause(2000)
    const agreementId = await CWAgreementsPage.getFirstAgreementReferenceText()
    expect(await CWAgreementsPage.getFirstAgreementStatusText()).toBe('Offered')

    await browser.takeScreenshot()
    return { agreementId }
  })
}

export async function updateCRMAndCompleteForestryCommissionJourney(appRefNum) {
  await step(
    `Open case ${appRefNum} for CRM and Forestry Commission tasks`,
    async () => {
      await browser.url(browser.options.cwUrl)
      await cwPage.clickLinkByText(appRefNum)
      await browser.pause(3000)
      await CwTasksPage.waitForElement('Create CRM record')
    }
  )

  await step('Create CRM record', async () => {
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
  })

  await step('Forward to Forestry Commission', async () => {
    await CwTasksPage.enterText(
      '#ACTION_FORWARD_TO_FC-comment',
      'Forward to Forestry Commission'
    )
    await CwTasksPage.clickButtonByText('Forestry Commission has been notified')
    await browser.pause(2000)
  })

  await step('Record Forestry Commission review outcome', async () => {
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
  })

  await step('Record Forestry Commission outcome', async () => {
    await CwTasksPage.clickButtonByText('Record Forestry Commission outcome')
    await browser.pause(2000)
  })

  await step('Record Forestry Commission review', async () => {
    const eligibleAreaLink = await $('a[href*="TASK_RECORD_ELIGIBLE_AREA"]')
    await eligibleAreaLink.waitForClickable({ timeout: 10000 })
    await eligibleAreaLink.scrollIntoView()
    await eligibleAreaLink.click()
    await browser.pause(2000)

    await CwTasksPage.selectRadioByValue('STATUS_RECORDED')
    await CwTasksPage.enterText(
      '#STATUS_RECORDED-comment',
      'Checked the total eligible area for audit'
    )
    await CwTasksPage.clickButtonByText('Confirm')
    await browser.pause(2000)

    const notifyClaimLink = await $('a[href*="TASK_NOTIFY_READY_TO_CLAIM"]')
    await notifyClaimLink.waitForClickable({ timeout: 10000 })
    await notifyClaimLink.scrollIntoView()
    await notifyClaimLink.click()
    await browser.pause(2000)

    const notificationSent = await $('label=Notification sent')
    await notificationSent.waitForClickable({ timeout: 10000 })
    await notificationSent.click()
    await CwTasksPage.enterText(
      '.govuk-radios__conditional:not(.govuk-radios__conditional--hidden) textarea',
      '65654'
    )
    await CwTasksPage.clickButtonByText('Confirm')
    await browser.pause(2000)

    await CwTasksPage.clickButtonByText('Complete Forestry Commission review')
    await browser.pause(2000)
  })

  await step('Validate case status is updated to Awaiting Claim', async () => {
    await browser.waitUntil(
      async () =>
        (await cwPage.getApplicationStatusText()) === 'Awaiting Claim',
      {
        timeout: 30000,
        timeoutMsg: 'Application status did not update to "Awaiting Claim"'
      }
    )
    expect(await cwPage.getApplicationStatusText()).toBe('Awaiting Claim')
    expect(await cwPage.headerH2()).toBe('Waiting for the customer to claim')
    await browser.takeScreenshot()
  })

  // await step('Approve Forestry Commission review', async () => {
  //   await CwTasksPage.enterText(
  //     '#ACTION_APPROVE_FC_REVIEW-comment',
  //     "Forestry Commission's decision approved"
  //   )
  //   await CwTasksPage.clickButtonByText('Approve Forestry Commission review')
  //   await CwTasksPage.clickButtonByText('Record Forestry Commission outcome')
  //   await browser.pause(2000)
  // })
  //
  // await step('Assert application status is Accepted', async () => {
  //   await browser.pause(2000)
  //   expect(await CWAgreementsPage.headerH2()).toBe('Application completed')
  //   await browser.takeScreenshot()
  // })
  //
  // await step('Assert agreement status is Accepted', async () => {
  //   await CwTasksPage.clickLinkByText('Agreements')
  //   await browser.pause(2000)
  //   expect(await CWAgreementsPage.getFirstAgreementStatusText()).toBe(
  //     'Accepted'
  //   )
  //   await browser.takeScreenshot()
  // })
}

export async function completeWithdrawJourney(appRefNum) {
  await step(`Complete application withdraw ${appRefNum}`, async () => {
    await browser.url(browser.options.cwUrl)
    await cwPage.clickLinkByText(appRefNum)
    await browser.pause(3000)
    await CwTasksPage.enterText(
      '#WITHDRAW_APPLICATION-comment',
      'Withdraw APPLICATION'
    )
    await CwTasksPage.clickButtonByText('Withdraw')
    await browser.pause(2000)
    await CwTasksPage.clickLinkByText('Refresh page')
  })

  await step('Refresh until application status is Withdrawn', async () => {
    await browser.waitUntil(
      async () => {
        try {
          await browser.refresh()
          await browser.pause(1000)

          const heading = await CWAgreementsPage.headerH3()
          console.log('Current heading:', heading)

          return heading === 'Application withdrawn'
        } catch (error) {
          console.log('Unable to verify application status:', error.message)
          return false
        }
      },
      {
        timeout: 60000,
        interval: 2000,
        timeoutMsg:
          'Status did not change to "Application withdrawn" within 60s'
      }
    )
  })

  await step('Assert application status is Withdrawn', async () => {
    await browser.pause(2000)
    expect(await CWAgreementsPage.headerH3()).toBe('Application withdrawn')
    await browser.takeScreenshot()
  })

  await step('Assert agreement status is Withdrawn', async () => {
    await CwTasksPage.clickLinkByText('Agreements')
    await browser.pause(2000)
    expect(await CWAgreementsPage.getFirstAgreementStatusText()).toBe(
      'Withdrawn'
    )
    await browser.takeScreenshot()

    const page = getPage()

    const [newTab] = await Promise.all([
      page.context().waitForEvent('page'),
      CwTasksPage.clickLinkByText('View agreement')
    ])

    await newTab.waitForLoadState('domcontentloaded')

    await browser.switchToWindow(newTab)

    console.log('New tab URL:', newTab.url())

    await browser.pause(2000)

    expect(await CWAgreementsPage.headerH2text()).toBe(
      'This agreement offer has been withdrawn'
    )
  })
}

export async function loginToCwAndOpenCase(appRefNum) {
  return step(
    `Login to caseworker portal and open case ${appRefNum}`,
    async () => {
      await browser.url(browser.options.cwUrl)
      await waitForCaseworkerPortalOrLogin()

      const cwUsername = process.env.ENTRA_ID_ADMIN_USER
      const cwPassword = process.env.ENTRA_ID_USER_PASSWORD
      await entraLogin(cwUsername, cwPassword)

      await browser.waitUntil(
        async () => isCaseworkerPortalUrl(await browser.getUrl()),
        {
          timeout: 60000,
          timeoutMsg: 'Caseworker portal did not load after login'
        }
      )

      await browser.waitUntil(
        async () => {
          try {
            const isVisible = await cwPage.waitUntilVisible(appRefNum, 5000)

            if (isVisible) {
              return true
            }

            // Case not displayed - reload and try again
            await browser.refresh()
            await browser.pause(1000)

            return false
          } catch (error) {
            // If the case isn't found, reload and try again
            await browser.refresh()
            await browser.pause(1000)

            return false
          }
        },
        {
          timeout: 60000,
          interval: 3000,
          timeoutMsg: `Case "${appRefNum}" was not found in caseworker portal after waiting 60 seconds`
        }
      )

      await browser.pause(2000)
      await cwPage.clickLinkByText(appRefNum)
      await browser.pause(5000)
    }
  )
}

/**
 * Open the Application tab and verify parcel actions and quantities.
 */
export async function verifyCaseApplicationActions({ parcelId, actions }) {
  await cwPage.clickApplicationTab()
  await cwPage.verifyParcelActions(parcelId, actions)
}
