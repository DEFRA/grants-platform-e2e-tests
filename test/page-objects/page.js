import { browser, $ } from '../utils/test-runtime.js'
import { step } from '../utils/report-step.js'

class Page {
  get pageHeading() {
    return $('h1')
  }

  open(path) {
    return step(`Open ${path}`, () => browser.url(path))
  }

  async clickButton(selector) {
    const button = await $("button[type='submit']")
    await button.click()
  }
}

export { Page }
