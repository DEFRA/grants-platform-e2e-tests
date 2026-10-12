import GrantsPlatformAdminPage from '../page-objects/grants.platform.admin.page.js'
import { step } from '../utils/report-step.js'

export async function approveClaimAsGrantsPlatformAdministrator(appRefNum) {
  await step(
    'Navigate to Grants Platform Administrator Page to approve the claim',
    async () => {
      await GrantsPlatformAdminPage.openWoodlandClaims(appRefNum)
    }
  )

  await step('Approve claim as Grants Platform Administrator', async () => {
    await GrantsPlatformAdminPage.createClaimableItem('50')
  })
}
