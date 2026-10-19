import { browser, $, expect } from '../utils/test-runtime.js'
import { Page } from '../page-objects/page'
import { step } from '../utils/report-step.js'

class WoodlandHomePage extends Page {
  open() {
    return super.open('/woodland/check-details')
  }

  openReturnedApplication() {
    return super.open('/woodland/returned-to-customer')
  }

  openClaim() {
    return super.open('/woodland/claim')
  }

  clearApplicationState() {
    return super.open('/woodland/clear-application-state')
  }

  async completeCheckDetails() {
    return step('Check details page: confirm business details', async () => {
      await this.selectRadioById('businessDetailsUpToDate')
      await this.clickButton('Continue')
    })
  }

  async completeEligibility() {
    return step('Complete eligibility questions', async () => {
      await step('Eligibility: land registered with RPA', async () => {
        await this.clickHref('/woodland/eligibility-land-registered')
        await this.waitForUrlIncludes('/woodland/eligibility-land-registered')
        await this.selectRadioById('landRegisteredWithRpa')
        await this.clickButton('Save and continue')
      })

      await step('Eligibility: land management control', async () => {
        await this.selectRadioById('landManagementControl')
        await this.clickButton('Save and continue')
      })

      await step('Eligibility: public body tenant', async () => {
        await this.selectRadioById('publicBodyTenant-2')
        await this.clickButton('Save and continue')
      })

      await step('Eligibility: grazing rights', async () => {
        await this.selectRadioById('landHasGrazingRights-2')
        await this.clickButton('Save and continue')
      })

      await step('Eligibility: existing woodland management plan', async () => {
        await this.selectRadioById('appLandHasExistingWmp-2')
        await this.clickButton('Save and continue')
      })

      await step('Eligibility: intend to apply Higher Tier', async () => {
        await this.selectRadioById('intendToApplyHigherTier')
        await this.clickButton('Save and continue')
      })
    })
  }

  async completeWoodlandDetails({
    landParcelId,
    landParcelIdOne,
    landParcelIdTwo,
    hectaresTenOrOverYearsOld,
    WoodlandAreaTenOrOverYearsOld,
    hectaresUnderTenYearsOld,
    WoodlandAreaUnderTenYearsOld,
    centreGridReference,
    woodlandName,
    fcTeamCodeId
  }) {
    const landParcelIds = [landParcelId, landParcelIdOne, landParcelIdTwo]
      .map((id) => (id == null ? '' : String(id).trim()))
      .filter(Boolean)
    const woodlandOverTenYears =
      hectaresTenOrOverYearsOld ?? WoodlandAreaTenOrOverYearsOld
    const woodlandUnderTenYears =
      hectaresUnderTenYearsOld ?? WoodlandAreaUnderTenYearsOld
    const hasWoodlandUnderTenYears =
      woodlandUnderTenYears !== undefined &&
      woodlandUnderTenYears !== null &&
      woodlandUnderTenYears !== ''

    return step('Complete woodland details', async () => {
      await step(
        `Select land parcels ${landParcelIds.join(', ')}`,
        async () => {
          await this.clickHref('/woodland/land-parcels')
          await this.waitForUrlIncludes('/woodland/land-parcels')
          for (const parcelId of landParcelIds) {
            await this.selectLandParcel(parcelId)
          }
          await this.clickButton('Save and continue')
        }
      )

      await step(
        hasWoodlandUnderTenYears
          ? `Enter woodland areas: ${woodlandOverTenYears} ha over 10 years, ${woodlandUnderTenYears} ha under 10 years`
          : `Enter woodland over 10 years old: ${woodlandOverTenYears} ha`,
        async () => {
          await this.waitForUrlIncludes('/woodland/total-area-of-woodland')
          await this.typeById(
            'hectaresTenOrOverYearsOld',
            String(woodlandOverTenYears)
          )

          if (hasWoodlandUnderTenYears) {
            await this.typeById(
              'hectaresUnderTenYearsOld',
              String(woodlandUnderTenYears)
            )
          }

          await this.clickButton('Save and continue')
        }
      )

      await step(`Enter grid reference ${centreGridReference}`, async () => {
        await this.typeById('centreGridReference', centreGridReference)
        await this.clickButton('Save and continue')
      })

      await step(`Enter woodland name ${woodlandName}`, async () => {
        await this.typeById('woodlandName', woodlandName)
        await this.clickButton('Save and continue')
      })

      await step('Select Forestry Commission team', async () => {
        await this.selectRadioById(fcTeamCodeId)
        await this.clickButton('Save and continue')
      })
    })
  }

  async submitApplication(expectedPaymentAmount) {
    return step('Check and submit application', async () => {
      await this.clickHref('/woodland/summary')
      await this.waitForUrlIncludes('/woodland/summary')
      await this.clickButton('Continue')
      await this.verifyPotentialFunding(expectedPaymentAmount)
      await this.clickButton('Continue')
      await this.clickButton('Confirm and submit')
    })
  }

