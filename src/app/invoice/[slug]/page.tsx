import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string }
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

export default async function PublicInvoicePage({ params }: PageProps) {
  const { slug } = await params

  const invoice = await prisma.invoice.findUnique({
    where: { publicSlug: slug },
    include: { lineItems: true },
  })

  if (!invoice) {
    notFound()
  }

  const totalAmount = invoice.lineItems.reduce(
    (sum, item) => sum + item.amount,
    0
  )

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    sent: 'bg-blue-100 text-blue-700 border-blue-200',
    viewed: 'bg-purple-100 text-purple-700 border-purple-200',
    overdue: 'bg-red-100 text-red-700 border-red-200',
    paid: 'bg-green-100 text-green-700 border-green-200',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Invoice Card */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          {/* Paid watermark */}
          {invoice.status === 'paid' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rotate-[-30deg] rounded-xl border-4 border-green-500/20 px-8 py-4 text-6xl font-black uppercase tracking-widest text-green-500/15">
                PAID
              </div>
            </div>
          )}

          {/* Header */}
          <div className="border-b border-gray-100 px-6 py-8 sm:px-10">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  INVOICE
                </h1>
                <p className="mt-1 font-mono text-xs text-gray-400">
                  #{invoice.id}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${
                  statusColors[invoice.status] || statusColors.draft
                }`}
              >
                {invoice.status.charAt(0).toUpperCase() +
                  invoice.status.slice(1)}
              </span>
            </div>
          </div>

          {/* From / To */}
          <div className="grid gap-6 border-b border-gray-100 px-6 py-6 sm:grid-cols-2 sm:px-10">
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                From
              </h3>
              <p className="text-sm font-medium text-gray-900">
                ChaseFlow User
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                To
              </h3>
              <p className="text-sm font-medium text-gray-900">
                {invoice.clientName}
              </p>
              {invoice.clientEmail && (
                <p className="text-sm text-gray-500">{invoice.clientEmail}</p>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid gap-4 border-b border-gray-100 px-6 py-6 sm:grid-cols-4 sm:px-10">
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Title
              </h3>
              <p className="text-sm font-medium text-gray-900">
                {invoice.title}
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Invoice ID
              </h3>
              <p className="font-mono text-sm text-gray-700">
                {invoice.id.slice(-8).toUpperCase()}
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Issue Date
              </h3>
              <p className="text-sm text-gray-700">
                {format(new Date(invoice.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Due Date
              </h3>
              <p
                className={`text-sm font-medium ${
                  new Date(invoice.dueDate) < new Date() &&
                  invoice.status !== 'paid'
                    ? 'text-red-600'
                    : 'text-gray-700'
                }`}
              >
                {format(new Date(invoice.dueDate), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="px-6 py-6 sm:px-10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="pb-3 pr-4">Description</th>
                    <th className="pb-3 pr-4 text-right">Qty</th>
                    <th className="pb-3 pr-4 text-right">Unit Price</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-50 ${
                        index % 2 === 1 ? 'bg-gray-50/50' : ''
                      }`}
                    >
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {item.description}
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-600">
                        {formatAmount(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {formatAmount(item.amount, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-6 sm:px-10">
            <div className="flex flex-col items-end gap-2">
              <div className="flex w-full max-w-xs items-center justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatAmount(totalAmount, invoice.currency)}
                </span>
              </div>
              <div className="w-full max-w-xs border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatAmount(totalAmount, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-gray-100 px-6 py-6 sm:px-10">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Notes
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Powered by{' '}
            <a
              href="/"
              className="font-medium text-blue-500 hover:text-blue-600"
            >
              ChaseFlow
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
