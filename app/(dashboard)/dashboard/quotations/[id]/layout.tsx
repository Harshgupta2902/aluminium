import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Pencil } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DownloadPDFButton } from '@/components/quotations/download-pdf-button'
import { SendEmailButton } from '@/components/quotations/send-email-button'
import { QuotationTabs } from '@/components/quotations/quotation-tabs'

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
            <h1 className="text-xl font-bold leading-tight text-heading">
              {quotation.quotation_number}
            </h1>
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
          <SendEmailButton quotation={quotation} />
        </div>
      </div>

      <QuotationTabs quotationId={id} />

      {children}
    </div>
  )
}
