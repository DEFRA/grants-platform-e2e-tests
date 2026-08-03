import { browser, $ } from '../utils/test-runtime.js'

class Page {
  get pageHeading() {
    return $('h1')
  }

  open(path) {
    return browser.url(path)
  }

  async clickButton(selector) {
    const button = await $("button[type='submit']")
    await button.click()
  }
}

export { Page }
