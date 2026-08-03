import { Page } from './page.js'
import { $ } from '../utils/test-runtime.js'
class AgreementsTerminateOfferPage extends Page {
  async getConfirmationText() {
    return await $(`.govuk-panel__title`).getText()
  }

  async getStartDateText() {
    return await $('.govuk-panel__body').getText()
  }

  async toggleHelpText() {
    return await $('summary=If you need help').click()
  }

  async getHelpText() {
    const details = await $('summary=If you need help')
    const parent = await details.parentElement()
    return parent.$('.govuk-details__text').getText()
  }
}

export default new AgreementsTerminateOfferPage()
