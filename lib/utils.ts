import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Currency for PDFs. jsPDF's built-in Helvetica has no ₹ glyph (it renders as
 * broken/spaced characters), so we use an "Rs " prefix with Indian grouping.
 */
export function formatCurrencyPdf(amount: number): string {
  const n = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0))
  return `Rs ${n}`
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}
