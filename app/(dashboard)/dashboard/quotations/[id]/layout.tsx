import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Pencil } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DownloadPDFButton } from '@/components/quotations/download-pdf-button'
import { SendWhatsAppButton } from '@/components/quotations/send-whatsapp-button'
import { QuotationTabs } from '@/components/quotations/quotation-tabs'

const statusStyles: Record<string, string> = {
  draft: 'bg-secondary text-secondary-foreground ring-1 ring-inset ring-border-strong',
  sent: 'bg-primary-soft text-primary ring-1 ring-inset ring-primary/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
}

export default async function QuotationLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: quotation, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !quotation) notFound()

  const status = quotation.status as string

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/quotations">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold leading-tight text-heading">
                {quotation.quotation_number}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  statusStyles[status] ?? statusStyles.draft
                }`}
              >
                {status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {quotation.client_name} · Created {formatDate(quotation.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/quotations/new?edit=${quotation.id}`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DownloadPDFButton quotation={quotation} />
          <SendWhatsAppButton quotation={quotation} />
        </div>
      </div>

      <QuotationTabs quotationId={id} />

      {children}
    </div>
  )
}
