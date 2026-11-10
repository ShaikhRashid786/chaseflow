import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { reminders: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Update invoice status to paid and cancel all pending reminders
    const [updatedInvoice] = await prisma.$transaction([
      prisma.invoice.update({
        where: { id },
        data: { status: 'paid' },
        include: {
          lineItems: true,
          reminders: { orderBy: { sendOrder: 'asc' } },
        },
      }),
      prisma.reminder.updateMany({
        where: { invoiceId: id, status: 'pending' },
        data: { status: 'cancelled' },
      }),
    ])

    // Re-fetch to get updated reminder statuses
    const freshInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: true,
        reminders: { orderBy: { sendOrder: 'asc' } },
      },
    })

    const invoiceWithTotal = {
      ...freshInvoice!,
      totalAmount: freshInvoice!.lineItems.reduce((sum, item) => sum + item.amount, 0),
    }

    return NextResponse.json(invoiceWithTotal)
  } catch (error) {
    console.error('Failed to mark invoice as paid:', error)
    return NextResponse.json(
      { error: 'Failed to mark invoice as paid' },
      { status: 500 }
    )
  }
}
