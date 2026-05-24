const { createDb } = require('../db/database')

describe('createDb', () => {
  let db

  beforeEach(() => {
    db = createDb(':memory:')
  })

  afterEach(() => {
    db.close()
  })

  test('creates cooperatives table', () => {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cooperatives'").get()
    expect(row).toBeDefined()
  })

  test('creates invoices table', () => {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'").get()
    expect(row).toBeDefined()
  })

  test('creates invoice_items table', () => {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invoice_items'").get()
    expect(row).toBeDefined()
  })

  test('enforces foreign keys', () => {
    expect(() => {
      db.prepare('INSERT INTO invoice_items (invoice_id, product_name, unit, quantity, unit_price, subtotal) VALUES (999, "test", "kg", 1, 1, 1)').run()
    }).toThrow()
  })
})
