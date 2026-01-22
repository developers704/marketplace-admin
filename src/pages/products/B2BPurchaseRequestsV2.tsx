import { PageBreadcrumb } from '@/components'
import { Badge, Button, Card, Table, Tabs, Tab, Form, InputGroup } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import { FaWarehouse, FaSearch, FaExclamationTriangle } from 'react-icons/fa'

type B2BPurchaseRequest = {
	_id: string
	status: 'PENDING_DM' | 'PENDING_CM' | 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED'
	quantity: number
	createdAt: string
	updatedAt: string
	vendorProductId?: {
		_id: string
		vendorModel: string
		title: string
		brand?: string
		category?: string
	}
	skuId?: {
		_id: string
		sku: string
		metalColor?: string
		metalType?: string
		size?: string
		price?: number
	}
	storeWarehouseId?: {
		_id: string
		name: string
	}
	requestedByUser?: {
		_id: string
		username?: string
		email?: string
		phone_number?: string
	}
	// Low stock indicator (calculated on frontend or from backend)
	vendorInventory?: number
}

type Warehouse = {
	_id: string
	name: string
}

const statusBadge = (status: string) => {
	switch (status) {
		case 'PENDING_ADMIN':
			return <Badge bg="warning">Pending Admin</Badge>
		case 'APPROVED':
			return <Badge bg="success">Approved</Badge>
		case 'REJECTED':
			return <Badge bg="danger">Rejected</Badge>
		default:
			return <Badge bg="secondary">{status}</Badge>
	}
}

const tabStatuses = [
	{ key: 'PENDING_ADMIN', label: 'Pending Admin' },
	{ key: 'APPROVED', label: 'Approved' },
	{ key: 'REJECTED', label: 'Rejected' },
] as const

