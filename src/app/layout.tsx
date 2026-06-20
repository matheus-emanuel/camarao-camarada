import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Camarão Camarada',
  description: 'Portal de Monitoramento da Qualidade da Água para Carcinicultura',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
