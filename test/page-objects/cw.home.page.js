import CwBasePage from '../page-objects/cw.base.page.js'
import fs from 'fs'
import yaml from 'yaml'
import { $, $$, browser, expect, config } from '../utils/test-runtime.js'

class CwHomePage extends CwBasePage {
  get startNowButton() {
    return $('button[data-prevent-double-click="true"].govuk-button--start')
  }

  get isPigFarmerYes() {
    return $('input[id="isPigFarmer"]')
  }

  get isPigFarmerYesLabel() {
    return $('label[for="isPigFarmer"]')
  }

  get totalPigsInput() {
    return $('input[name="totalPigs"]')
  }

  get continueButton() {
    return $('button[data-prevent-double-click="true"].govuk-button')
  }

  get sendButton() {
    return $('button[data-prevent-double-click="true"].govuk-button')
  }

  get largeWhiteCheckbox() {
    return $('=Large White')
  }

  get britishLandraceCheckbox() {
    return $('=British Landrace')
  }

  get berkshireCheckbox() {
    return $('=Berkshire')
  }

  get otherCheckbox() {
    return $('=Other')
  }

  get whitePigsCountInput() {
    return $('input[name="whitePigsCount"]')
  }

  get britishLandracePigsCountInput() {
    return $('input[name="britishLandracePigsCount"]')
  }

  get berkshirePigsCountInput() {
    return $('input[name="berkshirePigsCount"]')
  }

  get otherPigsCountInput() {
    return $('input[name="otherPigsCount"]')
  }

  get referenceNumber() {
    return $('.govuk-panel__body strong')
  }

  get confirmationPanel() {
    return $('.govuk-panel--confirmation')
  }

  get crnInput() {
    return $('#crn')
  }

  async enterCrn(crn) {
    await this.crnInput.waitForDisplayed()
    await this.crnInput.setValue(crn)
  }

  get passwordInput() {
    return $('#password')
  }

  async enterPassword(password) {
    await this.passwordInput.waitForDisplayed()
    await this.passwordInput.setValue(password)
  }

  get submitButton() {
    return $('#submit')
  }

  async clickSubmit() {
    await this.submitButton.waitForClickable()
    await this.submitButton.click()
  }

  // convenience function to log in
  async login(crn, password) {
    await this.enterCrn(crn)
    await this.enterPassword(password)
    await this.clickSubmit()
  }

  async clickStartNow() {
    await this.startNowButton.waitForClickable()
    await this.startNowButton.click()
  }

  async selectPigFarmerYes() {
    await this.isPigFarmerYesLabel.waitForClickable()
    await this.isPigFarmerYesLabel.click()
  }

  async enterTotalPigs(count) {
    await this.totalPigsInput.waitForEnabled()
    await this.totalPigsInput.setValue(count)
  }

  async clickContinue() {
    await this.continueButton.waitForClickable()
    await this.continueButton.click()
  }

  async clickSend() {
    await this.sendButton.waitForClickable()
    await this.sendButton.click()
  }

  async selectAllPigBreeds() {
    await this.largeWhiteCheckbox.waitForClickable()
    await this.largeWhiteCheckbox.click()

    await this.britishLandraceCheckbox.waitForClickable()
    await this.britishLandraceCheckbox.click()

    await this.berkshireCheckbox.waitForClickable()
    await this.berkshireCheckbox.click()

    await this.otherCheckbox.waitForClickable()
    await this.otherCheckbox.click()
  }

  async enterWhitePigsCount(count) {
    await this.whitePigsCountInput.waitForEnabled()
    await this.whitePigsCountInput.setValue(count)
  }

  async enterBritishLandracePigsCount(count) {
    await this.britishLandracePigsCountInput.waitForEnabled()
    await this.britishLandracePigsCountInput.setValue(count)
  }

  async enterBerkshirePigsCount(count) {
    await this.berkshirePigsCountInput.waitForEnabled()
    await this.berkshirePigsCountInput.setValue(count)
  }

  async enterOtherPigsCount(count) {
    await this.otherPigsCountInput.waitForEnabled()
    await this.otherPigsCountInput.setValue(count)
  }

  async getReferenceNumber() {
    await this.referenceNumber.waitForDisplayed()
    const rawText = await this.referenceNumber.getText()
    return rawText.replace(/^=/, '').trim().toLowerCase()
  }

