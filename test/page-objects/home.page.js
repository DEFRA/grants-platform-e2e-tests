import { Page } from '../page-objects/page'

class HomePage extends Page {
  open() {
    return super.open('/farm-payments')
  }

  async clearApplicationState() {
    return super.open('/farm-payments/clear-application-state')
  }
}

export default new HomePage()
