import { PageBreadcrumb } from '@/components'
import { Badge, Button, Card, Form, InputGroup, Spinner, Table } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { FaWarehouse, FaSearch, FaExclamationTriangle } from 'react-icons/fa'
import { LuRefreshCw } from 'react-icons/lu'

const GOLD = '#C6A87D'

const TABLE_SCROLL_AREA_STYLE = {
	flex: '1 1 auto',
	minHeight: 0,
	overflowY: 'auto' as const,
	WebkitOverflowScrolling: 'touch' as const,
}

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
	vendorInventory?: number
}

type Warehouse = {
	_id: string
	name: string
}

const statusBadge = (status: string) => {
	switch (status) {
		case 'PENDING_ADMIN':
			return (
				<Badge bg="warning" text="dark" className="rounded-pill px-2 py-1 fw-semibold">
					Pending Admin
				</Badge>
			)
		case 'APPROVED':
			return (
				<Badge bg="success" className="rounded-pill px-2 py-1 fw-semibold">
					Approved
				</Badge>
			)
		case 'REJECTED':
			return (
				<Badge bg="danger" className="rounded-pill px-2 py-1 fw-semibold">
					Rejected
				</Badge>
			)
		default:
			return (
				<Badge bg="secondary" className="rounded-pill px-2 py-1">
					{status}
				</Badge>
			)
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
	const navigate = useNavigate()

	const [activeKey, setActiveKey] = useState<string>('PENDING_ADMIN')
	const [loading, setLoading] = useState(false)
	const [rows, setRows] = useState<B2BPurchaseRequest[]>([])
	const [warehouses, setWarehouses] = useState<Warehouse[]>([])
	const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
	const [searchTerm, setSearchTerm] = useState('')
	const [inventoryMap, setInventoryMap] = useState<Record<string, number>>({})
	const LOW_STOCK_THRESHOLD = 10

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
			url.searchParams.set('status', status)
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
					r.requestedByUser?.email?.toLowerCase().includes(term),
			)
		}

		return filtered
	}, [rows, searchTerm])

	const isLowStock = (skuId?: string) => {
		if (!skuId) return false
		const inventory = inventoryMap[skuId] || 0
		return inventory < LOW_STOCK_THRESHOLD
	}

	const getInventoryQty = (skuId?: string) => {
		if (!skuId) return null
		return inventoryMap[skuId] ?? null
	}

	const lowStockAlert =
		activeKey === 'PENDING_ADMIN' && filteredRows.some((r) => isLowStock(r.skuId?._id))

	return (
		<>
			<PageBreadcrumb title="B2B Purchase Requests" subName="Products" />

			<Card
				className="border-0 shadow d-flex flex-column"
				style={{
					borderRadius: '1rem',
					borderBottom: `3px solid ${GOLD}`,
					overflow: 'hidden',
					height: 'calc(100vh - 108px)',
					maxHeight: 'calc(100vh - 108px)',
				}}
			>
				<div
					className="px-4 py-4 text-white flex-shrink-0"
					style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}
				>
					<div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
						<div>
							<div
								className="text-white-50 small text-uppercase mb-1"
								style={{ fontSize: 11, letterSpacing: '0.1em' }}
							>
								B2B approvals
							</div>
							<h4 className="mb-1 fw-semibold text-white">Purchase requests</h4>
							<p className="mb-0 text-white-50 small" style={{ maxWidth: 640 }}>
								Approve or reject store purchase requests. Vendor inventory moves to the store on approval.
							</p>
						</div>
						<Button
							variant="light"
							className="rounded-pill px-3 d-flex align-items-center gap-2"
							onClick={() => void fetchRequests(activeKey)}
							disabled={loading}
						>
							{loading ? <Spinner animation="border" size="sm" /> : <LuRefreshCw size={18} />}
							Refresh
						</Button>
					</div>

					<div className="row g-3 mb-3 pb-1 border-bottom border-secondary border-opacity-25">
						<div className="col-md-5 col-lg-4">
							<Form.Label className="text-white-50 small mb-1">
								<FaWarehouse className="me-1" />
								Warehouse
							</Form.Label>
							<Form.Select
								className="rounded-3 border-0"
								value={selectedWarehouse}
								onChange={(e) => setSelectedWarehouse(e.target.value)}
								disabled={loading}
							>
								<option value="">All warehouses</option>
								{warehouses.map((wh) => (
									<option key={wh._id} value={wh._id}>
										{wh.name}
									</option>
								))}
							</Form.Select>
						</div>
						<div className="col-md-7 col-lg-8">
							<Form.Label className="text-white-50 small mb-1">
								<FaSearch className="me-1" />
								Search
							</Form.Label>
							<InputGroup className="rounded-3 overflow-hidden">
								<Form.Control
									className="border-0"
									type="text"
									placeholder="Model, product, SKU, store, requester…"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									disabled={loading}
								/>
								{searchTerm ? (
									<Button
										variant="light"
										className="border-0"
										onClick={() => setSearchTerm('')}
										disabled={loading}
									>
										Clear
									</Button>
								) : null}
							</InputGroup>
						</div>
					</div>

					<div className="d-flex flex-wrap gap-2">
						{tabStatuses.map((t) => {
							const active = activeKey === t.key
							return (
								<button
									key={t.key}
									type="button"
									onClick={() => setActiveKey(t.key)}
									disabled={loading}
									className={`rounded-pill px-4 py-2 small fw-semibold border-0 transition-all ${
										active ? 'text-dark' : 'text-white'
									}`}
									style={{
										background: active ? GOLD : 'rgba(255,255,255,0.12)',
										opacity: loading ? 0.7 : 1,
									}}
								>
									{t.label}
								</button>
							)
						})}
					</div>
				</div>

				{lowStockAlert ? (
					<div
						className="mx-4 mt-3 mb-0 rounded-3 px-3 py-2 small d-flex align-items-center gap-2 flex-shrink-0"
						style={{
							background: 'rgba(198, 168, 125, 0.15)',
							border: '1px solid rgba(198, 168, 125, 0.45)',
							color: '#5c4d32',
						}}
					>
						<FaExclamationTriangle />
						<span>
							<strong>Low stock:</strong> Some SKUs are below {LOW_STOCK_THRESHOLD} units at vendor — review before
							approving.
						</span>
					</div>
				) : null}

				<Card.Body className="p-0 d-flex flex-column flex-grow-1 pt-3" style={{ minHeight: 0 }}>
					{loading ? (
						<div className="d-flex flex-grow-1 align-items-center justify-content-center py-5">
							<Spinner animation="border" style={{ color: GOLD }} />
						</div>
					) : (
						<div className="table-responsive flex-grow-1 px-0" style={TABLE_SCROLL_AREA_STYLE}>
							<Table hover className="align-middle mb-0">
								<thead className="table-light sticky-top border-bottom" style={{ zIndex: 5 }}>
									<tr className="small text-uppercase text-muted" style={{ fontSize: 11, letterSpacing: '0.05em' }}>
										<th className="ps-4 bg-light">Vendor / product</th>
										<th className="bg-light">SKU</th>
										<th className="text-end bg-light">Qty</th>
										<th className="bg-light">Store</th>
										<th className="bg-light">Requested by</th>
										<th className="bg-light">Vendor stock</th>
										<th className="bg-light">Status</th>
										<th className="text-end pe-4 bg-light">Actions</th>
									</tr>
								</thead>
								<tbody>
									{filteredRows.length === 0 ? (
										<tr>
											<td colSpan={8} className="text-center text-muted py-5">
												No requests in this tab.
											</td>
										</tr>
									) : (
										filteredRows.map((r) => {
											const skuId = r.skuId?._id
											const inventoryQty = getInventoryQty(skuId)
											const lowStock = isLowStock(skuId)
											const canApprove =
												r.status === 'PENDING_ADMIN' && inventoryQty !== null && inventoryQty >= r.quantity
											const warnRow = lowStock && r.status === 'PENDING_ADMIN'

											return (
												<tr
													key={r._id}
													style={
														warnRow
															? {
																	boxShadow: `inset 3px 0 0 ${GOLD}`,
																	background: 'rgba(198, 168, 125, 0.06)',
																}
															: undefined
													}
												>
													<td className="ps-4">
														<div className="fw-semibold small">{r.vendorProductId?.vendorModel || '—'}</div>
														<div className="text-muted small">{r.vendorProductId?.title || ''}</div>
														{r.vendorProductId?.brand && (
															<div className="text-muted small" style={{ fontSize: 11 }}>
																{r.vendorProductId.brand}
															</div>
														)}
													</td>
													<td>
														<span className="font-monospace fw-semibold small">{r.skuId?.sku || '—'}</span>
														<div className="text-muted small" style={{ fontSize: 11 }}>
															{[r.skuId?.metalType, r.skuId?.metalColor, r.skuId?.size]
																.filter(Boolean)
																.join(' · ')}
														</div>
													</td>
													<td className="text-end">
														<span className="fw-bold">{r.quantity}</span>
													</td>
													<td className="small fw-medium">{r.storeWarehouseId?.name || '—'}</td>
													<td>
														<div className="fw-medium small">{r.requestedByUser?.username || '—'}</div>
														<div className="text-muted small" style={{ fontSize: 11 }}>
															{r.requestedByUser?.email || ''}
														</div>
													</td>
													<td>
														{inventoryQty !== null ? (
															<div>
																<span className={lowStock ? 'text-danger fw-bold' : 'text-success fw-semibold'}>
																	{inventoryQty}
																</span>
																{lowStock && (
																	<Badge bg="danger" className="ms-2 rounded-pill" style={{ fontSize: 10 }}>
																		Low
																	</Badge>
																)}
																{r.status === 'PENDING_ADMIN' && inventoryQty < r.quantity && (
																	<div className="text-danger small mt-1" style={{ fontSize: 11 }}>
																		Need {r.quantity} · short {r.quantity - inventoryQty}
																	</div>
																)}
															</div>
														) : (
															<span className="text-muted small">…</span>
														)}
													</td>
													<td>{statusBadge(r.status)}</td>
													<td className="text-end pe-4">
														<div className="d-inline-flex flex-wrap gap-2 justify-content-end align-items-center">
															<Button
																size="sm"
																variant="outline-secondary"
																className="rounded-pill px-3 fw-semibold"
																style={{ borderColor: `${GOLD}66`, color: '#5c4d32' }}
																onClick={() => navigate(`/products/b2b-purchase-requests-v2/${r._id}`)}
															>
																View
															</Button>
															{r.status === 'PENDING_ADMIN' ? (
																<>
																	<Button
																		size="sm"
																		className="rounded-pill px-3 fw-semibold"
																		style={{
																			background: canApprove ? '#198754' : '#adb5bd',
																			border: 'none',
																			opacity: canApprove ? 1 : 0.85,
																		}}
																		disabled={!canApprove || loading}
																		onClick={() => void approveRequest(r._id)}
																		title={
																			!canApprove
																				? inventoryQty === null
																					? 'Checking inventory…'
																					: inventoryQty < r.quantity
																						? `Only ${inventoryQty} available · need ${r.quantity}`
																						: 'Cannot approve'
																				: 'Approve and transfer stock'
																		}
																	>
																		Approve
																	</Button>
																	<Button
																		size="sm"
																		variant="outline-danger"
																		className="rounded-pill px-3 fw-semibold"
																		disabled={loading}
																		onClick={() => void rejectRequest(r._id)}
																	>
																		Reject
																	</Button>
																</>
															) : null}
														</div>
													</td>
												</tr>
											)
										})
									)}
								</tbody>
							</Table>
						</div>
					)}
				</Card.Body>
			</Card>
		</>
	)
}

export default B2BPurchaseRequestsV2

