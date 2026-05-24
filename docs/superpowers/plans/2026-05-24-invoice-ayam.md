# Invoice Ayam Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app for generating, storing, and downloading chicken purchase invoices with cooperative buyer autocomplete.

**Architecture:** React (Vite) frontend communicates with an Express backend via REST API. SQLite (better-sqlite3) stores invoices, invoice items, and master cooperative data. PDF generation uses Puppeteer on the server side to render an HTML template and export to PDF.

**Tech Stack:** React 18, Vite 5, React Router v6, Express 4, better-sqlite3, Puppeteer, Jest, Supertest, Vitest, React Testing Library

---

## File Map

**Root**
- `package.json` — root scripts to run both client and server with `concurrently`

**Server**
- `server/package.json` — server dependencies and scripts
- `server/index.js` — Express app setup, middleware, route registration
- `server/db/database.js` — SQLite connection factory + schema creation
- `server/routes/cooperatives.js` — factory function returning Express router for cooperative routes
- `server/routes/invoices.js` — factory function returning Express router for invoice routes
- `server/utils/invoiceNumber.js` — generate `INV-YYYYMMDD-XXX` format number
- `server/pdf/generator.js` — HTML template builder + Puppeteer PDF export
- `server/tests/cooperatives.test.js` — Jest + Supertest tests for cooperative routes
- `server/tests/invoices.test.js` — Jest + Supertest tests for invoice routes
- `server/tests/invoiceNumber.test.js` — unit tests for invoice number generation

**Client**
- `client/package.json` — Vite + React dependencies
- `client/vite.config.js` — dev server config + proxy `/api` to backend
- `client/index.html` — HTML shell
- `client/src/main.jsx` — React entry point
- `client/src/App.jsx` — React Router setup (3 routes)
- `client/src/api/client.js` — fetch wrappers for all API calls
- `client/src/pages/InvoiceList.jsx` — list + search page
- `client/src/pages/InvoiceForm.jsx` — create invoice form with dynamic item rows
- `client/src/pages/InvoiceDetail.jsx` — preview, download PDF, delete
- `client/src/components/CooperativeAutocomplete.jsx` — debounced search + dropdown
- `client/src/components/InvoiceTemplate.jsx` — invoice display layout (used in Detail page)
- `client/src/components/CooperativeAutocomplete.test.jsx`
- `client/src/pages/InvoiceList.test.jsx`

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json` (root)
- Create: `server/package.json`
- Create: `client/` (Vite scaffold)

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "invoice-ayam",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "install:all": "npm install && npm install --prefix server && npm install --prefix client"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 2: Install root dependencies**

```bash
cd C:\tmp\invoice-ayam
npm install
```

Expected: `node_modules/concurrently` created.

- [ ] **Step 3: Create server/package.json**

```json
{
  "name": "invoice-ayam-server",
  "private": true,
  "scripts": {
    "dev": "node --watch index.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.3",
    "puppeteer": "^22.4.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.4"
  }
}
```

- [ ] **Step 4: Install server dependencies**

```bash
cd C:\tmp\invoice-ayam\server
npm install
```

Expected: `server/node_modules` created, puppeteer downloads Chromium.

- [ ] **Step 5: Scaffold Vite + React client**

```bash
cd C:\tmp\invoice-ayam
npm create vite@latest client -- --template react
cd client
npm install
npm install react-router-dom
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected: `client/src/App.jsx` and `client/index.html` exist.

- [ ] **Step 6: Create server/index.js (minimal, just to verify it starts)**

```js
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

module.exports = app
```

- [ ] **Step 7: Verify server starts**

```bash
cd C:\tmp\invoice-ayam\server
node index.js
```

Expected output: `Server running on port 3001`. Open `http://localhost:3001/api/health` in browser — should return `{"ok":true}`. Stop with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
cd C:\tmp\invoice-ayam
git init
git add .
git commit -m "chore: project scaffold — Express server + Vite React client"
```

---

## Task 2: Database Setup

**Files:**
- Create: `server/db/database.js`

- [ ] **Step 1: Create server/db/database.js**

```js
const Database = require('better-sqlite3')
const path = require('path')

