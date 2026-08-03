import { WdioApiClient } from '../utils/api-client.js'
import { addAllureAttachment } from '../utils/allure-helpers.js'
import {
  setCrumb,
  getCrumb,
  setReferenceNumber
} from '../utils/shared-context.js'

function assertStatus(response, expected = 200) {
  if (response.status !== expected) {
    addAllureAttachment('Validation Error', {
      expectedStatus: expected,
      actualStatus: response.status
    })
    throw new Error(`Expected status ${expected} but got ${response.status}`)
  }
}

function extractCrumbFromHtml(html) {
  // Attempt to find a hidden input or meta tag named 'crumb'
  const match =
    html.match(/name=["']?crumb["']?[^>]*value=["']?([^"'>\s]+)/i) ||
    html.match(/\bcrumb\b\s*[:=]\s*["']([^"']+)["']/i)
  return match ? match[1].trim() : undefined
}

function extractReferenceNumberFromHtml(html) {
  // Look for panel body then strong content
  const panelBodyMatch = html.match(
    /<div class="govuk-panel__body">([\s\S]*?)<\/div>/i
  )
  if (!panelBodyMatch) return undefined
  const strongMatch = panelBodyMatch[1].match(/<strong[^>]*>([^<]+)<\/strong>/i)
  return strongMatch ? strongMatch[1].trim() : undefined
}

export async function runFundingApiJourney({
  browser = null,
  username,
  sbi,
  selectedLandParcel,
  landAction,
  consentRequired
} = {}) {
  if (username != null || sbi != null) {
    addAllureAttachment(
      'Journey farmer identifiers',
      JSON.stringify({ username, sbi }),
      'application/json'
    )
  }

  // Create API client with browser context
  const Api = new WdioApiClient({ browser })
  const serviceName = 'farm-payments'

  // 1. GET /farm-payments → extract crumb
  const r1 = await Api.get(`/${serviceName}`)
  assertStatus(r1, 200)

  const crumb = extractCrumbFromHtml(r1.body)
  if (!crumb) throw new Error('Crumb not found in GET /farm-payments response')
  setCrumb(crumb)
  addAllureAttachment('Extracted Crumb', crumb, 'text/plain')

  const c = getCrumb()

  // Helper post with plain text body
  async function postFormUrlEncoded(path, payload) {
    return Api.post(path, payload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  }

  // 2. POST confirm-farm-details
  assertStatus(
    await postFormUrlEncoded(
      `/${serviceName}/confirm-farm-details`,
      `crumb=${c}`
    ),
    200
  )

  // 3. POST confirm-you-will-be-eligible
  assertStatus(
    await postFormUrlEncoded(
      `/${serviceName}/confirm-you-will-be-eligible`,
      `crumb=${c}`
    ),
    200
  )

  // 4. POST confirm-your-land-details-are-up-to-date
  assertStatus(
    await postFormUrlEncoded(
      `/${serviceName}/confirm-your-land-details-are-up-to-date`,
      `crumb=${c}`
    ),
    200
  )

  // 5. POST select-land-parcel (crumb + selectedLandParcel)
  assertStatus(
    await postFormUrlEncoded(
      `/${serviceName}/select-land-parcel`,
      `crumb=${c}&landParcels=${selectedLandParcel}`
    ),
    200
  )

  // 6. POST choose-which-actions-to-do (crumb + landAction)
  assertStatus(
    await postFormUrlEncoded(
      `/${serviceName}/select-actions-for-land-parcel?parcelId=${selectedLandParcel}`,
      `crumb=${c}&landAction_1=${landAction}&parcelId=${selectedLandParcel}`
    ),
    200
  )

  // 7. POST check-selected-land-actions (crumb + addMoreActions=false)
  assertStatus(
    await postFormUrlEncoded(
      `/${serviceName}/check-selected-land-actions`,
      `crumb=${c}&addMoreActions=false`
    ),
    200
  )

  // 8. POST you-must-have-consent when the journey requires that step (crumb)
  if (consentRequired) {
    assertStatus(
      await postFormUrlEncoded(
        `/${serviceName}/you-must-have-consent`,
        `crumb=${c}`
      ),
      200
    )
  }

  // 9. POST submit-your-application (crumb + action=send)

  const r11 = await postFormUrlEncoded(
    `/${serviceName}/submit-your-application`,
    `crumb=${c}&action=send`
  )

  assertStatus(r11, 200)

  // extract application ref
  if (!r11.body.includes('<div class="govuk-panel__body">')) {
    addAllureAttachment(
      'Validation Error',
      'Panel body not found',
      'text/plain'
    )
    throw new Error('Expected confirmation panel body not found in HTML')
  }
  const ref = extractReferenceNumberFromHtml(r11.body)
  if (!ref) throw new Error('Reference number not found in confirmation page')
  setReferenceNumber(ref)
  addAllureAttachment('Extracted Reference Number', ref, 'text/plain')

  return { crumb: c, referenceNumber: ref }
}
