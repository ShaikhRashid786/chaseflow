'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Loader2 } from 'lucide-react'

interface LineItemInput {
  description: string
  quantity: number
  unitPrice: number
}

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const currencies = [
  { code: 'INR', label: 'INR (₹)' },
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
]

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateInvoiceModalProps) {
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [title, setTitle] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItemInput[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setClientName('')
      setClientEmail('')
      setTitle('')
      setCurrency('INR')
      setDueDate('')
      setNotes('')
      setLineItems([{ description: '', quantity: 1, unitPrice: 0 }])
      setError(null)
    }
  }, [isOpen])

  function addLineItem() {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }])
  }

  function removeLineItem(index: number) {
    if (lineItems.length <= 1) return
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  function updateLineItem(
    index: number,
    field: keyof LineItemInput,
    value: string | number
  ) {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  function getLineAmount(item: LineItemInput): number {
    return item.quantity * item.unitPrice
  }

  function getTotal(): number {
    return lineItems.reduce((sum, item) => sum + getLineAmount(item), 0)
  }

  function formatAmount(amount: number): string {
    try {
      const locale = currency === 'INR' ? 'en-IN' : 'en-US'
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount)
    } catch {
      return `${currency} ${amount.toFixed(2)}`
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!clientName.trim()) {
      setError('Client name is required')
      return
    }
    if (!title.trim()) {
      setError('Invoice title is required')
      return
    }
    if (!dueDate) {
      setError('Due date is required')
      return
    }
    const validItems = lineItems.filter(
      (item) => item.description.trim() && item.unitPrice > 0
    )
    if (validItems.length === 0) {
      setError('Add at least one line item with a description and price')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim() || undefined,
          title: title.trim(),
          currency,
          dueDate: new Date(dueDate).toISOString(),
          notes: notes.trim() || undefined,
          lineItems: validItems.map((item) => ({
            description: item.description.trim(),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create invoice')
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Create Invoice
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Client Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Acme Corp"
              />
            </div>

            {/* Client Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Client Email
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="billing@acme.com"
              />
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Invoice Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Web Development - November 2024"
              />
            </div>

            {/* Currency + Due Date row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Line Items <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </button>
              </div>
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="mb-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(index, 'description', e.target.value)
                        }
                        placeholder="Description"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              'quantity',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min="0"
                          step="0.01"
                          placeholder="Qty"
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-gray-400">×</span>
                      <div className="flex-1">
                        <input
                          type="number"
                          value={item.unitPrice || ''}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              'unitPrice',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min="0"
                          step="0.01"
                          placeholder="Unit Price"
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        = {formatAmount(getLineAmount(item))}
                      </span>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-right">
                <span className="text-sm text-gray-500">Total: </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatAmount(getTotal())}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Additional notes or payment instructions..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
