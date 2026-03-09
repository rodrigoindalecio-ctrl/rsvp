import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Manrope, Lora, Playfair_Display, Inter, Outfit, Great_Vibes } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { EventProvider } from '@/lib/event-context'
import { AdminProvider } from '@/lib/admin-context'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const greatVibes = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-great-vibes',
  display: 'swap',
})


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'App RSVP | Vanessa Bidinotti',
  description: 'Gestão exclusiva de eventos e convidados',
  icons: {
    icon: '/Logo-03.jpg',
    apple: '/Logo-03.jpg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RSVP Manager',
  },
}

import { DynamicTheme } from '@/app/components/dynamic-theme'
import { Toaster } from 'sonner'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${lora.variable} ${playfair.variable} ${inter.variable} ${outfit.variable} ${greatVibes.variable}`}>
      <body className="bg-background text-textPrimary font-sans antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <AdminProvider>
            <EventProvider>
              <DynamicTheme />
              <main className="flex-1">
                {children}
              </main>
              <Toaster position="top-center" richColors />
            </EventProvider>
          </AdminProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
