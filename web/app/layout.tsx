import type { Metadata, Viewport } from 'next'
import AppProviders from '@/providers/AppProviders'
import './globals.css'

export const metadata: Metadata = {
  title: 'HYBLOCK Official',
  description: 'HYBLOCK 공식 웹사이트입니다.',
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
    <html
      lang="ko"
      suppressHydrationWarning
      style={
        {
          '--font-space-grotesk': '"Avenir Next", "Pretendard", "Noto Sans KR", "Segoe UI", sans-serif',
          '--font-manrope': '"Inter", "Pretendard", "Noto Sans KR", "Segoe UI", sans-serif',
        } as React.CSSProperties
      }
    >
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
