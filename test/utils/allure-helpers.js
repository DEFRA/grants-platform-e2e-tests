import { attachment, step } from 'allure-js-commons'

function stringify(value) {
  try {
    if (typeof value === 'string') return value
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function addAllureAttachment(name, content, type = 'application/json') {
  const body = typeof content === 'string' ? content : stringify(content)
  attachment(name, body, type)
}

export async function logApiStep({ title, request, response, validation }) {
  const stepTitle = title || `${request?.method || 'GET'} ${request?.url || ''}`
  await step(stepTitle, async () => {
    if (request) {
      addAllureAttachment('API Request - URL', request.url, 'text/plain')
      if (request.headers) {
        addAllureAttachment('API Request - Headers', request.headers)
      }
      if (request.body !== undefined) {
        const type =
          typeof request.body === 'string' ? 'text/plain' : 'application/json'
        addAllureAttachment('API Request - Body', request.body, type)
      }
    }
    if (response) {
      addAllureAttachment(
        'API Response - Status',
        stringify({ status: response.status, ok: response.ok }),
        'application/json'
      )
      if (response.headers) {
        addAllureAttachment('API Response - Headers', response.headers)
      }
      if (response.body !== undefined) {
        const contentType = response.contentType || 'text/plain'
        addAllureAttachment(
          'API Response - Body',
          response.body,
          contentType.includes('json') ? 'application/json' : 'text/plain'
        )
      }
    }
    if (validation) {
      addAllureAttachment('Validation', validation, 'application/json')
    }
  })
}
