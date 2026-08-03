import { Page } from '../page-objects/page.js'
import { $, $$, browser } from '../utils/test-runtime.js'

class AgreementsAcceptYourOfferPage extends Page {
  async getConfirmationText() {
    return await $(`.govuk-heading-l`).getText()
  }

  async clickBackLink() {
    return await $('a.govuk-back-link').click()
  }

  async selectAcceptOffer(selector) {
    const button = await $('button[id="accept-offer-button"]')
    await button.click()
  }

  async toggleGuidanceDetails() {
    return $('summary=If you need to make an update').click()
  }

  getConfirmationChecklist() {
    return $$('ul.govuk-list--bullet li').map((el) => el.getText())
  }

  async getGuidanceDetailsText() {
    const details = await $('summary=If you need to make an update')
    const parent = await details.parentElement()
    return parent.$('.govuk-details__text').getText()
  }

  async getCallChargesLink() {
    return await this.getLinkByPartialText('Find out about call charges')
  }

  async getTermsAndConditionsLink() {
    return await this.getLinkByPartialText('terms and conditions')
  }

  async getFundingLink() {
    return await this.getLinkByPartialText('funding for land or farms')
  }

  async clickConfirmCheckbox() {
    const checkbox = await $('#confirm')
    await checkbox.scrollIntoView()
    await checkbox.click()
    await browser.waitUntil(
      async () => {
        return (await checkbox.isSelected()) === true
      },
      {
        timeout: 2000,
        timeoutMsg: 'Checkbox #confirm was not selected'
      }
    )
  }
}
export default new AgreementsAcceptYourOfferPage()
