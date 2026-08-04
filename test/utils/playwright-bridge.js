import { expect as playwrightExpect } from '@playwright/test'

let activePage
let activeContext
let activeConfig = {}
const pageHandles = new WeakMap()

function getPage() {
  if (!activePage) {
    throw new Error(
      'Playwright page is not initialised. Ensure tests use the base fixture.'
    )
  }
  return activePage
}

function getContext() {
  if (!activeContext) {
    throw new Error(
      'Playwright context is not initialised. Ensure tests use the base fixture.'
    )
  }
  return activeContext
}

export function initBridge({ page, context, config = {} }) {
  activePage = page
  activeContext = context
  activeConfig = config
  syncPageHandles()
}

export function clearBridge() {
  activePage = undefined
  activeContext = undefined
  activeConfig = {}
}

function syncPageHandles() {
  for (const page of getContext().pages()) {
    pageHandles.set(page, page)
  }
}

function splitCssTextSelector(selector) {
  let bracketDepth = 0

  for (let i = selector.length - 1; i >= 0; i -= 1) {
    const char = selector[i]

    if (char === ']') {
      bracketDepth += 1
    } else if (char === '[') {
      bracketDepth -= 1
    } else if (char === '=' && bracketDepth === 0) {
      const css = selector.slice(0, i).trim()
      const text = selector.slice(i + 1).trim()

      if (!css || !text) {
        return null
      }

      return { css, text }
    }
  }

  return null
}

function parseSelector(selector) {
  const normalized = selector.trim()

  if (normalized.startsWith('=')) {
    return { type: 'text', text: normalized.slice(1), exact: true }
  }

  const partialTagMatch = normalized.match(/^([a-zA-Z][\w-]*)\*=(.+)$/)
  if (partialTagMatch) {
    return {
      type: 'tagPartial',
      tag: partialTagMatch[1],
      text: partialTagMatch[2].trim()
    }
  }

  const tagTextMatch = normalized.match(/^([a-zA-Z][\w-]*)=(.+)$/)
  if (tagTextMatch) {
    return {
      type: 'tagText',
      tag: tagTextMatch[1],
      text: tagTextMatch[2].trim()
    }
  }

  const cssText = splitCssTextSelector(normalized)
  if (cssText) {
    return { type: 'cssText', css: cssText.css, text: cssText.text }
  }

  if (normalized.startsWith('//') || normalized.startsWith('(//')) {
    return { type: 'xpath', selector: normalized }
  }

  return { type: 'css', selector: normalized }
}

function isNavigationError(error) {
  const message = error?.message ?? ''
  return (
    message.includes('Execution context was destroyed') ||
    message.includes('Target closed') ||
    message.includes('frame was detached')
  )
}

function resolveLocator(root, selector) {
  const parsed = parseSelector(selector)

  switch (parsed.type) {
    case 'text':
      return root.getByText(parsed.text, { exact: parsed.exact })
    case 'tagPartial':
      return root.locator(parsed.tag).filter({ hasText: parsed.text })
    case 'tagText': {
      if (parsed.tag === 'a') {
        return root.getByRole('link', { name: parsed.text })
      }
      if (parsed.tag === 'button') {
        return root.getByRole('button', { name: parsed.text })
      }
      return root.locator(parsed.tag).filter({ hasText: parsed.text })
    }
    case 'cssText':
      return root.locator(parsed.css).filter({ hasText: parsed.text })
    case 'xpath':
      return root.locator(`xpath=${parsed.selector}`)
    default:
      return root.locator(parsed.selector)
  }
}

class ElementWrapper {
  constructor(locator, page) {
    this.locator = locator
    this.page = page
  }

  $(selector) {
    return new ElementWrapper(
      resolveLocator(this.locator, selector).first(),
      this.page
    )
  }

  async click(options = {}) {
    await this.locator.scrollIntoViewIfNeeded()
    try {
      await this.locator.click({
        timeout: activeConfig.waitforTimeout ?? 10000,
        ...options
      })
    } catch (error) {
      await this.locator.click({ force: true, ...options })
    }
  }

  async setValue(value) {
    await this.locator.scrollIntoViewIfNeeded()
    await this.locator.fill(String(value))
  }

  async clearValue() {
    await this.locator.clear()
  }

  async getText() {
    const text = (await this.locator.textContent()) ?? ''
    return text.replace(/\s+/g, ' ').trim()
  }

  async getValue() {
    return this.locator.inputValue()
  }

  async getAttribute(name) {
    return this.locator.getAttribute(name)
  }

  async isDisplayed() {
    try {
      return await this.locator.isVisible()
    } catch (error) {
      if (isNavigationError(error)) {
        return false
      }
      throw error
    }
  }

  async isExisting() {
    try {
      return (await this.locator.count()) > 0
    } catch (error) {
      if (isNavigationError(error)) {
        return false
      }
      throw error
    }
  }

