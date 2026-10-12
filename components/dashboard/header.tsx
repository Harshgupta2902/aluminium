'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  user?: {
    full_name: string
    email: string
  }
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b border-border bg-card px-4">
      <Button variant="ghost" size="icon" className="relative h-9 w-9">
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card"></span>
      </Button>

      <div className="flex items-center gap-2.5 border-l border-border pl-3">
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-foreground">
            {user?.full_name || 'User'}
          </p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover text-sm font-semibold text-white shadow-[var(--shadow-primary)] ring-2 ring-card">
          {user?.full_name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  )
}
