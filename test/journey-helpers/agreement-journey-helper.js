import { browser, expect } from '../utils/test-runtime.js'
import AgreementReviewOfferPage from '../page-objects/agreements.review.offer.page.js'
import AgreementsAcceptYourOfferPage from '../page-objects/agreements.accept.your.offer.page.js'
import AgreementOfferAcceptedPage from '../page-objects/agreements.offer.accepted.page.js'
import { step } from '../utils/report-step.js'

export async function completeWoodlandAgreementJourney(
  agreementId,
  username,
  password
) {
  await step(`Open agreement ${agreementId}`, async () => {
    await browser.url(browser.options.agreementsUrl + agreementId)
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
