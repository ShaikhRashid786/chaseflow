'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import ReminderTimeline from '@/components/ReminderTimeline'
import {
  ArrowLeft,
  Copy,
  Check,
  Send,
  CreditCard,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  X,
  ExternalLink,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface LineItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface Reminder {
  id: string
  invoiceId: string
  subject: string
  body: string
  scheduledDate: string
  status: string
  tone: string
  sendOrder: number
  sentAt?: string | null
}

interface Invoice {
  id: string
  clientName: string
  clientEmail?: string | null
  title: string
  currency: string
  status: string
  dueDate: string
  publicSlug: string
  notes?: string | null
  createdAt: string
  updatedAt: string
  lineItems: LineItem[]
  reminders: Reminder[]
}

function formatAmount(amount: number, currency: string): string {
  try {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [copied, setCopied] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    clientName: '',
    clientEmail: '',
    title: '',
    currency: 'INR',
    dueDate: '',
    notes: '',
  })
  const [editLineItems, setEditLineItems] = useState<
    { description: string; quantity: number; unitPrice: number }[]
  >([])

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type })
      setTimeout(() => setToast(null), 3000)
    },
    []
  )

  const fetchInvoice = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(`/api/invoices/${invoiceId}`)
      if (!res.ok) throw new Error('Failed to fetch invoice')
      const data = await res.json()
      setInvoice(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  function startEdit() {
    if (!invoice) return
    setEditData({
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail || '',
      title: invoice.title,
      currency: invoice.currency,
      dueDate: format(new Date(invoice.dueDate), 'yyyy-MM-dd'),
      notes: invoice.notes || '',
    })
    setEditLineItems(
      invoice.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
      }))
    )
    setIsEditing(true)
  }

  async function saveEdit() {
    setActionLoading('save')
    try {
      const validItems = editLineItems.filter(
        (item) => item.description.trim() && item.unitPrice > 0
      )
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: editData.clientName.trim(),
          clientEmail: editData.clientEmail.trim() || null,
          title: editData.title.trim(),
          currency: editData.currency,
          dueDate: new Date(editData.dueDate).toISOString(),
          notes: editData.notes.trim() || null,
          lineItems: validItems.map((item) => ({
            description: item.description.trim(),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed to update invoice')
      setIsEditing(false)
      showToast('Invoice updated successfully')
      fetchInvoice()
    } catch {
      showToast('Failed to update invoice', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  async function sendInvoice() {
    setActionLoading('send')
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to send invoice')
      showToast('Invoice sent successfully')
      fetchInvoice()
    } catch {
      showToast('Failed to send invoice', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  async function markAsPaid() {
    setActionLoading('paid')
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to mark as paid')
      showToast('Invoice marked as paid')
      fetchInvoice()
    } catch {
      showToast('Failed to mark as paid', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteInvoice() {
    setActionLoading('delete')
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete invoice')
      showToast('Invoice deleted')
      router.push('/dashboard')
    } catch {
      showToast('Failed to delete invoice', 'error')
      setActionLoading(null)
    }
  }

  async function handleReminderUpdate(
    reminderId: string,
    data: { subject: string; body: string; tone?: string }
  ) {
    try {
      const res = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update reminder')
      showToast('Reminder email updated successfully')
      fetchInvoice()
    } catch {
      showToast('Failed to update reminder', 'error')
    }
  }

  function copyPublicLink() {
    if (!invoice) return
    const url = `${window.location.origin}/invoice/${invoice.publicSlug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-red-700">
              {error || 'Invoice not found'}
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const totalAmount = invoice.lineItems.reduce(
    (sum, item) => sum + item.amount,
    0
  )
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/invoice/${invoice.publicSlug}`
  const dueDate = new Date(invoice.dueDate)
  const isPast = dueDate < new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Invoice?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              This will permanently delete this invoice and all its reminders.
              This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  deleteInvoice()
                }}
                disabled={actionLoading === 'delete'}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === 'delete' && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Invoice Header Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editData.title}
                        onChange={(e) =>
                          setEditData({ ...editData, title: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-bold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editData.clientName}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              clientName: e.target.value,
                            })
                          }
                          placeholder="Client Name"
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="email"
                          value={editData.clientEmail}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              clientEmail: e.target.value,
                            })
                          }
                          placeholder="Client Email"
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={editData.currency}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              currency: e.target.value,
                            })
                          }
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                        <input
                          type="date"
                          value={editData.dueDate}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              dueDate: e.target.value,
                            })
                          }
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <textarea
                        value={editData.notes}
                        onChange={(e) =>
                          setEditData({ ...editData, notes: e.target.value })
                        }
                        placeholder="Notes"
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-900">
                          {invoice.title}
                        </h1>
                        <StatusBadge status={invoice.status} size="md" />
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-500">
                        <p>
                          <span className="font-medium text-gray-700">
                            Client:
                          </span>{' '}
                          {invoice.clientName}
                          {invoice.clientEmail && (
                            <span className="ml-1 text-gray-400">
                              ({invoice.clientEmail})
                            </span>
                          )}
                        </p>
                        <p>
                          <span className="font-medium text-gray-700">
                            Due:
                          </span>{' '}
                          {format(dueDate, 'MMMM d, yyyy')}
                          <span
                            className={`ml-2 ${isPast && invoice.status !== 'paid' ? 'text-red-500' : 'text-gray-400'}`}
                          >
                            (
                            {isPast
                              ? `${formatDistanceToNow(dueDate)} ago`
                              : `in ${formatDistanceToNow(dueDate)}`}
                            )
                          </span>
                        </p>
                        <p>
                          <span className="font-medium text-gray-700">
                            Created:
                          </span>{' '}
                          {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                        </p>
                        {invoice.notes && (
                          <p className="mt-2 rounded-lg bg-gray-50 p-3 text-gray-600">
                            {invoice.notes}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Edit / Save buttons */}
                <div className="flex shrink-0 gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEdit}
                        disabled={actionLoading === 'save'}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {actionLoading === 'save' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={startEdit}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="mt-4 flex items-baseline justify-between border-t border-gray-100 pt-4">
                <span className="text-sm font-medium text-gray-500">
                  Total Amount
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatAmount(totalAmount, invoice.currency)}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Line Items
                </h2>
              </div>
              {isEditing ? (
                <div className="p-6">
                  <div className="space-y-3">
                    {editLineItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...editLineItems]
                            updated[index] = {
                              ...updated[index],
                              description: e.target.value,
                            }
                            setEditLineItems(updated)
                          }}
                          placeholder="Description"
                          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...editLineItems]
                            updated[index] = {
                              ...updated[index],
                              quantity: parseFloat(e.target.value) || 0,
                            }
                            setEditLineItems(updated)
                          }}
                          className="w-20 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-gray-400">×</span>
                        <input
                          type="number"
                          value={item.unitPrice || ''}
                          onChange={(e) => {
                            const updated = [...editLineItems]
                            updated[index] = {
                              ...updated[index],
                              unitPrice: parseFloat(e.target.value) || 0,
                            }
                            setEditLineItems(updated)
                          }}
                          className="w-28 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="0"
                          step="0.01"
                        />
                        <span className="w-24 text-right text-sm font-medium text-gray-600">
                          {formatAmount(
                            item.quantity * item.unitPrice,
                            editData.currency
                          )}
                        </span>
                        {editLineItems.length > 1 && (
                          <button
                            onClick={() =>
                              setEditLineItems(
                                editLineItems.filter((_, i) => i !== index)
                              )
                            }
                            className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      setEditLineItems([
                        ...editLineItems,
                        { description: '', quantity: 1, unitPrice: 0 },
                      ])
                    }
                    className="mt-3 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Item
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3 text-right">Qty</th>
                        <th className="px-6 py-3 text-right">Unit Price</th>
                        <th className="px-6 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lineItems.map((item, index) => (
                        <tr
                          key={item.id}
                          className={
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }
                        >
                          <td className="px-6 py-3 font-medium text-gray-900">
                            {item.description}
                          </td>
                          <td className="px-6 py-3 text-right text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-3 text-right text-gray-600">
                            {formatAmount(item.unitPrice, invoice.currency)}
                          </td>
                          <td className="px-6 py-3 text-right font-medium text-gray-900">
                            {formatAmount(item.amount, invoice.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200">
                        <td
                          colSpan={3}
                          className="px-6 py-3 text-right text-sm font-semibold text-gray-700"
                        >
                          Total
                        </td>
                        <td className="px-6 py-3 text-right text-lg font-bold text-gray-900">
                          {formatAmount(totalAmount, invoice.currency)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Reminders */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">
                Reminder Timeline
              </h2>
              <ReminderTimeline
                reminders={invoice.reminders}
                onUpdate={handleReminderUpdate}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">
                Actions
              </h3>
              <div className="space-y-3">
                {invoice.status === 'draft' && (
                  <button
                    onClick={sendInvoice}
                    disabled={actionLoading === 'send'}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading === 'send' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Invoice
                  </button>
                )}
                {invoice.status !== 'paid' && (
                  <button
                    onClick={markAsPaid}
                    disabled={actionLoading === 'paid'}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === 'paid' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    Mark as Paid
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Invoice
                </button>
              </div>
            </div>

            {/* Public Link */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Public Link
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                Share this link with your client to view the invoice.
              </p>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600">
                  {publicUrl}
                </div>
                <button
                  onClick={copyPublicLink}
                  className="shrink-0 rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:bg-gray-50"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                Open in new tab <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Invoice Info */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Details
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Invoice ID</dt>
                  <dd className="font-mono text-xs text-gray-700">
                    {invoice.id}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Currency</dt>
                  <dd className="text-gray-700">{invoice.currency}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status</dt>
                  <dd>
                    <StatusBadge status={invoice.status} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Reminders</dt>
                  <dd className="text-gray-700">
                    {invoice.reminders.filter((r) => r.status === 'sent').length}
                    /{invoice.reminders.length} sent
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Last Updated</dt>
                  <dd className="text-gray-700">
                    {format(new Date(invoice.updatedAt), 'MMM d, yyyy')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
