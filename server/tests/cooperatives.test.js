const request = require('supertest')
const express = require('express')
const { createDb } = require('../db/database')
const { createRouter } = require('../routes/cooperatives')

function buildApp(db) {
  const app = express()
  app.use(express.json())
  app.use('/api/cooperatives', createRouter(db))
  return app
}

describe('GET /api/cooperatives', () => {
  let db, app

  beforeEach(() => {
    db = createDb(':memory:')
    app = buildApp(db)
    db.prepare("INSERT INTO cooperatives (name, address, phone) VALUES ('KUD Maju Bersama', 'Jl. Raya 1', '081234')").run()
    db.prepare("INSERT INTO cooperatives (name, address, phone) VALUES ('Koperasi Sejahtera', 'Jl. Raya 2', '082345')").run()
  })

  afterEach(() => db.close())

  test('returns all cooperatives when no query', async () => {
    const res = await request(app).get('/api/cooperatives')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  test('filters cooperatives by name query', async () => {
    const res = await request(app).get('/api/cooperatives?q=KUD')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('KUD Maju Bersama')
  })

  test('returns empty array when no match', async () => {
    const res = await request(app).get('/api/cooperatives?q=Tidak Ada')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })
})

describe('POST /api/cooperatives', () => {
  let db, app

  beforeEach(() => {
    db = createDb(':memory:')
    app = buildApp(db)
  })

  afterEach(() => db.close())

  test('creates a new cooperative', async () => {
    const res = await request(app).post('/api/cooperatives').send({
      name: 'KUD Baru',
      address: 'Jl. Baru 1',
      phone: '089123'
    })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('KUD Baru')
    expect(res.body.id).toBeDefined()
  })

  test('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/cooperatives').send({ address: 'Jl. A' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/name/)
  })

  test('returns existing cooperative if name already exists (no error)', async () => {
    db.prepare("INSERT INTO cooperatives (name) VALUES ('KUD Lama')").run()
    const res = await request(app).post('/api/cooperatives').send({ name: 'KUD Lama' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('KUD Lama')
  })
})
