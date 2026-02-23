import { PageBreadcrumb } from '@/components'
import { Badge, Button, Card, Form, Modal } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { LuArrowLeft } from 'react-icons/lu'

type SpecialOrder = {
	_id: string
	ticketNumber: string
	receiptNumber: string
	storeId?: { _id: string; name: string }
	customerNumber: string
	typeOfRequest: string
	referenceSkuNumber: string
	metalQuality: string
	diamondType: string
	diamondColor: string
	diamondClarity: string
	diamondDetails: string
	customization: string
	status: string
	assignedTo: string | null
	eta: string | null
	notes: string
	canvasDrawing?: string
	attachments?: string[]
	createdAt: string
	requestedBy?: { username?: string; email?: string }
}

const isVideo = (path: string) => /\.(mp4|webm|mov|avi|mkv)$/i.test(path)
const isImage = (path: string) => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(path)

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

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
	<div className="d-flex border-bottom border-light py-3" style={{ minHeight: 48 }}>
		<div className="text-muted fw-medium" style={{ minWidth: 180 }}>{label}</div>
		<div className="text-dark">{value ?? '—'}</div>
	</div>
)

const SpecialOrderView = () => {
	const BASE_API = import.meta.env.VITE_BASE_API
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { user, isSuperUser } = useAuthContext()
	const token = user?.token

	const [order, setOrder] = useState<SpecialOrder | null>(null)
	const [loading, setLoading] = useState(true)
	const [editModal, setEditModal] = useState(false)
	const [editForm, setEditForm] = useState({ status: '', assignedTo: '', eta: '', notes: '' })
	const [saving, setSaving] = useState(false)

	const fetchOrder = async () => {
		if (!id) return
		setLoading(true)
		try {
			const res = await fetch(`${BASE_API}/api/special-orders/${id}`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data?.message || 'Failed to fetch')
			setOrder(data?.data || null)
			setEditForm({
				status: data?.data?.status || '',
				assignedTo: data?.data?.assignedTo || '',
				eta: data?.data?.eta ? data.data.eta.split('T')[0] : '',
				notes: data?.data?.notes || '',
			})
		} catch (err: any) {
			Swal.fire({ title: 'Error', text: err?.message || 'Failed to load', icon: 'error' })
			navigate('/products/special-orders')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (!token || !isSuperUser || !id) return
		fetchOrder()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token, isSuperUser, id])

	const handleSaveEdit = async () => {
		if (!order) return
		setSaving(true)
		try {
			const res = await fetch(`${BASE_API}/api/special-orders/${order._id}`, {
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
			setEditModal(false)
			fetchOrder()
		} catch (err: any) {
			Swal.fire({ title: 'Error', text: err?.message || 'Failed to update', icon: 'error' })
		} finally {
			setSaving(false)
		}
	}

	if (!isSuperUser) {
		return (
			<>
				<PageBreadcrumb title="Special Order" subName="Products" />
				<Card><Card.Body>Access denied.</Card.Body></Card>
			</>
		)
	}

	if (loading || !order) {
		return (
			<>
				<PageBreadcrumb title="Special Order" subName="Products" />
				<Card><Card.Body className="text-center py-5">Loading…</Card.Body></Card>
			</>
		)
	}

	const videos = (order.attachments || []).filter(isVideo)
	const images = (order.attachments || []).filter(isImage)
	const hasDiagram = !!order.canvasDrawing

	return (
		<>
			<PageBreadcrumb title={`SPO - ${order.ticketNumber}`} subName="Products" />

			<div className="mb-3">
				<Button variant="link" className="text-decoration-none p-0 d-inline-flex align-items-center" onClick={() => navigate('/products/special-orders')}>
					<LuArrowLeft size={20} className="me-1" /> Back to Special Orders
				</Button>
			</div>

			<div className="row g-4">
				{/* Key-Value Details - Luxury Card */}
				<div className="col-lg-6">
					<Card className="shadow-sm border-0 overflow-hidden" style={{ borderRadius: 12, borderColor: 'rgba(198,168,125,0.3)' }}>
						<Card.Header className="py-3 px-4 text-white fw-semibold" style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2d2d2d 100%)', border: 'none' }}>
							Order Details
						</Card.Header>
						<Card.Body className="p-0 px-4">
							<DetailRow label="Ticket Number" value={<strong>{order.ticketNumber}</strong>} />
							<DetailRow label="Receipt Number" value={order.receiptNumber} />
							<DetailRow label="Store" value={order.storeId?.name} />
							<DetailRow label="Customer Number" value={order.customerNumber} />
							<DetailRow label="Type of Request" value={order.typeOfRequest?.replace(/_/g, ' ')} />
							<DetailRow label="Reference SKU" value={order.referenceSkuNumber} />
							<DetailRow label="Metal Quality" value={order.metalQuality?.replace(/_/g, ' ')} />
							<DetailRow label="Diamond Type" value={order.diamondType?.replace(/_/g, ' ')} />
							<DetailRow label="Diamond Color" value={order.diamondColor} />
							<DetailRow label="Diamond Clarity" value={order.diamondClarity} />
							<DetailRow label="Diamond Details" value={order.diamondDetails} />
							<DetailRow label="Customization" value={order.customization} />
							<DetailRow label="Status" value={statusBadge(order.status)} />
							<DetailRow label="Assigned To" value={order.assignedTo?.replace(/_/g, ' ') || '—'} />
							<DetailRow label="ETA" value={order.eta ? new Date(order.eta).toLocaleDateString() : '—'} />
							<DetailRow label="Requested By" value={
								<div>
									<div>{order.requestedBy?.username || '—'}</div>
									{order.requestedBy?.email && <div className="text-muted small">{order.requestedBy.email}</div>}
								</div>
							} />
							<DetailRow label="Created" value={new Date(order.createdAt).toLocaleString()} />
							<div className="border-0 py-3">
								<div className="text-muted fw-medium mb-2">Notes</div>
								<div className="text-dark">{order.notes || '—'}</div>
							</div>
						</Card.Body>
						<Card.Footer className="bg-light border-0 py-3 px-4">
							<Button variant="outline-primary" onClick={() => setEditModal(true)}>Edit Order</Button>
						</Card.Footer>
					</Card>
				</div>

				{/* Media Section */}
				<div className="col-lg-6">
					<Card className="shadow-sm border-0 overflow-hidden" style={{ borderRadius: 12, borderColor: 'rgba(198,168,125,0.3)' }}>
						<Card.Header className="py-3 px-4 text-white fw-semibold" style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2d2d2d 100%)', border: 'none' }}>
							Attachments & Diagram
						</Card.Header>
						<Card.Body>
							{videos.length === 0 && images.length === 0 && !hasDiagram ? (
								<p className="text-muted mb-0">—</p>
							) : (
								<div className="d-flex flex-column gap-4">
									{videos.length > 0 && (
										<div>
											<h6 className="mb-2 fw-semibold" style={{ color: '#C6A87D' }}>Videos</h6>
											<div className="d-flex flex-wrap gap-3">
												{videos.map((url) => (
													<div key={url} className="rounded-3 overflow-hidden shadow-sm bg-dark" style={{ maxWidth: 320 }}>
														<video controls className="w-100" src={`${BASE_API}/uploads/${url}`} />
														<div className="p-2 small text-white text-truncate">{url.split('/').pop()}</div>
													</div>
												))}
											</div>
										</div>
									)}
									{images.length > 0 && (
										<div>
											<h6 className="mb-2 fw-semibold" style={{ color: '#C6A87D' }}>Images</h6>
											<div className="d-flex flex-wrap gap-3">
												{images.map((url) => (
													<a
														key={url}
														href={`${BASE_API}/uploads/${url}`}
														target="_blank"
														rel="noreferrer"
														className="rounded-3 overflow-hidden shadow-sm d-block border"
														style={{ maxWidth: 220 }}
													>
														<img
															src={`${BASE_API}/uploads/${url}`}
															alt=""
															className="img-fluid"
															style={{ maxHeight: 220, objectFit: 'cover', width: 220 }}
														/>
													</a>
												))}
											</div>
										</div>
									)}
									{hasDiagram && (
										<div>
											<h6 className="mb-2 fw-semibold" style={{ color: '#C6A87D' }}>Customer Diagram</h6>
											<div className="rounded-3 overflow-hidden border shadow-sm p-3 bg-light">
												<img
													src={`${BASE_API}/uploads/${order.canvasDrawing}`}
													alt="Customer diagram"
													className="img-fluid rounded"
													style={{ maxHeight: 400, objectFit: 'contain' }}
												/>
											</div>
										</div>
									)}
								</div>
							)}
						</Card.Body>
					</Card>
				</div>
			</div>

			{/* Edit Modal */}
			<Modal show={editModal} onHide={() => setEditModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Edit - {order.ticketNumber}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form.Group className="mb-3">
						<Form.Label>Status</Form.Label>
						<Form.Select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}>
							{STATUS_OPTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
						</Form.Select>
					</Form.Group>
					<Form.Group className="mb-3">
						<Form.Label>Assigned To</Form.Label>
						<Form.Select value={editForm.assignedTo} onChange={(e) => setEditForm((p) => ({ ...p, assignedTo: e.target.value }))}>
							<option value="">—</option>
							{ASSIGNED_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
						</Form.Select>
					</Form.Group>
					<Form.Group className="mb-3">
						<Form.Label>ETA</Form.Label>
						<Form.Control type="date" value={editForm.eta} onChange={(e) => setEditForm((p) => ({ ...p, eta: e.target.value }))} />
					</Form.Group>
					<Form.Group>
						<Form.Label>Notes</Form.Label>
						<Form.Control as="textarea" rows={3} value={editForm.notes} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} />
					</Form.Group>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
					<Button variant="primary" onClick={handleSaveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default SpecialOrderView