function createDb(dbPath) {
  const db = new Database(dbPath || path.join(__dirname, 'invoice.db'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS cooperatives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      seller_name TEXT NOT NULL,
      seller_address TEXT DEFAULT '',
      seller_phone TEXT DEFAULT '',
      buyer_name TEXT NOT NULL,
      cooperative_id INTEGER,
      cooperative_name TEXT NOT NULL,
      cooperative_address TEXT DEFAULT '',
      cooperative_phone TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      signer_name TEXT DEFAULT '',
      signer_title TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      unit TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
  `)

  return db
}

module.exports = { createDb }
```

- [ ] **Step 2: Write test for database schema**

Create `server/tests/database.test.js`:

```js
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
```

- [ ] **Step 3: Run test to verify it passes**

```bash
cd C:\tmp\invoice-ayam\server
npx jest tests/database.test.js --verbose
```

Expected: 4 tests PASS.

- [ ] **Step 4: Wire db into server/index.js**

Replace `server/index.js`:

```js
const express = require('express')
const cors = require('cors')
const { createDb } = require('./db/database')

const app = express()
app.use(cors())
app.use(express.json())

const db = createDb()

app.get('/api/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

module.exports = { app, db }
```

- [ ] **Step 5: Commit**

```bash
cd C:\tmp\invoice-ayam
git add server/
git commit -m "feat: database schema — cooperatives, invoices, invoice_items"
```

---

## Task 3: Invoice Number Generator

**Files:**
- Create: `server/utils/invoiceNumber.js`
- Create: `server/tests/invoiceNumber.test.js`

- [ ] **Step 1: Write failing tests**

Create `server/tests/invoiceNumber.test.js`:

```js
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
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd C:\tmp\invoice-ayam\server
npx jest tests/invoiceNumber.test.js --verbose
```

Expected: FAIL — `Cannot find module '../utils/invoiceNumber'`.

- [ ] **Step 3: Create server/utils/invoiceNumber.js**

```js
function generateInvoiceNumber(db, date) {
  const dateStr = date.replace(/-/g, '')
  const row = db.prepare(
    "SELECT COUNT(*) as cnt FROM invoices WHERE invoice_number LIKE ?"
  ).get(`INV-${dateStr}-%`)
  const seq = String(row.cnt + 1).padStart(3, '0')
  return `INV-${dateStr}-${seq}`
}

module.exports = { generateInvoiceNumber }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd C:\tmp\invoice-ayam\server
npx jest tests/invoiceNumber.test.js --verbose
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd C:\tmp\invoice-ayam
git add server/utils/ server/tests/invoiceNumber.test.js
git commit -m "feat: invoice number generator with auto-increment per date"
```

---

## Task 4: Cooperative Routes

**Files:**
- Create: `server/routes/cooperatives.js`
- Create: `server/tests/cooperatives.test.js`
- Modify: `server/index.js`

- [ ] **Step 1: Write failing tests**

Create `server/tests/cooperatives.test.js`:

```js
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
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd C:\tmp\invoice-ayam\server
npx jest tests/cooperatives.test.js --verbose
```

Expected: FAIL — `Cannot find module '../routes/cooperatives'`.

- [ ] **Step 3: Create server/routes/cooperatives.js**

```js
const express = require('express')

function createRouter(db) {
  const router = express.Router()

  router.get('/', (req, res) => {
    const q = req.query.q || ''
    const rows = db.prepare(
      'SELECT * FROM cooperatives WHERE name LIKE ? ORDER BY name LIMIT 20'
    ).all(`%${q}%`)
    res.json(rows)
  })

  router.post('/', (req, res) => {
    const { name, address = '', phone = '' } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' })
    }
    try {
      const result = db.prepare(
        'INSERT INTO cooperatives (name, address, phone) VALUES (?, ?, ?)'
      ).run(name.trim(), address.trim(), phone.trim())
      const row = db.prepare('SELECT * FROM cooperatives WHERE id = ?').get(result.lastInsertRowid)
      res.status(201).json(row)
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        const existing = db.prepare('SELECT * FROM cooperatives WHERE name = ?').get(name.trim())
        res.status(200).json(existing)
      } else {
        res.status(500).json({ error: err.message })
      }
    }
  })

  return router
}

module.exports = { createRouter }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd C:\tmp\invoice-ayam\server
npx jest tests/cooperatives.test.js --verbose
```

Expected: 6 tests PASS.

- [ ] **Step 5: Register route in server/index.js**

Replace `server/index.js`:

```js
const express = require('express')
const cors = require('cors')
const { createDb } = require('./db/database')
const { createRouter: cooperativesRouter } = require('./routes/cooperatives')

const app = express()
app.use(cors())
app.use(express.json())

const db = createDb()

app.use('/api/cooperatives', cooperativesRouter(db))
app.get('/api/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

module.exports = { app, db }
```

- [ ] **Step 6: Commit**

```bash
cd C:\tmp\invoice-ayam
git add server/routes/cooperatives.js server/tests/cooperatives.test.js server/index.js
git commit -m "feat: cooperative routes — GET search, POST create with auto-save"
```

---

## Task 5: Invoice Routes (CRUD)

**Files:**
- Create: `server/routes/invoices.js`
- Create: `server/tests/invoices.test.js`
- Modify: `server/index.js`

- [ ] **Step 1: Write failing tests**

Create `server/tests/invoices.test.js`:

```js
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
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd C:\tmp\invoice-ayam\server
npx jest tests/invoices.test.js --verbose
```

Expected: FAIL — `Cannot find module '../routes/invoices'`.

- [ ] **Step 3: Create server/routes/invoices.js**

```js
const express = require('express')
const { generateInvoiceNumber } = require('../utils/invoiceNumber')

function createRouter(db) {
  const router = express.Router()

  router.get('/', (req, res) => {
    const q = req.query.q || ''
    const rows = db.prepare(`
      SELECT i.*,
        COALESCE((SELECT SUM(subtotal) FROM invoice_items WHERE invoice_id = i.id), 0) as total
      FROM invoices i
      WHERE i.invoice_number LIKE ? OR i.cooperative_name LIKE ? OR i.buyer_name LIKE ?
      ORDER BY i.created_at DESC
    `).all(`%${q}%`, `%${q}%`, `%${q}%`)
    res.json(rows)
  })

  router.get('/:id', (req, res) => {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoice.id)
    res.json({ ...invoice, items })
  })

  router.post('/', (req, res) => {
    const {
      date, seller_name, seller_address = '', seller_phone = '',
      buyer_name, cooperative_id = null,
      cooperative_name, cooperative_address = '', cooperative_phone = '',
      notes = '', signer_name = '', signer_title = '', items
    } = req.body

    if (!seller_name || !seller_name.trim()) return res.status(400).json({ error: 'seller_name is required' })
    if (!buyer_name || !buyer_name.trim()) return res.status(400).json({ error: 'buyer_name is required' })
    if (!cooperative_name || !cooperative_name.trim()) return res.status(400).json({ error: 'cooperative_name is required' })
    if (!items || items.length === 0) return res.status(400).json({ error: 'items must not be empty' })

    const invoice_number = generateInvoiceNumber(db, date)

    const create = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO invoices
          (invoice_number, date, seller_name, seller_address, seller_phone,
           buyer_name, cooperative_id, cooperative_name, cooperative_address, cooperative_phone,
           notes, signer_name, signer_title)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoice_number, date, seller_name.trim(), seller_address, seller_phone,
        buyer_name.trim(), cooperative_id, cooperative_name.trim(),
        cooperative_address, cooperative_phone, notes, signer_name, signer_title
      )
      const invoiceId = result.lastInsertRowid
      for (const item of items) {
        const subtotal = item.quantity * item.unit_price
        db.prepare(`
          INSERT INTO invoice_items (invoice_id, product_name, unit, quantity, unit_price, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(invoiceId, item.product_name, item.unit, item.quantity, item.unit_price, subtotal)
      }
      return invoiceId
    })

    try {
      const invoiceId = create()
      const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId)
      res.status(201).json(invoice)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.delete('/:id', (req, res) => {
    const invoice = db.prepare('SELECT id FROM invoices WHERE id = ?').get(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id)
    res.status(204).end()
  })

  return router
}

