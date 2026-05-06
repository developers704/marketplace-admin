import { Badge } from 'react-bootstrap'

export type StoreTransferRow = {
	_id: string
	ticketNumber?: string
	status: string
	quantity: number
	unitPrice?: number
	currency?: string
	vendorProductId?: { vendorModel?: string; title?: string }
	skuId?: {
		sku?: string
		price?: number
		images?: string[]
		metalType?: string
		metalColor?: string
		size?: string
		attributes?: Record<string, string | number | undefined | null>
	}
	sourceWarehouseId?: { name?: string }
	destWarehouseId?: { name?: string }
	requestedBy?: { username?: string; email?: string }
	requestedByModel?: string
	rejection?: { reason?: string; rejectedAt?: string | null }
	deliveredAt?: string | null
	receivedAt?: string | null
	createdAt?: string
	inventoryAppliedAt?: string | null
}

const ATTR_LABEL_OVERRIDES: Record<string, string> = {
	cpprice: 'CP price',
	descriptionname: 'Description',
	gender: 'Gender',
	vendor: 'Vendor',
	avgweight: 'Avg. weight',
	centercarat: 'Center carat',
	sidecarat: 'Side carat',
}

export function humanizeAttrKey(key: string): string {
	if (!key || key.trim() === '') return ''
	const lower = key.toLowerCase()
	if (ATTR_LABEL_OVERRIDES[lower]) return ATTR_LABEL_OVERRIDES[lower]
	const spaced = key
		.replace(/_/g, ' ')
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.trim()
	if (!spaced) return key
	return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function hasAttrValue(v: unknown): boolean {
	if (v === null || v === undefined) return false
	if (typeof v === 'string') return v.trim().length > 0
	if (typeof v === 'number') return !Number.isNaN(v)
	return true
}

/** Entries suitable for display (drops empty keys and empty values) */
export function getAttrEntries(attr?: Record<string, string | number | undefined | null> | null): [string, string][] {
	if (!attr || typeof attr !== 'object') return []
	return Object.entries(attr)
		.filter(([k, v]) => k !== '' && String(k).trim() !== '' && hasAttrValue(v))
		.map(([k, v]) => [k, String(v)])
}

export function attributesSummary(attr?: Record<string, string | number | undefined | null> | null, maxParts = 5): string {
	const entries = getAttrEntries(attr)
	if (!entries.length) return ''
	return entries
		.slice(0, maxParts)
		.map(([k, v]) => `${humanizeAttrKey(k)}: ${v}`)
		.join(' · ')
}

export function statusBadgeEl(s: string) {
	const u = String(s || '').toUpperCase()
	const map: Record<string, string> = {
		SUBMITTED: 'secondary',
		WIP: 'info',
		TRANSFER: 'primary',
		APPROVED: 'success',
		REJECTED: 'danger',
		DELIVERED: 'warning',
		RECEIVED: 'dark',
	}
	return <Badge bg={map[u] || 'secondary'}>{u}</Badge>
}
