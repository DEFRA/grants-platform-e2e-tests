import { browser, $ } from '../utils/test-runtime.js'
import { expect as playwrightExpect } from '@playwright/test'
import { Page } from '../page-objects/page.js'
import { step } from '../utils/report-step.js'
import { getPage } from '../utils/playwright-bridge.js'

class GrasslandPage extends Page {
  open() {
    return super.open('/grasslands')
  }

  async waitForTasksPage() {
    return step('Wait for grasslands tasks page', async () => {
      await this.waitForUrlIncludes('/grasslands/tasks')
      const heading = await $('h1')
      await heading.waitForDisplayed({ timeout: 50000 })
    })
  }

  async completeCheckBeforeYouStartQuestions() {
    const tasks = [
      'Are these details correct?',
      'Confirm your land details are up to date',
      'Confirm management control of the land'
    ]

    for (const [index, taskName] of tasks.entries()) {
      await step(`Question ${index + 1}: ${taskName}`, async () => {
        if ((await browser.getUrl()).includes('/grasslands/tasks')) {
          await this.clickTask(taskName)
        }

        await this.selectYes()
        await this.clickSaveAndContinue()
      })
    }
  }

  async clickSelectLandAndActions() {
    return this.clickTask('Select the land and actions you want to apply for')
  }

  async selectParcelOnMap(parcelId, areaHa) {
    return step(
      `Select land parcel ${parcelId} (${areaHa} ha) on map`,
      async () => {
        const page = getPage()
        const area = Number(areaHa)

        // The page's parcel-map:selection listener is attached as soon as
        // parcel-select-page.js runs, but the element can be attached before
        // that listener is wired up, so a single dispatch can be dropped.
        // Retry until #selected-parcel-details becomes visible.
        await page.locator('#parcel-map').waitFor({ state: 'attached' })

        const dispatchSelection = () =>
          page.evaluate(
            ({ id, areaHa: selectedArea }) => {
              const [sheetId, parcelIdPart] = id.split('-')
              document.getElementById('parcel-map').dispatchEvent(
                new CustomEvent('parcel-map:selection', {
                  bubbles: true,
                  detail: {
                    selectedParcels: [
                      {
                        id,
                        sheet_id: sheetId,
                        parcel_id: parcelIdPart,
                        areaHa: selectedArea
                      }
                    ]
                  }
                })
              )
            },
            { id: parcelId, areaHa: area }
          )

        const selectedParcelDetails = page.locator('#selected-parcel-details')
        await playwrightExpect(async () => {
          await dispatchSelection()
          await playwrightExpect(selectedParcelDetails).toBeVisible({
            timeout: 1000
          })
        }).toPass({ timeout: 30000 })

        const selectedText = await selectedParcelDetails.innerText()
        playwrightExpect(selectedText).toContain(parcelId)
        playwrightExpect(selectedText).toContain(`${area} hectares`)
      }
    )
  }

  async continueFromMapSelection() {
    return step('Continue from land parcel map selection', async () => {
      const page = getPage()
      await page.locator('#map-select-continue').click()
    })
  }

  async verifySelectedParcelOnActionsPage(parcelId, areaHa) {
    return step(
      `Verify selected parcel ${parcelId} on actions page`,
      async () => {
        await this.waitForUrlIncludes(
          `/grasslands/select-actions-for-land-parcel?parcelId=${parcelId}`
        )

        const area = Number(areaHa)
        const pageText = await (await $('main')).getText()
        const parcelIdWithSpace = parcelId.replace('-', ' ')

        playwrightExpect(
          pageText.includes(parcelId) || pageText.includes(parcelIdWithSpace)
        ).toBe(true)
        playwrightExpect(pageText).toContain(`${area} hectares`)
        playwrightExpect(await browser.getUrl()).toContain(
          `parcelId=${parcelId}`
        )
        await browser.takeScreenshot()
      }
    )
  }

