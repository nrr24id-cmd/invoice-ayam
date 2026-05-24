import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getInvoice, deleteInvoice } from '../api/client'
import InvoiceTemplate from '../components/InvoiceTemplate'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getInvoice(id)
      .then(data => { setInvoice(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [id])

  async function handleDownload() {
    const res = await fetch(`/api/invoices/${id}/pdf`)
    if (!res.ok) { alert('Gagal generate PDF'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoice.invoice_number}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDelete() {
    if (!window.confirm(`Hapus invoice ${invoice.invoice_number}?`)) return
    try {
      await deleteInvoice(id)
      navigate('/')
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div style={{ padding: 40 }}>Memuat...</div>
  if (error) return <div style={{ padding: 40, color: 'red' }}>{error}</div>

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => navigate('/')} style={btnSecondary}>← Kembali ke Daftar</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleDownload} style={btnPrimary}>Download PDF</button>
          <button onClick={handleDelete} style={btnDanger}>Hapus</button>
        </div>
      </div>

      <InvoiceTemplate invoice={invoice} items={invoice.items} />
    </div>
  )
}

const btnPrimary = { padding: '8px 18px', background: '#1a56db', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }
const btnSecondary = { padding: '8px 18px', background: 'white', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }
const btnDanger = { padding: '8px 18px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }
