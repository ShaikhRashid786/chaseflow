import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ slug: string }> | { slug: string } }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { publicSlug: slug },
      include: {
        lineItems: true,
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
    console.error('Failed to fetch public invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}
