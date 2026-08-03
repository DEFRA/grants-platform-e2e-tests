import { browser, expect } from './test-runtime.js'
import AgreementReviewOfferPage from '../page-objects/agreements.review.offer.page.js'
import AgreementsAcceptYourOfferPage from '../page-objects/agreements.accept.your.offer.page.js'
import AgreementOfferAcceptedPage from '../page-objects/agreements.offer.accepted.page.js'

export async function completeWoodlandAgreementJourney(
  agreementId,
  username,
  password
) {
  // Farmer session is still active from the woodland journey — navigate directly to the agreement
  await browser.url(browser.options.agreementsUrl + agreementId)
  await browser.pause(3000)

  await AgreementReviewOfferPage.selectContinue()
  await browser.pause(2000)
  await AgreementsAcceptYourOfferPage.clickConfirmCheckbox()
  await AgreementsAcceptYourOfferPage.selectAcceptOffer()
  await browser.pause(2000)

  const confirmationText =
    await AgreementOfferAcceptedPage.getConfirmationText()
  expect(confirmationText).toBe('Agreement offer accepted')
  await browser.takeScreenshot()
}
