import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import InvoiceList from './pages/InvoiceList'
import InvoiceForm from './pages/InvoiceForm'
import InvoiceDetail from './pages/InvoiceDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InvoiceList />} />
        <Route path="/invoice/new" element={<InvoiceForm />} />
        <Route path="/invoice/:id" element={<InvoiceDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
