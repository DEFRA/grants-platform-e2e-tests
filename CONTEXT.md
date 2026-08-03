# sfi-reform-service-e2e-tests

End-to-end WebdriverIO coverage for land grants, woodland journeys, casework, and agreement lifecycle flows.

## Language

**Grant journey**
The user-facing application flow under test, from sign-in through answers, review, declaration, submission, and post-submission states.
_Avoid_: Wizard, Survey, Script

**Land action**
A configured environmental action selected by the applicant, such as `CLIG3` or `UPL8`, that drives eligibility, payment, and agreement behaviour.
_Avoid_: Product, Item, Option

**Land parcel**
A registered area of land associated with an SBI and selected for one or more actions.
_Avoid_: Field, Plot, Property

**Consent**
Evidence or confirmation needed before an action can proceed, such as HEFER or SSSI consent.
_Avoid_: Permission when referring to the configured journey requirement, Approval unless it is the official state

**Agreement**
The downstream arrangement reached after an application has an offer and the user accepts it.
_Avoid_: Application, Declaration, Contract when unspecified

**Offer**
The proposal presented for review before an agreement is accepted, terminated, or otherwise acted on.
_Avoid_: Quote, Contract, Confirmation

**Casework**
The internal case-management view used to inspect applications, tasks, timelines, and statuses.
_Avoid_: Admin UI, Back office when a specific casework page is meant

**Task**
A casework or journey unit of work whose completion affects progress through the application or agreement lifecycle.
_Avoid_: Page, Step, Section

**GAS**
The Grants Application Service used for submission and lifecycle state.
_Avoid_: Grants UI Backend, Casework, GPS

**GPS**
The Grant Payments Service used by tests that verify payment-related behaviour.
_Avoid_: GAS, Payment page, Finance system

**CRN**
Customer Reference Number: the Defra ID identifier for an individual user.
_Avoid_: SBI, User ID, Account number

**SBI**
Single Business Identifier: the farm business or organisation represented by the signed-in user.
_Avoid_: CRN, Business name, Holding number
