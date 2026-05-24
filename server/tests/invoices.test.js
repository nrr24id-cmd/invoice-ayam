const request = require('supertest')
const express = require('express')
const { createDb } = require('../db/database')
const { createRouter } = require('../routes/invoices')

function buildApp(db) {
  const app = express()
  app.use(express.json())
  app.use('/api/invoices', createRouter(db))
  return app
}

const SAMPLE_INVOICE = {
  date: '2026-05-24',
  seller_name: 'PT Ayam Jaya',
  seller_address: 'Jl. Peternakan 1',
  seller_phone: '021-1234',
  buyer_name: 'Budi',
  cooperative_id: null,
  cooperative_name: 'KUD Maju',
  cooperative_address: 'Jl. Raya 2',
  cooperative_phone: '081234',
  notes: '',
  signer_name: 'Direktur',
  signer_title: 'Manager',
  items: [
    { product_name: 'Ayam Broiler', unit: 'kg', quantity: 50, unit_price: 28000 },
    { product_name: 'Ayam Fillet', unit: 'filet', quantity: 10, unit_price: 45000 }
  ]
}

describe('POST /api/invoices', () => {
  let db, app

  beforeEach(() => {
    db = createDb(':memory:')
    app = buildApp(db)
  })

  afterEach(() => db.close())

  test('creates invoice and returns it with invoice_number', async () => {
    const res = await request(app).post('/api/invoices').send(SAMPLE_INVOICE)
    expect(res.status).toBe(201)
    expect(res.body.invoice_number).toBe('INV-20260524-001')
    expect(res.body.seller_name).toBe('PT Ayam Jaya')
  })

  test('stores invoice items in database', async () => {
    const res = await request(app).post('/api/invoices').send(SAMPLE_INVOICE)
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(res.body.id)
    expect(items).toHaveLength(2)
    expect(items[0].product_name).toBe('Ayam Broiler')
    expect(items[0].subtotal).toBe(50 * 28000)
  })

  test('returns 400 when seller_name is missing', async () => {
    const bad = { ...SAMPLE_INVOICE, seller_name: '' }
    const res = await request(app).post('/api/invoices').send(bad)
    expect(res.status).toBe(400)
  })

  test('returns 400 when items array is empty', async () => {
    const bad = { ...SAMPLE_INVOICE, items: [] }
    const res = await request(app).post('/api/invoices').send(bad)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/invoices', () => {
  let db, app

  beforeEach(async () => {
    db = createDb(':memory:')
    app = buildApp(db)
    await request(app).post('/api/invoices').send(SAMPLE_INVOICE)
    await request(app).post('/api/invoices').send({ ...SAMPLE_INVOICE, cooperative_name: 'KUD Sejahtera' })
  })

  afterEach(() => db.close())

  test('returns all invoices', async () => {
    const res = await request(app).get('/api/invoices')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  test('filters by cooperative name', async () => {
    const res = await request(app).get('/api/invoices?q=Sejahtera')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].cooperative_name).toBe('KUD Sejahtera')
  })

  test('each invoice includes total field', async () => {
    const res = await request(app).get('/api/invoices')
    expect(res.body[0].total).toBeDefined()
    expect(typeof res.body[0].total).toBe('number')
  })
})

describe('GET /api/invoices/:id', () => {
  let db, app, invoiceId

  beforeEach(async () => {
    db = createDb(':memory:')
    app = buildApp(db)
    const res = await request(app).post('/api/invoices').send(SAMPLE_INVOICE)
    invoiceId = res.body.id
  })

  afterEach(() => db.close())

  test('returns invoice with items array', async () => {
    const res = await request(app).get(`/api/invoices/${invoiceId}`)
    expect(res.status).toBe(200)
    expect(res.body.invoice_number).toBe('INV-20260524-001')
    expect(res.body.items).toHaveLength(2)
  })

  test('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/invoices/9999')
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/invoices/:id', () => {
  let db, app, invoiceId

  beforeEach(async () => {
    db = createDb(':memory:')
    app = buildApp(db)
    const res = await request(app).post('/api/invoices').send(SAMPLE_INVOICE)
    invoiceId = res.body.id
  })

  afterEach(() => db.close())

  test('deletes invoice and its items', async () => {
    const res = await request(app).delete(`/api/invoices/${invoiceId}`)
    expect(res.status).toBe(204)
    const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId)
    expect(row).toBeUndefined()
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoiceId)
    expect(items).toHaveLength(0)
  })

  test('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/invoices/9999')
    expect(res.status).toBe(404)
  })
})
