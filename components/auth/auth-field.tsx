'use client'

import { useState, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Labelled input with a leading icon. For password fields, pass
 * `type="password"` to get a built-in show/hide toggle.
 */
export function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  autoComplete,
  disabled,
  required,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  icon: ReactNode
  autoComplete?: string
  disabled?: boolean
  required?: boolean
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </span>
        <Input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          className={cn('pl-10', isPassword && 'pr-10')}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  )
}
