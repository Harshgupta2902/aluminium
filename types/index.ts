export interface User {
  id: string
  email: string
  full_name: string
  company_name: string
  role: 'admin' | 'sales' | 'accounts'
  created_at: string
}

export interface Quotation {
  id: string
  quotation_number: string
  client_id: string
  client_name: string
  client_email: string
  client_phone: string
  status: 'draft' | 'sent' | 'approved' | 'rejected'
  total_amount: number
  items: QuotationItem[]
  created_by: string
  created_at: string
  updated_at: string
  valid_until: string
  notes?: string
}

export interface QuotationItem {
  id: string
  design_id?: string
  window_type: string
  dimensions: {
    width: number
    height: number
  }
  quantity: number
  profile_type: string
  glass_type: string
  color: string
  accessories: Accessory[]
  profile_cost: number
  glass_cost: number
  accessories_cost: number
  labour_cost: number
  total_cost: number
}

export interface WindowDesign {
  id: string
  name: string
  template_id: string
  window_type: 'sliding' | 'casement' | 'fixed' | 'door' | 'combination'
  dimensions: {
    width: number
    height: number
  }
  profile_type: string
  glass_type: string
  glass_thickness: number
  color: string
  hardware: string[]
  preview_image?: string
  created_by: string
  created_at: string
}

export interface WindowTemplate {
  id: string
  name: string
  category: string
  window_type: string
  default_dimensions: {
    width: number
    height: number
  }
  image_url: string
  description: string
}

export interface Profile {
  id: string
  name: string
  type: 'aluminium' | 'upvc'
  weight_per_meter: number
  cost_per_kg: number
  cost_per_meter: number
  stock_quantity: number
  unit: string
}

export interface Glass {
  id: string
  type: string
  thickness: number
  cost_per_sqft: number
  stock_quantity: number
}

export interface Accessory {
  id: string
  name: string
  category: string
  cost: number
  quantity: number
  stock_quantity: number
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  company?: string
  created_at: string
  total_quotations: number
  total_revenue: number
}

export interface Invoice {
  id: string
  invoice_number: string
  quotation_id: string
  client_id: string
  amount: number
  paid_amount: number
  status: 'pending' | 'partial' | 'paid'
  due_date: string
  created_at: string
}

export interface DashboardStats {
  today_quotes: number
  today_quotes_change: number
  revenue_mtd: number
  revenue_mtd_change: number
  designs_created: number
  pdf_sent: number
}

export interface CalculationFormula {
  id: string
  profile_weight_formula: string
  glass_area_formula: string
  labour_cost_per_sqft: number
  markup_percentage: number
}
