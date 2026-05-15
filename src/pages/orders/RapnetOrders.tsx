import { PageBreadcrumb } from '@/components'
import { Card, Button, Badge, Modal, Form, Spinner, Table } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useCallback, useEffect, useState } from 'react'
import { toastService } from '@/common/context/toast.service'
import Swal from 'sweetalert2'
import {
	MdDiamond, MdFilterList, MdRefresh, MdRemoveRedEye,
	MdCheckCircle, MdCancel, MdPending, MdSend,
	MdImage, MdVideoLibrary, MdArticle, MdArrowBack,
} from 'react-icons/md'

// ── Types ─────────────────────────────────────────────────────────────────────
type RapnetStatus = 'REQUESTED' | 'SUBMITTED_TO_RAPNET' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED'

interface RapnetOrderRow {
	_id: string
	customerId?: { _id: string; username?: string; email?: string; phone_number?: string } | null
	rapnetProductId: string
	rapnetOrderRef: string | null
	productSnapshot: any
	shape: string | null
	carat: number | null
	color: string | null
	clarity: string | null
	lab: string | null
	price: number | null
	quantity: number
	notes: string
	adminNote: string | null
	status: RapnetStatus
	createdAt: string
	confirmedAt?: string | null
	rejectedAt?: string | null
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_META: Record<RapnetStatus, { label: string; variant: string; Icon: any }> = {
	REQUESTED:           { label: 'Requested',        variant: 'warning',   Icon: MdPending      },
	SUBMITTED_TO_RAPNET: { label: 'Sent to Supplier', variant: 'primary',   Icon: MdSend         },
	CONFIRMED:           { label: 'Confirmed',        variant: 'success',   Icon: MdCheckCircle  },
	REJECTED:            { label: 'Rejected',         variant: 'danger',    Icon: MdCancel       },
	CANCELLED:           { label: 'Cancelled',        variant: 'secondary', Icon: MdCancel       },
}

// ── Media helpers ─────────────────────────────────────────────────────────────
type MediaItem = { type: string; url: string; label: string }
function buildMedia(snap: any): MediaItem[] {
	const items: MediaItem[] = []
	const added = new Set<string>()
	const add = (type: string, url: string, label: string) => {
		if (!url || added.has(url)) return
		added.add(url); items.push({ type, url, label })
	}
	const media: any[] = snap?.raw?.diamond_media ?? snap?.diamondMedia ?? []
	let imgCount = 0
	media.forEach((m: any) => {
		if (!m?.url) return
		const t = String(m.type ?? '').toLowerCase()
		if (t === 'image') { imgCount++; add('image', m.url, `Photo ${imgCount}`) }
		else if (t === 'certificate') add('cert', m.url, 'Certificate')
		else add('video', m.url, t === 'v360' ? 'V360' : '360° Video')
	})
	if (snap?.image && !added.has(snap.image)) add('image', snap.image, 'Photo')
	if (snap?.video && !added.has(snap.video)) add('video', snap.video, '360° Video')
	return items
}

// ── Spec Row ──────────────────────────────────────────────────────────────────
function SpecRow({ label, value }: { label: string; value?: any }) {
	const v = value !== null && value !== undefined && value !== '' && value !== 0 ? String(value) : null
	if (!v) return null
	return (
		<tr>
			<td className="text-muted small fw-semibold" style={{ width: '42%' }}>{label}</td>
			<td className="fw-bold small">{v}</td>
		</tr>
	)
}

// ── Detail Panel ──────────────────────────────────────────────────────────────
function OrderDetail({
	order, onBack, onApprove, onReject, onMarkSent, updating,
}: {
	order: RapnetOrderRow
	onBack: () => void
	onApprove: (id: string) => void
	onReject: (order: RapnetOrderRow) => void
	onMarkSent: (id: string) => void
	updating: boolean
}) {
	const snap   = order.productSnapshot ?? {}
	const raw    = snap.raw ?? {}
	const media  = buildMedia(snap)
	const [activeIdx, setActiveIdx] = useState(0)
	const active = media[activeIdx]
	const cfg    = STATUS_META[order.status] ?? STATUS_META.REQUESTED
	const StatusIcon = cfg.Icon

	const price = snap.price ? `$${Number(snap.price).toLocaleString()}` : '—'
	const ppc   = snap.pricePerCarat ? `$${Number(snap.pricePerCarat).toLocaleString()}/ct` : null
	const measurements = [raw.meas_length, raw.meas_width, raw.meas_depth].filter(Boolean).join(' × ')

	return (
		<>
			<div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
				<Button variant="outline-secondary" size="sm" onClick={onBack}>
					<MdArrowBack className="me-1" /> Back to Orders
				</Button>
				<h5 className="mb-0 fw-bold text-dark">
					{snap.title ?? 'Diamond Inquiry'}
				</h5>
				<Badge bg={cfg.variant} className="d-flex align-items-center gap-1 px-2 py-1">
					<StatusIcon size={14} />
					{cfg.label}
				</Badge>
				<small className="text-muted ms-auto">
					#{String(order._id).slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleString()}
				</small>
			</div>

			<div className="row g-4">
				{/* ── Left: Media ── */}
				<div className="col-lg-5">
					<Card className="border-0 shadow-sm">
						<Card.Body className="p-0">
							{/* Main viewer */}
							<div className="position-relative bg-light overflow-hidden"
								style={{ aspectRatio: '1/1', borderRadius: '12px 12px 0 0' }}>
								{!active ? (
									<div className="w-100 h-100 d-flex align-items-center justify-center text-muted">
										<MdDiamond size={60} className="opacity-25" />
									</div>
								) : active.type === 'image' ? (
									<img src={active.url} alt="" className="w-100 h-100 object-fit-cover" />
								) : active.type === 'cert' ? (
									<div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-3">
										<MdArticle size={60} className="text-muted opacity-50" />
										<a href={active.url} target="_blank" rel="noopener noreferrer"
											className="btn btn-dark btn-sm">
											Open Certificate PDF
										</a>
									</div>
								) : (
									<iframe key={active.url} src={active.url} title={active.label}
										style={{ width: '100%', height: '100%', border: 'none' }}
										allow="autoplay; fullscreen" allowFullScreen />
								)}
								{/* Shape badge */}
								{snap.shape && (
									<span className="position-absolute top-0 start-0 m-2 badge bg-dark">{snap.shape}</span>
								)}
								{snap.lab && snap.lab !== 'NONE' && (
									<span className="position-absolute top-0 end-0 m-2 badge bg-light text-dark">{snap.lab}</span>
								)}
							</div>

							{/* Thumbs */}
							{media.length > 1 && (
								<div className="d-flex gap-2 p-3 overflow-auto" style={{ borderTop: '1px solid #eee' }}>
									{media.map((m, i) => {
										const isActive = i === activeIdx
										return (
											<button key={i} onClick={() => setActiveIdx(i)}
												className={`btn btn-sm flex-shrink-0 d-flex flex-column align-items-center gap-1 ${isActive ? 'btn-dark' : 'btn-outline-secondary'}`}
												style={{ minWidth: '70px', fontSize: '11px' }}>
												{m.type === 'image' ? <MdImage size={16} /> : m.type === 'cert' ? <MdArticle size={16} /> : <MdVideoLibrary size={16} />}
												{m.label}
											</button>
										)
									})}
								</div>
							)}

							{/* Cert link */}
							{(snap.certificateUrl || raw.cert_file) && (
								<div className="px-3 pb-3">
									<a href={snap.certificateUrl ?? raw.cert_file} target="_blank" rel="noopener noreferrer"
										className="btn btn-outline-secondary btn-sm w-100">
										<MdArticle className="me-1" /> View Certificate
									</a>
								</div>
							)}
						</Card.Body>
					</Card>
				</div>

				{/* ── Right: Details ── */}
				<div className="col-lg-7 d-flex flex-column gap-3">

					{/* Price */}
					<Card className="border-0 shadow-sm">
						<Card.Body>
							<div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
								<div>
									<h3 className="fw-black mb-0">{price}</h3>
									{ppc && <small className="text-muted">{ppc}</small>}
								</div>
								<div className="d-flex flex-wrap gap-2">
									{[snap.shape, snap.carat ? `${snap.carat}ct` : null, snap.color, snap.clarity, snap.cut || null]
										.filter(Boolean).map((v, i) => (
											<Badge key={i} bg="secondary" className="fw-normal">{String(v)}</Badge>
										))}
								</div>
							</div>
						</Card.Body>
					</Card>

					{/* Customer + inquiry */}
					<Card className="border-0 shadow-sm">
						<Card.Header className="bg-white fw-bold small text-uppercase tracking-widest text-muted">Inquiry Info</Card.Header>
						<Card.Body>
							<Table size="sm" className="mb-0">
								<tbody>
									<SpecRow label="Customer"    value={order.customerId?.username ?? order.customerId?.email} />
									<SpecRow label="Email"       value={order.customerId?.email} />
									<SpecRow label="Date"        value={new Date(order.createdAt).toLocaleString()} />
									<SpecRow label="Quantity"    value={order.quantity} />
									<SpecRow label="RapNet Ref"  value={order.rapnetOrderRef} />
									<SpecRow label="Order ID"    value={order._id} />
									<SpecRow label="Confirmed"   value={order.confirmedAt ? new Date(order.confirmedAt).toLocaleString() : null} />
									<SpecRow label="Rejected"    value={order.rejectedAt  ? new Date(order.rejectedAt).toLocaleString()  : null} />
								</tbody>
							</Table>
							{order.notes && (
								<div className="mt-3 p-3 rounded" style={{ background: '#f8f9fa' }}>
									<small className="fw-bold text-uppercase text-muted d-block mb-1">Customer Notes</small>
									<p className="mb-0 small">{order.notes}</p>
								</div>
							)}
							{order.adminNote && (
								<div className="mt-2 p-3 rounded border border-warning">
									<small className="fw-bold text-uppercase text-muted d-block mb-1">Admin Note</small>
									<p className="mb-0 small">{order.adminNote}</p>
								</div>
							)}
						</Card.Body>
					</Card>

					{/* Diamond specs */}
					<Card className="border-0 shadow-sm">
						<Card.Header className="bg-white fw-bold small text-uppercase tracking-widest text-muted">Diamond Specifications</Card.Header>
						<Card.Body>
							<div className="row g-0">
								<div className="col-6">
									<Table size="sm" className="mb-0">
										<tbody>
											<SpecRow label="Shape"        value={snap.shape} />
											<SpecRow label="Carat"        value={snap.carat ? `${snap.carat} ct` : null} />
											<SpecRow label="Color"        value={snap.color} />
											<SpecRow label="Clarity"      value={snap.clarity} />
											<SpecRow label="Cut"          value={snap.cut} />
											<SpecRow label="Polish"       value={snap.polish} />
											<SpecRow label="Symmetry"     value={snap.symmetry} />
											<SpecRow label="Fluorescence" value={snap.fluorescence} />
										</tbody>
									</Table>
								</div>
								<div className="col-6">
									<Table size="sm" className="mb-0">
										<tbody>
											<SpecRow label="Lab"         value={snap.lab !== 'NONE' ? snap.lab : null} />
											<SpecRow label="Certificate" value={snap.certificateNumber} />
											<SpecRow label="Stock #"     value={snap.lotNum} />
											<SpecRow label="Depth %"     value={snap.depthPercent ? `${snap.depthPercent}%` : null} />
											<SpecRow label="Table %"     value={snap.tablePercent  ? `${snap.tablePercent}%`  : null} />
											<SpecRow label="Measurements"value={measurements || null} />
											<SpecRow label="Eye Clean"   value={snap.eyeClean} />
											<SpecRow label="BGM"         value={snap.isBGM != null ? (snap.isBGM ? 'Yes' : 'No') : null} />
											<SpecRow label="City"        value={[snap.city, snap.state, snap.location].filter(Boolean).join(', ')} />
										</tbody>
									</Table>
								</div>
							</div>
						</Card.Body>
					</Card>

					{/* ── Admin Actions ── */}
					{!['CONFIRMED', 'REJECTED', 'CANCELLED'].includes(order.status) && (
						<Card className="border-0 shadow-sm border-top border-primary">
							<Card.Header className="bg-primary bg-opacity-10 fw-bold small text-uppercase text-primary">Admin Actions</Card.Header>
							<Card.Body className="d-flex flex-wrap gap-2">
								{order.status === 'REQUESTED' && (
									<Button variant="outline-primary" size="sm" disabled={updating}
										onClick={() => onMarkSent(order._id)}>
										{updating ? <Spinner size="sm" /> : <MdSend className="me-1" />}
										Mark as Sent to Supplier
									</Button>
								)}
								<Button variant="success" size="sm" disabled={updating}
									onClick={() => onApprove(order._id)}>
									{updating ? <Spinner size="sm" /> : <MdCheckCircle className="me-1" />}
									Confirm Order
								</Button>
								<Button variant="danger" size="sm" disabled={updating}
									onClick={() => onReject(order)}>
									{updating ? <Spinner size="sm" /> : <MdCancel className="me-1" />}
									Reject Order
								</Button>
							</Card.Body>
						</Card>
					)}
				</div>
			</div>
		</>
	)
}

// ── Main page ─────────────────────────────────────────────────────────────────
const STATUS_FILTERS: { label: string; value: string }[] = [
	{ label: 'All',               value: ''                   },
	{ label: 'Requested',         value: 'REQUESTED'          },
	{ label: 'Sent to Supplier',  value: 'SUBMITTED_TO_RAPNET'},
	{ label: 'Confirmed',         value: 'CONFIRMED'          },
	{ label: 'Rejected',          value: 'REJECTED'           },
	{ label: 'Cancelled',         value: 'CANCELLED'          },
]

export default function RapnetOrders() {
	const BASE_API = import.meta.env.VITE_BASE_API as string
	const { user } = useAuthContext()
	const { token } = user

	const [orders, setOrders]       = useState<RapnetOrderRow[]>([])
	const [loading, setLoading]     = useState(true)
	const [statusFilter, setStatusFilter] = useState('')
	const [search, setSearch]       = useState('')
	const [page, setPage]           = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [viewOrder, setViewOrder] = useState<RapnetOrderRow | null>(null)
	const [updating, setUpdating]   = useState(false)

	// Reject modal
	const [rejectModal, setRejectModal] = useState<{ order: RapnetOrderRow | null }>({ order: null })
	const [rejectNote, setRejectNote]   = useState('')
	const [rejectSubmitting, setRejectSubmitting] = useState(false)

	// ── Fetch ────────────────────────────────────────────────────────────────
	const fetchOrders = useCallback(async () => {
		if (!token) return
		setLoading(true)
		try {
			const qs = new URLSearchParams({ page: String(page), limit: '30' })
			if (statusFilter) qs.set('status', statusFilter)
			if (search.trim()) qs.set('search', search.trim())
			const res  = await fetch(`${BASE_API}/api/rapnet/admin/orders?${qs}`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message ?? 'Failed')
			setOrders(Array.isArray(json.data) ? json.data : [])
			setTotalPages(json.paginatorInfo?.totalPages ?? 1)
		} catch (err: any) {
			toastService.error(err?.message ?? 'Failed to load orders')
		} finally {
			setLoading(false)
		}
	}, [token, BASE_API, page, statusFilter, search])

	useEffect(() => { fetchOrders() }, [fetchOrders])

	// ── Update status ─────────────────────────────────────────────────────────
	const patchStatus = async (id: string, status: string, adminNote?: string) => {
		if (!token) return
		setUpdating(true)
		try {
			const res  = await fetch(`${BASE_API}/api/rapnet/admin/orders/${id}/status`, {
				method:  'PATCH',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
				body:    JSON.stringify({ status, adminNote }),
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message ?? 'Failed')
			toastService.success(json.message ?? 'Status updated')
			// Update local state
			const updated = { ...viewOrder!, status: status as RapnetStatus, adminNote: adminNote ?? viewOrder?.adminNote ?? null }
			setViewOrder(updated)
			setOrders(prev => prev.map(o => o._id === id ? updated : o))
		} catch (err: any) {
			toastService.error(err?.message ?? 'Failed to update status')
		} finally {
			setUpdating(false)
		}
	}

	const handleApprove = (id: string) => {
		Swal.fire({
			title: 'Confirm Order?',
			text:  'Mark this inquiry as CONFIRMED?',
			icon:  'question',
			showCancelButton:  true,
			confirmButtonText: 'Yes, Confirm',
			confirmButtonColor:'#198754',
		}).then(r => { if (r.isConfirmed) patchStatus(id, 'CONFIRMED') })
	}

	const handleMarkSent = (id: string) => {
		patchStatus(id, 'SUBMITTED_TO_RAPNET')
	}

	const handleRejectSubmit = async () => {
		if (!rejectModal.order) return
		setRejectSubmitting(true)
		await patchStatus(rejectModal.order._id, 'REJECTED', rejectNote.trim() || undefined)
		setRejectModal({ order: null })
		setRejectNote('')
		setRejectSubmitting(false)
	}

	const stats = {
		total:     orders.length,
		pending:   orders.filter(o => ['REQUESTED','SUBMITTED_TO_RAPNET'].includes(o.status)).length,
		confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
		rejected:  orders.filter(o => ['REJECTED','CANCELLED'].includes(o.status)).length,
	}

	// ── Detail view ───────────────────────────────────────────────────────────
	if (viewOrder) {
		return (
			<>
				<PageBreadcrumb title="RapNet Orders" subName="Orders" />
				<Card className="border-0 shadow-sm">
					<Card.Body className="p-4">
						<OrderDetail
							order={viewOrder}
							onBack={() => setViewOrder(null)}
							onApprove={handleApprove}
							onReject={(o) => { setRejectModal({ order: o }); setRejectNote('') }}
							onMarkSent={handleMarkSent}
							updating={updating}
						/>
					</Card.Body>
				</Card>

				{/* Reject modal */}
				<Modal show={!!rejectModal.order} onHide={() => setRejectModal({ order: null })} centered>
					<Modal.Header closeButton>
						<Modal.Title className="fw-bold">Reject Inquiry</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<p className="text-muted small">
							Rejecting: <strong>{rejectModal.order?.productSnapshot?.title}</strong>
						</p>
						<Form.Group>
							<Form.Label className="fw-semibold small">Reason / Admin Note (optional)</Form.Label>
							<Form.Control as="textarea" rows={3} value={rejectNote}
								onChange={e => setRejectNote(e.target.value)}
								placeholder="e.g. Supplier unavailable, price changed…" />
						</Form.Group>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={() => setRejectModal({ order: null })}>Cancel</Button>
						<Button variant="danger" disabled={rejectSubmitting} onClick={handleRejectSubmit}>
							{rejectSubmitting ? <Spinner size="sm" /> : 'Reject Order'}
						</Button>
					</Modal.Footer>
				</Modal>
			</>
		)
	}

	// ── List view ─────────────────────────────────────────────────────────────
	return (
		<>
			<PageBreadcrumb title="RapNet Orders" subName="Orders" />

			{/* Stats */}
			<div className="row g-3 mb-4">
				{[
					{ label: 'Total',     value: stats.total,     color: '#6f4e37' },
					{ label: 'Pending',   value: stats.pending,   color: '#b45309' },
					{ label: 'Confirmed', value: stats.confirmed, color: '#15803d' },
					{ label: 'Rejected',  value: stats.rejected,  color: '#dc2626' },
				].map(s => (
					<div key={s.label} className="col-6 col-md-3">
						<Card className="border-0 shadow-sm h-100">
							<Card.Body className="text-center py-3">
								<h3 className="fw-black mb-0" style={{ color: s.color }}>{s.value}</h3>
								<small className="text-muted text-uppercase fw-semibold">{s.label}</small>
							</Card.Body>
						</Card>
					</div>
				))}
			</div>

			<Card className="border-0 shadow-sm">
				{/* Filters */}
				<Card.Header className="bg-white py-3">
					<div className="d-flex flex-wrap align-items-center gap-3">
						<MdDiamond size={20} className="text-muted" />
						<span className="fw-bold">RapNet Inquiries</span>
						<div className="ms-auto d-flex flex-wrap gap-2">
							<Form.Control size="sm" placeholder="Search order / diamond / cert…" style={{ width: '220px' }}
								value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
							<Form.Select size="sm" style={{ width: '190px' }}
								value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
								{STATUS_FILTERS.map(f => (
									<option key={f.value} value={f.value}>{f.label}</option>
								))}
							</Form.Select>
							<Button variant="outline-secondary" size="sm" onClick={fetchOrders}>
								<MdRefresh size={16} />
							</Button>
						</div>
					</div>
				</Card.Header>

				<Card.Body className="p-0">
					{loading ? (
						<div className="text-center py-5">
							<Spinner variant="secondary" />
							<p className="text-muted mt-2 small">Loading orders…</p>
						</div>
					) : orders.length === 0 ? (
						<div className="text-center py-5">
							<MdDiamond size={48} className="text-muted opacity-25 mb-3" />
							<p className="text-muted">No orders found.</p>
						</div>
					) : (
						<div className="table-responsive">
							<Table hover className="mb-0 align-middle">
								<thead className="table-light">
									<tr>
										<th style={{ width: '60px' }}>Image</th>
										<th>Diamond</th>
										<th>Customer</th>
										<th>Price</th>
										<th>Status</th>
										<th>Date</th>
										<th className="text-end">Actions</th>
									</tr>
								</thead>
								<tbody>
									{orders.map(order => {
										const snap  = order.productSnapshot ?? {}
										const cfg   = STATUS_META[order.status] ?? STATUS_META.REQUESTED
										const Icon  = cfg.Icon
										const image = snap.image ?? snap.raw?.image_file ?? null
										return (
											<tr key={order._id} style={{ cursor: 'pointer' }}
												onClick={() => setViewOrder(order)}>
												<td>
													<div className="rounded overflow-hidden bg-light d-flex align-items-center justify-content-center"
														style={{ width: 48, height: 48 }}>
														{image
															? <img src={image} alt="" style={{ width: 48, height: 48, objectFit: 'cover' }} />
															: <MdDiamond size={24} className="text-muted opacity-25" />}
													</div>
												</td>
												<td>
													<p className="fw-bold mb-0 small">{snap.title ?? '—'}</p>
													<small className="text-muted">
														{[snap.shape, snap.carat ? `${snap.carat}ct` : null, snap.color, snap.clarity]
															.filter(Boolean).join(' · ')}
													</small>
												</td>
												<td>
													<small className="fw-semibold d-block">{order.customerId?.username ?? '—'}</small>
													<small className="text-muted">{order.customerId?.email ?? ''}</small>
												</td>
												<td>
													<span className="fw-bold">
														{snap.price ? `$${Number(snap.price).toLocaleString()}` : '—'}
													</span>
												</td>
												<td>
													<Badge bg={cfg.variant} className="d-inline-flex align-items-center gap-1">
														<Icon size={12} />
														{cfg.label}
													</Badge>
												</td>
												<td>
													<small className="text-muted">
														{new Date(order.createdAt).toLocaleDateString()}
													</small>
												</td>
												<td className="text-end" onClick={e => e.stopPropagation()}>
													<div className="d-flex justify-content-end gap-1">
														<Button variant="outline-secondary" size="sm"
															onClick={() => setViewOrder(order)}
															title="View Details">
															<MdRemoveRedEye size={15} />
														</Button>
														{!['CONFIRMED','REJECTED','CANCELLED'].includes(order.status) && (
															<>
																<Button variant="outline-success" size="sm"
																	disabled={updating}
																	onClick={() => handleApprove(order._id)}
																	title="Confirm">
																	<MdCheckCircle size={15} />
																</Button>
																<Button variant="outline-danger" size="sm"
																	disabled={updating}
																	onClick={() => { setViewOrder(order); setRejectModal({ order }); setRejectNote('') }}
																	title="Reject">
																	<MdCancel size={15} />
																</Button>
															</>
														)}
													</div>
												</td>
											</tr>
										)
									})}
								</tbody>
							</Table>
						</div>
					)}
				</Card.Body>

				{/* Pagination */}
				{totalPages > 1 && (
					<Card.Footer className="bg-white d-flex align-items-center justify-content-center gap-3">
						<Button variant="outline-secondary" size="sm" disabled={page <= 1}
							onClick={() => setPage(p => p - 1)}>← Prev</Button>
						<small className="text-muted">Page {page} of {totalPages}</small>
						<Button variant="outline-secondary" size="sm" disabled={page >= totalPages}
							onClick={() => setPage(p => p + 1)}>Next →</Button>
					</Card.Footer>
				)}
			</Card>

			{/* Reject Modal (list-level) */}
			<Modal show={!!rejectModal.order} onHide={() => setRejectModal({ order: null })} centered>
				<Modal.Header closeButton>
					<Modal.Title className="fw-bold">Reject Inquiry</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p className="text-muted small mb-3">
						Rejecting: <strong>{rejectModal.order?.productSnapshot?.title}</strong>
					</p>
					<Form.Group>
						<Form.Label className="fw-semibold small">Reason / Admin Note (optional)</Form.Label>
						<Form.Control as="textarea" rows={3} value={rejectNote}
							onChange={e => setRejectNote(e.target.value)}
							placeholder="e.g. Supplier unavailable, price changed…" />
					</Form.Group>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setRejectModal({ order: null })}>Cancel</Button>
					<Button variant="danger" disabled={rejectSubmitting} onClick={handleRejectSubmit}>
						{rejectSubmitting ? <Spinner size="sm" /> : 'Reject Order'}
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}
