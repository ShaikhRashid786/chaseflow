import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> | { id: string } }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: true,
        reminders: { orderBy: { sendOrder: 'asc' } },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const invoiceWithTotal = {
      ...invoice,
      totalAmount: invoice.lineItems.reduce((sum, item) => sum + item.amount, 0),
    }

    return NextResponse.json(invoiceWithTotal)
  } catch (error) {
    console.error('Failed to fetch invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const { lineItems, reminders, ...invoiceFields } = body

    // Build the update data for invoice scalar fields
    const updateData: Record<string, unknown> = {}
    const allowedFields = ['clientName', 'clientEmail', 'title', 'currency', 'dueDate', 'notes', 'status']
    for (const field of allowedFields) {
      if (invoiceFields[field] !== undefined) {
        updateData[field] = field === 'dueDate' ? new Date(invoiceFields[field]) : invoiceFields[field]
      }
    }

    // Handle line items: delete existing and create new ones
    if (lineItems && Array.isArray(lineItems)) {
      await prisma.lineItem.deleteMany({ where: { invoiceId: id } })
      updateData.lineItems = {
        create: lineItems.map((item: { description: string; quantity: number; unitPrice: number }) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
        })),
      }
    }

    // Handle reminders: update existing ones
    if (reminders && Array.isArray(reminders)) {
      for (const reminder of reminders) {
        if (reminder.id) {
          const reminderUpdate: Record<string, unknown> = {}
          if (reminder.subject !== undefined) reminderUpdate.subject = reminder.subject
          if (reminder.body !== undefined) reminderUpdate.body = reminder.body
          if (reminder.scheduledDate !== undefined) reminderUpdate.scheduledDate = new Date(reminder.scheduledDate)
          if (reminder.tone !== undefined) reminderUpdate.tone = reminder.tone

          await prisma.reminder.update({
            where: { id: reminder.id },
            data: reminderUpdate,
          })
        }
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        lineItems: true,
        reminders: { orderBy: { sendOrder: 'asc' } },
      },
    })

    const invoiceWithTotal = {
      ...invoice,
      totalAmount: invoice.lineItems.reduce((sum, item) => sum + item.amount, 0),
    }

    return NextResponse.json(invoiceWithTotal)
  } catch (error) {
    console.error('Failed to update invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const existing = await prisma.invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    await prisma.invoice.delete({ where: { id } })

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Failed to delete invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}

export const PATCH = PUT
