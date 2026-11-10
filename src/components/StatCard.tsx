'use client'

import React from 'react'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  color?: string
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
}: StatCardProps) {
  const bgColor: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600',
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bgColor[color] || bgColor.blue}`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