  async isConfirmationPageDisplayed() {
    await this.confirmationPanel.waitForDisplayed()
    return await this.confirmationPanel.isDisplayed()
  }

  async navigateToCasesPage() {
    const environment = process.env.ENVIRONMENT || 'dev'
    await browser.url(
      `https://fg-cw-frontend.${environment}.cdp-int.defra.cloud/cases/#all-cases`
    )
  }

  async isReferenceNumberInTable(referenceNumber) {
    const link = await $(`=${referenceNumber}`)
    await link.waitForExist({ timeout: 10000 })

    // Scroll to make it visible
    await link.scrollIntoView()
    await browser.pause(500)

    return await link.isDisplayed()
  }

  async clickReferenceNumberInTable(referenceNumber) {
    // First wait for the page to load completely
    await browser.waitUntil(
      async () =>
        (await browser.execute(() => document.readyState)) === 'complete',
      { timeout: 10000, timeoutMsg: 'Cases page did not load completely' }
    )

    // Give some time for the table to render
    await browser.pause(2000)

    const link = await $(`=${referenceNumber}`)
    await link.waitForClickable({ timeout: config.waitforTimeout })
    await link.click()
  }

  async clickCaseDetailsTab() {
    const caseDetailsTab = await $(
      'a.govuk-service-navigation__link[href*="/case-details"]'
    )
    await caseDetailsTab.waitForDisplayed()
    await caseDetailsTab.click()
  }

  async verifySubmittedAnswers() {
    const file = fs.readFileSync('test/data/pigs-might-fly.yml', 'utf8')
    const parsedData = yaml.parse(file)
    const data = {}
    for (const section of Object.values(parsedData)) {
      Object.assign(data, section)
    }

    // Check the questions and answers match the YAML
    const questionElements = await $$('dl > div > dt')
    const answerElements = await $$('dl > div > dd')

    for (let i = 0; i < questionElements.length; i++) {
      const question = await questionElements[i].getText()
      const answer = await answerElements[i].getText()
      const expected = data[question]

      if (expected === undefined) {
        console.warn(`⚠️ No expected value for: "${question}"`)
      } else if (expected !== answer) {
        console.error(`❌ ${question}: Expected "${expected}", got "${answer}"`)
      } else {
        console.log(`✅ ${question}: "${answer}"`)
      }
    }
  }

  async clickTasksTab() {
    const tasksTab = await $('a.govuk-service-navigation__link=Tasks')
    await tasksTab.waitForDisplayed()
    await tasksTab.click()
  }

  async clickAcceptButton() {
    const acceptButton = await $('button=Accept')
    await acceptButton.waitForDisplayed()
    await acceptButton.click()
  }

  async clickApproveButton() {
    const approveButton = await $('#actionId')
    await approveButton.waitForDisplayed()
    await approveButton.click()
  }

  async inputApprovalNotes() {
    const commentBox = await $('#approve-comment')
    await commentBox.setValue('This is my approval comment.')
  }

  async clickSaveButton() {
    const saveButton = await $('button=Save')
    await saveButton.click()
  }

  async isAssessmentStageDisplayed() {
    const assessmentHeading = await $(
      'h2[data-testid="stage-heading"]=Assessment'
    )
    await assessmentHeading.waitForDisplayed()
    return await assessmentHeading.isDisplayed()
  }

  async verifyAssessmentSections() {
    const checkApplicationSection = await $(
      'h3.govuk-heading-m=1. Check Application'
    )
    await checkApplicationSection.waitForDisplayed()

    const registrationChecksSection = await $(
      'h3.govuk-heading-m=2. Registration checks'
    )
    await registrationChecksSection.waitForDisplayed()

    return (
      (await checkApplicationSection.isDisplayed()) &&
      (await registrationChecksSection.isDisplayed())
    )
  }

  async clickTaskLink(taskName) {
    const taskLink = await $(`a.govuk-task-list__link = ${taskName}`)
    await taskLink.waitForDisplayed()
    await taskLink.click()
  }

