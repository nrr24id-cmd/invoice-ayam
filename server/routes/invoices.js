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

    let invoiceId
    try {
      db.exec('BEGIN')
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
      invoiceId = result.lastInsertRowid
      for (const item of items) {
        const subtotal = item.quantity * item.unit_price
        db.prepare(`
          INSERT INTO invoice_items (invoice_id, product_name, unit, quantity, unit_price, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(invoiceId, item.product_name, item.unit, item.quantity, item.unit_price, subtotal)
      }
      db.exec('COMMIT')
      const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId)
      res.status(201).json(invoice)
    } catch (err) {
      db.exec('ROLLBACK')
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
