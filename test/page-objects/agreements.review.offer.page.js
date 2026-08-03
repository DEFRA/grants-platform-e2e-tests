import { Page } from '../page-objects/page.js'
import { $, browser } from '../utils/test-runtime.js'

class AgreementsReviewOfferPage extends Page {
  open(id) {
    const proxy = `${browser.options.proxy}`
    const path = id ? `/${id}` : '/SFI123456789'
    return super.open(proxy + path)
  }

  async getActionTableRowData(rowIndex) {
    const action = await $(`#actionTableActionRow${rowIndex}`).getText()
    const code = await $(`#actionTableCodeRow${rowIndex}`).getText()
    const parcel = await $(`#actionTableLandParcelRow${rowIndex}`).getText()
    const quantity = await $(`#actionTableQuantityRow${rowIndex}`).getText()

    console.log(
      `Row ${rowIndex} - Action: ${action}, Code: ${code}, Parcel: ${parcel}, Quantity: ${quantity}`
    )
    return { action, code, parcel, quantity }
  }

  async getPaymentsTableRowData(rowIndex) {
    const action = await $(`#paymentsTableActionRow${rowIndex}`).getText()
    const code = await $(`#paymentsTableCodeRow${rowIndex}`).getText()
    const paymentRate = await $(
      `#paymentsTablePaymentRateForEachYearRow${rowIndex}`
    ).getText()
    const firstPayment = await $(
      `#paymentsTableFirstPaymentRow${rowIndex}`
    ).getText()
    const subsequentPayments = await $(
      `#paymentsTableSubsequentPaymentRow${rowIndex}`
    ).getText()
    const yearlyPayment = await $(
      `#paymentsTableYearlyPaymentRow${rowIndex}`
    ).getText()

    console.log(
      `Row ${rowIndex} - Action: ${action}, Code: ${code}, Payment Rate: ${paymentRate}, First Payment: ${firstPayment},Subsequent payments : ${subsequentPayments}, Yearly: ${yearlyPayment}`
    )

    return {
      action,
      code,
      paymentRate,
      firstPayment,
      subsequentPayments,
      yearlyPayment
    }
  }

  async getTotalFirstPayment() {
    return await $(`#paymentsTableTotalFirstPayment`).getText()
  }

  async getTotalSubsequentPayment() {
    return await $(`#paymentsTableTotalSubsequentPayment`).getText()
  }

  async getTotalYearlyPayment() {
    return await $(`#paymentsTableTotalYearlyPayment`).getText()
  }

  async selectContinue(selector) {
    const button = await $('.govuk-button')
    await button.waitForClickable({ timeout: 10000 })
    await button.click()
  }
}

export default new AgreementsReviewOfferPage()
