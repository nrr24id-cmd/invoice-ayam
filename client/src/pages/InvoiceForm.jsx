import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createInvoice, createCooperative } from '../api/client'
import CooperativeAutocomplete from '../components/CooperativeAutocomplete'

const UNITS = ['kg', 'pcs', 'filet']

function today() {
  return new Date().toISOString().split('T')[0]
}

function emptyItem() {
  return { product_name: '', unit: 'kg', quantity: '', unit_price: '' }
}

function formatRupiah(n) {
  if (!n && n !== 0) return ''
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export default function InvoiceForm() {
  const navigate = useNavigate()

  const [date, setDate] = useState(today())
  const [seller, setSeller] = useState({ name: '', address: '', phone: '' })
  const [buyerName, setBuyerName] = useState('')
  const [cooperative, setCooperative] = useState(null)
  const [items, setItems] = useState([emptyItem()])
  const [notes, setNotes] = useState('')
  const [signerName, setSignerName] = useState('')
  const [signerTitle, setSignerTitle] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const total = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unit_price) || 0
    return sum + qty * price
  }, 0)

  function updateItem(index, field, value) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems(prev => [...prev, emptyItem()])
  }

  function removeItem(index) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function validate() {
    if (!seller.name.trim()) return 'Nama penjual wajib diisi'
    if (!buyerName.trim()) return 'Nama pembeli wajib diisi'
    if (!cooperative?.name?.trim()) return 'Koperasi wajib diisi'
    if (items.length === 0) return 'Minimal 1 item produk'
    for (const item of items) {
      if (!item.product_name.trim()) return 'Nama produk wajib diisi'
      if (!(parseFloat(item.quantity) > 0)) return 'Jumlah harus lebih dari 0'
      if (!(parseFloat(item.unit_price) > 0)) return 'Harga satuan harus lebih dari 0'
    }
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError('')
    setSaving(true)
    try {
      let savedCoop = cooperative
      if (!cooperative?.id) {
        savedCoop = await createCooperative({
          name: cooperative.name,
          address: cooperative.address || '',
          phone: cooperative.phone || ''
        })
      }

      const payload = {
        date,
        seller_name: seller.name,
        seller_address: seller.address,
        seller_phone: seller.phone,
        buyer_name: buyerName,
        cooperative_id: savedCoop?.id || null,
        cooperative_name: savedCoop?.name || cooperative?.name,
        cooperative_address: savedCoop?.address || '',
        cooperative_phone: savedCoop?.phone || '',
        notes,
        signer_name: signerName,
        signer_title: signerTitle,
        items: items.map(item => ({
          product_name: item.product_name,
          unit: item.unit,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price)
        }))
      }

      const invoice = await createInvoice(payload)
      navigate(`/invoice/${invoice.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Buat Invoice Baru</h1>

      <form onSubmit={handleSubmit}>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 6, marginBottom: 16 }}>{error}</div>}

        <section style={sectionStyle}>
          <h2 style={sectionTitle}>Info Invoice</h2>
          <label style={labelStyle}>Tanggal</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} required />
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitle}>Info Penjual</h2>
          <label style={labelStyle}>Nama Penjual *</label>
          <input value={seller.name} onChange={e => setSeller(s => ({ ...s, name: e.target.value }))} placeholder="PT Ayam Jaya" style={inputStyle} />
          <label style={labelStyle}>Alamat</label>
          <input value={seller.address} onChange={e => setSeller(s => ({ ...s, address: e.target.value }))} placeholder="Jl. Peternakan No. 1" style={inputStyle} />
          <label style={labelStyle}>Telepon</label>
          <input value={seller.phone} onChange={e => setSeller(s => ({ ...s, phone: e.target.value }))} placeholder="021-12345" style={inputStyle} />
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitle}>Info Pembeli</h2>
          <label style={labelStyle}>Nama Pembeli / PIC *</label>
          <input value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Nama pembeli" style={inputStyle} />
          <label style={labelStyle}>Koperasi *</label>
          <CooperativeAutocomplete value={cooperative} onChange={setCooperative} />
          {cooperative && (
            <div style={{ marginTop: 8 }}>
              <input
                value={cooperative.address || ''}
                onChange={e => setCooperative(c => ({ ...c, address: e.target.value }))}
                placeholder="Alamat koperasi"
                style={{ ...inputStyle, marginTop: 6 }}
              />
              <input
                value={cooperative.phone || ''}
                onChange={e => setCooperative(c => ({ ...c, phone: e.target.value }))}
                placeholder="Telepon koperasi"
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </div>
          )}
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitle}>Item Produk</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={thStyle}>Nama Produk</th>
                <th style={{ ...thStyle, width: 90 }}>Satuan</th>
                <th style={{ ...thStyle, width: 90 }}>Jumlah</th>
                <th style={{ ...thStyle, width: 130 }}>Harga Satuan</th>
                <th style={{ ...thStyle, width: 120, textAlign: 'right' }}>Subtotal</th>
                <th style={{ ...thStyle, width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>
                      <input value={item.product_name} onChange={e => updateItem(i, 'product_name', e.target.value)} placeholder="Ayam Broiler" style={{ ...inputStyle, margin: 0 }} />
                    </td>
                    <td style={tdStyle}>
                      <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} style={{ ...inputStyle, margin: 0 }}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <input type="number" min="0" step="any" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} placeholder="0" style={{ ...inputStyle, margin: 0 }} />
                    </td>
                    <td style={tdStyle}>
                      <input type="number" min="0" step="any" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} placeholder="0" style={{ ...inputStyle, margin: 0 }} />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{subtotal > 0 ? formatRupiah(subtotal) : '-'}</td>
                    <td style={tdStyle}>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: 18 }}>×</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <button type="button" onClick={addItem} style={{ marginTop: 10, background: 'none', border: '1px dashed #aaa', color: '#555', padding: '6px 14px', borderRadius: 4, cursor: 'pointer' }}>
            + Tambah Item
          </button>
          <div style={{ textAlign: 'right', marginTop: 10, fontWeight: 700, fontSize: 16 }}>
            Total: {formatRupiah(total)}
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitle}>Catatan & Tanda Tangan</h2>
          <label style={labelStyle}>Catatan (opsional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan..." style={{ ...inputStyle, height: 72, resize: 'vertical' }} />
          <label style={labelStyle}>Nama Penandatangan</label>
          <input value={signerName} onChange={e => setSignerName(e.target.value)} placeholder="Nama" style={inputStyle} />
          <label style={labelStyle}>Jabatan</label>
          <input value={signerTitle} onChange={e => setSignerTitle(e.target.value)} placeholder="Manager / Direktur" style={inputStyle} />
        </section>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button type="button" onClick={() => navigate('/')} style={{ padding: '10px 20px', borderRadius: 6, border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>
            Batal
          </button>
          <button type="submit" disabled={saving} style={{ padding: '10px 24px', borderRadius: 6, background: '#1a56db', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {saving ? 'Menyimpan...' : 'Simpan & Preview'}
          </button>
        </div>
      </form>
    </div>
  )
}

const sectionStyle = { background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', marginBottom: 20 }
const sectionTitle = { fontSize: 15, fontWeight: 700, margin: '0 0 14px 0', color: '#333' }
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4, marginTop: 10 }
const inputStyle = { display: 'block', width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, marginBottom: 4 }
const thStyle = { padding: '8px 10px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#555' }
const tdStyle = { padding: '6px 6px' }
