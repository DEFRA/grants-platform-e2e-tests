import BasePage from '../page-objects/cw.base.page.js'
import { $ } from '../utils/test-runtime.js'
import { step } from '../utils/report-step.js'

class CWTasksPage extends BasePage {
  async approvalNotes(actionCode) {
    const selector = `#${actionCode.toUpperCase()}-comment`
    const commentBox = await $(selector)

    await commentBox.waitForDisplayed()
    await commentBox.setValue(`#${actionCode}-comment`)
  }

  async acceptedNotes(notes) {
    const commentBox = await $('#comment')
    await commentBox.setValue(notes)
  }

  async approveCaseWithComments(approveApplication) {
    await this.selectRadioByValue(approveApplication)
    await this.approvalNotes(approveApplication)
  }

  async handleTask(taskName, radioValue) {
    return step(`Complete task "${taskName}"`, async () => {
      await this.clickLinkByText(taskName)
      await this.selectRadioByValue(radioValue)
      await this.approvalNotes(radioValue)
      await this.clickButtonByText('Confirm')
    })
  }

  async confirmTask(taskName) {
    await this.handleTask(taskName, 'CONFIRM')
  }

  async completeTask(taskName) {
    await this.handleTask(taskName, 'ACCEPTED')
  }

  async approveAgreement(agreementsent) {
    await this.selectRadioByValue(agreementsent)
  }
}

export default new CWTasksPage()
