import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rifa Tracker',
  description: 'Dashboard de métricas para rifas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
