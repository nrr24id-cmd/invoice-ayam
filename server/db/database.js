const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const fs = require('fs')

function createDb(dbPath) {
  const resolvedPath = dbPath || process.env.DB_PATH || path.join(__dirname, 'invoice.db')
  const dir = path.dirname(resolvedPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const db = new DatabaseSync(resolvedPath)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')

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
