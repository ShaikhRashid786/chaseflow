'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import StatusBadge from '@/components/StatusBadge'
import { Check, X, Pencil } from 'lucide-react'

interface Reminder {
  id: string
  invoiceId: string
  subject: string
  body: string
  scheduledDate: string
  status: string
  tone: string
  sendOrder: number
  sentAt?: string | null
}

interface ReminderTimelineProps {
  reminders: Reminder[]
  onUpdate?: (reminderId: string, data: { subject: string; body: string; tone?: string }) => void
}

const dotColorMap: Record<string, string> = {
  sent: 'bg-green-500',
  pending: 'bg-yellow-400',
  cancelled: 'bg-gray-300',
  skipped: 'bg-gray-300',
}

const toneColorMap: Record<string, string> = {
  friendly: 'bg-blue-100 text-blue-700',
  firm: 'bg-orange-100 text-orange-700',
  final: 'bg-red-100 text-red-700',
}

export default function ReminderTimeline({
  reminders,
  onUpdate,
}: ReminderTimelineProps) {
  const sorted = [...reminders].sort((a, b) => a.sendOrder - b.sendOrder)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editTone, setEditTone] = useState('friendly')

  function startEdit(r: Reminder) {
    setEditingId(r.id)
    setEditSubject(r.subject)
    setEditBody(r.body)
    setEditTone(r.tone)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditSubject('')
    setEditBody('')
  }

  function saveEdit(id: string) {
    onUpdate?.(id, { subject: editSubject, body: editBody, tone: editTone })
    setEditingId(null)
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 py-8 text-center text-sm text-gray-400">
        No reminders scheduled
      </div>
    )
  }

  return (
    <div className="relative space-y-0">
      {sorted.map((reminder, index) => {
        const isLast = index === sorted.length - 1
        const isEditing = editingId === reminder.id
        const dotColor = dotColorMap[reminder.status] || 'bg-gray-300'
        const toneColor = toneColorMap[reminder.tone] || 'bg-gray-100 text-gray-700'

        return (
          <div key={reminder.id} className="relative flex gap-4 pb-6">
            {/* Timeline line and dot */}
            <div className="flex flex-col items-center">
              <div
                className={`z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white ring-2 ring-gray-100 ${dotColor}`}
              />
              {!isLast && (
                <div className="w-0.5 flex-1 bg-gray-200" />
              )}
            </div>

            {/* Content Card */}
            <div className="-mt-0.5 flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400">
                    Step #{reminder.sendOrder}
                  </span>
                  <StatusBadge status={reminder.status} size="sm" />
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${toneColor}`}
                  >
                    {reminder.tone} Tone
                  </span>
                </div>
                {onUpdate && reminder.status !== 'sent' && !isEditing && (
                  <button
                    onClick={() => startEdit(reminder)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit Email
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="mt-3 space-y-3 rounded-lg border border-blue-100 bg-blue-50/30 p-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Tone</label>
                    <select
                      value={editTone}
                      onChange={(e) => setEditTone(e.target.value)}
                      className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="friendly">Friendly</option>
                      <option value="firm">Firm</option>
                      <option value="final">Final Escalation</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Subject</label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Email subject..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Email Body</label>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Email content..."
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => saveEdit(reminder.id)}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
                    >
                      <Check className="h-3.5 w-3.5" /> Save Changes
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="mt-2 text-sm font-semibold text-gray-900">
                    {reminder.subject}
                  </h4>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-gray-600">
                    {reminder.body}
                  </p>
                </>
              )}

              <p className="mt-3 text-xs text-gray-400">
                Scheduled:{' '}
                {format(new Date(reminder.scheduledDate), 'MMM d, yyyy h:mm a')}
                {reminder.sentAt && (
                  <>
                    {' · '}Sent:{' '}
                    {format(new Date(reminder.sentAt), 'MMM d, yyyy h:mm a')}
                  </>
                )}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
