import BasePage from '../page-objects/cw.base.page.js'
import { $, expect } from '../utils/test-runtime.js'

class CWApplicationPage extends BasePage {
  async headerH2() {
    const h2Element = await $('h2')
    return await h2Element.getText()
  }

  async clickApplicationTab() {
    const applicationTab = await $(
      'a.govuk-service-navigation__link=Application'
    )
    await applicationTab.waitForDisplayed()
    await applicationTab.click()
  }

  async clickTasksTab() {
    const applicationTab = await $('a.govuk-service-navigation__link=Tasks')
    await applicationTab.waitForDisplayed()
    await applicationTab.click()
  }

  async getAnnualPaymentText() {
    const paymentValue = await $(
      '//dt[contains(normalize-space(.), "annual payment")]/following-sibling::dd'
    )
    await paymentValue.waitForExist({ timeout: 50000 })
    await paymentValue.scrollIntoView()
    return paymentValue.getText()
  }

  async verifyAnnualPayment(expectedPayment) {
    const actualPayment = await this.getAnnualPaymentText()
    expect(this.normalizeWhitespace(actualPayment)).toBe(
      this.normalizeWhitespace(expectedPayment)
    )
  }

  normalizeWhitespace(text) {
    return text.replace(/\s+/g, ' ').trim()
  }
}

export default new CWApplicationPage()
