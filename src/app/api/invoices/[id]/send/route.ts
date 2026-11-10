import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const invoice = await prisma.invoice.findUnique({ where: { id } })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft invoices can be sent' },
        { status: 400 }
      )
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'sent' },
      include: {
        lineItems: true,
        reminders: { orderBy: { sendOrder: 'asc' } },
      },
    })

    const invoiceWithTotal = {
      ...updatedInvoice,
      totalAmount: updatedInvoice.lineItems.reduce((sum, item) => sum + item.amount, 0),
    }

    return NextResponse.json(invoiceWithTotal)
  } catch (error) {
    console.error('Failed to send invoice:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
