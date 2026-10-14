import { browser, expect } from '../utils/test-runtime.js'
import AgreementReviewOfferPage from '../page-objects/agreements.review.offer.page.js'
import AgreementsAcceptYourOfferPage from '../page-objects/agreements.accept.your.offer.page.js'
import AgreementOfferAcceptedPage from '../page-objects/agreements.offer.accepted.page.js'
import { step } from '../utils/report-step.js'
import cwAgreementsPage from '../page-objects/cw.agreements.page.js'

export async function completeWoodlandAgreementJourney(
  agreementId,
  code,
  username,
  password
) {
  await step(`Open agreement ${agreementId} for ${code}`, async () => {
    await browser.url(browser.options.agreementsUrl + code)
    await browser.pause(3000)
  })

  await step('Review offer and continue', async () => {
    await AgreementReviewOfferPage.selectContinue()
    await browser.pause(2000)
  })

  await step('Accept the agreement offer', async () => {
    await AgreementsAcceptYourOfferPage.clickConfirmCheckbox()
    await AgreementsAcceptYourOfferPage.selectAcceptOffer()
    await browser.pause(2000)
  })

  await step('Confirm agreement offer accepted', async () => {
    const confirmationText =
      await AgreementOfferAcceptedPage.getConfirmationText()
    expect(confirmationText).toBe('Agreement offer accepted')
    await browser.takeScreenshot()
  })
}

export async function checkAgreementIsWithdraw(
  agreementId,
  code,
  username,
  password
) {
  await step(`Open agreement ${agreementId} for ${code}`, async () => {
    await browser.url(browser.options.agreementsUrl + 'agreement')
    await browser.pause(3000)
  })

  await step(
    `Assert agreement status is Withdrawn ${agreementId}`,
    async () => {
      await browser.pause(2000)
      expect(await cwAgreementsPage.headerH2text()).toBe(
        'This agreement offer has been withdrawn'
      )

      expect(await cwAgreementsPage.getAgreementNumber()).toBe(agreementId)

      await browser.takeScreenshot()

      cwAgreementsPage.clickLinkByText(
        'View and print your withdrawn agreement (opens in new tab)'
      )

      await browser.pause(2000)
      expect(await cwAgreementsPage.headerH2text()).toBe(
        'This agreement offer has been withdrawn'
      )
    }
  )
}
