'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Save, Palette } from 'lucide-react'
import Link from 'next/link'
import { calculateGlassArea, formatDimensions } from '@/lib/calculations'

export default function NewDesignPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [template, setTemplate] = useState<any>(null)

  // Design data
  const [name, setName] = useState('')
  const [windowType, setWindowType] = useState('sliding')
  const [width, setWidth] = useState(1200)
  const [height, setHeight] = useState(1200)
  const [profileType, setProfileType] = useState('aluminium')
  const [glassType, setGlassType] = useState('clear')
  const [glassThickness, setGlassThickness] = useState(5)
  const [color, setColor] = useState('white')
  const [hardware, setHardware] = useState<string[]>([])

  // Load template if provided
  useEffect(() => {
    if (templateId) {
      loadTemplate()
    }
  }, [templateId])

  const loadTemplate = async () => {
    const { data, error } = await supabase
      .from('window_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (data) {
      setTemplate(data)
      setName(data.name)
      setWindowType(data.window_type)
      setWidth(data.default_width)
      setHeight(data.default_height)
    }
  }

  const saveDesign = async () => {
    if (!name) {
      setError('Design name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in')
        return
      }

      const { data, error: insertError } = await supabase
        .from('window_designs')
        .insert([
          {
            name,
            template_id: templateId || null,
            window_type: windowType,
            width,
            height,
            profile_type: profileType,
            glass_type: glassType,
            glass_thickness: glassThickness,
            color,
            hardware,
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      router.push('/dashboard/designs')
    } catch (err: any) {
      setError(err.message || 'Failed to save design')
    } finally {
      setLoading(false)
    }
  }

  const area = calculateGlassArea({ width, height })

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
              <h1 className="text-3xl font-bold text-gray-900">
                {template ? `New Design from ${template.name}` : 'Custom Window Design'}
              </h1>
              <p className="text-gray-600 mt-1">
                Configure your window specifications
              </p>
            </div>
          </div>
          <Button onClick={saveDesign} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Design'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Design Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Living Room Main Window"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="windowType">Window Type</Label>
                  <Select
                    id="windowType"
                    value={windowType}
                    onChange={(e) => setWindowType(e.target.value)}
                  >
                    <option value="sliding">Sliding</option>
                    <option value="casement">Casement</option>
                    <option value="fixed">Fixed</option>
                    <option value="door">Door</option>
                    <option value="combination">Combination</option>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="width">Width (mm)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                      min="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (mm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                      min="100"
                    />
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Dimensions:</span> {formatDimensions({ width, height })}
                  </p>
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Glass Area:</span> {area.toFixed(2)} sq ft
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Materials & Finishes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="profileType">Profile Type</Label>
                  <Select
                    id="profileType"
                    value={profileType}
                    onChange={(e) => setProfileType(e.target.value)}
                  >
                    <option value="aluminium">Aluminium</option>
                    <option value="upvc">UPVC</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="glassType">Glass Type</Label>
                  <Select
                    id="glassType"
                    value={glassType}
                    onChange={(e) => setGlassType(e.target.value)}
                  >
                    <option value="clear">Clear</option>
                    <option value="tinted">Tinted</option>
                    <option value="laminated">Laminated</option>
                    <option value="tempered">Tempered</option>
                    <option value="double-glazed">Double Glazed</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="glassThickness">Glass Thickness (mm)</Label>
                  <Select
                    id="glassThickness"
                    value={glassThickness}
                    onChange={(e) => setGlassThickness(parseInt(e.target.value))}
                  >
                    <option value="4">4mm</option>
                    <option value="5">5mm</option>
                    <option value="6">6mm</option>
                    <option value="8">8mm</option>
                    <option value="10">10mm</option>
                    <option value="12">12mm</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="color">Color/Finish</Label>
                  <Select
                    id="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  >
                    <option value="white">White</option>
                    <option value="black">Black</option>
                    <option value="grey">Grey</option>
                    <option value="brown">Brown</option>
                    <option value="bronze">Bronze</option>
                    <option value="wood-finish">Wood Finish</option>
                    <option value="anodized">Anodized</option>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visual Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center p-8">
                  <div
                    className="border-8 border-gray-800 bg-blue-200 bg-opacity-30 relative"
                    style={{
                      width: `${Math.min(width / 4, 300)}px`,
                      height: `${Math.min(height / 4, 300)}px`,
                    }}
                  >
                    {/* Simplified window representation */}
                    {windowType === 'sliding' && (
                      <>
                        <div className="absolute inset-0 border-r-4 border-gray-700" style={{ left: '50%' }} />
                        <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-gray-700 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                      </>
                    )}
                    {windowType === 'casement' && (
                      <div className="absolute inset-0 border-r-4 border-gray-700" style={{ left: '50%' }} />
                    )}
                    <Palette className="absolute top-2 right-2 w-6 h-6 text-gray-700 opacity-50" />
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-gray-600">
                    This is a simplified preview. Final design will be rendered in the quotation.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Design Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{windowType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="font-medium">{width} × {height} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profile:</span>
                    <span className="font-medium capitalize">{profileType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Glass:</span>
                    <span className="font-medium capitalize">{glassType} {glassThickness}mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Color:</span>
                    <span className="font-medium capitalize">{color}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-gray-600">Glass Area:</span>
                    <span className="font-medium">{area.toFixed(2)} sq ft</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
