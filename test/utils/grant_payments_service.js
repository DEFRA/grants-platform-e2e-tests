import { request as pwRequest } from '@playwright/test'
import { browser } from './test-runtime.js'
import { loadTestConfig } from './test-config.js'

const endpoint = 'api/test/grant-payments'
const getBaseUrl = () => {
  const configuredUrl =
    browser.options?.gpsUrl ||
    process.env.BASE_URL ||
    loadTestConfig(process.env.PLAYWRIGHT_PROFILE || 'local').gpsUrl

  return configuredUrl || 'http://localhost:3000/'
}

function formatBodyForLog(body) {
  if (body === undefined || body === null || body === '') {
    return '<empty>'
  }

  try {
    return JSON.stringify(body, null, 2)
  } catch {
    return String(body)
  }
}

async function sendJsonRequest(url, options = {}) {
  const requestContext = await pwRequest.newContext()

  try {
    const method = options.method || 'GET'

    console.log(`\n[GPS API] ${method} ${url}`)
    if (options.data !== undefined) {
      console.log('[GPS API request body]')
      console.log(formatBodyForLog(options.data))
    }

    const response = await requestContext.fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })

    const responseText = await response.text()
    let responseData = responseText

    if (responseText) {
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }
    }

    console.log(`[GPS API response] status=${response.status()} url=${url}`)
    console.log(formatBodyForLog(responseData))

    return { statusCode: response.status(), body: responseData }
  } finally {
    await requestContext.dispose()
  }
}

/**
 * Internal helper to handle common headers
 */
function getHeaders() {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Accept-Encoding': '*'
  }
  if (process.env.RUN_ENV === 'local') {
    headers['x-api-key'] = process.env.GRANTS_UI_BACKEND_API_KEY
  }
  return headers
}

/**
 * GET Health Status
 */
export async function getHealth() {
  const url = `${getBaseUrl()}health`

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'GET',
    headers: getHeaders()
  })

  return { statusCode, body }
}

/**
 * Create Grant Payment
 */
export async function createGrantPayment(payload) {
  const url = `${getBaseUrl()}${endpoint}`

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'POST',
    headers: getHeaders(),
    data: JSON.stringify(payload)
  })

  return { statusCode, body }
}

/**
 * Get Grant Payments
 */
export async function getGrantPayments() {
  const url = `${getBaseUrl()}${endpoint}`

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'GET',
    headers: getHeaders()
  })

  return { statusCode, body }
}

/**
 * Get Grant Payment by SBI ID
 */
export async function getGrantPaymentById(sbiId) {
  const url = `${getBaseUrl()}${endpoint}/${sbiId}`

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'GET',
    headers: getHeaders()
  })

  return { statusCode, body }
}

/**
 * Get Grant Payment by SBI ID and Account Code
 */
export async function getGrantPaymentBySbiAccountId(sbiId, accountCode) {
  const url = `${getBaseUrl()}${endpoint}/${sbiId}/${accountCode}`

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'GET',
    headers: getHeaders()
  })

  return { statusCode, body }
}

/**
 * Get Daily Payments by Date
 * @param {string} date - Format YYYY-MM-DD
 */
export async function getDailyPayments(date) {
  const endpoint = `api/test/daily-payments/${date}`
  const url = `${getBaseUrl()}${endpoint}`

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'GET',
    headers: getHeaders()
  })

  return { statusCode, body }
}

/**
 * Trigger Process Payments
 * @param {string} [date] - Optional format YYYY-MM-DD.
 * If omitted, the API defaults to tomorrow's date.
 */
export async function processPayments(date) {
  const path = date
    ? `api/test/process-payments/${date}`
    : `api/test/process-payments`
  const url = `${getBaseUrl()}${path}`

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'POST',
    headers: getHeaders()
  })

  return { statusCode, body }
}

/**
 * Trigger Cancellation via SQS
 * @param {object} data - { sbi, frn }
 */
export async function cancelPayment(data) {
  const url = `${getBaseUrl()}api/test/queue-message/gps__sqs__cancel_payment.fifo`
  const payload = {
    type: 'cancel_payment',
    data
  }

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'POST',
    headers: getHeaders(),
    data: JSON.stringify(payload)
  })

  return { statusCode, body }
}

/**
 * Delete Grant Payments - by SBI ID
 * @param {string} sbiId
 */
export async function deleteGrantPaymentsById(sbiId) {
  const url = `${getBaseUrl()}${endpoint}/${sbiId}`

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'DELETE',
    headers: getHeaders()
  })

  return { statusCode, body }
}

/**
 * Trigger Process Payments by SBI
 * @param {string} sbiId
 */
export async function processPaymentsBySbi(sbiId) {
  const url = `${getBaseUrl()}api/test/process-payments-by-sbi/${sbiId}`

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'POST',
    headers: getHeaders()
  })

  return { statusCode, body }
}
