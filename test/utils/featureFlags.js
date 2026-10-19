export function isClaimsEnabled() {
  return process.env.CONFIGURATION_VARIANT === 'next'
}
export async function claimsStep(test, title, callback) {
  if (isClaimsEnabled()) {
    await test.step(title, callback)
  }
}