  async checkTaskCheckbox(taskId) {
    console.log(`🔍 Looking for checkbox with task ID: ${taskId}`)

    // First, let's list all checkboxes on the page for debugging
    const allCheckboxes = await $$('input[type="checkbox"]')
    console.log(`📋 Found ${allCheckboxes.length} checkboxes on the page:`)

    for (let i = 0; i < allCheckboxes.length; i++) {
      const cb = allCheckboxes[i]
      const id = (await cb.getAttribute('id')) || 'no-id'
      const name = (await cb.getAttribute('name')) || 'no-name'
      const className = (await cb.getAttribute('class')) || 'no-class'
      const isVisible = await cb.isDisplayed()
      const isEnabled = await cb.isEnabled()
      console.log(
        `  [${i}] id="${id}", name="${name}", class="${className}", visible=${isVisible}, enabled=${isEnabled}`
      )
    }

    // Try multiple checkbox selector patterns
    const selectors = [
      `input#task-${taskId}`,
      `input#${taskId}`,
      `input[name="${taskId}"]`,
      `input[data-task-id="${taskId}"]`,
      `input[id*="${taskId}"]`, // Contains taskId
      `input[name*="${taskId}"]`, // Contains taskId in name
      'input[type="checkbox"]:visible:not([disabled])', // Any visible enabled checkbox
      'input[type="checkbox"]:not([disabled])' // Any enabled checkbox fallback
    ]

    let checkbox = null
    let found = false
    let foundSelector = null

    console.log(`🎯 Trying ${selectors.length} selector patterns...`)

    for (const selector of selectors) {
      console.log(`  Trying: ${selector}`)
      checkbox = await $(selector)
      if ((await checkbox.isExisting()) && (await checkbox.isDisplayed())) {
        found = true
        foundSelector = selector
        console.log(`  ✅ FOUND with: ${selector}`)
        break
      } else {
        console.log(`  ❌ No match with: ${selector}`)
      }
    }

    if (!found) {
      console.log(`❌ FAILED to find any matching checkbox`)
      throw new Error(
        `Could not find checkbox for task ID: ${taskId}. See console output for available checkboxes.`
      )
    }

    await checkbox.waitForDisplayed()
    await checkbox.click()
    console.log(
      `✅ Successfully clicked checkbox using selector: ${foundSelector}`
    )
  }

  async clickSaveAndContinue() {
    const saveButton = await $('button[data-testid="save-and-continue-button"]')
    await saveButton.waitForDisplayed()
    await saveButton.click()
  }

  async verifyTaskStatus(taskName, expectedStatus) {
    // Use XPath to find the task list item that contains the specific task name and get its status
    const statusElement = await $(
      `//li[@class='govuk-task-list__item govuk-task-list__item--with-link'][.//a[@class='govuk-link govuk-task-list__link' and text()='${taskName}']]//strong[@class='govuk-tag govuk-tag govuk-tag--blue']`
    )
    await statusElement.waitForDisplayed()
    const status = await statusElement.getText()
    return status === expectedStatus
  }

  async isContractedStageDisplayed() {
    const contractedHeading = await $(
      'h2[data-testid="stage-heading"]=Contracted'
    )
    await contractedHeading.waitForDisplayed()
    return await contractedHeading.isDisplayed()
  }

  async submitApplication() {
    // const environment = process.env.ENVIRONMENT || 'dev'
    await browser.url('/flying-pigs/start')
    await this.login('1100504729', 'Password456')
    // Fill out the application form following the exact flow from steps
    await this.clickStartNow()
    await this.selectPigFarmerYes()
    await this.clickContinue()
    await this.enterTotalPigs('100')
    await this.clickContinue()
    await this.selectAllPigBreeds()
    await this.clickContinue()
    await this.enterWhitePigsCount('25')
    await this.clickContinue()
    await this.enterBritishLandracePigsCount('25')
    await this.clickContinue()
    await this.enterBerkshirePigsCount('25')
    await this.clickContinue()
    await this.enterOtherPigsCount('25')
    await this.clickContinue()
    await this.clickContinue()
    await this.clickSend()

    // Get the reference number from confirmation page
    return await this.getReferenceNumber()
  }

  async navigateToApplicationPage(referenceNumber) {
    await this.navigateToCasesPage()
    await this.clickReferenceNumberInTable(referenceNumber)
  }

  async completeReviewApplicationDataTask() {
    // Click on the Review application data task link
    const reviewTaskLink = await $(
      'a.govuk-task-list__link=Review application data'
    )
    await reviewTaskLink.waitForDisplayed()
    await reviewTaskLink.click()

    // Check the Review application data checkbox
    const reviewCheckbox = await $('input#task-review-application-data')
    await reviewCheckbox.waitForDisplayed()
    await reviewCheckbox.click()

    // Click Save and continue button
    const saveButton = await $('button[data-testid="save-and-continue-button"]')
    await saveButton.waitForDisplayed()
    await saveButton.click()
  }

