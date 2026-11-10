'use client'

import { useState, useEffect, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import StatCard from '@/components/StatCard'
import InvoiceCard from '@/components/InvoiceCard'
import CreateInvoiceModal from '@/components/CreateInvoiceModal'
import {
  Plus,
  FileText,
  AlertCircle,
  CheckCircle2,
  Bell,
  Loader2,
} from 'lucide-react'

interface StatsData {
  totalOutstanding: number
  totalOutstandingCount: number
  overdue: number
  overdueCount: number
  paidThisMonth: number
  paidThisMonthCount: number
  pendingReminders: number
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
  lineItems: { id: string; description: string; quantity: number; unitPrice: number; amount: number }[]
  reminders: { id: string; status: string; sendOrder: number }[]
}

const statusFilters = ['all', 'draft', 'sent', 'overdue', 'paid'] as const
type StatusFilter = (typeof statusFilters)[number]

const filterLabels: Record<StatusFilter, string> = {
  all: 'All',
  draft: 'Draft',
  sent: 'Sent',
  overdue: 'Overdue',
  paid: 'Paid',
}

function formatCurrency(amount: number, currency: string = 'INR'): string {
  try {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(0)}`
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [statsRes, invoicesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/invoices'),
      ])

      if (!statsRes.ok || !invoicesRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [statsData, invoicesData] = await Promise.all([
        statsRes.json(),
        invoicesRes.json(),
      ])

      setStats(statsData)
      setInvoices(invoicesData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredInvoices =
    filter === 'all'
      ? invoices
      : invoices.filter((inv) => inv.status === filter)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your invoices and track payments
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            {stats && (
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Outstanding"
                  value={formatCurrency(stats.totalOutstanding)}
                  subtitle={`${stats.totalOutstandingCount} invoice${stats.totalOutstandingCount !== 1 ? 's' : ''}`}
                  icon={<FileText className="h-6 w-6" />}
                  color="blue"
                />
                <StatCard
                  title="Overdue"
                  value={formatCurrency(stats.overdue)}
                  subtitle={`${stats.overdueCount} invoice${stats.overdueCount !== 1 ? 's' : ''}`}
                  icon={<AlertCircle className="h-6 w-6" />}
                  color="red"
                />
                <StatCard
                  title="Paid This Month"
                  value={formatCurrency(stats.paidThisMonth)}
                  subtitle={`${stats.paidThisMonthCount} invoice${stats.paidThisMonthCount !== 1 ? 's' : ''}`}
                  icon={<CheckCircle2 className="h-6 w-6" />}
                  color="green"
                />
                <StatCard
                  title="Pending Reminders"
                  value={String(stats.pendingReminders)}
                  subtitle="Scheduled to send"
                  icon={<Bell className="h-6 w-6" />}
                  color="yellow"
                />
              </div>
            )}

            {/* Action bar */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-1">
                {statusFilters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {filterLabels[f]}
                    {f !== 'all' && (
                      <span className="ml-1.5 text-xs opacity-70">
                        {invoices.filter((inv) => inv.status === f).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create Invoice
              </button>
            </div>

            {/* Invoice List */}
            {filteredInvoices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
                <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <h3 className="text-sm font-medium text-gray-900">
                  {filter === 'all'
                    ? 'No invoices yet'
                    : `No ${filter} invoices`}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all'
                    ? 'Create your first invoice to get started.'
                    : `You don't have any invoices with "${filter}" status.`}
                </p>
                {filter === 'all' && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create Invoice
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredInvoices.map((invoice) => (
                  <InvoiceCard key={invoice.id} invoice={invoice} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchData()
        }}
      />
    </div>
  )
}
