import { fetch } from 'undici'
import { logApiStep } from '../utils/allure-helpers.js'

function mergeHeaders(base = {}, extra = {}) {
  return { ...base, ...extra }
}

class WdioApiClient {
  constructor(options = {}) {
    // Use the same base URL as the WebdriverIO configuration
    this.baseUrl =
      options.baseUrl ||
      `https://grants-ui.${process.env.ENVIRONMENT}.cdp-int.defra.cloud`
    this.defaultHeaders = options.headers || { 'Content-Type': 'text/plain' }
    this._clientPromise = undefined
    this.browser = options.browser || null
  }

  async getClient() {
    // For undici, we don't need to create a client instance
    // We can use the request function directly
    return null
  }

  buildUrl(path) {
    if (!path) return this.baseUrl
    if (path.startsWith('http')) return path
    const base = this.baseUrl?.replace(/\/$/, '') || ''
    const suffix = path.startsWith('/') ? path : `/${path}`
    return `${base}${suffix}`
  }

  async request(method, path, { headers = {}, body } = {}) {
    const url = this.buildUrl(path)
    let finalHeaders = mergeHeaders(this.defaultHeaders, headers)

    // Add cookies from browser if available
    if (this.browser) {
      try {
        const cookies = this.browser.cookies
          ? await this.browser.cookies()
          : await this.browser.getAllCookies()
        if (cookies && cookies.length > 0) {
          const cookieHeader = cookies
            .map((cookie) => `${cookie.name}=${cookie.value}`)
            .join('; ')
          finalHeaders = { ...finalHeaders, Cookie: cookieHeader }

          // Extract CSRF token from cookies if available
          const csrfCookie = cookies.find((cookie) => cookie.name === 'crumb')
          if (csrfCookie && method === 'POST') {
            // Try multiple common CSRF header names
            finalHeaders = {
              ...finalHeaders,
              'X-CSRF-Token': csrfCookie.value,
              'X-CSRF-TOKEN': csrfCookie.value,
              'X-XSRF-TOKEN': csrfCookie.value,
              'X-Requested-With': 'XMLHttpRequest'
            }
          }
        }
      } catch (err) {
        console.log('Failed to get browser cookies:', err.message)
      }
    }

    const requestInfo = { method, url, headers: finalHeaders, body }

    // Debug: log the request details
    console.log('API Request:', { method, url, headers: finalHeaders })

    let res
    let text
    let contentType
    try {
      res = await fetch(url, {
        method,
        redirect: 'follow',
        headers: finalHeaders,
        body: body === undefined ? undefined : body
      })

      contentType = res.headers['content-type'] || ''
      text = await res.text()
    } catch (err) {
      logApiStep({
        title: `API ${method} ${url} - network error`,
        request: requestInfo,
        response: {
          status: 0,
          ok: false,
          headers: {},
          body: String(err),
          contentType: 'text/plain'
        },
        validation: { error: String(err) }
      })
      throw err
    }

    const responseInfo = {
      status: res.status,
      ok: res.status >= 200 && res.status < 300,
      headers: res.headers,
      body: text,
      contentType
    }

    logApiStep({
      title: `API ${method} ${url}`,
      request: requestInfo,
      response: responseInfo
    })

    return responseInfo
  }

  get(path, options = {}) {
    return this.request('GET', path, options)
  }

  post(path, body, options = {}) {
    return this.request('POST', path, { ...options, body })
  }
}

const ApiClient = new WdioApiClient()
export { WdioApiClient }
export default ApiClient
