'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParameterInfoToggleProps {
  name: string
  description: string
}

export function ParameterInfoToggle({ name, description }: ParameterInfoToggleProps) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-left"
        aria-expanded={open}
      >
        {name}
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-gray-400 transition-transform shrink-0', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          <span className="font-medium">Sobre este parâmetro: </span>
          {description}
        </p>
      )}
    </div>
  )
}
