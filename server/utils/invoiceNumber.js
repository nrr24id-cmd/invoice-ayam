function generateInvoiceNumber(db, date) {
  const dateStr = date.replace(/-/g, '')
  const row = db.prepare(
    "SELECT COUNT(*) as cnt FROM invoices WHERE invoice_number LIKE ?"
  ).get(`INV-${dateStr}-%`)
  const seq = String(row.cnt + 1).padStart(3, '0')
  return `INV-${dateStr}-${seq}`
}

module.exports = { generateInvoiceNumber }