  async selectActionsWithQuantities(actions) {
    return step('Select land actions and quantities', async () => {
      await this.waitForUrlIncludes(
        '/grasslands/select-actions-for-land-parcel'
      )

      for (let index = 0; index < actions.length; index++) {
        const { code, quantity } = actions[index]
        const nextAction = actions[index + 1]

        await step(
          quantity
            ? `Select ${code} and enter ${quantity} ha`
            : `Select ${code}`,
          async () => {
            await this.waitForActionEnabled(code)
            await this.selectActionCheckbox(code)

            if (
              quantity !== undefined &&
              quantity !== null &&
              quantity !== ''
            ) {
              await this.enterActionQuantity(code, quantity)

              // Entering a quantity refreshes available areas; wait until
              // the next action is selectable again before continuing.
              if (nextAction) {
                await this.waitForActionEnabled(nextAction.code)
              }
            }
          }
        )
      }

      await this.clickButton('Save and continue')
      await this.waitForTasksPage()
    })
  }

  actionCheckbox(actionCode) {
    return getPage().locator(
      `input[type="checkbox"][name="landAction"][value="${actionCode}"]`
    )
  }

  async waitForActionEnabled(actionCode) {
    const checkbox = this.actionCheckbox(actionCode)
    await checkbox.waitFor({ state: 'attached', timeout: 50000 })
    await playwrightExpect(checkbox).toBeEnabled({ timeout: 50000 })
  }

  async selectActionCheckbox(actionCode) {
    const page = getPage()
    const checkbox = this.actionCheckbox(actionCode)

    await checkbox.waitFor({ state: 'attached', timeout: 50000 })

    if (!(await checkbox.isChecked())) {
      // GOV.UK visually hides the input; click its label so the
      // conditional quantity panel is revealed via aria-controls.
      const checkboxId = await checkbox.getAttribute('id')
      const label = checkboxId
        ? page.locator(`label[for="${checkboxId}"]`).first()
        : checkbox.locator('xpath=following-sibling::label[1]')

      await label.click()
    }

    await playwrightExpect(checkbox).toBeChecked({ timeout: 50000 })
  }

  async enterActionQuantity(actionCode, quantity) {
    const checkbox = this.actionCheckbox(actionCode)
    const controlsId =
      (await checkbox.getAttribute('aria-controls')) ||
      (await checkbox.getAttribute('data-aria-controls'))

    // Prefer the GOV.UK conditional panel. Avoid bare #landActionQuantity_*
    // because a hidden tracker input can share that id and match first.
    const quantityInput = controlsId
      ? getPage().locator(
          `#${controlsId} input.govuk-input[name="landActionQuantity_${actionCode}"]`
        )
      : getPage().locator(
          `input.govuk-input[name="landActionQuantity_${actionCode}"]:not([type="hidden"])`
        )

    await quantityInput.waitFor({ state: 'visible', timeout: 50000 })
    await quantityInput.fill(String(quantity))
    // Blur so the page recalculates remaining area and refreshes actions.
    await quantityInput.blur()
  }

  async clickTask(taskName) {
    return step(`Start task "${taskName}"`, async () => {
      const link = await $(`a=${taskName}`)
      await link.waitForClickable({
        timeout: 50000,
        timeoutMsg: `Task "${taskName}" was not clickable`
      })
      await link.click()
    })
  }

  async selectYes() {
    return step('Select Yes', async () => {
      const yesLabel = await $('label=Yes')
      await yesLabel.waitForClickable({
        timeout: 50000,
        timeoutMsg: 'Yes radio was not clickable'
      })
      await yesLabel.click()
    })
  }

  async clickSaveAndContinue() {
    const saveAndContinue = await $('button=Save and continue')
    if (await saveAndContinue.isExisting()) {
      await this.clickButton('Save and continue')
      return
    }

    await this.clickButton('Continue')
  }

  async clickButton(buttonText) {
    return step(`Click "${buttonText}" button`, async () => {
      const button = await $(`button=${buttonText}`)
      await button.waitForClickable({
        timeout: 50000,
        timeoutMsg: `Button "${buttonText}" was not clickable`
      })
      await button.click()
    })
  }

  async checkAnswersAndSubmitApplication() {
    return step('Check answers and submit application', async () => {
      await this.waitForTasksPage()
      await this.clickTask('Check your answers')
      await this.clickButton('Continue')

      await this.waitForUrlIncludes('/grasslands/declaration')
      await this.clickButton('Confirm and submit')
    })
  }

  async waitForUrlIncludes(path, timeout = 50000) {
    await browser.waitUntil(
      async () => (await browser.getUrl()).includes(path),
      {
        timeout,
        timeoutMsg: `Expected URL to include "${path}" but it did not`
      }
    )
  }
}

export default new GrasslandPage()
