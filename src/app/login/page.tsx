'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [mode, setMode] = useState<'passwordless' | 'password'>('passwordless')

  return (
    <div className="min-h-screen bg-ocean-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1>
            <Image src="/logo.png" alt="Camarão Camarada" width={856} height={371} className="h-20 w-auto mx-auto" priority />
          </h1>
          <p className="text-ocean-600 mt-3">Portal de Monitoramento da Qualidade da Água</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {mode === 'passwordless' ? (
            <PasswordlessForm onUsePassword={() => setMode('password')} />
          ) : (
            <PasswordForm onUsePasswordless={() => setMode('passwordless')} />
          )}
        </div>
      </div>
    </div>
  )
}

function PasswordlessForm({ onUsePassword }: { onUsePassword: () => void }) {
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const response = await fetch('/api/auth/access-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    })
    const result = await response.json()

    setLoading(false)

    if (!response.ok) {
      setError(result.error ?? 'Não foi possível acessar sua conta.')
      return
    }

    setMaskedEmail(result.maskedEmail)
  }

  if (maskedEmail) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifique seu e-mail</h2>
        <p className="text-sm text-gray-600">
          Enviamos um link de acesso para <strong>{maskedEmail}</strong>. Abra o e-mail e clique no
          link para entrar no seu portal.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Entrar na sua conta</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
            E-mail ou CPF
          </label>
          <input
            id="identifier"
            type="text"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-sm"
            placeholder="seu@email.com ou 000.000.000-00"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ocean-600 hover:bg-ocean-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? 'Enviando...' : 'Enviar link de acesso'}
        </button>
      </form>

      <button
        type="button"
        onClick={onUsePassword}
        className="w-full text-center text-sm text-ocean-600 hover:text-ocean-700 mt-4"
      >
        Entrar com senha
      </button>
    </div>
  )
}

function PasswordForm({ onUsePasswordless }: { onUsePasswordless: () => void }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Entrar com senha</h2>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-sm"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-sm"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ocean-600 hover:bg-ocean-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <button
        type="button"
        onClick={onUsePasswordless}
        className="w-full text-center text-sm text-ocean-600 hover:text-ocean-700 mt-4"
      >
        Entrar sem senha
      </button>
    </div>
  )
}