  async isSelected() {
    return this.locator.isChecked()
  }

  async isEnabled() {
    return this.locator.isEnabled()
  }

  async waitForDisplayed({
    timeout = activeConfig.waitforTimeout ?? 10000
  } = {}) {
    await this.locator.waitFor({ state: 'visible', timeout })
  }

  async waitForClickable({
    timeout = activeConfig.waitforTimeout ?? 10000
  } = {}) {
    await this.locator.waitFor({ state: 'visible', timeout })
    await playwrightExpect(this.locator).toBeEnabled({ timeout })
  }

  async waitForEnabled({
    timeout = activeConfig.waitforTimeout ?? 10000
  } = {}) {
    await this.locator.waitFor({ state: 'attached', timeout })
    await playwrightExpect(this.locator).toBeEnabled({ timeout })
  }

  async waitForExist({ timeout = activeConfig.waitforTimeout ?? 10000 } = {}) {
    await this.locator.waitFor({ state: 'attached', timeout })
  }

  async scrollIntoView() {
    await this.locator.scrollIntoViewIfNeeded()
  }

  async moveTo() {
    await this.locator.hover()
  }

  async parentElement() {
    return new ElementWrapper(this.locator.locator('xpath=..'), this.page)
  }
}

function createElementArrayWrapper(locator, page) {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop === 'symbol') {
          return undefined
        }

        if (/^\d+$/.test(String(prop))) {
          return new ElementWrapper(locator.nth(Number(prop)), page)
        }

        if (prop === 'length') {
          return locator.count()
        }

        if (prop === 'then') {
          return (resolve, reject) =>
            locator
              .count()
              .then((count) => {
                const items = Array.from(
                  { length: count },
                  (_, index) => new ElementWrapper(locator.nth(index), page)
                )
                resolve(items)
              })
              .catch(reject)
        }

        return undefined
      }
    }
  )
}

export function $(selector, page = getPage()) {
  return new ElementWrapper(resolveLocator(page, selector).first(), page)
}

export function $$(selector, page = getPage()) {
  return createElementArrayWrapper(resolveLocator(page, selector), page)
}

function resolveNavigationUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const baseUrl = activeConfig.baseUrl || getPage().url()
  return new URL(path.startsWith('/') ? path : `/${path}`, baseUrl).href
}

export const browser = {
  get options() {
    return activeConfig
  },

  async url(path) {
    const page = getPage()
    await page.goto(resolveNavigationUrl(path), {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    })
    await page.bringToFront()
  },

  async pause(ms) {
    await getPage().waitForTimeout(ms)
  },

  async refresh() {
    await getPage().reload()
  },

  async getUrl() {
    return getPage().url()
  },

  async takeScreenshot() {
    await getPage().screenshot({ fullPage: true })
  },

  async deleteCookies() {
    await getContext().clearCookies()
  },

  async execute(fn, arg) {
    if (arg instanceof ElementWrapper) {
      return arg.locator.evaluate(fn)
    }

    if (arg !== undefined) {
      return getPage().evaluate(fn, arg)
    }

    return getPage().evaluate(fn)
  },

  async executeScript(script) {
    return getPage().evaluate(script)
  },

  async waitUntil(fn, { timeout = 10000, interval = 200, timeoutMsg } = {}) {
    const start = Date.now()

    while (Date.now() - start < timeout) {
      if (await fn()) {
        return true
      }
      await getPage().waitForTimeout(interval)
    }

    throw new Error(timeoutMsg || `waitUntil timed out after ${timeout}ms`)
  },

  async getWindowHandles() {
    syncPageHandles()
    return getContext().pages()
  },

  async switchToWindow(handle) {
    if (!handle || typeof handle.bringToFront !== 'function') {
      throw new Error('Invalid Playwright page handle passed to switchToWindow')
    }

    activePage = handle
    await activePage.bringToFront()
  },

  async closeWindow() {
    const current = getPage()
    const pages = getContext().pages()
    const fallback = pages.find((page) => page !== current) || pages[0]

    await current.close()

    if (fallback && !fallback.isClosed()) {
      activePage = fallback
      await activePage.bringToFront()
    }
  }
}

function createElementExpect(wrapper) {
  return {
    toBeDisplayed: () => playwrightExpect(wrapper.locator).toBeVisible(),
    toBeEnabled: () => playwrightExpect(wrapper.locator).toBeEnabled(),
    toBeSelected: () => playwrightExpect(wrapper.locator).toBeChecked()
  }
}

function createPageExpect(page) {
  return {
    toHaveTitle: (title) => playwrightExpect(page).toHaveTitle(title)
  }
}

/* eslint-disable playwright/valid-expect */
export function expect(actual) {
  if (actual instanceof ElementWrapper) {
    return createElementExpect(actual)
  }

  if (actual === browser) {
    return createPageExpect(getPage())
  }

  return playwrightExpect(actual)
}

export { getPage, getContext }
