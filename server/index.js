const express = require('express')
const cors = require('cors')
const path = require('path')
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

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  })
}

const PORT = process.env.PORT || 3001
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

module.exports = { app, db }
