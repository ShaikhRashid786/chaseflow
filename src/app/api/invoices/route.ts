import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where = status ? { status } : {}

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        lineItems: true,
        reminders: { orderBy: { sendOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const invoicesWithTotals = invoices.map((invoice) => ({
      ...invoice,
      totalAmount: invoice.lineItems.reduce((sum, item) => sum + item.amount, 0),
    }))

    return NextResponse.json(invoicesWithTotals)
  } catch (error) {
    console.error('Failed to fetch invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clientName,
      clientEmail,
      title,
      currency = 'INR',
      dueDate,
      notes,
      lineItems,
      reminders,
    } = body

    if (!clientName || !title || !dueDate || !lineItems?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: clientName, title, dueDate, and at least one lineItem' },
        { status: 400 }
      )
    }

    const publicSlug = nanoid(10)

    const invoice = await prisma.invoice.create({
      data: {
        clientName,
        clientEmail: clientEmail || null,
        title,
        currency,
        dueDate: new Date(dueDate),
        notes: notes || null,
        publicSlug,
        lineItems: {
          create: lineItems.map((item: { description: string; quantity: number; unitPrice: number }) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
        },
        ...(reminders?.length
          ? {
              reminders: {
                create: reminders.map(
                  (r: {
                    subject: string
                    body: string
                    scheduledDate: string
                    tone: string
                    sendOrder: number
                  }) => ({
                    subject: r.subject,
                    body: r.body,
                    scheduledDate: new Date(r.scheduledDate),
                    tone: r.tone,
                    sendOrder: r.sendOrder,
                  })
                ),
              },
            }
          : {}),
      },
      include: {
        lineItems: true,
        reminders: { orderBy: { sendOrder: 'asc' } },
      },
    })

    const invoiceWithTotal = {
      ...invoice,
      totalAmount: invoice.lineItems.reduce((sum, item) => sum + item.amount, 0),
    }

    return NextResponse.json(invoiceWithTotal, { status: 201 })
  } catch (error) {
    console.error('Failed to create invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
