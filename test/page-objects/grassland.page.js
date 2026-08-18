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
        const parcelIdWithSpace = parcelId.replace('-', ' ')
        playwrightExpect(
          selectedText.includes(parcelId) ||
            selectedText.includes(parcelIdWithSpace)
        ).toBe(true)
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
        const hasQuantity =
          quantity !== undefined && quantity !== null && quantity !== ''

        await step(
          hasQuantity
            ? `Select ${code} and enter ${quantity} ha`
            : `Select ${code}`,
          async () => {
            await this.waitForActionEnabled(code)

            if (hasQuantity) {
              await this.selectActionCheckbox(code)
              await this.enterActionQuantity(code, quantity)

              if (nextAction) {
                await this.waitForActionAvailable(nextAction.code)
              }
            } else {
              await this.selectActionAndWaitForRefresh(code)
            }
          }
        )
      }

      // Checking a "total" action like CLIG3 recalculates remaining land
      // and disables the other checkboxes. Disabled fields are omitted
      // from submit, so re-enable and restore values just before save.
      await this.prepareFormForSubmit(actions)
      await this.clickButton('Save and continue')
      await this.waitForTasksPage()
    })
  }

  actionCheckbox(actionCode) {
    return getPage().locator(
      `input[type="checkbox"][name="landAction"][value="${actionCode}"]`
    )
  }

  visibleQuantityInput(actionCode) {
    return getPage().locator(
      `input.govuk-input[name="landActionQuantity_${actionCode}"]:not([type="hidden"])`
    )
  }

  actionItem(actionCode) {
    return getPage().locator(
      `.govuk-checkboxes__item:has(input[name="landAction"][value="${actionCode}"])`
    )
  }

  waitForActionsApiResponse(matchPlannedAction) {
    return getPage().waitForResponse(
      async (response) => {
        if (
          !response.url().includes('/api/land-grants/actions/') ||
          response.request().method() !== 'POST' ||
          !response.ok()
        ) {
          return false
        }

        if (!matchPlannedAction) {
          return true
        }

        try {
          const body = response.request().postDataJSON()
          return Boolean(body?.plannedActions?.some(matchPlannedAction))
        } catch {
          return false
        }
      },
      { timeout: 50000 }
    )
  }

  async waitForActionEnabled(actionCode) {
    const checkbox = this.actionCheckbox(actionCode)
    await checkbox.waitFor({ state: 'attached', timeout: 50000 })
    await playwrightExpect(checkbox).toBeEnabled({ timeout: 50000 })
  }

  async waitForActionAvailable(actionCode) {
    await this.waitForActionEnabled(actionCode)

    await playwrightExpect(async () => {
      const itemText = await this.actionItem(actionCode).innerText()
      playwrightExpect(itemText).not.toContain(
        'Not compatible with other selected actions'
      )
    }).toPass({ timeout: 50000 })
  }

  async selectActionCheckbox(actionCode) {
    const checkbox = this.actionCheckbox(actionCode)
    await checkbox.waitFor({ state: 'attached', timeout: 50000 })

    if (await checkbox.isChecked()) {
      return
    }

    // Click the label that belongs to this checkbox. Avoid label[for=id]
    // because the first action uses id="landAction" and that can match
    // the wrong control.
    const label = checkbox.locator(
      'xpath=following-sibling::label[contains(@class,"govuk-checkboxes__label")][1]'
    )
    await label.click()
    await playwrightExpect(checkbox).toBeChecked({ timeout: 50000 })
  }

  async selectActionAndWaitForRefresh(actionCode) {
    const responsePromise = this.waitForActionsApiResponse(
      (action) => action.actionCode === actionCode
    )
    await this.selectActionCheckbox(actionCode)
    await responsePromise
  }

  async enterActionQuantity(actionCode, quantity) {
    const quantityInput = this.visibleQuantityInput(actionCode)
    await quantityInput.waitFor({ state: 'visible', timeout: 50000 })
    await quantityInput.click()

    const responsePromise = this.waitForActionsApiResponse(
      (action) =>
        action.actionCode === actionCode &&
        Number(action.quantity) === Number(quantity)
    )
    await quantityInput.fill(String(quantity))
    await quantityInput.press('Tab')
    await responsePromise

    await playwrightExpect(this.actionCheckbox(actionCode)).toBeChecked()
    await playwrightExpect(this.visibleQuantityInput(actionCode)).toHaveValue(
      String(quantity)
    )
  }

  async prepareFormForSubmit(actions) {
    return step('Restore selected actions so they are submitted', async () => {
      await getPage().evaluate((selectedActions) => {
        const entered = selectedActions.filter(
          (action) =>
            action.quantity !== undefined &&
            action.quantity !== null &&
            action.quantity !== ''
        )
        const totalAvailable = Number(
          document
            .querySelector(
              'input[name="landAction"][data-total-available-area]'
            )
            ?.getAttribute('data-total-available-area') || 0
        )
        const enteredTotal = entered.reduce(
          (sum, action) => sum + Number(action.quantity),
          0
        )
        const remaining = Number((totalAvailable - enteredTotal).toFixed(4))

        for (const action of selectedActions) {
          const checkbox = document.querySelector(
            `input[name="landAction"][value="${action.code}"]`
          )

          if (!checkbox) {
            throw new Error(`Action checkbox "${action.code}" was not found`)
          }

          checkbox.disabled = false
          checkbox.removeAttribute('disabled')
          checkbox.checked = true

          const value =
            action.quantity !== undefined &&
            action.quantity !== null &&
            action.quantity !== ''
              ? String(action.quantity)
              : String(remaining)

          document
            .querySelectorAll(`input[name="landActionQuantity_${action.code}"]`)
            .forEach((input) => {
              input.disabled = false
              input.removeAttribute('disabled')
              input.value = value
            })
        }
      }, actions)
    })
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

  async getApplicationReference() {
    const refNumberEl = await $(
      '.govuk-panel--confirmation .govuk-panel__body strong'
    )
    await refNumberEl.waitForDisplayed({ timeout: 50000 })
    return (await refNumberEl.getText()).trim().toLowerCase()
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
