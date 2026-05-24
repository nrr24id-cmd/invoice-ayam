import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import InvoiceList from './InvoiceList'
import * as apiClient from '../api/client'

vi.mock('../api/client')

const INVOICES = [
  { id: 1, invoice_number: 'INV-20260524-001', date: '2026-05-24', cooperative_name: 'KUD Maju', buyer_name: 'Budi', total: 1400000 },
  { id: 2, invoice_number: 'INV-20260524-002', date: '2026-05-24', cooperative_name: 'Koperasi Sejahtera', buyer_name: 'Ani', total: 900000 }
]

function renderPage() {
  return render(<MemoryRouter><InvoiceList /></MemoryRouter>)
}

test('shows loading state then invoice list', async () => {
  apiClient.getInvoices.mockResolvedValue(INVOICES)
  renderPage()
  expect(screen.getByText(/memuat/i)).toBeInTheDocument()
  await waitFor(() => expect(screen.getByText('INV-20260524-001')).toBeInTheDocument())
})

test('shows all invoices in table', async () => {
  apiClient.getInvoices.mockResolvedValue(INVOICES)
  renderPage()
  await waitFor(() => screen.getByText('INV-20260524-001'))
  expect(screen.getByText('KUD Maju')).toBeInTheDocument()
  expect(screen.getByText('INV-20260524-002')).toBeInTheDocument()
})

test('shows empty message when no invoices', async () => {
  apiClient.getInvoices.mockResolvedValue([])
  renderPage()
  await waitFor(() => expect(screen.getByText(/belum ada invoice/i)).toBeInTheDocument())
})

test('calls getInvoices with search query when user types', async () => {
  apiClient.getInvoices.mockResolvedValue(INVOICES)
  renderPage()
  await waitFor(() => screen.getByText('INV-20260524-001'))
  await userEvent.type(screen.getByPlaceholderText(/cari/i), 'KUD')
  await waitFor(() => expect(apiClient.getInvoices).toHaveBeenCalledWith('KUD'))
})
