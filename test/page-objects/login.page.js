import { Page } from '../page-objects/page.js'
import { $ } from '../utils/test-runtime.js'

class LoginPage extends Page {
  async login(crn, password) {
    const usernameInput = await $('#crn')
    const passwordInput = await $('#password')
    const submitButton = await $('button[type="submit"]')

    await usernameInput.setValue(crn)
    await passwordInput.setValue(password)
    await submitButton.click()
  }
}

export default new LoginPage()
