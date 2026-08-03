import BasePage from '../page-objects/cw.base.page.js'
import { $, $$ } from '../utils/test-runtime.js'

class CWAllCasesPage extends BasePage {
  async serviceNameHeader() {
    const serviceName = await $('[data-testid="defra-heading-service-name"]')
    return await serviceName.getText()
  }

  async headerH2() {
    const h2Element = await $('#all-cases > h2')
    return await h2Element.getText()
  }

  async allCases() {
    const rows = await $$(`#all-cases > table > tbody > tr`)
    return rows.length
  }

  async getAssignedUserForACase(generatedClientRef) {
    const row = await $(`//tr[td/a[text()="${generatedClientRef}"]]`)
    const cells = await row.$$('td')
    const caseUserText = await cells[cells.length - 1].getText()
    console.log('Case user text:', caseUserText)
    return caseUserText
  }

  async getStatusForACase(generatedClientRef) {
    const row = await $(`//tr[td/a[text()="${generatedClientRef}"]]`)
    const cells = await row.$$('td')
    const caseStatusText = await cells[cells.length - 2].getText()
    console.log('Case user text:', caseStatusText)
    return caseStatusText
  }
}

export default new CWAllCasesPage()