  async acceptApplicationForAssessment() {
    await this.clickTasksTab()
    await this.clickAcceptButton()
  }

  async approveApplicationForAssessment() {
    await this.clickTasksTab()
    await this.clickApproveButton()
    await this.inputApprovalNotes()
    await this.clickSaveButton()
  }

  async verifyStageIs() {
    const heading = await $('[data-testid="stage-heading"]')
    return await heading.getText()
  }

  async verifyTaskSections(expectedSections) {
    for (const section of expectedSections) {
      // Try multiple approaches to find the section
      let sectionHeading = null
      let found = false

      // Approach 1: Try with WebdriverIO text selectors (case-insensitive partial match)
      try {
        sectionHeading = await $(`h3*=${section}`)
        if (await sectionHeading.isExisting()) {
          found = true
        }
      } catch (error) {
        // Continue to next approach
      }

      // Approach 2: Try with different case variations
      if (!found) {
        const variations = [
          section,
          section.toLowerCase(),
          section.charAt(0).toUpperCase() + section.slice(1).toLowerCase()
        ]

        for (const variation of variations) {
          try {
            sectionHeading = await $(`h3*=${variation}`)
            if (await sectionHeading.isExisting()) {
              found = true
              break
            }
          } catch (error) {
            // Continue to next variation
          }
        }
      }

      // Approach 3: Try XPath as fallback
      if (!found) {
        try {
          sectionHeading = await $(
            `//h3[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${section.toLowerCase()}')]`
          )
          if (await sectionHeading.isExisting()) {
            found = true
          }
        } catch (error) {
          // Continue
        }
      }

      if (!found) {
        throw new Error(`Task section "${section}" could not be found`)
      }

      await sectionHeading.waitForDisplayed()
      const isDisplayed = await sectionHeading.isDisplayed()
      if (!isDisplayed) {
        throw new Error(`Task section "${section}" is not displayed`)
      }
    }
  }

  async completeTask(taskName, taskIndex = null) {
    console.log(`🚀 Starting task: ${taskName}`)

    // Handle duplicate task names - check status first
    if (taskName === 'Confirm available area check') {
      await this.clickIncompleteTaskByName(taskName)
    } else {
      await this.clickLinkByText(taskName)
    }

    console.log(`✅ Clicked task link: ${taskName}`)

    // Click the checkbox
    const checkbox = await $('input[type="checkbox"]')
    await checkbox.waitForDisplayed()
    await checkbox.click()
    console.log(`✅ Clicked checkbox`)

    // Fill notes if this is one of the last 6 tasks
    if (this.requiresNotes(taskName)) {
      const noteField = await $('textarea')
      await noteField.waitForDisplayed()
      const note = this.generateTaskNote(taskName)
      await noteField.setValue(note)
      console.log(`✅ Added note: ${note}`)
    }

    // Click Save and Continue
    await this.clickSaveAndContinue()
    console.log(`✅ Completed task: ${taskName}`)
  }

  async clickIncompleteTaskByName(taskName) {
    // Find all task list items and check each one
    const taskItems = await $$('.govuk-task-list__item')

    for (const item of taskItems) {
      const taskLink = await item.$(`a=${taskName}`)
      if (await taskLink.isExisting()) {
        // Found a link with this name, now check status
        const statusTag = await item.$('.govuk-tag')
        if (await statusTag.isExisting()) {
          const status = await statusTag.getText()
          console.log(`Found '${taskName}' with status: ${status}`)
          if (status === 'Incomplete') {
            console.log(`🎯 Clicking incomplete task: ${taskName}`)
            await taskLink.click()
            return
          }
        }
      }
    }

    // Fallback if no incomplete found
    console.log(`⚠️ No incomplete task found, using fallback`)
    await this.clickLinkByText(taskName)
  }

  requiresNotes(taskName) {
    const tasksWithNotes = [
      'SFI available area check 1',
      'SFI available area check 2',
      'SFI intersecting layers check 1',
      'SFI intersecting layers check 2'
    ]
    return tasksWithNotes.includes(taskName)
  }

