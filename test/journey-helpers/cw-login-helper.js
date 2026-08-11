import { $, browser } from '../utils/test-runtime.js'

const ENTRA_LOGIN_FIELD_TIMEOUT = 50000
const CW_PORTAL_DOMAIN = 'fg-cw-frontend'
const MICROSOFT_LOGIN_DOMAIN = 'login.microsoftonline.com'

function getUrlHostname(url) {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

function isCaseworkerPortalUrl(url) {
  return getUrlHostname(url).startsWith(CW_PORTAL_DOMAIN)
}

function isMicrosoftLoginUrl(url) {
  return getUrlHostname(url).includes(MICROSOFT_LOGIN_DOMAIN)
}

export { isCaseworkerPortalUrl }

export async function entraLogin(username, password) {
  if (isCaseworkerPortalUrl(await browser.getUrl())) {
    console.log('Already on caseworker portal — skipping Entra ID login')
    return
  }

  await performLogin(username, password)
  await waitForAppLoadOrRetry(username, password)
  console.log(`Entra ID login successful for ${username}`)
}

export async function waitForCaseworkerPortalOrLogin() {
  await browser.waitUntil(
    async () => {
      const currentUrl = await browser.getUrl()
      return (
        isCaseworkerPortalUrl(currentUrl) || isMicrosoftLoginUrl(currentUrl)
      )
    },
    {
      timeout: ENTRA_LOGIN_FIELD_TIMEOUT,
      timeoutMsg: 'Caseworker portal or Microsoft login page did not load'
    }
  )
}

/**
 * Performs the base login steps (enter email, password, click sign in).
 */
async function performLogin(username, password) {
  await browser.waitUntil(
    async () => isMicrosoftLoginUrl(await browser.getUrl()),
    {
      timeout: ENTRA_LOGIN_FIELD_TIMEOUT,
      timeoutMsg: 'Microsoft login page did not load'
    }
  )

  const emailField = await $('#i0116')
  await emailField.waitForDisplayed({ timeout: ENTRA_LOGIN_FIELD_TIMEOUT })
  await emailField.setValue(username)
  await (await $('#idSIButton9')).click() // Next
  await browser.pause(5000)
  const passwordField = await $('#i0118')
  await passwordField.waitForDisplayed({ timeout: ENTRA_LOGIN_FIELD_TIMEOUT })
  await passwordField.setValue(password)

  // sometime sign in button don't click
  await clickSignInWithRetry()
}

/**
 * Waits until app loads or retries login if redirect goes back to Microsoft login page.
 */
async function waitForAppLoadOrRetry(username, password) {
  let retryCount = 0
  const maxRetries = 2

  await browser.waitUntil(
    async () => {
      const currentUrl = await browser.getUrl()
      if (isCaseworkerPortalUrl(currentUrl)) {
        return true
      }
      if (isMicrosoftLoginUrl(currentUrl) && retryCount < maxRetries) {
        retryCount++
        await performRetryLogin(username, password)
      }

      return false
    },
    {
      timeout: 60000,
      interval: 2000,
      timeoutMsg: 'App did not load after Entra ID login redirect'
    }
  )
}

/**
 * Retry login flow if the Microsoft login page reappears.
 */
async function performRetryLogin(username, password) {
  const emailField = await $('#i0116')
  if (await emailField.isDisplayed()) {
    console.log('Retrying login (email page detected)')
    await emailField.setValue(username)
    await (await $('#idSIButton9')).click()
  }

  // Wait for password input field
  const passwordField = await $('#i0118')
  if (await passwordField.isDisplayed()) {
    await passwordField.setValue(password)
    await (await $('#idSIButton9')).click()
  }

  // Optional: handle "Stay signed in?" again
  const staySignedIn = await $('#idBtn_Back')
  if (await staySignedIn.isDisplayed()) {
    await staySignedIn.click()
  }
}

async function clickSignInWithRetry(maxRetries = 3) {
  const signInButtonSelector = '#idSIButton9'
  const loginHeaderSelector = '#loginHeader'

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const signInButton = await $(signInButtonSelector)
    await signInButton.waitForDisplayed({ timeout: 10000 })
    await signInButton.waitForEnabled({ timeout: 10000 })
    await signInButton.scrollIntoView()
    await signInButton.moveTo()

    await signInButton.click()
    await browser.pause(2000)

    const loginHeader = await $(loginHeaderSelector)
    if (await loginHeader.isDisplayed()) {
      const headerText = (await loginHeader.getText()).trim()
      if (headerText === 'Enter password') {
        console.warn(
          `Still on password page after click (attempt ${attempt}). Retrying...`
        )
        continue
      }
    }

    // Check if URL changed (redirect started)
    const currentUrl = await browser.getUrl()
    if (!isMicrosoftLoginUrl(currentUrl)) {
      console.log('Redirected away from Microsoft login.')
      return
    }

    console.warn(
      `Still on login.microsoftonline.com (attempt ${attempt}). Retrying...`
    )
  }

  throw new Error('Login stuck on password page after multiple retries.')
}
