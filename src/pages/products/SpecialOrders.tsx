import { PageBreadcrumb } from '@/components'
import { Badge, Button, Card, Dropdown, Form, Modal, Spinner, Table } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { FaSearch, FaWarehouse } from 'react-icons/fa'
import { LuRefreshCw } from 'react-icons/lu'

const GOLD = '#C6A87D'

/** Scroll area inside flex card — fills all space below filters */
const TABLE_SCROLL_AREA_STYLE = {
	flex: '1 1 auto',
	minHeight: 0,
	overflowY: 'auto' as const,
	WebkitOverflowScrolling: 'touch' as const,
}

type SpecialOrderRow = {
	_id: string
	ticketNumber: string
	receiptNumber: string
	storeId?: { _id: string; name: string }
	customerNumber: string
	typeOfRequest: string
	metalQuality: string
	diamondType: string
	status: string
	assignedTo: string | null
	eta: string | null
	notes: string
	canvasDrawing?: string
	attachments?: string[]
	createdAt: string
	requestedBy?: { username?: string; email?: string }
}

const ASSIGNED_OPTIONS = [
	{ value: 'TRANSFER', label: 'TRANSFER' },
	{ value: 'NON_STOCK_QG_STULLER', label: 'NON-STOCK - QG / STULLER' },
	{ value: 'NON_STOCK_BENCHMARK', label: 'NON-STOCK - BENCHMARK' },
	{ value: 'NON_STOCK_TRITON', label: 'NON-STOCK - TRITON' },
	{ value: 'NON_STOCK_TUNGSTEN', label: 'NON-STOCK - TUNGSTEN' },
	{ value: 'NON_STOCK_WATCH_PARTS_FREE_LINKS', label: 'NON-STOCK - WATCH (PARTS, FREE LINKS)' },
	{ value: 'NON_STOCK_CUSTOM', label: 'NON-STOCK - CUSTOM' },
	{ value: 'REPAIR_DIAMONDS_REPLACEMENT', label: 'REPAIR - DIAMONDS REPLACEMENT' },
	{ value: 'REPAIR_ROLEX', label: 'REPAIR - ROLEX' },
]

const STATUS_OPTIONS = [
	{ value: 'SUBMITTED', label: 'Submitted' },
	{ value: 'RECEIVED_BY_SPO_TEAM', label: 'Received by SPO Team' },
	{ value: 'WIP', label: 'WIP' },
	{ value: 'CLOSED', label: 'Delivered' },
	{ value: 'FINALIZED', label: 'Received' },
]

const STATUS_OPTIONS_ADMIN_EDIT = STATUS_OPTIONS.filter((s) => s.value !== 'FINALIZED')

const statusLabel = (status: string) => {
	if (status === 'CLOSED') return 'Delivered'
	if (status === 'FINALIZED') return 'Received'
	return status?.replace(/_/g, ' ') || '—'
}

const statusBadge = (status: string) => {
	const map: Record<string, string> = {
		SUBMITTED: 'warning',
		RECEIVED_BY_SPO_TEAM: 'info',
		WIP: 'primary',
		CLOSED: 'info',
		FINALIZED: 'dark',
		RECEIVED: 'success',
	}
	return <Badge bg={map[status] || 'secondary'}>{statusLabel(status)}</Badge>
}

