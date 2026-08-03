import { Page } from '../page-objects/page.js'
import { $ } from '../utils/test-runtime.js'

class AgreementsOfferAcceptedPage extends Page {
  async getConfirmationText() {
    return await $(`.govuk-panel__title`).getText()
  }

  async getStartDateText() {
    return await $('.govuk-panel__body').getText()
  }

  async getReferenceNumber() {
    return await $('p.govuk-body').getText()
  }

  async getViewFullAgreementLink() {
    return await this.getLinkByPartialText('view your full agreement')
  }

  async clickViewAgreementLink() {
    const link = await this.getLinkByPartialText('view your full agreement')
    await link.click()
  }

  async getGuidanceLink() {
    return await this.getLinkByPartialText('Read the guidance')
  }

  async getHelpText() {
    const details = await $('summary=If you need help')
    const parent = await details.parentElement()
    return parent.$('.govuk-details__text').getText()
  }

  async toggleHelpText() {
    return await $('summary=If you need help').click()
  }

  async getCallChargesLink() {
    return await this.getLinkByPartialText('Find out about call charges')
  }

  async getSectionHeading(headingText) {
    return await $(`h2=${headingText}`)
  }
}

export default new AgreementsOfferAcceptedPage()
