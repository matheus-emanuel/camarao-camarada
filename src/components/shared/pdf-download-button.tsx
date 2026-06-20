'use client'

import { useState } from 'react'
import { generatePdf } from '@/lib/pdf/generate'

interface PdfDownloadButtonProps {
  elementId: string
  filename: string
  label?: string
  className?: string
}

export function PdfDownloadButton({
  elementId,
  filename,
  label = 'Baixar PDF',
  className,
}: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDownload() {
    setLoading(true)
    setError('')
    try {
      await generatePdf(elementId, filename)
    } catch {
      setError('Erro ao gerar PDF. Tente em um desktop.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-ocean-600 hover:bg-ocean-700 disabled:opacity-60 rounded-lg transition-colors ${className ?? ''}`}
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span> Gerando...
          </>
        ) : (
          <>📄 {label}</>
        )}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
