const BASE = '/api'

export async function getInvoices(q = '') {
  const res = await fetch(`${BASE}/invoices?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('Gagal mengambil daftar invoice')
  return res.json()
}

export async function getInvoice(id) {
  const res = await fetch(`${BASE}/invoices/${id}`)
  if (!res.ok) throw new Error('Invoice tidak ditemukan')
  return res.json()
}

export async function createInvoice(data) {
  const res = await fetch(`${BASE}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Gagal membuat invoice')
  }
  return res.json()
}

export async function deleteInvoice(id) {
  const res = await fetch(`${BASE}/invoices/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Gagal menghapus invoice')
}

export async function searchCooperatives(q) {
  const res = await fetch(`${BASE}/cooperatives?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('Gagal mencari koperasi')
  return res.json()
}

export async function createCooperative(data) {
  const res = await fetch(`${BASE}/cooperatives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Gagal menyimpan koperasi')
  return res.json()
}