const B2BPurchaseRequestsV2 = () => {
	const BASE_API = import.meta.env.VITE_BASE_API
	const { user } = useAuthContext()
	const token = user?.token

	const [activeKey, setActiveKey] = useState<string>('PENDING_ADMIN')
	const [loading, setLoading] = useState(false)
	const [rows, setRows] = useState<B2BPurchaseRequest[]>([])
	const [warehouses, setWarehouses] = useState<Warehouse[]>([])
	const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
	const [searchTerm, setSearchTerm] = useState('')
	const [inventoryMap, setInventoryMap] = useState<Record<string, number>>({})
	const LOW_STOCK_THRESHOLD = 10 // Alert if vendor inventory < 10

	// Fetch warehouses list
	const fetchWarehouses = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/warehouses`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (response.ok) {
				const data = await response.json()
				setWarehouses(data || [])
			}
		} catch (error) {
			console.error('Failed to fetch warehouses:', error)
		}
	}

	// Fetch vendor inventory for a SKU
	const fetchSkuInventory = async (skuId: string) => {
		try {
			const response = await fetch(`${BASE_API}/api/v2/skus/${skuId}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (response.ok) {
				const data = await response.json()
				return data?.data?.totalQuantity || 0
			}
		} catch (error) {
			console.error('Failed to fetch SKU inventory:', error)
		}
		return 0
	}

	// Fetch all SKU inventories for current requests
	const fetchAllInventories = async (requests: B2BPurchaseRequest[]) => {
		const inventoryPromises = requests.map(async (r) => {
			if (r.skuId?._id) {
				const qty = await fetchSkuInventory(r.skuId._id)
				return { skuId: r.skuId._id, quantity: qty }
			}
			return null
		})

		const results = await Promise.all(inventoryPromises)
		const map: Record<string, number> = {}
		results.forEach((r) => {
			if (r) map[r.skuId] = r.quantity
		})
		setInventoryMap(map)
	}

	const fetchRequests = async (status: string) => {
		setLoading(true)
		try {
			const url = new URL(`${BASE_API}/api/v2/b2b/requests`)

			// Admin only sees PENDING_ADMIN, APPROVED, REJECTED
			url.searchParams.set('status', status)

			// Filter by warehouse if selected
			if (selectedWarehouse) {
				url.searchParams.set('storeWarehouseId', selectedWarehouse)
			}

			const response = await fetch(url.toString(), {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data?.message || 'Failed to fetch requests')
			}

			const requests = data?.data || []
			setRows(requests)

			// Fetch inventory for all SKUs
			if (requests.length > 0) {
				await fetchAllInventories(requests)
			}
		} catch (error: any) {
			Swal.fire({
				title: 'Error',
				text: error?.message || 'Failed to load purchase requests',
				icon: 'error',
			})
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (!token) return
		fetchWarehouses()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token])

	useEffect(() => {
		if (!token) return
		fetchRequests(activeKey)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeKey, selectedWarehouse, token])

	const approveRequest = async (id: string) => {
		try {
			const response = await fetch(`${BASE_API}/api/v2/b2b/approve/${id}`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			const data = await response.json()
			if (!response.ok) throw new Error(data?.message || 'Approve failed')
			Swal.fire({ title: 'Approved', text: 'Request approved successfully', icon: 'success', timer: 1200 })
			await fetchRequests(activeKey)
		} catch (error: any) {
			Swal.fire({ title: 'Error', text: error?.message || 'Approve failed', icon: 'error' })
		}
	}

	const rejectRequest = async (id: string) => {
		const { value: reason } = await Swal.fire({
			title: 'Reject Request',
			input: 'text',
			inputLabel: 'Reason (optional)',
			inputPlaceholder: 'Enter rejection reason',
			showCancelButton: true,
		})
		if (reason === undefined) return

		try {
			const response = await fetch(`${BASE_API}/api/v2/b2b/reject/${id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ reason }),
			})
			const data = await response.json()
			if (!response.ok) throw new Error(data?.message || 'Reject failed')
			Swal.fire({ title: 'Rejected', text: 'Request rejected', icon: 'success', timer: 1200 })
			await fetchRequests(activeKey)
		} catch (error: any) {
			Swal.fire({ title: 'Error', text: error?.message || 'Reject failed', icon: 'error' })
		}
	}

	// Filter rows by search term
	const filteredRows = useMemo(() => {
		let filtered = rows

		if (searchTerm) {
			const term = searchTerm.toLowerCase()
			filtered = filtered.filter(
				(r) =>
					r.vendorProductId?.vendorModel?.toLowerCase().includes(term) ||
					r.vendorProductId?.title?.toLowerCase().includes(term) ||
					r.skuId?.sku?.toLowerCase().includes(term) ||
					r.storeWarehouseId?.name?.toLowerCase().includes(term) ||
					r.requestedByUser?.username?.toLowerCase().includes(term) ||
					r.requestedByUser?.email?.toLowerCase().includes(term)
			)
		}

		return filtered
	}, [rows, searchTerm])

	// Check if SKU has low stock
	const isLowStock = (skuId?: string) => {
		if (!skuId) return false
		const inventory = inventoryMap[skuId] || 0
		return inventory < LOW_STOCK_THRESHOLD
	}

	// Get inventory quantity for a SKU
	const getInventoryQty = (skuId?: string) => {
		if (!skuId) return null
		return inventoryMap[skuId] ?? null
	}

	return (
		<>
			<PageBreadcrumb title="B2B Purchase Requests (v2)" subName="Products" />

			<Card>
				<Card.Body>
					<div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
						<div>
							<h4 className="mb-1">Admin Purchase Approvals</h4>
							<div className="text-muted">
								Review and approve/reject B2B purchase requests. DM/CM approvals are handled in Marketplace.
								On Admin approval, vendor SKU inventory is deducted and store inventory is incremented.
							</div>
						</div>
						<Button variant="outline-primary" onClick={() => fetchRequests(activeKey)} disabled={loading}>
							{loading ? 'Refreshing…' : 'Refresh'}
						</Button>
					</div>

					{/* Filters */}
					<div className="row g-3 mb-3">
						<div className="col-md-4">
							<Form.Label>
								<FaWarehouse className="me-1" />
								Filter by Warehouse
							</Form.Label>
							<Form.Select
								value={selectedWarehouse}
								onChange={(e) => setSelectedWarehouse(e.target.value)}
								disabled={loading}
							>
								<option value="">All Warehouses</option>
								{warehouses.map((wh) => (
									<option key={wh._id} value={wh._id}>
										{wh.name}
									</option>
								))}
							</Form.Select>
						</div>
						<div className="col-md-8">
							<Form.Label>
								<FaSearch className="me-1" />
								Search
							</Form.Label>
							<InputGroup>
								<Form.Control
									type="text"
									placeholder="Search by Vendor Model, Product, SKU, Store, Requester..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									disabled={loading}
								/>
								{searchTerm && (
									<Button
										variant="outline-secondary"
										onClick={() => setSearchTerm('')}
										disabled={loading}
									>
										Clear
									</Button>
								)}
							</InputGroup>
						</div>
					</div>

					<Tabs activeKey={activeKey} onSelect={(k) => k && setActiveKey(k)} className="mb-3">
						{tabStatuses.map((t) => (
							<Tab eventKey={t.key} title={t.label} key={t.key} />
						))}
					</Tabs>

					<Table responsive hover>
						<thead>
							<tr>
								<th>Vendor Model</th>
								<th>SKU</th>
								<th className="text-end">Qty</th>
								<th>Store</th>
								<th>Requested By</th>
								<th>Vendor Stock</th>
								<th>Status</th>
								<th className="text-end">Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={8}>Loading…</td>
								</tr>
							) : filteredRows.length === 0 ? (
								<tr>
									<td colSpan={8} className="text-center text-muted">
										No requests found.
									</td>
								</tr>
							) : (
								filteredRows.map((r) => {
									const skuId = r.skuId?._id
									const inventoryQty = getInventoryQty(skuId)
									const lowStock = isLowStock(skuId)
									const canApprove = r.status === 'PENDING_ADMIN' && inventoryQty !== null && inventoryQty >= r.quantity

									return (
										<tr key={r._id} className={lowStock && r.status === 'PENDING_ADMIN' ? 'table-warning' : ''}>
											<td>
												<div className="fw-bold">{r.vendorProductId?.vendorModel || '—'}</div>
												<div className="text-muted small">{r.vendorProductId?.title || ''}</div>
												{r.vendorProductId?.brand && (
													<div className="text-muted small">Brand: {r.vendorProductId.brand}</div>
												)}
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
											<td>
												<div className="fw-bold">{r.storeWarehouseId?.name || '—'}</div>
											</td>
											<td>
												<div className="fw-bold">{r.requestedByUser?.username || '—'}</div>
												<div className="text-muted small">{r.requestedByUser?.email || ''}</div>
											</td>
											<td>
												{inventoryQty !== null ? (
													<div>
														<span className={lowStock ? 'text-danger fw-bold' : 'text-success'}>
															{inventoryQty}
														</span>
														{lowStock && (
															<Badge bg="danger" className="ms-2">
																<FaExclamationTriangle className="me-1" />
																Low Stock
															</Badge>
														)}
														{r.status === 'PENDING_ADMIN' && inventoryQty < r.quantity && (
															<div className="text-danger small mt-1">
																Insufficient stock (need {r.quantity})
															</div>
														)}
													</div>
												) : (
													<span className="text-muted">Loading...</span>
												)}
											</td>
											<td>{statusBadge(r.status)}</td>
											<td className="text-end">
												<div className="d-inline-flex gap-2">
													{r.status === 'PENDING_ADMIN' && (
														<>
															<Button
																size="sm"
																variant="success"
																disabled={!canApprove || loading}
																onClick={() => approveRequest(r._id)}
																title={
																	!canApprove
																		? inventoryQty === null
																			? 'Checking inventory...'
																			: inventoryQty < r.quantity
																			? `Insufficient stock. Available: ${inventoryQty}, Required: ${r.quantity}`
																			: 'Cannot approve'
																		: 'Approve request'
																}
															>
																Approve
															</Button>
															<Button
																size="sm"
																variant="danger"
																disabled={loading}
																onClick={() => rejectRequest(r._id)}
															>
																Reject
															</Button>
														</>
													)}
													{(r.status === 'APPROVED' || r.status === 'REJECTED') && (
														<span className="text-muted small">No actions</span>
													)}
												</div>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</Table>

					{/* Low Stock Alert Summary */}
					{activeKey === 'PENDING_ADMIN' && filteredRows.some((r) => isLowStock(r.skuId?._id)) && (
						<div className="alert alert-warning mt-3">
							<FaExclamationTriangle className="me-2" />
							<strong>Low Stock Alert:</strong> Some products have vendor inventory below {LOW_STOCK_THRESHOLD} units.
							Please review before approving requests.
						</div>
					)}
				</Card.Body>
			</Card>
		</>
	)
}

export default B2BPurchaseRequestsV2
