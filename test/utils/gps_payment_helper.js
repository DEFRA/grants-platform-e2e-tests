import { expect } from './test-runtime.js'
import {
  getGrantPaymentById,
  deleteGrantPaymentsById,
  processPaymentsBySbi
} from './grant_payments_service.js'

const getRecordFromResponse = (body) => {
  if (Array.isArray(body?.docs)) {
    return body.docs[0]
  }
  return body
}

const waitForGrantPaymentRecord = async (
  sbi,
  { maxAttempts = 20, delayMs = 2000, validate } = {}
) => {
  let lastResponse

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    console.log(
      `[GPS] waiting for record ${sbi} attempt ${attempt}/${maxAttempts}`
    )

    const response = await getGrantPaymentById(sbi)
    lastResponse = response

    const record = getRecordFromResponse(response.body)
    const isReady = validate ? validate(record) : !!record

    if (isReady) {
      console.log(`[GPS] record ready for SBI ${sbi} on attempt ${attempt}`)
      return response
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  throw new Error(
    `Grant payment record for SBI ${sbi} did not become ready after ${maxAttempts} attempts. Last response: ${JSON.stringify(lastResponse?.body, null, 2)}`
  )
}

export const clearExistingPayments = async (sbi) => {
  console.log(`[GPS] deleteGrantPaymentsById ${sbi}`)
  await deleteGrantPaymentsById(sbi)
  console.log(`[GPS] deleteGrantPaymentsById completed ${sbi}`)
  const getResponse = await getGrantPaymentById(sbi)
  console.log('[GPS] getResponse from getGrantPaymentById')
  expect(getResponse.statusCode).toBe(200)
  expect(getResponse.body.docs).toHaveLength(0)
}

export const runGpsPaymentChecks = async (sbi) => {
  //  Step 1: Wait for the grant payment record to be available and valid
  console.log(`[GPS] Step 1`)
  console.log(`[GPS] START for SBI ${sbi}`)
  const { body: initialBody, statusCode: initialStatusCode } =
    await waitForGrantPaymentRecord(sbi, {
      maxAttempts: 20,
      delayMs: 2000,
      validate: (record) =>
        !!record &&
        record.sbi === sbi &&
        Array.isArray(record.grants) &&
        record.grants.length > 0
    })
  console.log(`[GPS] record available for SBI ${sbi}`)
  expect(initialStatusCode).toBe(200)

  const recordData = getRecordFromResponse(initialBody)
  console.log('[GPS] initial record summary', {
    sbi: recordData?.sbi,
    grantCount: recordData?.grants?.length,
    paymentCount: recordData?.grants?.[0]?.payments?.length,
    statuses: recordData?.grants?.[0]?.payments?.map(
      (payment) => payment.status
    )
  })
  expect(recordData).toBeDefined()
  expect(recordData.sbi).toBe(sbi)
  expect(recordData.grants).toHaveLength(1)
  const payments = recordData.grants[0].payments
  expect(payments).toHaveLength(1)

  // Step 2:  Process Payment to Payment Hub
  console.log(`[GPS] Step 2`)
  console.log(`[GPS] before processPaymentsBySbi for SBI ${sbi}`)
  const { statusCode, body: processResult } = await processPaymentsBySbi(sbi)
  console.log(
    `[GPS] process call completed for SBI ${sbi} status=${statusCode}`
  )
  expect(statusCode).toBe(200)
  expect(processResult.result).toHaveLength(1)
  payments.forEach((payment) => {
    const processedItem = processResult.result.find(
      (item) => item.body.correlationId === payment.correlationId
    )
    console.log('[GPS] processed payload summary', {
      sbi: processedItem.body.sbi,
      correlationId: processedItem.body.correlationId,
      invoiceNumber: processedItem.body.invoiceNumber,
      dueDate: processedItem.body.dueDate,
      paymentLines: processedItem.body.invoiceLines?.length,
      sourceSystem: processedItem.body.sourceSystem,
      status: processedItem.body.status
    })

    expect(processedItem).toBeDefined()
    expect(processedItem.body.sbi).toBe(sbi)
    expect(processedItem.body.correlationId).toBe(payment.correlationId)
    expect(processedItem.body.invoiceLines).toBeDefined()
    expect(processedItem.body.invoiceLines.length).toBeGreaterThan(0)
    expect(processedItem.body.sourceSystem).toBe('WMP')
    expect(processedItem.body.ledger).toBe('AP')
    expect(processedItem.body.deliveryBody).toBe('RP10')
    expect(processedItem.body.invoiceNumber).toBeTruthy()
    expect(processedItem.body.frn).toBeTruthy()
    expect(processedItem.body.sbi).toBe(sbi)
    expect(processedItem.body.fesCode).toBe('FALS_WMP')
    expect(processedItem.body.marketingYear).toBe('2026')
    expect(processedItem.body.paymentRequestNumber).toBeTruthy()
    expect(processedItem.body.currency).toBe('GBP')
    expect(processedItem.body.remittanceDescription).toBe(
      'Woodland Management Plan Payment'
    )
    expect(processedItem.body.value).toBeTruthy()
    expect(processedItem.body.contractNumber).toBeTruthy()
    expect(processedItem.body.correlationId).toBe(payment.correlationId)
    processedItem.body.invoiceLines.forEach((line, index) => {
      console.log('[GPS] invoice line', {
        index: index + 1,
        schemeCode: line.schemeCode,
        accountCode: line.accountCode,
        fundCode: line.fundCode,
        description: line.description,
        value: line.value
      })

      expect(line.schemeCode).toBeDefined()
      expect(line.schemeCode).not.toBe('')
      expect(line.schemeCode).not.toBeNull()
      expect(line.accountCode).toBe('SOS710')
      expect(line.fundCode).toBe('DRD10')
      expect(line.deliveryBody).toBe('RP10')
      expect(line.marketingYear).toBe('2026')
      expect(line.description).toBeTruthy()
      expect(line.value).toBeTruthy()
    })
  })
  // Step 3: check status is submitted
  console.log(`[GPS] Step 3`)
  console.log(`[GPS] before final getGrantPaymentById for SBI ${sbi}`)
  const { body: updatedBody, statusCode: updatedStatusCode } =
    await waitForGrantPaymentRecord(sbi, {
      maxAttempts: 20,
      delayMs: 2000,
      validate: (record) => {
        const paymentList = record?.grants?.[0]?.payments || []
        return (
          paymentList.length === 1 &&
          paymentList.every((payment) => payment.status === 'submitted')
        )
      }
    })
  console.log(`[GPS] final state reached for SBI ${sbi}`)
  expect(updatedStatusCode).toBe(200)

  const updatedData = getRecordFromResponse(updatedBody)
  const updatedPayments = updatedData.grants[0].payments
  expect(updatedPayments).toHaveLength(1)

  updatedPayments.forEach((payment, index) => {
    console.log('[GPS] final payment status', {
      index: index + 1,
      correlationId: payment.correlationId,
      status: payment.status
    })
    // expect(payment.status).toBe('submitted')
  })

  console.log(`[GPS] COMPLETED SUCCESSFULLY for SBI ${sbi}`)
}
