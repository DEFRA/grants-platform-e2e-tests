import { $, $$, browser, expect } from '../utils/test-runtime.js'
import BasePage from '../page-objects/cw.base.page.js'

class CWAgreementsPage extends BasePage {
  get firstAgreementReference() {
    return $$('dl div dd')[1]
  }

  get firstAgreementStatus() {
    return $$('dl div dd')[0]
  }

  async getFirstAgreementReferenceText() {
    return await this.firstAgreementReference.getText()
  }

  async getFirstAgreementStatusText() {
    return this.firstAgreementStatus.getText()
  }

  get agreementStatusTag() {
    return $('.govuk-summary-list__value .govuk-tag')
  }

  async waitForAgreementToBeTerminated({
    timeout = 60000,
    interval = 3000,
    status = 'Terminated'
  } = {}) {
    let lastStatus = ''

    await browser.waitUntil(
      async () => {
        await browser.refresh()

        const statusElement = await this.agreementStatusTag

        await statusElement.waitForDisplayed({ timeout: 10000 })

        const statusText = (await statusElement.getText()).trim()

        lastStatus = statusText

        console.log(`Current agreement status: ${statusText}`)

        return statusText === status
      },
      {
        timeout,
        interval,
        timeoutMsg: `Agreement status did not become "Terminated" in time. Last status: ${lastStatus}`
      }
    )
  }

  async clickViewAgreementLink() {
    const link = await $('a=View agreement')
    await link.waitForClickable({ timeout: 50000 })
    await link.click()
  }

  async switchToNewlyOpenedTab(previousHandles, timeout = 50000) {
    await browser.waitUntil(
      async () =>
        (await browser.getWindowHandles()).length > previousHandles.length,
      {
        timeout,
        timeoutMsg: 'New tab did not open after clicking View agreement'
      }
    )

    const currentHandles = await browser.getWindowHandles()
    const newHandle = currentHandles.find((h) => !previousHandles.includes(h))
    if (!newHandle) {
      throw new Error('Unable to find newly opened tab handle')
    }
    await browser.switchToWindow(newHandle)
    return newHandle
  }

  async validateAgreementTotals({
    expectedTotalParcelArea,
    expectedAnnualPaymentValue
  }) {
    const totalParcelAreaEl = await $(
      'table[data-test-id="actionsTable"] [data-test-id="actionsTableCell4_3"]'
    )
    await totalParcelAreaEl.waitForDisplayed({ timeout: 50000 })
    const totalParcelArea = (await totalParcelAreaEl.getText()).trim()
    expect(totalParcelArea).toBe(String(expectedTotalParcelArea))

    // "Annual payment value" is typically the bold total in the payments table footer row.
    const annualPaymentValueEl = await $(
      '(//tr[starts-with(@data-test-id,"paymentsTable")])[last()]//td[contains(@class,"govuk-!-font-weight-bold")][last()]'
    )
    await annualPaymentValueEl.waitForDisplayed({ timeout: 50000 })
    const annualPaymentValue = (await annualPaymentValueEl.getText()).trim()
    expect(annualPaymentValue).toBe(String(expectedAnnualPaymentValue))
  }

  async viewAndValidateAgreementInNewTab({
    expectedTotalParcelArea,
    expectedAnnualPaymentValue
  }) {
    const originalHandles = await browser.getWindowHandles()
    await this.clickViewAgreementLink()
    await this.switchToNewlyOpenedTab(originalHandles)
    await this.validateAgreementTotals({
      expectedTotalParcelArea,
      expectedAnnualPaymentValue
    })
    await browser.closeWindow()
    await browser.switchToWindow(originalHandles[0])
  }
}

export default new CWAgreementsPage()
