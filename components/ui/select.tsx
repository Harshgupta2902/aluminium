'use client'

import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A custom Select that mirrors the native <select> API (value, onChange,
 * <option>/<optgroup> children) but renders a styled, rounded dropdown panel
 * with shadows — things the native option list can't be styled with.
 *
 * onChange is called with a minimal event-like object ({ target: { value } })
 * so existing `onChange={(e) => ... e.target.value}` call sites keep working.
 */

export interface SelectProps {
  value?: string
  onChange?: (event: { target: { value: string } }) => void
  children?: React.ReactNode
  id?: string
  name?: string
  disabled?: boolean
  placeholder?: string
  className?: string
}

interface ParsedOption {
  value: string
  label: string
  disabled?: boolean
}

interface ParsedGroup {
  label: string | null
  options: ParsedOption[]
}

// Flatten <option> / <optgroup> children into groups we can render ourselves.
function parseChildren(children: React.ReactNode): ParsedGroup[] {
  const groups: ParsedGroup[] = []
  let current: ParsedGroup = { label: null, options: [] }

  const pushCurrent = () => {
    if (current.options.length > 0) groups.push(current)
  }

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return

    // <optgroup label="...">...</optgroup>
    if (child.type === 'optgroup') {
      pushCurrent()
      current = { label: null, options: [] }

      const props = child.props as {
        label?: string
        children?: React.ReactNode
      }
      const groupOptions: ParsedOption[] = []
      React.Children.forEach(props.children, (opt) => {
        if (React.isValidElement(opt) && opt.type === 'option') {
          const op = opt.props as {
            value?: string
            children?: React.ReactNode
            disabled?: boolean
          }
          groupOptions.push({
            value: String(op.value ?? ''),
            label: childrenToText(op.children),
            disabled: op.disabled,
          })
        }
      })
      groups.push({ label: props.label ?? null, options: groupOptions })
      return
    }

    // bare <option>
    if (child.type === 'option') {
      const op = child.props as {
        value?: string
        children?: React.ReactNode
        disabled?: boolean
      }
      current.options.push({
        value: String(op.value ?? ''),
        label: childrenToText(op.children),
        disabled: op.disabled,
      })
    }
  })

  pushCurrent()
  return groups
}

function childrenToText(children: React.ReactNode): string {
  if (children == null || children === false) return ''
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }
  if (Array.isArray(children)) return children.map(childrenToText).join('')
  if (React.isValidElement(children)) {
    return childrenToText((children.props as { children?: React.ReactNode }).children)
  }
  return ''
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ value, onChange, children, id, name, disabled, placeholder, className }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [activeIndex, setActiveIndex] = React.useState(0)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const groups = React.useMemo(() => parseChildren(children), [children])
    const flat = React.useMemo(() => groups.flatMap((g) => g.options), [groups])

    const selected = flat.find((o) => o.value === value)
    const displayLabel = selected?.label || placeholder || 'Select...'

    // Close on outside click.
    React.useEffect(() => {
      if (!open) return
      const onDocClick = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', onDocClick)
      return () => document.removeEventListener('mousedown', onDocClick)
    }, [open])

    // When opening, highlight the currently selected option.
    React.useEffect(() => {
      if (open) {
        const idx = flat.findIndex((o) => o.value === value)
        setActiveIndex(idx >= 0 ? idx : 0)
      }
    }, [open, flat, value])

    const commit = (val: string) => {
      onChange?.({ target: { value: val } })
      setOpen(false)
    }

    const moveActive = (dir: 1 | -1) => {
      setActiveIndex((prev) => {
        let next = prev
        for (let i = 0; i < flat.length; i++) {
          next = (next + dir + flat.length) % flat.length
          if (!flat[next]?.disabled) break
        }
        return next
      })
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          setOpen(true)
        }
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveActive(1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveActive(-1)
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const opt = flat[activeIndex]
        if (opt && !opt.disabled) commit(opt.value)
      }
    }

    // Running index across groups so highlight/selection stay in sync.
    let runningIndex = -1

    return (
      <div ref={containerRef} className={cn('relative', className)}>
        <button
          ref={ref}
          type="button"
          id={id}
          name={name}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={onKeyDown}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 py-2 text-left text-sm shadow-xs transition-colors',
            'hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
            'disabled:cursor-not-allowed disabled:opacity-50',
            open && 'border-primary ring-2 ring-ring/60'
          )}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {displayLabel}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150',
              open && 'rotate-180'
            )}
          />
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card p-1 shadow-lg focus:outline-none"
          >
            {groups.map((group, gi) => (
              <div key={gi}>
                {group.label && (
                  <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </div>
                )}
                {group.options.map((opt) => {
                  runningIndex += 1
                  const index = runningIndex
                  const isSelected = opt.value === value
                  const isActive = index === activeIndex
                  return (
                    <div
                      key={`${opt.value}-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => !opt.disabled && commit(opt.value)}
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
                        isActive && 'bg-accent text-accent-foreground',
                        isSelected && 'font-medium text-primary',
                        opt.disabled && 'cursor-not-allowed opacity-50'
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }
