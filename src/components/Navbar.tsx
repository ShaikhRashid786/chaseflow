'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            Chase<span className="text-blue-600">Flow</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  )
}
