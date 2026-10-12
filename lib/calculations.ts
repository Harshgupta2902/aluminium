/**
 * Calculation utilities for window quotations
 */

export interface WindowDimensions {
  width: number // in mm
  height: number // in mm
}

export interface ProfileCalculation {
  profileType: string
  weightPerMeter: number // kg/m
  costPerKg: number // ₹/kg
  dimensions: WindowDimensions
}

export interface GlassCalculation {
  glassType: string
  thickness: number // mm
  costPerSqft: number // ₹/sqft
  dimensions: WindowDimensions
}

/**
 * Calculate the perimeter of a window (in meters)
 */
export function calculatePerimeter(dimensions: WindowDimensions): number {
  const { width, height } = dimensions
  // Convert mm to meters and calculate perimeter
  const perimeterMm = 2 * (width + height)
  return perimeterMm / 1000 // Convert to meters
}

/**
 * Calculate profile weight based on dimensions and weight per meter
 */
export function calculateProfileWeight(calc: ProfileCalculation): number {
  const perimeter = calculatePerimeter(calc.dimensions)
  // For sliding windows, we need more profiles (tracks)
  const multiplier = calc.profileType.toLowerCase().includes('sliding') ? 1.5 : 1.2
  return perimeter * calc.weightPerMeter * multiplier
}

/**
 * Calculate profile cost
 */
export function calculateProfileCost(calc: ProfileCalculation): number {
  const weight = calculateProfileWeight(calc)
  return weight * calc.costPerKg
}

/**
 * Calculate glass area in square feet
 */
export function calculateGlassArea(dimensions: WindowDimensions): number {
  const { width, height } = dimensions
  // Convert mm to inches, then to square feet
  const widthInches = width / 25.4
  const heightInches = height / 25.4
  const areaInches = widthInches * heightInches
  return areaInches / 144 // Convert to square feet
}

/**
 * Calculate glass cost
 */
export function calculateGlassCost(calc: GlassCalculation): number {
  const area = calculateGlassArea(calc.dimensions)
  // Add 10% wastage
  const areaWithWastage = area * 1.1
  return areaWithWastage * calc.costPerSqft
}

/**
 * Calculate labour cost based on area
 */
export function calculateLabourCost(dimensions: WindowDimensions, labourCostPerSqft: number = 50): number {
  const area = calculateGlassArea(dimensions)
  return area * labourCostPerSqft
}

/**
 * Calculate total cost for a window item
 */
export function calculateItemTotal(params: {
  dimensions: WindowDimensions
  profileType: string
  profileWeightPerMeter: number
  profileCostPerKg: number
  glassType: string
  glassThickness: number
  glassCostPerSqft: number
  accessoriesCost: number
  labourCostPerSqft?: number
  quantity: number
  markupPercentage?: number
}): {
  profileCost: number
  glassCost: number
  labourCost: number
  accessoriesCost: number
  subtotal: number
  markup: number
  total: number
  totalWithQuantity: number
} {
  const {
    dimensions,
    profileType,
    profileWeightPerMeter,
    profileCostPerKg,
    glassType,
    glassThickness,
    glassCostPerSqft,
    accessoriesCost,
    labourCostPerSqft = 50,
    quantity,
    markupPercentage = 15,
  } = params

  const profileCost = calculateProfileCost({
    profileType,
    weightPerMeter: profileWeightPerMeter,
    costPerKg: profileCostPerKg,
    dimensions,
  })

  const glassCost = calculateGlassCost({
    glassType,
    thickness: glassThickness,
    costPerSqft: glassCostPerSqft,
    dimensions,
  })

  const labourCost = calculateLabourCost(dimensions, labourCostPerSqft)

  const subtotal = profileCost + glassCost + labourCost + accessoriesCost
  const markup = subtotal * (markupPercentage / 100)
  const total = subtotal + markup
  const totalWithQuantity = total * quantity

  return {
    profileCost: Math.round(profileCost),
    glassCost: Math.round(glassCost),
    labourCost: Math.round(labourCost),
    accessoriesCost: Math.round(accessoriesCost),
    subtotal: Math.round(subtotal),
    markup: Math.round(markup),
    total: Math.round(total),
    totalWithQuantity: Math.round(totalWithQuantity),
  }
}

/**
 * Format dimensions for display
 */
export function formatDimensions(dimensions: WindowDimensions): string {
  return `${dimensions.width}mm × ${dimensions.height}mm`
}

/**
 * Calculate area in square meters
 */
export function calculateAreaInSquareMeters(dimensions: WindowDimensions): number {
  const { width, height } = dimensions
  const areaInMm = width * height
  return areaInMm / 1000000 // Convert to square meters
}
