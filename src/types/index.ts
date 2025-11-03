export * from './User'

export interface ProductFormData {
	name: string
	description?: string
	sku: any
	currency?: string
	price?: any
	IsBestSeller?: boolean
	image?: File | null
	gallery?: File[] | null
	variants: any[]
	category?: string | null
	brandId?: string | null
	subcategory?: string | null
	lifecycleStage?: string
	videoLink?: string | null
	releaseDate?: string | null
}

export interface ProductVariant {
	_id: string
	variantName: {
		_id: string
		name: string // for display in dropdown
	}
	value: string
}
