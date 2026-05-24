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
