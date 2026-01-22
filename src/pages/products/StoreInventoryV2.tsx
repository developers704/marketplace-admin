import { PageBreadcrumb } from '@/components'
import { Button, Card, Form, Table } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

type StoreInventoryRow = {
	_id: string
	quantity: number
	storeWarehouseId?: { _id: string; name: string; isMain?: boolean }
	vendorProductId?: { _id: string; vendorModel: string; title: string; brand?: string; category?: string }
	skuId?: { _id: string; sku: string; metalColor?: string; metalType?: string; size?: string; price?: number }
}

const StoreInventoryV2 = () => {
	const BASE_API = import.meta.env.VITE_BASE_API
	const { user, isSuperUser, role } = useAuthContext()
	const token = user?.token

	const roleName = String(role || '').toLowerCase().trim()
	const isAdmin = isSuperUser || roleName === 'admin'

	const [rows, setRows] = useState<StoreInventoryRow[]>([])
	const [loading, setLoading] = useState(false)
	const [storeWarehouseId, setStoreWarehouseId] = useState<string>('')

	const fetchStoreInventory = async () => {
		setLoading(true)
		try {
			const url = new URL(`${BASE_API}/api/v2/b2b/store-inventory`)
			if (storeWarehouseId) url.searchParams.set('storeWarehouseId', storeWarehouseId)

			const response = await fetch(url.toString(), {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			const data = await response.json()
			if (!response.ok) throw new Error(data?.message || 'Failed to fetch store inventory')
			setRows(data?.data || [])
		} catch (error: any) {
			Swal.fire({ title: 'Error', text: error?.message || 'Failed to load store inventory', icon: 'error' })
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (!token || !isAdmin) return
		fetchStoreInventory()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token, isAdmin])

	if (!isAdmin) {
		return (
			<>
				<PageBreadcrumb title="Store Inventory (v2)" subName="Products" />
				<Card>
					<Card.Body>Access denied.</Card.Body>
				</Card>
			</>
		)
	}

	return (
		<>
			<PageBreadcrumb title="Store Inventory (v2)" subName="Products" />

			<Card>
				<Card.Body>
					<div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
						<div>
							<h4 className="mb-1">Store Inventory</h4>
							<div className="text-muted">Inventory created from admin-approved B2B purchase requests.</div>
						</div>
						<div className="d-flex gap-2">
							<Form.Control
								placeholder="Filter by Store Warehouse ID (optional)"
								value={storeWarehouseId}
								onChange={(e) => setStoreWarehouseId(e.target.value)}
								style={{ width: 320 }}
							/>
							<Button variant="primary" onClick={fetchStoreInventory} disabled={loading}>
								{loading ? 'Loading…' : 'Search'}
							</Button>
						</div>
					</div>

					<Table responsive hover>
						<thead>
							<tr>
								<th>Store</th>
								<th>Vendor Model</th>
								<th>SKU</th>
								<th className="text-end">Qty</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={4}>Loading…</td>
								</tr>
							) : rows.length === 0 ? (
								<tr>
									<td colSpan={4}>No store inventory rows found.</td>
								</tr>
							) : (
								rows.map((r) => (
									<tr key={r._id}>
										<td>{r.storeWarehouseId?.name || '—'}</td>
										<td>
											<div className="fw-bold">{r.vendorProductId?.vendorModel || '—'}</div>
											<div className="text-muted small">{r.vendorProductId?.brand || ''}</div>
										</td>
										<td>
											<div className="fw-bold">{r.skuId?.sku || '—'}</div>
											<div className="text-muted small">
												{[r.skuId?.metalType, r.skuId?.metalColor, r.skuId?.size]
													.filter(Boolean)
													.join(' / ')}
											</div>
										</td>
										<td className="text-end fw-bold">{r.quantity}</td>
									</tr>
								))
							)}
						</tbody>
					</Table>
				</Card.Body>
			</Card>
		</>
	)
}

export default StoreInventoryV2


