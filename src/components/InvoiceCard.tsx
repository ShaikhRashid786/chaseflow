'use client'

import Link from 'next/link'
import { Clock, User, IndianRupee, DollarSign, Bell, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import StatusBadge from '@/components/StatusBadge'

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface Reminder {
  id: string
  status: string
  sendOrder: number
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

interface InvoiceCardProps {
  invoice: Invoice
}

const currencyIcons: Record<string, React.ReactNode> = {
  INR: <IndianRupee className="h-4 w-4" />,
}

function formatAmount(amount: number, currency: string): string {
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

export default function InvoiceCard({ invoice }: InvoiceCardProps) {
  const totalAmount = invoice.lineItems.reduce(
    (sum, item) => sum + item.amount,
    0
  )
  const sentReminders = invoice.reminders.filter(
    (r) => r.status === 'sent'
  ).length
  const totalReminders = invoice.reminders.length
  const dueDate = new Date(invoice.dueDate)
  const isPast = dueDate < new Date()
  const CurrencyIcon =
    currencyIcons[invoice.currency] || <DollarSign className="h-4 w-4" />

  return (
    <Link
      href={`/dashboard/invoice/${invoice.id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Client & Title */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                {invoice.clientName}
              </h3>
              <p className="truncate text-xs text-gray-500">{invoice.title}</p>
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {/* Amount */}
            <span className="inline-flex items-center gap-1 font-semibold text-gray-900">
              {CurrencyIcon}
              {formatAmount(totalAmount, invoice.currency)}
            </span>

            {/* Due date */}
            <span
              className={`inline-flex items-center gap-1 ${isPast && invoice.status !== 'paid' ? 'text-red-600' : ''}`}
            >
              <Clock className="h-3.5 w-3.5" />
              {isPast
                ? `${formatDistanceToNow(dueDate)} ago`
                : `in ${formatDistanceToNow(dueDate)}`}
            </span>

            {/* Reminders */}
            {totalReminders > 0 && (
              <span className="inline-flex items-center gap-1">
                <Bell className="h-3.5 w-3.5" />
                {sentReminders}/{totalReminders} sent
              </span>
            )}
          </div>
        </div>

        {/* Right side: status + action */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={invoice.status} />
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
            View <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}
