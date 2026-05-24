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
