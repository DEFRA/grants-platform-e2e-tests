import { $, browser, expect, config } from '../utils/test-runtime.js'
import { step } from '../utils/report-step.js'

class GrantsPlatformAdminPage {
  async openWoodlandClaims(appRefNum) {
    return step(
      'Open woodland claims in Grants Platform Administration',
      async () => {
        await browser.url(
          `${browser.options.grantsAdminUrl}${appRefNum}/claims`
        )
        await browser.waitUntil(
          async () =>
            (await browser.getUrl()).includes(
              `/applications/${appRefNum}/claims`
            ),
          {
            timeout: 60000,
            timeoutMsg:
              'Grants Platform Administration claims page did not load'
          }
        )

        const claimableItems = await $(
          '[data-testid="available-entitlements-heading"]'
        )
        await claimableItems.waitForDisplayed({
          timeout: config.waitforTimeout
        })

        const pageText = await (await $('body')).getText()
        expect(pageText).toContain('Claimable items')
        expect(pageText).toContain(appRefNum)
        await browser.takeScreenshot()
      }
    )
  }

  async createClaimableItem(areaHa) {
    return step(`Create claimable item for ${areaHa} ha`, async () => {
      const createLink = await $('[data-testid="available-entitlement-create"]')
      await createLink.waitForClickable({ timeout: config.waitforTimeout })
      await createLink.click()

      const areaInput = await $('#totalHectares')
      await areaInput.waitForDisplayed({ timeout: config.waitforTimeout })
      await areaInput.waitForEnabled({ timeout: config.waitforTimeout })
      await areaInput.clearValue()
      await areaInput.setValue(String(areaHa))

      const saveItem = await $('button=Save item')
      await saveItem.waitForClickable({ timeout: config.waitforTimeout })
      await saveItem.click()

      const successBanner = await $('[data-testid="entitlement-created"]')
      await successBanner.waitForDisplayed({ timeout: 30000 })
      expect(await successBanner.getText()).toContain('Success')
      await browser.takeScreenshot()
    })
  }
}

export default new GrantsPlatformAdminPage()