  async verifyPotentialFunding(expectedPaymentAmount) {
    const hasExpectedAmount =
      expectedPaymentAmount !== undefined &&
      expectedPaymentAmount !== null &&
      expectedPaymentAmount !== ''

    return step(
      hasExpectedAmount
        ? `Potential funding shows a grant of ${formatGrantAmount(expectedPaymentAmount)}`
        : 'Open potential funding',
      async () => {
        await this.waitForUrlIncludes('/woodland/potential-funding')

        if (!hasExpectedAmount) {
          return
        }

        const formattedAmount = formatGrantAmount(expectedPaymentAmount)
        const fundingText = await $('main').getText()
        expect(fundingText).toContain(
          `Based on the information provided, you may be eligible for a grant of ${formattedAmount}.`
        )
        await browser.takeScreenshot()
      }
    )
  }

  async updateWoodlandAreas(applicationData) {
    const woodlandOverTenYears =
      applicationData.hectaresTenOrOverYearsOld ??
      applicationData.WoodlandAreaTenOrOverYearsOld
    const woodlandUnderTenYears =
      applicationData.hectaresUnderTenYearsOld ??
      applicationData.WoodlandAreaUnderTenYearsOld
    const hasWoodlandUnderTenYears =
      woodlandUnderTenYears !== undefined &&
      woodlandUnderTenYears !== null &&
      woodlandUnderTenYears !== ''

    return step(
      hasWoodlandUnderTenYears
        ? `Change woodland areas to ${woodlandOverTenYears} ha over 10 years and ${woodlandUnderTenYears} ha under 10 years`
        : `Change woodland over 10 years old to ${woodlandOverTenYears} ha`,
      async () => {
        await this.waitForUrlIncludes('/woodland/summary')
        await this.clickSummaryChangeFor('Woodland over 10 years old')
        await this.waitForUrlIncludes('/woodland/total-area-of-woodland')
        await this.typeById(
          'hectaresTenOrOverYearsOld',
          String(woodlandOverTenYears)
        )

        if (hasWoodlandUnderTenYears) {
          await this.typeById(
            'hectaresUnderTenYearsOld',
            String(woodlandUnderTenYears)
          )
        }

        await this.clickButton('Save and continue')
        await this.waitForUrlIncludes('/woodland/summary')
      }
    )
  }

  async clickSummaryChangeFor(fieldLabel) {
    return step(`Click Change for "${fieldLabel}"`, async () => {
      const changeLink = await $(
        `//dt[contains(normalize-space(.),"${fieldLabel}")]/following-sibling::dd[contains(@class,"govuk-summary-list__actions")]//a`
      )
      await changeLink.waitForClickable({
        timeout: 50000,
        timeoutMsg: `Change link for "${fieldLabel}" was not clickable`
      })
      await changeLink.click()
    })
  }

  async getApplicationReference() {
    const refNumberEl = await $('.govuk-panel__body strong')
    await refNumberEl.waitForDisplayed()
    return (await refNumberEl.getText()).toLowerCase()
  }

  async submit() {
    const submitButton = await $('button[type="submit"]')
    await submitButton.waitForClickable()
    await submitButton.click()
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

  async selectRadioById(id) {
    const label = await $(`label[for="${id}"]`)
    if (await label.isExisting()) {
      await label.waitForClickable()
      await label.click()
      return
    }

    const radio = await $(`#${id}`)
    await radio.waitForExist()
    await browser.execute((el) => el.click(), radio)
  }

  async selectLandParcel(parcelId) {
    const parcelIdWithSpace = String(parcelId).trim().replace('-', ' ')
    const byHyphen = await $(
      `input[type="checkbox"][value="${String(parcelId).trim()}"]`
    )

    if (await byHyphen.isExisting()) {
      await this.selectCheckboxByValue(String(parcelId).trim())
      return
    }

    const bySpace = await $(
      `input[type="checkbox"][value="${parcelIdWithSpace}"]`
    )
    if (await bySpace.isExisting()) {
      await this.selectCheckboxByValue(parcelIdWithSpace)
      return
    }

    const label = await $(`label*=${parcelIdWithSpace}`)
    await label.waitForClickable({
      timeout: 50000,
      timeoutMsg: `Land parcel "${parcelIdWithSpace}" was not clickable`
    })
    await label.click()
  }

  async selectCheckboxByValue(value) {
    const safeValue = String(value).replace(/"/g, '\\"')
    const checkbox = await $(`input[type="checkbox"][value="${safeValue}"]`)

    await checkbox.waitForExist({
      timeout: 50000,
      timeoutMsg: `Checkbox with value "${value}" was not found`
    })

    if (await checkbox.isSelected()) {
      return
    }

    const checkboxId = await checkbox.getAttribute('id')
    if (checkboxId) {
      const label = await $(`label[for="${checkboxId}"]`)
      if (await label.isExisting()) {
        await label.waitForClickable()
        await label.click()
        return
      }
    }

    await browser.execute((el) => el.click(), checkbox)
  }

  async typeById(id, value) {
    const input = await $(`#${id}`)
    await input.waitForDisplayed()
    await input.clearValue()
    await input.setValue(value)
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

  async clickHref(path) {
    const link = await $(`a[href="${path}"]`)
    await link.waitForClickable({
      timeout: 50000,
      timeoutMsg: `Link with href "${path}" was not clickable`
    })
    await link.click()
  }
}

function formatGrantAmount(amount) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(Number(amount))
}

export default new WoodlandHomePage()
