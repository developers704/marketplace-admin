import { PageBreadcrumb } from '@/components'
import { Badge, Button, Card, Form, Modal, Table } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { FaSearch, FaWarehouse } from 'react-icons/fa'
import { LuRefreshCw } from 'react-icons/lu'

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
	{ value: 'COMPLETED', label: 'Completed' },
	{ value: 'CLOSED', label: 'Closed' },
]

const statusBadge = (status: string) => {
	const map: Record<string, string> = {
		SUBMITTED: 'warning',
		RECEIVED_BY_SPO_TEAM: 'info',
		WIP: 'primary',
		COMPLETED: 'success',
		CLOSED: 'secondary',
	}
	return <Badge bg={map[status] || 'secondary'}>{status?.replace(/_/g, ' ')}</Badge>
}

const SpecialOrders = () => {
	const BASE_API = import.meta.env.VITE_BASE_API
	const navigate = useNavigate()
	const { user, isSuperUser } = useAuthContext()
	const token = user?.token

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
		if (!token || !isSuperUser) return
		fetchWarehouses()
		fetchOrders()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token, isSuperUser])

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
			const res = await fetch(`${BASE_API}/api/special-orders/${editModal._id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(editForm),
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

	if (!isSuperUser) {
		return (
			<>
				<PageBreadcrumb title="Special Orders" subName="Products" />
				<Card>
					<Card.Body>Access denied.</Card.Body>
				</Card>
			</>
		)
	}

	return (
		<>
			<PageBreadcrumb title="Special Orders" subName="Products" />

			<Card>
				<Card.Body>
					<div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
						<div>
							<h4 className="mb-1">Special Order (SPO) Requests</h4>
							<div className="text-muted">View and manage special order requests from store managers.</div>
						</div>
						<Button
							variant="outline-primary"
							onClick={fetchOrders}
							disabled={loading}
							className="d-flex align-items-center"
						>
							<LuRefreshCw size={18} className="me-1" />
							Refresh
						</Button>
					</div>

					<div className="row g-3 mb-3">
						<div className="col-md-2">
							<Form.Label><FaWarehouse className="me-1" /> Store</Form.Label>
							<Form.Select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
								<option value="">All</option>
								{warehouses.map((w) => (
									<option key={w._id} value={w._id}>{w.name}</option>
								))}
							</Form.Select>
						</div>
						<div className="col-md-2">
							<Form.Label>Status</Form.Label>
							<Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
								<option value="">All</option>
								{STATUS_OPTIONS.map((s) => (
									<option key={s.value} value={s.value}>{s.label}</option>
								))}
							</Form.Select>
						</div>
						<div className="col-md-4">
							<Form.Label><FaSearch className="me-1" /> Search</Form.Label>
							<Form.Control
								placeholder="Ticket, receipt, customer..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
						<div className="col-md-2 d-flex align-items-end">
							<Button variant="primary" onClick={fetchOrders} disabled={loading}>
								{loading ? 'Loading…' : 'Filter'}
							</Button>
						</div>
					</div>

					<Table responsive hover>
						<thead>
							<tr>
								<th>Ticket</th>
								<th>Receipt</th>
								<th>Drawing</th>
								<th>Store</th>
								<th>Customer #</th>
								<th>Status</th>
								<th>Assigned To</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={4}>Loading…</td></tr>
							) : rows.length === 0 ? (
								<tr><td colSpan={4} className="text-center text-muted">No special orders found.</td></tr>
							) : (
								rows.map((r) => (
									<tr key={r._id}>
										<td><strong>{r?.ticketNumber || '—'}</strong></td>
											<td>{r?.receiptNumber || '—'}</td>
										<td>
											{r?.canvasDrawing ? (
												<Badge bg="success">Yes</Badge>
											) : (
												<span className="text-muted">—</span>
											)}
										</td>
										<td>{r?.storeId?.name || '—'}</td>
										<td>{r?.customerNumber || '—'}</td>
										<td>{statusBadge(r?.status)}</td>
										<td>{r?.assignedTo?.replace(/_/g, ' ') || '—'}</td>
										<td>
											<div className="d-flex gap-1 flex-wrap">
												<Button
													size="sm"
													variant="outline-info"
													onClick={() => navigate(`/products/special-orders/${r._id}`)}
													title="View full details"
												>
													View
												</Button>
												<Button size="sm" variant="outline-primary" onClick={() => openEdit(r)}>
													Edit
												</Button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</Table>
				</Card.Body>
			</Card>

			<Modal show={!!editModal} onHide={() => setEditModal(null)}>
				<Modal.Header closeButton>
					<Modal.Title>Edit Special Order - {editModal?.ticketNumber}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form.Group className="mb-3">
						<Form.Label>Status</Form.Label>
						<Form.Select
							value={editForm.status}
							onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
						>
							{STATUS_OPTIONS.map((s) => (
								<option key={s.value} value={s.value}>{s.label}</option>
							))}
						</Form.Select>
					</Form.Group>
					<Form.Group className="mb-3">
						<Form.Label>Assigned To</Form.Label>
						<Form.Select
							value={editForm.assignedTo}
							onChange={(e) => setEditForm((p) => ({ ...p, assignedTo: e.target.value }))}
						>
							<option value="">—</option>
							{ASSIGNED_OPTIONS.map((o) => (
								<option key={o.value} value={o.value}>{o.label}</option>
							))}
						</Form.Select>
					</Form.Group>
					<Form.Group className="mb-3">
						<Form.Label>ETA</Form.Label>
						<Form.Control
							type="date"
							value={editForm.eta}
							onChange={(e) => setEditForm((p) => ({ ...p, eta: e.target.value }))}
						/>
					</Form.Group>
					<Form.Group>
						<Form.Label>Notes</Form.Label>
						<Form.Control
							as="textarea"
							rows={3}
							value={editForm.notes}
							onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
						/>
					</Form.Group>
					{editModal?.canvasDrawing && (
						<Form.Group className="mt-3">
							<Form.Label>Customer Drawing</Form.Label>
							<div className="border rounded p-2 bg-light">
								<img
									src={`${BASE_API}/uploads/${editModal.canvasDrawing}`}
									alt="Customer drawing"
									className="img-fluid rounded"
									style={{ maxHeight: 300, objectFit: 'contain' }}
								/>
							</div>
						</Form.Group>
					)}
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setEditModal(null)}>Cancel</Button>
					<Button variant="primary" onClick={handleSaveEdit} disabled={saving}>
						{saving ? 'Saving…' : 'Save'}
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default SpecialOrders