module.exports = { createRouter }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd C:\tmp\invoice-ayam\server
npx jest tests/invoices.test.js --verbose
```

Expected: All tests PASS.

- [ ] **Step 5: Register invoice route in server/index.js**

Replace `server/index.js`:

```js
const express = require('express')
const cors = require('cors')
const { createDb } = require('./db/database')
const { createRouter: cooperativesRouter } = require('./routes/cooperatives')
const { createRouter: invoicesRouter } = require('./routes/invoices')

const app = express()
app.use(cors())
app.use(express.json())

const db = createDb()

app.use('/api/cooperatives', cooperativesRouter(db))
app.use('/api/invoices', invoicesRouter(db))
app.get('/api/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

module.exports = { app, db }
```

- [ ] **Step 6: Run all server tests**

```bash
cd C:\tmp\invoice-ayam\server
npx jest --verbose
```

Expected: All tests from all test files PASS.

- [ ] **Step 7: Commit**

```bash
cd C:\tmp\invoice-ayam
git add server/routes/invoices.js server/tests/invoices.test.js server/index.js
git commit -m "feat: invoice CRUD routes — list, detail, create, delete"
```

---

## Task 6: PDF Generator

**Files:**
- Create: `server/pdf/generator.js`
- Modify: `server/routes/invoices.js`

- [ ] **Step 1: Create server/pdf/generator.js**

```js
const puppeteer = require('puppeteer')

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function buildHtml(invoice, items) {
  const total = items.reduce((sum, item) => sum + item.subtotal, 0)

  const itemRows = items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.product_name}</td>
      <td>${item.unit}</td>
      <td style="text-align:right">${item.quantity}</td>
      <td style="text-align:right">${formatRupiah(item.unit_price)}</td>
      <td style="text-align:right">${formatRupiah(item.subtotal)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 40px; font-size: 12px; color: #222; }
  h1 { text-align: center; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .subtitle { text-align: center; font-size: 11px; color: #666; margin-bottom: 24px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 16px; }
  .meta-left, .meta-right { width: 48%; }
  .meta-right { text-align: right; }
  .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 4px; }
  .divider { border: none; border-top: 2px solid #222; margin: 16px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #222; color: white; padding: 7px 8px; text-align: left; font-size: 11px; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; }
  .total-row td { border-top: 2px solid #222; font-weight: bold; font-size: 13px; }
  .notes { margin-top: 16px; font-size: 11px; color: #444; }
  .footer { display: flex; justify-content: flex-end; margin-top: 64px; }
  .signature-box { text-align: center; width: 220px; }
  .signature-date { font-size: 11px; margin-bottom: 64px; }
  .signature-line { border-top: 1px solid #222; padding-top: 6px; font-weight: bold; }
  .signature-title { font-size: 11px; color: #666; }
</style>
</head>
<body>
  <h1>Invoice Pembelian Ayam</h1>
  <p class="subtitle">Dokumen ini merupakan bukti transaksi yang sah</p>
  <hr class="divider">

  <div class="meta">
    <div class="meta-left">
      <div class="section-title">Penjual</div>
      <strong>${invoice.seller_name}</strong><br>
      ${invoice.seller_address ? invoice.seller_address + '<br>' : ''}
      ${invoice.seller_phone || ''}
    </div>
    <div class="meta-right">
      <div class="section-title">No. Invoice</div>
      <strong>${invoice.invoice_number}</strong><br>
      <div class="section-title" style="margin-top:8px">Tanggal</div>
      ${invoice.date}
    </div>
  </div>

  <div style="margin-bottom:16px">
    <div class="section-title">Pembeli</div>
    <strong>${invoice.buyer_name}</strong><br>
    ${invoice.cooperative_name}<br>
    ${invoice.cooperative_address ? invoice.cooperative_address + '<br>' : ''}
    ${invoice.cooperative_phone || ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Produk</th>
        <th>Satuan</th>
        <th style="text-align:right">Jumlah</th>
        <th style="text-align:right">Harga Satuan</th>
        <th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="5" style="text-align:right">TOTAL</td>
        <td style="text-align:right">${formatRupiah(total)}</td>
      </tr>
    </tfoot>
  </table>

  ${invoice.notes ? `<p class="notes"><strong>Catatan:</strong> ${invoice.notes}</p>` : ''}

  <div class="footer">
    <div class="signature-box">
      <p class="signature-date">${invoice.date}</p>
      <div class="signature-line">${invoice.signer_name || '( _________________ )'}</div>
      <div class="signature-title">${invoice.signer_title || ''}</div>
    </div>
  </div>
</body>
</html>`
}

async function generatePdf(invoice, items) {
  const html = buildHtml(invoice, items)
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } })
    return pdf
  } finally {
    await browser.close()
  }
}

module.exports = { generatePdf, buildHtml }
```

- [ ] **Step 2: Write test for buildHtml**

Create `server/tests/pdfGenerator.test.js`:

```js
const { buildHtml } = require('../pdf/generator')

const invoice = {
  invoice_number: 'INV-20260524-001',
  date: '2026-05-24',
  seller_name: 'PT Ayam Jaya',
  seller_address: 'Jl. Peternakan 1',
  seller_phone: '021-1234',
  buyer_name: 'Budi',
  cooperative_name: 'KUD Maju',
  cooperative_address: 'Jl. Raya 2',
  cooperative_phone: '081234',
  notes: 'Lunas',
  signer_name: 'Direktur',
  signer_title: 'Manager'
}

const items = [
  { product_name: 'Ayam Broiler', unit: 'kg', quantity: 50, unit_price: 28000, subtotal: 1400000 }
]

test('buildHtml contains invoice number', () => {
  const html = buildHtml(invoice, items)
  expect(html).toContain('INV-20260524-001')
})

test('buildHtml contains seller name', () => {
  const html = buildHtml(invoice, items)
  expect(html).toContain('PT Ayam Jaya')
})

test('buildHtml contains product name', () => {
  const html = buildHtml(invoice, items)
  expect(html).toContain('Ayam Broiler')
})

test('buildHtml contains total formatted', () => {
  const html = buildHtml(invoice, items)
  expect(html).toContain('1.400.000')
})

test('buildHtml contains notes when provided', () => {
  const html = buildHtml(invoice, items)
  expect(html).toContain('Lunas')
})
```

- [ ] **Step 3: Run test to verify it passes**

```bash
cd C:\tmp\invoice-ayam\server
npx jest tests/pdfGenerator.test.js --verbose
```

Expected: 5 tests PASS.

- [ ] **Step 4: Add PDF route to server/routes/invoices.js**

Add this route BEFORE `module.exports`, inside `createRouter`:

```js
  router.get('/:id/pdf', async (req, res) => {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoice.id)
    try {
      const { generatePdf } = require('../pdf/generator')
      const pdf = await generatePdf(invoice, items)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`)
      res.send(Buffer.from(pdf))
    } catch (err) {
      res.status(500).json({ error: 'PDF generation failed: ' + err.message })
    }
  })
```

- [ ] **Step 5: Run all server tests**

```bash
cd C:\tmp\invoice-ayam\server
npx jest --verbose
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
cd C:\tmp\invoice-ayam
git add server/pdf/ server/tests/pdfGenerator.test.js server/routes/invoices.js
git commit -m "feat: PDF generation with Puppeteer — invoice HTML template + download route"
```

---

## Task 7: React App Setup

**Files:**
- Modify: `client/vite.config.js`
- Modify: `client/src/main.jsx`
- Create: `client/src/App.jsx`
- Create: `client/src/api/client.js`

- [ ] **Step 1: Configure Vite proxy in client/vite.config.js**

Replace `client/vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    globals: true
  }
})
```

- [ ] **Step 2: Create client/src/test-setup.js**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Update client/package.json to add test script**

In `client/package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 4: Create client/src/api/client.js**

```js
const BASE = '/api'

export async function getInvoices(q = '') {
  const res = await fetch(`${BASE}/invoices?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('Gagal mengambil daftar invoice')
  return res.json()
}

export async function getInvoice(id) {
  const res = await fetch(`${BASE}/invoices/${id}`)
  if (!res.ok) throw new Error('Invoice tidak ditemukan')
  return res.json()
}

export async function createInvoice(data) {
  const res = await fetch(`${BASE}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Gagal membuat invoice')
  }
  return res.json()
}

export async function deleteInvoice(id) {
  const res = await fetch(`${BASE}/invoices/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Gagal menghapus invoice')
}

export async function searchCooperatives(q) {
  const res = await fetch(`${BASE}/cooperatives?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('Gagal mencari koperasi')
  return res.json()
}

export async function createCooperative(data) {
  const res = await fetch(`${BASE}/cooperatives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Gagal menyimpan koperasi')
  return res.json()
}
```

- [ ] **Step 5: Create client/src/App.jsx**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import InvoiceList from './pages/InvoiceList'
import InvoiceForm from './pages/InvoiceForm'
import InvoiceDetail from './pages/InvoiceDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InvoiceList />} />
        <Route path="/invoice/new" element={<InvoiceForm />} />
        <Route path="/invoice/:id" element={<InvoiceDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 6: Update client/src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 7: Commit**

```bash
cd C:\tmp\invoice-ayam
git add client/
git commit -m "feat: React app setup — routing, Vite proxy config, API client"
```

---

## Task 8: CooperativeAutocomplete Component

**Files:**
- Create: `client/src/components/CooperativeAutocomplete.jsx`
- Create: `client/src/components/CooperativeAutocomplete.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `client/src/components/CooperativeAutocomplete.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import CooperativeAutocomplete from './CooperativeAutocomplete'
import * as apiClient from '../api/client'

vi.mock('../api/client')

describe('CooperativeAutocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders input field', () => {
    render(<CooperativeAutocomplete value={null} onChange={() => {}} />)
    expect(screen.getByPlaceholderText(/nama koperasi/i)).toBeInTheDocument()
  })

  test('calls searchCooperatives when user types', async () => {
    apiClient.searchCooperatives.mockResolvedValue([{ id: 1, name: 'KUD Maju', address: '', phone: '' }])
    render(<CooperativeAutocomplete value={null} onChange={() => {}} />)
    await userEvent.type(screen.getByPlaceholderText(/nama koperasi/i), 'KUD')
    await waitFor(() => expect(apiClient.searchCooperatives).toHaveBeenCalledWith('KUD'))
  })

  test('shows suggestions in dropdown', async () => {
    apiClient.searchCooperatives.mockResolvedValue([{ id: 1, name: 'KUD Maju', address: '', phone: '' }])
    render(<CooperativeAutocomplete value={null} onChange={() => {}} />)
    await userEvent.type(screen.getByPlaceholderText(/nama koperasi/i), 'KUD')
    await waitFor(() => expect(screen.getByText('KUD Maju')).toBeInTheDocument())
  })

  test('calls onChange with selected cooperative when item clicked', async () => {
    const mockCoop = { id: 1, name: 'KUD Maju', address: 'Jl. A', phone: '081' }
    apiClient.searchCooperatives.mockResolvedValue([mockCoop])
    const onChange = vi.fn()
    render(<CooperativeAutocomplete value={null} onChange={onChange} />)
    await userEvent.type(screen.getByPlaceholderText(/nama koperasi/i), 'KUD')
    await waitFor(() => screen.getByText('KUD Maju'))
    await userEvent.click(screen.getByText('KUD Maju'))
    expect(onChange).toHaveBeenCalledWith(mockCoop)
  })
})
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd C:\tmp\invoice-ayam\client
npx vitest run src/components/CooperativeAutocomplete.test.jsx
```

Expected: FAIL — `Cannot find module './CooperativeAutocomplete'`.

- [ ] **Step 3: Create client/src/components/CooperativeAutocomplete.jsx**

```jsx
import { useState, useEffect, useRef } from 'react'
import { searchCooperatives } from '../api/client'

export default function CooperativeAutocomplete({ value, onChange }) {
  const [query, setQuery] = useState(value?.name || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (value?.name && query !== value.name) setQuery(value.name)
  }, [value])

  useEffect(() => {
    if (!query) { setSuggestions([]); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const results = await searchCooperatives(query)
      setSuggestions(results)
      if (results.length > 0) setOpen(true)
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  function handleSelect(coop) {
    setQuery(coop.name)
    setOpen(false)
    setSuggestions([])
    onChange(coop)
  }

  function handleBlur() {
    setTimeout(() => setOpen(false), 150)
    if (!value || value.name !== query) {
      onChange({ name: query, address: '', phone: '' })
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(null) }}
        onBlur={handleBlur}
        placeholder="Nama koperasi..."
        style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4 }}
      />
      {open && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute', background: 'white', border: '1px solid #ccc',
          borderRadius: 4, width: '100%', listStyle: 'none', margin: 0,
          padding: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          {suggestions.map(coop => (
            <li
              key={coop.id}
              onMouseDown={() => handleSelect(coop)}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
            >
              <strong>{coop.name}</strong>
              {coop.address && <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>{coop.address}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd C:\tmp\invoice-ayam\client
npx vitest run src/components/CooperativeAutocomplete.test.jsx
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd C:\tmp\invoice-ayam
git add client/src/components/
git commit -m "feat: CooperativeAutocomplete — debounced search with auto-save on new entry"
```

---

## Task 9: InvoiceList Page

**Files:**
- Create: `client/src/pages/InvoiceList.jsx`
- Create: `client/src/pages/InvoiceList.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `client/src/pages/InvoiceList.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import InvoiceList from './InvoiceList'
import * as apiClient from '../api/client'

vi.mock('../api/client')

const INVOICES = [
  { id: 1, invoice_number: 'INV-20260524-001', date: '2026-05-24', cooperative_name: 'KUD Maju', buyer_name: 'Budi', total: 1400000 },
  { id: 2, invoice_number: 'INV-20260524-002', date: '2026-05-24', cooperative_name: 'Koperasi Sejahtera', buyer_name: 'Ani', total: 900000 }
]

function renderPage() {
  return render(<MemoryRouter><InvoiceList /></MemoryRouter>)
}

test('shows loading state then invoice list', async () => {
  apiClient.getInvoices.mockResolvedValue(INVOICES)
  renderPage()
  expect(screen.getByText(/memuat/i)).toBeInTheDocument()
  await waitFor(() => expect(screen.getByText('INV-20260524-001')).toBeInTheDocument())
})

test('shows all invoices in table', async () => {
  apiClient.getInvoices.mockResolvedValue(INVOICES)
  renderPage()
  await waitFor(() => screen.getByText('INV-20260524-001'))
  expect(screen.getByText('KUD Maju')).toBeInTheDocument()
  expect(screen.getByText('INV-20260524-002')).toBeInTheDocument()
})

test('shows empty message when no invoices', async () => {
  apiClient.getInvoices.mockResolvedValue([])
  renderPage()
  await waitFor(() => expect(screen.getByText(/belum ada invoice/i)).toBeInTheDocument())
})

test('calls getInvoices with search query when user types', async () => {
  apiClient.getInvoices.mockResolvedValue(INVOICES)
  renderPage()
  await waitFor(() => screen.getByText('INV-20260524-001'))
  await userEvent.type(screen.getByPlaceholderText(/cari/i), 'KUD')
  await waitFor(() => expect(apiClient.getInvoices).toHaveBeenCalledWith('KUD'))
})
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd C:\tmp\invoice-ayam\client
npx vitest run src/pages/InvoiceList.test.jsx
```

Expected: FAIL — `Cannot find module './InvoiceList'`.

- [ ] **Step 3: Create client/src/pages/InvoiceList.jsx**

```jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getInvoices } from '../api/client'

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    getInvoices(query).then(data => { setInvoices(data); setLoading(false) })
  }, [query])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Invoice Pembelian Ayam</h1>
        <button
          onClick={() => navigate('/invoice/new')}
          style={{ background: '#1a56db', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
        >
          + Buat Invoice Baru
        </button>
      </div>

      <input
        placeholder="Cari nomor invoice, koperasi, pembeli..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 6, marginBottom: 16, fontSize: 14 }}
      />

      {loading ? (
        <p>Memuat...</p>
      ) : invoices.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>Belum ada invoice. Buat invoice baru untuk memulai.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={th}>No. Invoice</th>
              <th style={th}>Tanggal</th>
              <th style={th}>Koperasi</th>
              <th style={th}>Pembeli</th>
              <th style={{ ...th, textAlign: 'right' }}>Total</th>
              <th style={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}><Link to={`/invoice/${inv.id}`} style={{ color: '#1a56db' }}>{inv.invoice_number}</Link></td>
                <td style={td}>{inv.date}</td>
                <td style={td}>{inv.cooperative_name}</td>
                <td style={td}>{inv.buyer_name}</td>
                <td style={{ ...td, textAlign: 'right' }}>{formatRupiah(inv.total)}</td>
                <td style={td}><Link to={`/invoice/${inv.id}`} style={{ color: '#1a56db' }}>Lihat</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', color: '#555' }
const td = { padding: '10px 12px' }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd C:\tmp\invoice-ayam\client
npx vitest run src/pages/InvoiceList.test.jsx
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd C:\tmp\invoice-ayam
git add client/src/pages/InvoiceList.jsx client/src/pages/InvoiceList.test.jsx
git commit -m "feat: InvoiceList page — table with search and link to detail"
```

---

## Task 10: InvoiceForm Page

**Files:**
- Create: `client/src/pages/InvoiceForm.jsx`

- [ ] **Step 1: Create client/src/pages/InvoiceForm.jsx**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createInvoice, createCooperative } from '../api/client'
import CooperativeAutocomplete from '../components/CooperativeAutocomplete'

const UNITS = ['kg', 'pcs', 'filet']

function today() {
  return new Date().toISOString().split('T')[0]
}

function emptyItem() {
  return { product_name: '', unit: 'kg', quantity: '', unit_price: '' }
}

function formatRupiah(n) {
  if (!n && n !== 0) return ''
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export default function InvoiceForm() {
  const navigate = useNavigate()

  const [date, setDate] = useState(today())
  const [seller, setSeller] = useState({ name: '', address: '', phone: '' })
  const [buyerName, setBuyerName] = useState('')
  const [cooperative, setCooperative] = useState(null)
  const [items, setItems] = useState([emptyItem()])
  const [notes, setNotes] = useState('')
  const [signerName, setSignerName] = useState('')
  const [signerTitle, setSignerTitle] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const total = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unit_price) || 0
    return sum + qty * price
  }, 0)

  function updateItem(index, field, value) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems(prev => [...prev, emptyItem()])
  }

  function removeItem(index) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function validate() {
    if (!seller.name.trim()) return 'Nama penjual wajib diisi'
    if (!buyerName.trim()) return 'Nama pembeli wajib diisi'
    if (!cooperative?.name?.trim()) return 'Koperasi wajib diisi'
    if (items.length === 0) return 'Minimal 1 item produk'
    for (const item of items) {
      if (!item.product_name.trim()) return 'Nama produk wajib diisi'
      if (!parseFloat(item.quantity) > 0) return 'Jumlah harus lebih dari 0'
      if (!parseFloat(item.unit_price) > 0) return 'Harga satuan harus lebih dari 0'
    }
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError('')
    setSaving(true)
    try {
      let savedCoop = cooperative
      if (!cooperative?.id) {
        savedCoop = await createCooperative({
          name: cooperative.name,
          address: cooperative.address || '',
          phone: cooperative.phone || ''
        })
      }

      const payload = {
        date,
        seller_name: seller.name,
        seller_address: seller.address,
        seller_phone: seller.phone,
        buyer_name: buyerName,
        cooperative_id: savedCoop?.id || null,
        cooperative_name: savedCoop?.name || cooperative?.name,
        cooperative_address: savedCoop?.address || '',
        cooperative_phone: savedCoop?.phone || '',
        notes,
        signer_name: signerName,
        signer_title: signerTitle,
        items: items.map(item => ({
          product_name: item.product_name,
          unit: item.unit,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price)
        }))
      }

      const invoice = await createInvoice(payload)
      navigate(`/invoice/${invoice.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Buat Invoice Baru</h1>

      <form onSubmit={handleSubmit}>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 6, marginBottom: 16 }}>{error}</div>}

        <section style={sectionStyle}>
          <h2 style={sectionTitle}>Info Invoice</h2>
          <label style={labelStyle}>Tanggal</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} required />
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitle}>Info Penjual</h2>
          <label style={labelStyle}>Nama Penjual *</label>
          <input value={seller.name} onChange={e => setSeller(s => ({ ...s, name: e.target.value }))} placeholder="PT Ayam Jaya" style={inputStyle} />
          <label style={labelStyle}>Alamat</label>
          <input value={seller.address} onChange={e => setSeller(s => ({ ...s, address: e.target.value }))} placeholder="Jl. Peternakan No. 1" style={inputStyle} />
          <label style={labelStyle}>Telepon</label>
          <input value={seller.phone} onChange={e => setSeller(s => ({ ...s, phone: e.target.value }))} placeholder="021-12345" style={inputStyle} />
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitle}>Info Pembeli</h2>
          <label style={labelStyle}>Nama Pembeli / PIC *</label>
          <input value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Nama pembeli" style={inputStyle} />
          <label style={labelStyle}>Koperasi *</label>
          <CooperativeAutocomplete value={cooperative} onChange={setCooperative} />
          {cooperative && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#555' }}>
              <input
                value={cooperative.address || ''}
                onChange={e => setCooperative(c => ({ ...c, address: e.target.value }))}
                placeholder="Alamat koperasi"
                style={{ ...inputStyle, marginTop: 6 }}
              />
              <input
                value={cooperative.phone || ''}
                onChange={e => setCooperative(c => ({ ...c, phone: e.target.value }))}
                placeholder="Telepon koperasi"
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </div>
          )}
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitle}>Item Produk</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={thStyle}>Nama Produk</th>
                <th style={{ ...thStyle, width: 90 }}>Satuan</th>
                <th style={{ ...thStyle, width: 90 }}>Jumlah</th>
                <th style={{ ...thStyle, width: 130 }}>Harga Satuan</th>
                <th style={{ ...thStyle, width: 120, textAlign: 'right' }}>Subtotal</th>
                <th style={{ ...thStyle, width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>
                      <input value={item.product_name} onChange={e => updateItem(i, 'product_name', e.target.value)} placeholder="Ayam Broiler" style={{ ...inputStyle, margin: 0 }} />
                    </td>
                    <td style={tdStyle}>
                      <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} style={{ ...inputStyle, margin: 0 }}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <input type="number" min="0" step="any" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} placeholder="0" style={{ ...inputStyle, margin: 0 }} />
                    </td>
                    <td style={tdStyle}>
                      <input type="number" min="0" step="any" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} placeholder="0" style={{ ...inputStyle, margin: 0 }} />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{subtotal > 0 ? formatRupiah(subtotal) : '-'}</td>
                    <td style={tdStyle}>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: 18 }}>×</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <button type="button" onClick={addItem} style={{ marginTop: 10, background: 'none', border: '1px dashed #aaa', color: '#555', padding: '6px 14px', borderRadius: 4, cursor: 'pointer' }}>
            + Tambah Item
          </button>
          <div style={{ textAlign: 'right', marginTop: 10, fontWeight: 700, fontSize: 16 }}>
            Total: {formatRupiah(total)}
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitle}>Catatan & Tanda Tangan</h2>
          <label style={labelStyle}>Catatan (opsional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan..." style={{ ...inputStyle, height: 72, resize: 'vertical' }} />
          <label style={labelStyle}>Nama Penandatangan</label>
          <input value={signerName} onChange={e => setSignerName(e.target.value)} placeholder="Nama" style={inputStyle} />
          <label style={labelStyle}>Jabatan</label>
          <input value={signerTitle} onChange={e => setSignerTitle(e.target.value)} placeholder="Manager / Direktur" style={inputStyle} />
        </section>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button type="button" onClick={() => navigate('/')} style={{ padding: '10px 20px', borderRadius: 6, border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>
            Batal
          </button>
          <button type="submit" disabled={saving} style={{ padding: '10px 24px', borderRadius: 6, background: '#1a56db', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {saving ? 'Menyimpan...' : 'Simpan & Preview'}
          </button>
        </div>
      </form>
    </div>
  )
}

const sectionStyle = { background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', marginBottom: 20 }
const sectionTitle = { fontSize: 15, fontWeight: 700, margin: '0 0 14px 0', color: '#333' }
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4, marginTop: 10 }
const inputStyle = { display: 'block', width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, marginBottom: 4 }
const thStyle = { padding: '8px 10px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#555' }
const tdStyle = { padding: '6px 6px' }
```

- [ ] **Step 2: Verify the form renders in the browser**

Start both servers:
```bash
cd C:\tmp\invoice-ayam\server && node index.js
# in another terminal:
cd C:\tmp\invoice-ayam\client && npm run dev
```

Open `http://localhost:5173/invoice/new`. Verify: form renders with all sections, can add/remove item rows, totals calculate automatically.

- [ ] **Step 3: Commit**

```bash
cd C:\tmp\invoice-ayam
git add client/src/pages/InvoiceForm.jsx
git commit -m "feat: InvoiceForm page — full invoice creation with dynamic items and cooperative autocomplete"
```

---

## Task 11: InvoiceDetail Page

**Files:**
- Create: `client/src/pages/InvoiceDetail.jsx`
- Create: `client/src/components/InvoiceTemplate.jsx`

- [ ] **Step 1: Create client/src/components/InvoiceTemplate.jsx**

```jsx
function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export default function InvoiceTemplate({ invoice, items }) {
  const total = items.reduce((sum, item) => sum + item.subtotal, 0)

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#222', maxWidth: 740, margin: '0 auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: '40px' }}>
      <h2 style={{ textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Invoice Pembelian Ayam</h2>
      <p style={{ textAlign: 'center', color: '#888', fontSize: 11, marginBottom: 24 }}>Dokumen ini merupakan bukti transaksi yang sah</p>
      <hr style={{ border: 'none', borderTop: '2px solid #222', marginBottom: 20 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={label}>Penjual</div>
          <strong>{invoice.seller_name}</strong>
          {invoice.seller_address && <div>{invoice.seller_address}</div>}
          {invoice.seller_phone && <div>{invoice.seller_phone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={label}>No. Invoice</div>
          <strong>{invoice.invoice_number}</strong>
          <div style={{ ...label, marginTop: 10 }}>Tanggal</div>
          <div>{invoice.date}</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={label}>Pembeli</div>
        <strong>{invoice.buyer_name}</strong>
        <div>{invoice.cooperative_name}</div>
        {invoice.cooperative_address && <div>{invoice.cooperative_address}</div>}
        {invoice.cooperative_phone && <div>{invoice.cooperative_phone}</div>}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#222', color: 'white' }}>
            <th style={th}>#</th>
            <th style={th}>Produk</th>
            <th style={th}>Satuan</th>
            <th style={{ ...th, textAlign: 'right' }}>Jumlah</th>
            <th style={{ ...th, textAlign: 'right' }}>Harga Satuan</th>
            <th style={{ ...th, textAlign: 'right' }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={td}>{i + 1}</td>
              <td style={td}>{item.product_name}</td>
              <td style={td}>{item.unit}</td>
              <td style={{ ...td, textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ ...td, textAlign: 'right' }}>{formatRupiah(item.unit_price)}</td>
              <td style={{ ...td, textAlign: 'right' }}>{formatRupiah(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{ ...td, textAlign: 'right', fontWeight: 700, borderTop: '2px solid #222', fontSize: 14 }}>TOTAL</td>
            <td style={{ ...td, textAlign: 'right', fontWeight: 700, borderTop: '2px solid #222', fontSize: 14 }}>{formatRupiah(total)}</td>
          </tr>
        </tfoot>
      </table>

      {invoice.notes && <p style={{ marginTop: 16, fontSize: 12, color: '#444' }}><strong>Catatan:</strong> {invoice.notes}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 60 }}>
        <div style={{ textAlign: 'center', width: 220 }}>
          <div style={{ fontSize: 12, marginBottom: 60 }}>{invoice.date}</div>
          <div style={{ borderTop: '1px solid #222', paddingTop: 6, fontWeight: 700 }}>{invoice.signer_name || '( _________________ )'}</div>
          <div style={{ fontSize: 11, color: '#666' }}>{invoice.signer_title}</div>
        </div>
      </div>
    </div>
  )
}

const label = { fontSize: 11, textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: 2 }
const th = { padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 12 }
const td = { padding: '8px 10px' }
```

- [ ] **Step 2: Create client/src/pages/InvoiceDetail.jsx**

```jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getInvoice, deleteInvoice } from '../api/client'
import InvoiceTemplate from '../components/InvoiceTemplate'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getInvoice(id)
      .then(data => { setInvoice(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [id])

  async function handleDownload() {
    const res = await fetch(`/api/invoices/${id}/pdf`)
    if (!res.ok) { alert('Gagal generate PDF'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoice.invoice_number}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDelete() {
    if (!window.confirm(`Hapus invoice ${invoice.invoice_number}?`)) return
    try {
      await deleteInvoice(id)
      navigate('/')
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div style={{ padding: 40 }}>Memuat...</div>
  if (error) return <div style={{ padding: 40, color: 'red' }}>{error}</div>

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => navigate('/')} style={btnSecondary}>← Kembali ke Daftar</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleDownload} style={btnPrimary}>Download PDF</button>
          <button onClick={handleDelete} style={btnDanger}>Hapus</button>
        </div>
      </div>

      <InvoiceTemplate invoice={invoice} items={invoice.items} />
    </div>
  )
}

const btnPrimary = { padding: '8px 18px', background: '#1a56db', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }
const btnSecondary = { padding: '8px 18px', background: 'white', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }
const btnDanger = { padding: '8px 18px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }
```

- [ ] **Step 3: Commit**

```bash
cd C:\tmp\invoice-ayam
git add client/src/pages/InvoiceDetail.jsx client/src/components/InvoiceTemplate.jsx
git commit -m "feat: InvoiceDetail page — preview, download PDF, delete invoice"
```

---

## Task 12: Manual End-to-End Test

- [ ] **Step 1: Run all automated tests**

```bash
cd C:\tmp\invoice-ayam\server
npx jest --verbose
```
Expected: All server tests PASS.

```bash
cd C:\tmp\invoice-ayam\client
npx vitest run
```
Expected: All client tests PASS.

- [ ] **Step 2: Start both servers**

Terminal 1:
```bash
cd C:\tmp\invoice-ayam\server
node index.js
```

Terminal 2:
```bash
cd C:\tmp\invoice-ayam\client
npm run dev
```

Open `http://localhost:5173`

- [ ] **Step 3: Test — buat invoice baru**

1. Klik "Buat Invoice Baru"
2. Isi tanggal, nama penjual, alamat, telepon
3. Isi nama pembeli
4. Di field Koperasi: ketik nama koperasi baru (contoh: "KUD Test") → pastikan tidak ada suggestion → isi alamat dan telepon koperasi
5. Tambah 2 item: "Ayam Broiler / kg / 50 / 28000" dan "Ayam Fillet / filet / 10 / 45000"
6. Pastikan total terhitung otomatis (Rp 1.850.000)
7. Isi nama penandatangan
8. Klik "Simpan & Preview"

Expected: redirect ke halaman detail invoice dengan tampilan invoice yang lengkap.

- [ ] **Step 4: Test — download PDF**

Klik tombol "Download PDF". Pastikan file PDF terunduh, buka dan verifikasi: semua data tampil benar, layout A4, area tanda tangan ada di kanan bawah.

- [ ] **Step 5: Test — autocomplete koperasi**

1. Buat invoice baru lagi
2. Di field Koperasi: ketik "KUD" → pastikan "KUD Test" muncul di dropdown
3. Klik "KUD Test" → pastikan alamat dan telepon terisi otomatis

- [ ] **Step 6: Test — daftar dan search invoice**

1. Kembali ke halaman utama (`/`)
2. Pastikan semua invoice muncul di tabel
3. Ketik "KUD Test" di search bar → pastikan filter berfungsi

- [ ] **Step 7: Test — hapus invoice**

1. Buka salah satu invoice
2. Klik "Hapus" → konfirmasi
3. Pastikan kembali ke daftar dan invoice sudah tidak ada

- [ ] **Step 8: Final commit**

```bash
cd C:\tmp\invoice-ayam
git add .
git commit -m "feat: invoice-ayam web app complete — list, create, preview, PDF download, cooperative autocomplete"
```
