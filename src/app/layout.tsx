import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChaseFlow – Invoice Chasing & Payment Follow-ups',
  description: 'Automated invoice chasing and payment follow-up platform powered by MCP + Claude',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  )
}
