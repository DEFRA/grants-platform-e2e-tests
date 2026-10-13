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

async function sendJsonRequest(url, options = {}) {
  const requestContext = await pwRequest.newContext()

  try {
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

  console.log('\n>>>>> OUTGOING REQUEST : health:GET >>>>>')
  console.log(`URL: ${url}`)

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'GET',
    headers: getHeaders()
  })

  console.log('<<<<< INCOMING RESPONSE : health:GET <<<<<')
  console.log(`STATUS: ${statusCode}`)
  console.log(`BODY:   ${JSON.stringify(body)}\n`)

  return { statusCode, body }
}

/**
 * Create Grant Payment
 */
export async function createGrantPayment(payload) {
  const url = `${getBaseUrl()}${endpoint}`

  console.log('\n>>>>> OUTGOING REQUEST : grant-payments:POST >>>>>')
  console.log(`URL: ${url}`)
  console.log(`PAYLOAD: ${JSON.stringify(payload, null, 2)}`)

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'POST',
    headers: getHeaders(),
    data: JSON.stringify(payload)
  })

  console.log('<<<<< INCOMING RESPONSE : grant-payments:POST <<<<<')
  console.log(`STATUS: ${statusCode}`)
  console.log(`BODY: ${JSON.stringify(body, null, 2)}\n`)

  return { statusCode, body }
}

/**
 * Get Grant Payments
 */
export async function getGrantPayments() {
  const url = `${getBaseUrl()}${endpoint}`

  console.log('\n>>>>> OUTGOING REQUEST : grant-payments:GET >>>>>')
  console.log(`URL: ${url}`)

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (Array.isArray(body)) {
    console.log(`RECORDS: ${body.length}`)
  }
  console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n')
  return { statusCode, body }
}

/**
 * Get Grant Payment by SBI ID
 */
export async function getGrantPaymentById(sbiId) {
  const url = `${getBaseUrl()}${endpoint}/${sbiId}`

  console.log(`\n>>>>> OUTGOING REQUEST : grant-payments:GET by SbiId >>>>>`)
  console.log(`URL: ${url}`)

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'GET',
    headers: getHeaders()
  })

  console.log('<<<<< INCOMING RESPONSE : grant-payments:GET by SbiId <<<<<')
  console.log(`STATUS: ${statusCode}`)
  // console.log(`BODY:   ${JSON.stringify(body, null, 2)}\n`)

  return { statusCode, body }
}

/**
 * Get Grant Payment by SBI ID and Account Code
 */
export async function getGrantPaymentBySbiAccountId(sbiId, accountCode) {
  const url = `${getBaseUrl()}${endpoint}/${sbiId}/${accountCode}`

  console.log(
    `\n>>>>> OUTGOING REQUEST : grant-payments:GET by SbiId Account Code >>>>>`
  )
  console.log(`URL: ${url}`)

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'GET',
    headers: getHeaders()
  })

  console.log(
    '<<<<< INCOMING RESPONSE : grant-payments:GET by SbiId Account Code <<<<<'
  )
  console.log(`STATUS: ${statusCode}`)
  console.log(`BODY:   ${JSON.stringify(body, null, 2)}\n`)

  return { statusCode, body }
}

/**
 * Get Daily Payments by Date
 * @param {string} date - Format YYYY-MM-DD
 */
export async function getDailyPayments(date) {
  const endpoint = `api/test/daily-payments/${date}`
  const url = `${getBaseUrl()}${endpoint}`

  console.log(`\n>>>>> OUTGOING REQUEST : daily-payments:GET >>>>>`)
  console.log(`URL: ${url}`)

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'GET',
    headers: getHeaders()
  })

  console.log('<<<<< INCOMING RESPONSE : daily-payments:GET <<<<<')
  console.log(`STATUS: ${statusCode}`)
  if (body.docs) {
    console.log(`RECORDS FOUND: ${body.docs.length}\n`)
  }
  console.log('RESPONSE DATA:', body)
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

  console.log(`\n>>>>> OUTGOING REQUEST : process-payments:POST >>>>>`)
  console.log(`URL: ${url}`)

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'POST',
    headers: getHeaders()
  })

  console.log('<<<<< INCOMING RESPONSE : process-payments:POST <<<<<')
  console.log(`STATUS: ${statusCode}`)

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
  console.log('\n>>>>> OUTGOING REQUEST : cancel-payment:POST (SQS) >>>>>')
  console.log(`URL: ${url}`)
  console.log('HEADERS:', getHeaders())
  console.log('BODY:', JSON.stringify(payload, null, 2))

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'POST',
    headers: getHeaders(),
    data: JSON.stringify(payload)
  })

  console.log('<<<<< INCOMING RESPONSE : cancel-payment:POST <<<<<')
  console.log(`STATUS: ${statusCode}\n`)

  return { statusCode, body }
}

/**
 * Delete Grant Payments - by SBI ID
 * @param {string} sbiId
 */
export async function deleteGrantPaymentsById(sbiId) {
  const url = `${getBaseUrl()}${endpoint}/${sbiId}`
  console.log('\n>>>>> OUTGOING REQUEST : grant-payments:DELETE by SbiId >>>>>')
  console.log(`URL: ${url}`)
  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'DELETE',
    headers: getHeaders()
  })
  console.log('<<<<< INCOMING RESPONSE : grant-payments:DELETE by SbiId <<<<<')
  console.log(`STATUS: ${statusCode}`)
  console.log(`BODY:   ${JSON.stringify(body, null, 2)}\n`)
  return { statusCode, body }
}

/**
 * Trigger Process Payments by SBI
 * @param {string} sbiId
 */
export async function processPaymentsBySbi(sbiId) {
  const url = `${getBaseUrl()}api/test/process-payments-by-sbi/${sbiId}`

  console.log('\n>>>>> OUTGOING REQUEST : process-payments-by-sbi:POST >>>>>')
  console.log(`URL: ${url}`)

  const { statusCode, body } = await sendJsonRequest(url, {
    method: 'POST',
    headers: getHeaders()
  })

  console.log('<<<<< INCOMING RESPONSE : process-payments-by-sbi:POST <<<<<')
  console.log(`STATUS: ${statusCode}`)
  console.log(`BODY: ${JSON.stringify(body, null, 2)}\n`)

  return { statusCode, body }
}
