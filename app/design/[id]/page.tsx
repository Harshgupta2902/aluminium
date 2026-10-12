import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Download } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDimensions, calculateGlassArea } from '@/lib/calculations'

export default async function DesignViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ quotationId?: string; environment?: string }>
}) {
  const { id } = await params
  const { quotationId, environment } = await searchParams
  const supabase = await createClient()

  // If quotationId is provided, fetch design from quotation
  let design
  if (quotationId) {
    const { data: quotation } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single()

    if (quotation && quotation.items && quotation.items.length > 0) {
      const item = quotation.items[0] // Use first item for now
      design = {
        id: quotationId,
        name: `${quotation.client_name} - Window`,
        window_type: item.window_type,
        width: item.dimensions.width,
        height: item.dimensions.height,
        profile_type: item.profile_type,
        glass_type: item.glass_type,
        glass_thickness: 5,
        color: item.color,
        quotation_number: quotation.quotation_number,
      }
    }
  } else {
    // Fetch design by ID
    const { data, error } = await supabase
      .from('window_designs')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      notFound()
    }
    design = data
  }

  if (!design) {
    notFound()
  }

  const area = calculateGlassArea({ width: design.width, height: design.height })

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/designs">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{design.name}</h1>
              {design.quotation_number && (
                <p className="text-gray-600 mt-1">
                  Quotation: {design.quotation_number}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Design Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Design Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center p-8">
                <div
                  className="border-8 border-gray-800 bg-blue-200 bg-opacity-30 relative shadow-2xl"
                  style={{
                    width: `${Math.min(design.width / 4, 350)}px`,
                    height: `${Math.min(design.height / 4, 350)}px`,
                  }}
                >
                  {design.window_type === 'sliding' && (
                    <>
                      <div className="absolute inset-0 border-r-4 border-gray-700" style={{ left: '50%' }} />
                      <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-gray-700 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-gray-700 rounded-full transform translate-x-1/2 -translate-y-1/2" />
                    </>
                  )}
                  {design.window_type === 'casement' && (
                    <>
                      <div className="absolute inset-0 border-r-4 border-gray-700" style={{ left: '50%' }} />
                      <div className="absolute top-1/2 left-1/4 w-6 h-16 bg-gray-700 rounded transform -translate-x-1/2 -translate-y-1/2" />
                    </>
                  )}
                  {design.window_type === 'fixed' && (
                    <div className="absolute inset-4 border-2 border-gray-600" />
                  )}
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 capitalize">
                  {design.window_type} Window
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Window Type</h4>
                    <p className="text-lg font-semibold capitalize">{design.window_type}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Dimensions</h4>
                    <p className="text-lg font-semibold">{formatDimensions({ width: design.width, height: design.height })}</p>
                    <p className="text-sm text-gray-500 mt-1">Glass Area: {area.toFixed(2)} sq ft</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Profile</h4>
                    <p className="text-lg font-semibold capitalize">{design.profile_type}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Glass</h4>
                    <p className="text-lg font-semibold capitalize">
                      {design.glass_type} {design.glass_thickness || 5}mm
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Color/Finish</h4>
                    <p className="text-lg font-semibold capitalize">{design.color}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm">Energy Efficient</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm">UV Protection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm">Sound Insulation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm">Weather Resistant</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm">Easy Maintenance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Frame Material</p>
                <p className="font-semibold capitalize mt-1">{design.profile_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Glass Thickness</p>
                <p className="font-semibold mt-1">{design.glass_thickness || 5}mm</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Opening Style</p>
                <p className="font-semibold capitalize mt-1">{design.window_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Finish</p>
                <p className="font-semibold capitalize mt-1">{design.color}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {environment && (
          <div className="text-center text-sm text-gray-500">
            Environment: {environment}
          </div>
        )}
      </div>
    </div>
  )
}
