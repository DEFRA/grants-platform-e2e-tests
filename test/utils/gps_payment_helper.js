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

export const clearExistingPayments = async (sbi) => {
  await deleteGrantPaymentsById(sbi)
  const getResponse = await getGrantPaymentById(sbi)
  expect(getResponse.statusCode).toBe(200)
  expect(getResponse.body.docs).toHaveLength(0)
}

export const runGpsPaymentChecks = async (sbi) => {
  console.log(`runGpsPaymentChecks: START for SBI ${sbi}`)
  console.log(
    `\n========== WAITING FOR INITIAL RECORD FOR SBI ${sbi} ==========`
  )
  const { body: initialBody, statusCode: initialStatusCode } =
    await getGrantPaymentById(sbi)
  expect(initialStatusCode).toBe(200)

  const recordData = getRecordFromResponse(initialBody)
  console.log('\n========== INITIAL RECORD FOUND ==========')
  console.log(JSON.stringify(recordData, null, 2))

  expect(recordData).toBeDefined()
  expect(recordData.sbi).toBe(sbi)
  expect(recordData.grants).toHaveLength(1)

  const payments = recordData.grants[0].payments
  console.log(`Found ${payments?.length || 0} payments`)
  expect(payments).toHaveLength(1)

  payments.forEach((payment, index) => {
    console.log(
      `Payment ${index + 1}: correlationId=${payment.correlationId}, status=${payment.status}`
    )
    expect(payment.status).toBe('pending')
  })

  console.log(`\n========== PROCESSING PAYMENTS FOR SBI ${sbi} ==========`)
  const { statusCode, body: processResult } = await processPaymentsBySbi(sbi)

  console.log(`Process status code: ${statusCode}`)
  console.log('Process response:\n', JSON.stringify(processResult, null, 2))

  expect(statusCode).toBe(200)
  expect(processResult.result).toHaveLength(1)

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

  console.log(`\n========== WAITING FOR SUBMITTED STATUS UPDATE ==========`)
  const { body: updatedBody, statusCode: updatedStatusCode } =
    await getGrantPaymentById(sbi)

  expect(updatedStatusCode).toBe(200)

  const updatedData = getRecordFromResponse(updatedBody)
  console.log('\n========== FINAL UPDATED RECORD ==========')
  console.log(JSON.stringify(updatedData, null, 2))

  const updatedPayments = updatedData.grants[0].payments
  expect(updatedPayments).toHaveLength(1)

  updatedPayments.forEach((payment, index) => {
    console.log(
      `Final Payment ${index + 1}: correlationId=${payment.correlationId}, status=${payment.status}`
    )
    expect(payment.status).toBe('submitted')
  })

  console.log(`runGpsPaymentChecks: COMPLETED SUCCESSFULLY for SBI ${sbi}`)
}
