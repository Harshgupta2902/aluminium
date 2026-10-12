import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DownloadPDFButton } from '@/components/quotations/download-pdf-button'
import { SendWhatsAppButton } from '@/components/quotations/send-whatsapp-button'
import { connection } from 'next/server'

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Request-time route (session + per-request data); not prerendered.
  await connection()

  const { id } = await params
  const supabase = await createClient()

  const { data: quotation, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !quotation) {
    notFound()
  }

  const items = quotation.items || []

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/quotations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {quotation.quotation_number}
            </h1>
            <p className="text-gray-600 mt-1">
              Created on {formatDate(quotation.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <DownloadPDFButton quotation={quotation} />
          <SendWhatsAppButton quotation={quotation} />
        </div>
      </div>

      {/* Status */}
      <div>
        <span
          className={`px-4 py-2 text-sm font-medium rounded-full ${
            statusColors[quotation.status as keyof typeof statusColors]
          }`}
        >
          {quotation.status.toUpperCase()}
        </span>
      </div>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium text-lg">{quotation.client_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium text-lg">{quotation.client_phone}</p>
            </div>
            {quotation.client_email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-lg">{quotation.client_email}</p>
              </div>
            )}
            {quotation.valid_until && (
              <div>
                <p className="text-sm text-gray-600">Valid Until</p>
                <p className="font-medium text-lg">
                  {formatDate(quotation.valid_until)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg capitalize">
                      {item.window_type} Window
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.dimensions.width}mm × {item.dimensions.height}mm
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="font-semibold text-lg">{item.quantity}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Profile</p>
                    <p className="font-medium capitalize">{item.profile_type}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Glass</p>
                    <p className="font-medium capitalize">{item.glass_type}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Color</p>
                    <p className="font-medium capitalize">{item.color}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Profile</p>
                      <p className="font-medium">{formatCurrency(item.profile_cost)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Glass</p>
                      <p className="font-medium">{formatCurrency(item.glass_cost)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Labour</p>
                      <p className="font-medium">{formatCurrency(item.labour_cost)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Accessories</p>
                      <p className="font-medium">{formatCurrency(item.accessories_cost)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">Total</p>
                      <p className="font-bold text-blue-600">
                        {formatCurrency(item.total_cost)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {quotation.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{quotation.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Total */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600">Total Items</p>
              <p className="text-2xl font-bold">{items.length}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 mb-2">Grand Total</p>
              <p className="text-4xl font-bold text-blue-600">
                {formatCurrency(quotation.total_amount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
