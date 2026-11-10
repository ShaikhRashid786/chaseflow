import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ reminderId: string }> | { reminderId: string } }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { reminderId } = await params
    const body = await request.json()

    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
    })

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.subject !== undefined) updateData.subject = body.subject
    if (body.body !== undefined) updateData.body = body.body
    if (body.scheduledDate !== undefined) updateData.scheduledDate = new Date(body.scheduledDate)
    if (body.status !== undefined) updateData.status = body.status
    if (body.tone !== undefined) updateData.tone = body.tone

    const updated = await prisma.reminder.update({
      where: { id: reminderId },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update reminder:', error)
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    )
  }
}

export const PATCH = PUT