  async fillTaskNotes(taskName) {
    // Look for common note field selectors, starting with most specific
    const noteSelectors = [
      'textarea[name="notes"]',
      'textarea[name="note"]',
      'textarea[name="comment"]',
      'textarea[id="notes"]',
      'textarea[id="note"]',
      'textarea[id="comment"]',
      'textarea[name*="note"]',
      'textarea[id*="note"]',
      'textarea.govuk-textarea',
      'textarea:not([disabled])', // Any enabled textarea as fallback
      '#notes',
      '#comments'
    ]

    let noteField = null
    let foundSelector = null

    for (const selector of noteSelectors) {
      try {
        noteField = await $(selector)
        if ((await noteField.isExisting()) && (await noteField.isDisplayed())) {
          foundSelector = selector
          break
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    if (noteField && (await noteField.isExisting())) {
      const note = this.generateTaskNote(taskName)
      await noteField.waitForEnabled()
      await noteField.setValue(note)
      console.log(
        `✅ Added note for ${taskName} using selector "${foundSelector}": ${note}`
      )
    } else {
      console.log(
        `⚠️ No note field found for ${taskName}. Tried: ${noteSelectors.join(', ')}`
      )
    }
  }

  generateTaskNote(taskName) {
    const notes = {
      'SFI available area check 1':
        'SFI area check completed - verified available area meets requirements.',
      'SFI available area check 2':
        'Second SFI area check completed - all criteria satisfied.',
      'Confirm available area check':
        'Available area check confirmed - documentation reviewed and approved.',
      'SFI intersecting layers check 1':
        'SFI intersecting layers check completed - no conflicts identified.',
      'SFI intersecting layers check 2':
        'Second intersecting layers check completed - all layers verified.'
    }

    return notes[taskName] || `Task completed: ${taskName}`
  }

  generateTaskId(taskName, taskIndex = null) {
    // Map specific task names to their actual IDs from the URLs
    const taskIdMap = {
      'Check application and documents': 'check-application-and-documents',
      'Check on Find farm and land payment data':
        'check-find-farm-and-land-payment-data',
      'Check on RPS (Dual Funding)': 'check-rps-dual-funding',
      'Confirm farm has a CPH': 'confirm-farm-has-cph',
      'Confirm APHA registration': 'confirm-apha-registration',
      'SFI available area check 1': 'so3757-3159',
      'SFI available area check 2': 'so3757-3164',
      'SFI intersecting layers check 1': 'so3756-3059',
      'SFI intersecting layers check 2': 'so3756-3064'
    }

    // Handle duplicate "Confirm available area check" tasks
    if (taskName === 'Confirm available area check') {
      if (taskIndex === 0) {
        return 'so3757-confirm-area-check' // First occurrence (available area)
      } else {
        return 'so3750-confirm-area-check' // Second occurrence (intersecting layers)
      }
    }

    // Return mapped ID or fallback to generated ID
    if (taskIdMap[taskName]) {
      return taskIdMap[taskName]
    }

    // Fallback to original transformation
    return taskName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[()]/g, '')
      .replace(/'/g, '')
      .replace(/[^\w-]/g, '')
  }

  async findAvailableTaskId(baseId, suffixes) {
    // Try each suffix until we find one that exists in the DOM
    for (const suffix of suffixes) {
      const taskId = `${baseId}${suffix}`
      const checkbox = await $(`input#task-${taskId}`)
      if (await checkbox.isExisting()) {
        return taskId
      }
    }
    // Fallback to base ID if none found
    return baseId
  }

  async verifyAllTasksComplete() {
    const tasks = [
      'Check application and documents',
      'Check on Find farm and land payment data',
      'Check on RPS (Dual Funding)',
      'Confirm farm has a CPH',
      'Confirm APHA registration',
      'SFI available area check 1',
      'SFI available area check 2',
      'Confirm available area check',
      'SFI intersecting layers check 1',
      'SFI intersecting layers check 2',
      'Confirm available area check'
    ]

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      const status = await this.getTaskStatusByName(task)
      expect(status).toBe('Complete')
    }
  }

  async completeAllTasks() {
    const tasks = [
      'Check application and documents',
      'Check on Find farm and land payment data',
      'Check on RPS (Dual Funding)',
      'Confirm farm has a CPH',
      'Confirm APHA registration',
      'SFI available area check 1',
      'SFI available area check 2',
      'Confirm available area check', // First occurrence (index 0)
      'SFI intersecting layers check 1',
      'SFI intersecting layers check 2',
      'Confirm available area check' // Second occurrence (index 1)
    ]

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      let taskIndex = null

      // Handle duplicate task names
      if (task === 'Confirm available area check') {
        // Count how many times we've seen this task before
        const previousOccurrences = tasks
          .slice(0, i)
          .filter((t) => t === task).length
        taskIndex = previousOccurrences
      }

      await this.completeTask(task, taskIndex)
    }
  }

  async approveTheDecision() {
    // Select the "confirm-approval" radio button
    // const confirmApprovalRadio = await $('[value="confirm-approval"]')
    const confirmApprovalRadio = await $('#actionId')
    await confirmApprovalRadio.click()

    // Click the Save button
    const saveButton = await $('button=Save')
    await saveButton.click()
  }

  async verifySuccessfulApproval() {
    // This could check for a success message or confirmation
    // For now, we'll just verify the Contracted stage is reached
    return await this.isContractedStageDisplayed()
  }

  async clickTimelineTab() {
    const timelineTab = await $(
      'a.govuk-service-navigation__link[href*="/timeline"]'
    )
    await timelineTab.waitForDisplayed()
    await timelineTab.click()
  }

  async verifyTimelineItem(itemType, expectedCount = null) {
    // Wait for timeline to be displayed
    const timeline = await $('.timeline')
    await timeline.waitForDisplayed()

    // Get all timeline items with the specified type
    const timelineItems = await $$('.timeline__item')
    let matchingItems = 0
    const foundItems = []

    for (const item of timelineItems) {
      const header = await item.$('.timeline__header h2')
      const headerText = await header.getText()
      const cleanText = headerText.trim()

      // Store found items for debugging
      foundItems.push(cleanText)

      if (cleanText === itemType) {
        matchingItems++
      }
    }

    if (expectedCount !== null) {
      if (matchingItems !== expectedCount) {
        console.log(`Looking for: "${itemType}"`)
        console.log(`Found timeline items:`, foundItems)
        throw new Error(
          `Expected ${expectedCount} "${itemType}" timeline items, but found ${matchingItems}`
        )
      }
    } else {
      if (matchingItems === 0) {
        console.log(`Looking for: "${itemType}"`)
        console.log(`Found timeline items:`, foundItems)
        throw new Error(`No "${itemType}" timeline items found`)
      }
    }

    return matchingItems
  }

  async verifyTimelineItemExists(itemType) {
    return (await this.verifyTimelineItem(itemType)) > 0
  }

  async getTimelineItemCount(itemType) {
    return await this.verifyTimelineItem(itemType)
  }

  async verifyLatestTimelineItem(expectedItemType) {
    // Wait for timeline to be displayed
    const timeline = await $('.timeline')
    await timeline.waitForDisplayed()

    // Get the first (latest) timeline item
    const latestItem = await $('.timeline__item:first-child')
    const header = await latestItem.$('.timeline__header h2')
    const headerText = await header.getText()

    if (headerText.trim() !== expectedItemType) {
      throw new Error(
        `Expected latest timeline item to be "${expectedItemType}", but found "${headerText.trim()}"`
      )
    }

    return true
  }

  async enterReason() {
    const approveReasons = [
      'Approved: all documents are valid.',
      'Approval given after review.',
      'Case approved successfully.'
    ]

    const rejectReasons = [
      'Rejected: missing required documents.',
      'Case rejected due to incorrect details.',
      'Rejected: insufficient evidence.'
    ]

    let fieldId, reasons

    // check approve textarea first
    const approveField = await $('#approve-comment')
    if (
      (await approveField.isDisplayed()) &&
      (await approveField.isEnabled())
    ) {
      fieldId = 'approve-comment'
      reasons = approveReasons
    } else {
      // fallback to reject textarea
      const rejectField = await $('#reject-comment')
      await expect(rejectField).toBeDisplayed()
      await expect(rejectField).toBeEnabled()

      fieldId = 'reject-comment'
      reasons = rejectReasons
    }

    // pick a random reason from the correct set
    const randomReason = reasons[Math.floor(Math.random() * reasons.length)]

    // enter text
    const input = await $(`#${fieldId}`)
    await input.setValue(randomReason)

    console.log(
      `✅ Entered ${fieldId.includes('approve') ? 'approve' : 'reject'} reason: ${randomReason}`
    )
    return {
      type: fieldId.includes('approve') ? 'approve' : 'reject',
      reason: randomReason
    }
  }
}

export default new CwHomePage()
