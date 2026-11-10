'use client'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const colorMap: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  overdue: 'bg-red-100 text-red-700',
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  skipped: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-gray-100 text-gray-700',
}

const sizeMap: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const colors = colorMap[status] || 'bg-gray-100 text-gray-700'
  const sizing = sizeMap[size]
  const label = status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colors} ${sizing}`}
    >
      {label}
    </span>
  )
}
