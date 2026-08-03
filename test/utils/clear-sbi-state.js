import Backend from './backend.js'

/**
 * Clear the SBI state for a given SBI and grant code via the backend
 * /admin/test-data DELETE endpoint.
 *
 * @param {string} crn - The CRN identifier (retained for call-site compatibility).
 * @param {string} sbi - The SBI identifier.
 * @param {string} grantCode - The grant code associated with the SBI.
 */
export async function clearState(crn, sbi, grantCode) {
  await Backend.clearTestData(sbi, grantCode)
}
