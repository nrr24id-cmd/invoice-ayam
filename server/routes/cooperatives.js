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
