import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    // Get invoice counts
    const [totalInvoices, overdueCount, paidCount, pendingReminders] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'overdue' } }),
      prisma.invoice.count({ where: { status: 'paid' } }),
      prisma.reminder.count({ where: { status: 'pending' } }),
    ])

    // Get outstanding invoices (draft, sent, viewed, overdue) with their line items
    const outstandingInvoices = await prisma.invoice.findMany({
      where: { status: { in: ['draft', 'sent', 'viewed', 'overdue'] } },
      include: { lineItems: true },
    })

    const totalOutstanding = outstandingInvoices.reduce(
      (sum, inv) => sum + inv.lineItems.reduce((s, item) => s + item.amount, 0),
      0
    )

    // Get overdue invoices with their line items
    const overdueInvoices = await prisma.invoice.findMany({
      where: { status: 'overdue' },
      include: { lineItems: true },
    })

    const totalOverdue = overdueInvoices.reduce(
      (sum, inv) => sum + inv.lineItems.reduce((s, item) => s + item.amount, 0),
      0
    )

    // Get paid invoices with their line items
    const paidInvoices = await prisma.invoice.findMany({
      where: { status: 'paid' },
      include: { lineItems: true },
    })

    const totalPaid = paidInvoices.reduce(
      (sum, inv) => sum + inv.lineItems.reduce((s, item) => s + item.amount, 0),
      0
    )

    return NextResponse.json({
      totalInvoices,
      totalOutstanding,
      totalOverdue,
      totalPaid,
      overdueCount,
      paidCount,
      pendingReminders,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
