import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'SecureQR - رموز QR مشفرة وآمنة',
  description: 'منصة متكاملة لإنشاء وإدارة رموز QR المشفرة وغير القابلة للتزوير',
  generator: 'SecureQR',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
