import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import CooperativeAutocomplete from './CooperativeAutocomplete'
import * as apiClient from '../api/client'

vi.mock('../api/client')

describe('CooperativeAutocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders input field', () => {
    render(<CooperativeAutocomplete value={null} onChange={() => {}} />)
    expect(screen.getByPlaceholderText(/nama koperasi/i)).toBeInTheDocument()
  })

  test('calls searchCooperatives when user types', async () => {
    apiClient.searchCooperatives.mockResolvedValue([{ id: 1, name: 'KUD Maju', address: '', phone: '' }])
    render(<CooperativeAutocomplete value={null} onChange={() => {}} />)
    await userEvent.type(screen.getByPlaceholderText(/nama koperasi/i), 'KUD')
    await waitFor(() => expect(apiClient.searchCooperatives).toHaveBeenCalledWith('KUD'))
  })

  test('shows suggestions in dropdown', async () => {
    apiClient.searchCooperatives.mockResolvedValue([{ id: 1, name: 'KUD Maju', address: '', phone: '' }])
    render(<CooperativeAutocomplete value={null} onChange={() => {}} />)
    await userEvent.type(screen.getByPlaceholderText(/nama koperasi/i), 'KUD')
    await waitFor(() => expect(screen.getByText('KUD Maju')).toBeInTheDocument())
  })

  test('calls onChange with selected cooperative when item clicked', async () => {
    const mockCoop = { id: 1, name: 'KUD Maju', address: 'Jl. A', phone: '081' }
    apiClient.searchCooperatives.mockResolvedValue([mockCoop])
    const onChange = vi.fn()
    render(<CooperativeAutocomplete value={null} onChange={onChange} />)
    await userEvent.type(screen.getByPlaceholderText(/nama koperasi/i), 'KUD')
    await waitFor(() => screen.getByText('KUD Maju'))
    await userEvent.click(screen.getByText('KUD Maju'))
    expect(onChange).toHaveBeenCalledWith(mockCoop)
  })
})
