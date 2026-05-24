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
