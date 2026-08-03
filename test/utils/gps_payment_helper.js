import { expect } from './test-runtime.js'
import {
  getGrantPaymentById,
  deleteGrantPaymentsById,
  processPaymentsBySbi
} from './grant_payments_service.js'

export const clearExistingPayments = async (sbi) => {
  await deleteGrantPaymentsById(sbi)
  const getResponse = await getGrantPaymentById(sbi)
  expect(getResponse.statusCode).toBe(200)
  expect(getResponse.body.docs).toHaveLength(0)
}

export const runGpsPaymentChecks = async (sbi) => {
  console.log(`runGpsPaymentChecks: START for SBI ${sbi}`)

  const getGrantPaymentByIdWithRetry = async (
    sbi,
    { maxRetries = 20, delayMs = 10000, validate } = {}
  ) => {
    let lastResult

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(
        `\n========== GET GRANT PAYMENT ATTEMPT ${attempt}/${maxRetries} ==========`
      )

      const result = await getGrantPaymentById(sbi)
      lastResult = result

      console.log('Raw API response:\n', JSON.stringify(result?.body, null, 2))

      const record = Array.isArray(result?.body?.docs)
        ? result.body.docs[0]
        : result?.body

      // console.log('Extracted record:\n', JSON.stringify(record, null, 2))

      let isValid = true

      if (validate) {
        try {
          isValid = validate(record)

          console.log(`Validation result: ${isValid}`)
        } catch (error) {
          console.log(`Validation threw error: ${error.message}`)
          isValid = false
        }
      }

      if (isValid) {
        console.log(`Validation passed on attempt ${attempt}`)
        return result
      }

      console.log(`Validation failed on attempt ${attempt}`)

      if (attempt < maxRetries) {
        console.log(`Waiting ${delayMs}ms before retry...`)

        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    throw new Error(
      `Condition not met after ${maxRetries} retries for SBI ${sbi}.
Last response:
${JSON.stringify(lastResult?.body, null, 2)}`
    )
  }

  //
  // STEP 1: Retry until the record exists
  //
  console.log(
    `\n========== WAITING FOR INITIAL RECORD FOR SBI ${sbi} ==========`
  )

  const { body: initialBody } = await getGrantPaymentByIdWithRetry(sbi, {
    maxRetries: 20,
    delayMs: 5000,
    validate: (record) => {
      console.log(
        `Initial record validation:
record exists = ${!!record}
sbi = ${record?.sbi}
grants count = ${record?.grants?.length || 0}`
      )

      return (
        !!record &&
        record.sbi === sbi &&
        Array.isArray(record.grants) &&
        record.grants.length > 0
      )
    }
  })

  const recordData = Array.isArray(initialBody.docs)
    ? initialBody.docs[0]
    : initialBody

  console.log('\n========== INITIAL RECORD FOUND ==========')
  console.log(JSON.stringify(recordData, null, 2))

  expect(recordData).toBeDefined()
  expect(recordData.sbi).toBe(sbi)
  expect(recordData.grants).toHaveLength(1)

  const payments = recordData.grants[0].payments

  console.log(`Found ${payments?.length || 0} payments`)

  expect(payments).toHaveLength(4)

  payments.forEach((payment, index) => {
    console.log(
      `Payment ${index + 1}: correlationId=${payment.correlationId}, status=${payment.status}`
    )

    expect(payment.status).toBe('pending')
  })

  //
  // STEP 2: Process payments
  //
  console.log(`\n========== PROCESSING PAYMENTS FOR SBI ${sbi} ==========`)

  const { statusCode, body: processResult } = await processPaymentsBySbi(sbi)

  console.log(`Process status code: ${statusCode}`)
  console.log('Process response:\n', JSON.stringify(processResult, null, 2))

  expect(statusCode).toBe(200)
  expect(processResult.result).toHaveLength(4)

  //
  // STEP 3: Validate processed payments
  //
  payments.forEach((payment) => {
    const processedItem = processResult.result.find(
      (item) => item.body.correlationId === payment.correlationId
    )

    console.log(`Checking processed payment: ${payment.correlationId}`)

    expect(processedItem).toBeDefined()

    console.log('Processed item:\n', JSON.stringify(processedItem, null, 2))

    expect(processedItem.body.sbi).toBe(sbi)
    expect(processedItem.body.correlationId).toBe(payment.correlationId)

    const expectedDueDate = new Date(payment.dueDate).toLocaleDateString(
      'en-GB',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    )

    console.log(`Expected due date: ${expectedDueDate}`)
    console.log(`Actual due date: ${processedItem.body.dueDate}`)

    expect(processedItem.body.dueDate).toBe(expectedDueDate)

    console.log(
      `Processed payment invoice: ${processedItem.body.invoiceNumber}`
    )

    expect(processedItem.body.invoiceLines).toBeDefined()
    expect(processedItem.body.invoiceLines.length).toBeGreaterThan(0)

    processedItem.body.invoiceLines.forEach((line, index) => {
      console.log(`Invoice line ${index + 1}:`, JSON.stringify(line, null, 2))

      expect(line.schemeCode).toBeDefined()
      expect(line.schemeCode).not.toBe('')
      expect(line.schemeCode).not.toBeNull()

      expect(line.accountCode).toBe('SOS710')
      expect(line.fundCode).toBe('DRD10')
    })
  })

  //
  // STEP 4: Retry until all statuses become submitted
  //
  console.log(`\n========== WAITING FOR SUBMITTED STATUS UPDATE ==========`)

  const { body: updatedRecord } = await getGrantPaymentByIdWithRetry(sbi, {
    maxRetries: 10,
    delayMs: 2000,
    validate: (record) => {
      const payments = record?.grants?.[0]?.payments || []

      console.log(
        `Status validation:
payments found = ${payments.length}
statuses = ${payments.map((p) => p.status).join(', ')}`
      )

      return (
        payments.length === 4 &&
        payments.every((payment) => payment.status === 'submitted')
      )
    }
  })

  const updatedData = Array.isArray(updatedRecord.docs)
    ? updatedRecord.docs[0]
    : updatedRecord

  console.log('\n========== FINAL UPDATED RECORD ==========')
  console.log(JSON.stringify(updatedData, null, 2))

  const updatedPayments = updatedData.grants[0].payments

  expect(updatedPayments).toHaveLength(4)

  updatedPayments.forEach((payment, index) => {
    console.log(
      `Final Payment ${index + 1}: correlationId=${payment.correlationId}, status=${payment.status}`
    )

    expect(payment.status).toBe('submitted')
  })

  console.log(`runGpsPaymentChecks: COMPLETED SUCCESSFULLY for SBI ${sbi}`)
}
