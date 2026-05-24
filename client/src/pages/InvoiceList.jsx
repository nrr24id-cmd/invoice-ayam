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
