// Shared context for storing values across steps/specs
const store = {
  crumb: undefined,
  referenceNumber: undefined,
  baseUrl: undefined
}

export function setCrumb(value) {
  store.crumb = typeof value === 'string' ? value.trim() : value
}

export function getCrumb() {
  return store.crumb
}

export function setReferenceNumber(value) {
  store.referenceNumber = value
}

export function getReferenceNumber() {
  return store.referenceNumber
}

export function setBaseUrl(value) {
  store.baseUrl = value
}

export function getBaseUrl() {
  return store.baseUrl
}

export default store