const SpecialOrders = () => {
	const BASE_API = import.meta.env.VITE_BASE_API
	const navigate = useNavigate()
	const { user, isSuperUser, role } = useAuthContext()
	const token = user?.token
	const roleNorm = String(role ?? user?.role ?? '').toLowerCase().trim()
	const isPrivilegedAdmin =
		isSuperUser ||
		roleNorm === 'admin' ||
		roleNorm === 'super admin' ||
		roleNorm === 'superuser'

	const [rows, setRows] = useState<SpecialOrderRow[]>([])
	const [loading, setLoading] = useState(false)
	const [statusFilter, setStatusFilter] = useState('')
	const [storeFilter, setStoreFilter] = useState('')
	const [search, setSearch] = useState('')
	const [warehouses, setWarehouses] = useState<{ _id: string; name: string }[]>([])
	const [editModal, setEditModal] = useState<SpecialOrderRow | null>(null)
	const [editForm, setEditForm] = useState({ status: '', assignedTo: '', eta: '', notes: '' })
	const [saving, setSaving] = useState(false)

	const fetchWarehouses = async () => {
		try {
			const res = await fetch(`${BASE_API}/api/warehouses`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.ok) {
				const data = await res.json()
				setWarehouses(data || [])
			}
		} catch (e) {
			console.error(e)
		}
	}

	const fetchOrders = async () => {
		setLoading(true)
		try {
			const url = new URL(`${BASE_API}/api/special-orders/admin`)
			if (statusFilter) url.searchParams.set('status', statusFilter)
			if (storeFilter) url.searchParams.set('storeId', storeFilter)
			if (search?.trim()) url.searchParams.set('search', search.trim())

			const res = await fetch(url.toString(), {
				headers: { Authorization: `Bearer ${token}` },
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data?.message || 'Failed to fetch')
			setRows(data?.data || [])
		} catch (err: any) {
			Swal.fire({ title: 'Error', text: err?.message || 'Failed to load', icon: 'error' })
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (!token || !isPrivilegedAdmin) return
		fetchWarehouses()
		fetchOrders()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token, isPrivilegedAdmin])

	const openEdit = (row: SpecialOrderRow) => {
		setEditModal(row)
		setEditForm({
			status: row.status || '',
			assignedTo: row.assignedTo || '',
			eta: row.eta ? row.eta.split('T')[0] : '',
			notes: row.notes || '',
		})
	}

	const handleSaveEdit = async () => {
		if (!editModal) return
		setSaving(true)
		try {
			let body: Record<string, unknown>
			if (editModal.status === 'FINALIZED' && !isPrivilegedAdmin) {
				body = {
					assignedTo: editForm.assignedTo,
					eta: editForm.eta,
					notes: editForm.notes,
				}
			} else if (isPrivilegedAdmin && editForm.status === 'FINALIZED') {
				body = {
					assignedTo: editForm.assignedTo,
					eta: editForm.eta,
					notes: editForm.notes,
				}
			} else {
				body = editForm
			}
			const res = await fetch(`${BASE_API}/api/special-orders/${editModal._id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(body),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data?.message || 'Update failed')
			Swal.fire({ title: 'Saved', text: 'Special order updated.', icon: 'success', timer: 1500 })
			setEditModal(null)
			fetchOrders()
		} catch (err: any) {
			Swal.fire({ title: 'Error', text: err?.message || 'Failed to update', icon: 'error' })
		} finally {
			setSaving(false)
		}
	}

	if (!isPrivilegedAdmin) {
		return (
			<>
				<PageBreadcrumb title="Special Orders" subName="Products" />
				<Card className="border-0 shadow-sm" style={{ borderRadius: '1rem' }}>
					<Card.Body className="py-5 text-center text-muted">Access denied.</Card.Body>
				</Card>
			</>
		)
	}

	return (
		<>
			<PageBreadcrumb title="Special Orders" subName="Products" />

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
					<div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
						<div>
							<div
								className="text-white-50 small text-uppercase mb-1"
								style={{ fontSize: 11, letterSpacing: '0.1em' }}
							>
								Special order program
							</div>
							<h4 className="mb-1 fw-semibold text-white">SPO requests</h4>
							<p className="mb-0 text-white-50 small">Review and manage requests from store teams.</p>
						</div>
						<Button
							variant="light"
							className="rounded-pill px-4 d-flex align-items-center gap-2"
							onClick={() => void fetchOrders()}
							disabled={loading}
						>
							<LuRefreshCw size={18} />
							Refresh
						</Button>
					</div>

					<div className="row g-3 mt-2 pt-2 border-top border-secondary border-opacity-25">
						<div className="col-md-6 col-lg-3">
							<Form.Label className="text-white-50 small mb-1">
								<FaWarehouse className="me-1" /> Store
							</Form.Label>
							<Form.Select
								value={storeFilter}
								onChange={(e) => setStoreFilter(e.target.value)}
								className="rounded-3 border-0"
							>
								<option value="">All stores</option>
								{warehouses.map((w) => (
									<option key={w._id} value={w._id}>
										{w.name}
									</option>
								))}
							</Form.Select>
						</div>
						<div className="col-md-6 col-lg-2">
							<Form.Label className="text-white-50 small mb-1">Status</Form.Label>
							<Form.Select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="rounded-3 border-0"
							>
								<option value="">All</option>
								{STATUS_OPTIONS.map((s) => (
									<option key={s.value} value={s.value}>
										{s.label}
									</option>
								))}
							</Form.Select>
						</div>
						<div className="col-md-8 col-lg-4">
							<Form.Label className="text-white-50 small mb-1">
								<FaSearch className="me-1" /> Search
							</Form.Label>
							<Form.Control
								className="rounded-3 border-0"
								placeholder="Ticket, receipt, customer…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
						<div className="col-md-4 col-lg-3 d-flex align-items-end">
							<Button
								className="w-100 rounded-3 fw-semibold"
								style={{ background: GOLD, border: 'none' }}
								onClick={() => void fetchOrders()}
								disabled={loading}
							>
								{loading ? 'Loading…' : 'Apply filters'}
							</Button>
						</div>
					</div>
				</div>

				<Card.Body className="p-0 d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
					{loading ? (
						<div className="d-flex flex-grow-1 align-items-center justify-content-center py-5">
							<Spinner animation="border" style={{ color: GOLD }} />
						</div>
					) : (
						<div className="table-responsive flex-grow-1" style={TABLE_SCROLL_AREA_STYLE}>
							<Table hover className="align-middle mb-0">
								<thead className="table-light sticky-top border-bottom" style={{ zIndex: 5 }}>
									<tr className="small text-uppercase text-muted" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
										<th className="ps-4 bg-light">Ticket</th>
										<th className="bg-light">Receipt</th>
										<th className="bg-light">ETA</th>
										<th className="bg-light">Drawing</th>
										<th className="bg-light">Store</th>
										<th className="bg-light">Customer #</th>
										<th className="bg-light">Status</th>
										<th className="bg-light">Assigned</th>
										<th className="pe-4 text-end bg-light" style={{ minWidth: 120 }}>
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{rows.length === 0 ? (
										<tr>
											<td colSpan={9} className="text-center text-muted py-5">
												No special orders found.
											</td>
										</tr>
									) : (
										rows.map((r) => (
											<tr
												key={r._id}
												style={
													r.status === 'SUBMITTED'
														? { boxShadow: `inset 3px 0 0 ${GOLD}`, background: 'rgba(198, 168, 125, 0.06)' }
														: undefined
												}
											>
												<td className="ps-4 font-monospace fw-semibold small">{r.ticketNumber || '—'}</td>
												<td className="small">{r.receiptNumber || '—'}</td>
												<td className="small text-nowrap">
													{r.eta ? new Date(r.eta).toLocaleDateString() : '—'}
												</td>
												<td>
													{r.canvasDrawing ? (
														<Badge bg="success" className="rounded-pill px-2">
															Yes
														</Badge>
													) : (
														<span className="text-muted">—</span>
													)}
												</td>
												<td className="small">{r.storeId?.name || '—'}</td>
												<td className="small">{r.customerNumber || '—'}</td>
												<td>{statusBadge(r.status || '')}</td>
												<td className="small">{r.assignedTo?.replace(/_/g, ' ') || '—'}</td>
												<td className="pe-4 text-end">
													<Dropdown align="end">
														<Dropdown.Toggle
															variant="outline-dark"
															size="sm"
															className="rounded-pill px-3"
															id={`spo-actions-${r._id}`}
															style={{ borderColor: '#dee2e6' }}
														>
															Actions
														</Dropdown.Toggle>
														<Dropdown.Menu className="shadow border-0 rounded-3 py-2">
															<Dropdown.Item
																onClick={() => navigate(`/products/special-orders/${r._id}`)}
															>
																View details
															</Dropdown.Item>
															<Dropdown.Item onClick={() => openEdit(r)}>Edit order</Dropdown.Item>
														</Dropdown.Menu>
													</Dropdown>
												</td>
											</tr>
										))
									)}
								</tbody>
							</Table>
						</div>
					)}
				</Card.Body>
			</Card>

			<Modal
				show={!!editModal}
				onHide={() => setEditModal(null)}
				centered
				contentClassName="border-0 rounded-4 overflow-hidden shadow"
			>
				<div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: `2px solid ${GOLD}` }}>
					<Modal.Header closeButton closeVariant="white" className="border-0 text-white py-3">
						<Modal.Title className="fw-semibold">
							Edit order · {editModal?.ticketNumber}
						</Modal.Title>
					</Modal.Header>
				</div>
				<Modal.Body className="px-4 py-4">
					<Form.Group className="mb-3">
						<Form.Label className="small text-muted text-uppercase fw-semibold">Status</Form.Label>
						{editModal?.status === 'FINALIZED' && !isPrivilegedAdmin ? (
							<div className="py-2">
								<Badge bg="dark">Received</Badge>
								<div className="text-muted small mt-1">Confirmed by the store after delivery.</div>
							</div>
						) : (
							<Form.Select
								className="rounded-3"
								value={editForm.status}
								onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
							>
								{(isPrivilegedAdmin && editForm.status === 'FINALIZED'
									? [{ value: 'FINALIZED', label: 'Received' }, ...STATUS_OPTIONS_ADMIN_EDIT]
									: STATUS_OPTIONS_ADMIN_EDIT
								).map((s) => (
									<option key={s.value} value={s.value}>
										{s.label}
									</option>
								))}
							</Form.Select>
						)}
					</Form.Group>
					<Form.Group className="mb-3">
						<Form.Label className="small text-muted text-uppercase fw-semibold">Assigned to</Form.Label>
						<Form.Select
							className="rounded-3"
							value={editForm.assignedTo}
							onChange={(e) => setEditForm((p) => ({ ...p, assignedTo: e.target.value }))}
						>
							<option value="">—</option>
							{ASSIGNED_OPTIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</Form.Select>
					</Form.Group>
					<Form.Group className="mb-3">
						<Form.Label className="small text-muted text-uppercase fw-semibold">ETA</Form.Label>
						<Form.Control
							className="rounded-3"
							type="date"
							value={editForm.eta}
							onChange={(e) => setEditForm((p) => ({ ...p, eta: e.target.value }))}
						/>
					</Form.Group>
					<Form.Group>
						<Form.Label className="small text-muted text-uppercase fw-semibold">Notes</Form.Label>
						<Form.Control
							className="rounded-3"
							as="textarea"
							rows={3}
							value={editForm.notes}
							onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
						/>
					</Form.Group>
					{editModal?.canvasDrawing && (
						<Form.Group className="mt-4">
							<Form.Label className="small text-muted text-uppercase fw-semibold">Customer drawing</Form.Label>
							<div className="border rounded-3 p-3 bg-light">
								<img
									src={`${BASE_API}/uploads/${editModal.canvasDrawing}`}
									alt="Customer drawing"
									className="img-fluid rounded-3"
									style={{ maxHeight: 300, objectFit: 'contain' }}
								/>
							</div>
						</Form.Group>
					)}
				</Modal.Body>
				<Modal.Footer className="border-0 px-4 pb-4 bg-light bg-opacity-50">
					<Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setEditModal(null)}>
						Cancel
					</Button>
					<Button
						className="rounded-pill px-4 fw-semibold"
						style={{ background: GOLD, border: 'none' }}
						onClick={() => void handleSaveEdit()}
						disabled={saving}
					>
						{saving ? 'Saving…' : 'Save changes'}
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default SpecialOrders
