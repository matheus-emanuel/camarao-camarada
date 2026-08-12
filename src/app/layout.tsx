import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Camarão Camarada',
  description: 'Portal de Monitoramento da Qualidade da Água para Carcinicultura',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
