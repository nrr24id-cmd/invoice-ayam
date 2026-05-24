const { createDb } = require('../db/database')
const { generateInvoiceNumber } = require('../utils/invoiceNumber')

describe('generateInvoiceNumber', () => {
  let db

  beforeEach(() => {
    db = createDb(':memory:')
  })

  afterEach(() => {
    db.close()
  })

  test('returns INV-YYYYMMDD-001 format for first invoice of the day', () => {
    const num = generateInvoiceNumber(db, '2026-05-24')
    expect(num).toBe('INV-20260524-001')
  })

  test('increments sequence for same date', () => {
    db.prepare(`INSERT INTO invoices
      (invoice_number, date, seller_name, buyer_name, cooperative_name)
      VALUES ('INV-20260524-001', '2026-05-24', 'Seller', 'Buyer', 'Koperasi A')
    `).run()

    const num = generateInvoiceNumber(db, '2026-05-24')
    expect(num).toBe('INV-20260524-002')
  })

  test('resets sequence for a different date', () => {
    db.prepare(`INSERT INTO invoices
      (invoice_number, date, seller_name, buyer_name, cooperative_name)
      VALUES ('INV-20260523-005', '2026-05-23', 'Seller', 'Buyer', 'Koperasi A')
    `).run()

    const num = generateInvoiceNumber(db, '2026-05-24')
    expect(num).toBe('INV-20260524-001')
  })

  test('pads sequence to 3 digits', () => {
    for (let i = 1; i <= 9; i++) {
      db.prepare(`INSERT INTO invoices
        (invoice_number, date, seller_name, buyer_name, cooperative_name)
        VALUES ('INV-20260524-00${i}', '2026-05-24', 'Seller', 'Buyer', 'Koperasi A')
      `).run()
    }
    const num = generateInvoiceNumber(db, '2026-05-24')
    expect(num).toBe('INV-20260524-010')
  })
})
