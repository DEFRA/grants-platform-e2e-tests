import { browser, expect } from './test-runtime.js'
import AgreementReviewOfferPage from '../page-objects/agreements.review.offer.page.js'
import AgreementsAcceptYourOfferPage from '../page-objects/agreements.accept.your.offer.page.js'
import AgreementOfferAcceptedPage from '../page-objects/agreements.offer.accepted.page.js'
import AgreementsTerminateOfferPage from '../page-objects/agreements.terminate-offer.page.js'
import * as constants from './constants.js'
import dayjs from 'dayjs'

const consentConfig = {
  ssi: {
    heading: constants.SSSI_ONLY_HEADING
  },
  hefer: {
    heading: constants.HEFER_ONLY_HEADING
  }
}

export async function completeAgreementJourney(consent) {
  // Agreements - Farmer Accepts Offer
  await browser.url(browser.options.agreementsUrl)
  await browser.pause(5000)

  await AgreementReviewOfferPage.selectContinue()
  await AgreementsAcceptYourOfferPage.clickConfirmCheckbox()
  await AgreementsAcceptYourOfferPage.selectAcceptOffer()

  const confirmationText =
    await AgreementOfferAcceptedPage.getConfirmationText()
  expect(confirmationText).toBe('Agreement offer accepted')

  const config = consentConfig[consent]

  if (config) {
    const heading = await AgreementOfferAcceptedPage.getSectionHeading(
      config.heading
    )
    await expect(heading).toBeDisplayed()
  }

  await browser.takeScreenshot()
}

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

export async function terminatedAgreementJourney(consent) {
  await browser.url(browser.options.agreementsUrl)
  await browser.pause(5000)
  await expect(browser).toHaveTitle(constants.AGREEMENT_ENDED_TITLE)
  const headerText = await AgreementsTerminateOfferPage.getConfirmationText()
  await expect(headerText).toBe(constants.TERMINATE_HEADER)
  const startDateText = await AgreementsTerminateOfferPage.getStartDateText()
  const formattedDate = dayjs().format('D MMMM YYYY')
  await expect(startDateText).toContain(constants.END_DATE)
  await expect(startDateText).toContain(formattedDate)
}
