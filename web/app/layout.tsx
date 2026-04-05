import type { Metadata, Viewport } from 'next'
import { Manrope, Space_Grotesk } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Participation Status Check',
  description: 'QR-based attendance system',
  icons: {
    icon: '/logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0e4a84',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${manrope.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
