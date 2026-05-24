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
