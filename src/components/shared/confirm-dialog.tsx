'use client'

import { useState } from 'react'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  children: React.ReactNode
  variant?: 'danger' | 'default'
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  children,
  variant = 'default',
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
    setOpen(false)
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !loading && setOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
            <p className="text-sm text-gray-600 mb-6">{description}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                  variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-ocean-600 hover:bg-ocean-700'
                }`}
              >
                {loading ? 'Aguarde...' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
