import { PageBreadcrumb } from '@/components'
import { Card, Button, Badge, Modal, Form, Spinner, Row, Col } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toastService } from '@/common/context/toast.service'
import Swal from 'sweetalert2'
import { LuArrowLeft } from 'react-icons/lu'
import { MdInventory2, MdLocalShipping, MdPerson, MdStore, MdDiamond } from 'react-icons/md'

type SuppliesOrderStatus = 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED'

export interface SuppliesOrderDetailRow {
	_id: string
	ticketNumber: string
	customer?: {
		_id?: string
		username?: string
		email?: string
		phone_number?: string
	}
	warehouse?: { _id?: string; name?: string; isMain?: boolean }
	requestedByModel?: string
	items: Array<{
		specialProductId?: string
		name: string
		sku: string
		quantity: number
		unitPrice: number
		currency: string
		image?: string
	}>
	totalAmount: number
	currency: string
	status: SuppliesOrderStatus
	rejection?: { reason?: string; rejectedAt?: string | null }
	approvedAt?: string | null
	createdAt: string
	updatedAt?: string
}

const STATUS_LABEL: Record<SuppliesOrderStatus, string> = {
	PENDING_ADMIN: 'Pending approval',
	APPROVED: 'Approved',
	REJECTED: 'Rejected',
}

const BROWN = '#3d2914'
const IVORY = '#faf8f5'
const CHAMPAGNE = '#e8d5b5'
const BORDER = 'rgba(61, 41, 20, 0.12)'

function imageUrl(base: string, path?: string): string {
	if (!path || !String(path).trim()) return ''
	const p = String(path).trim()
	if (p.startsWith('http://') || p.startsWith('https://')) return p
	const b = base.replace(/\/$/, '')
	return p.startsWith('/') ? `${b}${p}` : `${b}/${p}`
}

function formatMoney(amount: number | undefined, currency?: string): string {
	if (amount === undefined || Number.isNaN(amount)) return '—'
	try {
		return new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: currency && /^[A-Z]{3}$/i.test(currency) ? currency.toUpperCase() : 'USD',
		}).format(amount)
	} catch {
		return String(amount)
	}
}

export default function SuppliesOrderDetail() {
	const BASE_API = import.meta.env.VITE_BASE_API as string
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { user } = useAuthContext()
	const { token } = user

	const [loading, setLoading] = useState(true)
	const [order, setOrder] = useState<SuppliesOrderDetailRow | null>(null)
	const [rejectModal, setRejectModal] = useState(false)
	const [rejectReason, setRejectReason] = useState('')
	const [rejectSubmitting, setRejectSubmitting] = useState(false)
	const [actionBusy, setActionBusy] = useState(false)

	const load = useCallback(async () => {
		if (!token || !id) return
		setLoading(true)
		try {
			const res = await fetch(`${BASE_API}/api/v2/supplies/orders/admin/${id}`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok || json.success === false) {
				throw new Error(json.message || 'Failed to load order')
			}
			setOrder(json.data || null)
		} catch (e: unknown) {
			toastService.error(e instanceof Error ? e.message : 'Failed to load')
			setOrder(null)
		} finally {
			setLoading(false)
		}
	}, [BASE_API, id, token])

	useEffect(() => {
		void load()
	}, [load])

	const statusVariant = (s: SuppliesOrderStatus) => {
		if (s === 'APPROVED') return 'success'
		if (s === 'REJECTED') return 'danger'
		return 'warning'
	}

	const approve = async () => {
		if (!order || !token) return
		const r = await Swal.fire({
			title: 'Approve this supplies order?',
			html: `<div style="text-align:left;font-size:14px;color:#4a3f36">${order.ticketNumber}<br/><strong>${formatMoney(order.totalAmount, order.currency)}</strong></div>`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Approve',
			confirmButtonColor: BROWN,
			cancelButtonColor: '#928982',
		})
		if (!r.isConfirmed) return
		setActionBusy(true)
		try {
			const res = await fetch(`${BASE_API}/api/v2/supplies/orders/admin/${order._id}/approve`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok || json.success === false) throw new Error(json.message || 'Approve failed')
			toastService.success('Order approved')
			await load()
		} catch (e: unknown) {
			toastService.error(e instanceof Error ? e.message : 'Approve failed')
		} finally {
			setActionBusy(false)
		}
	}

	const submitReject = async () => {
		if (!order || !token) return
		const reason = rejectReason.trim()
		if (reason.length < 3) {
			toastService.error('Please enter a rejection reason (min. 3 characters).')
			return
		}
		setRejectSubmitting(true)
		try {
			const res = await fetch(`${BASE_API}/api/v2/supplies/orders/admin/${order._id}/reject`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ reason }),
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok || json.success === false) throw new Error(json.message || 'Reject failed')
			toastService.success('Order rejected')
			setRejectModal(false)
			setRejectReason('')
			await load()
		} catch (e: unknown) {
			toastService.error(e instanceof Error ? e.message : 'Reject failed')
		} finally {
			setRejectSubmitting(false)
		}
	}

	if (loading) {
		return (
			<>
				<PageBreadcrumb title="Supplies order" subName="Orders" />
				<div className="d-flex justify-content-center py-5">
					<Spinner animation="border" variant="secondary" />
				</div>
			</>
		)
	}

	if (!order) {
		return (
			<>
				<PageBreadcrumb title="Supplies order" subName="Orders" />
				<Card className="border-0 shadow-sm text-center py-5" style={{ borderRadius: 20, border: `1px solid ${BORDER}` }}>
					<Card.Body>
						<MdInventory2 size={48} className="text-muted mb-3 opacity-50" />
						<p className="text-muted mb-3">Order not found or you do not have access.</p>
						<Link className="btn btn-dark px-4" to="/orders/supplies-orders" style={{ backgroundColor: BROWN, borderColor: BROWN }}>
							Back to list
						</Link>
					</Card.Body>
				</Card>
			</>
		)
	}

	const panelStyle: React.CSSProperties = {
		borderRadius: 20,
		border: `1px solid ${BORDER}`,
		background: `linear-gradient(165deg, ${IVORY} 0%, #ffffff 55%)`,
		boxShadow: '0 20px 48px rgba(61, 41, 20, 0.08)',
		overflow: 'hidden',
	}

	return (
		<div style={{ background: '#fbf9f6', minHeight: '70vh', margin: '-12px -12px 0', padding: '12px 12px 48px' }}>
			<PageBreadcrumb title={`Order ${order.ticketNumber}`} subName="Orders" />

			<div className="mb-3">
				<Button
					variant="link"
					className="text-decoration-none p-0 d-inline-flex align-items-center gap-1"
					style={{ color: BROWN }}
					onClick={() => navigate('/orders/supplies-orders')}
				>
					<LuArrowLeft size={18} />
					Back to supplies orders
				</Button>
			</div>

			<div
				className="mb-4 rounded-4 p-4 p-md-5 text-white position-relative overflow-hidden"
				style={{
					background: `linear-gradient(125deg, ${BROWN} 0%, #2a1a0f 45%, #1a1009 100%)`,
					boxShadow: '0 24px 56px rgba(44, 24, 16, 0.35)',
				}}
			>
				<div
					className="position-absolute top-0 end-0 opacity-10 pe-none"
					style={{ fontSize: 180, lineHeight: 1, transform: 'translate(12%, -8%)' }}
					aria-hidden
				>
					<MdDiamond />
				</div>
				<div className="position-relative d-flex flex-wrap align-items-start justify-content-between gap-4">
					<div>
						<div className="small text-white-50 text-uppercase mb-2" style={{ letterSpacing: '0.2em', fontSize: 11 }}>
							Reference
						</div>
						<div className="fs-4 fw-bold" style={{ letterSpacing: '0.04em', color: CHAMPAGNE }}>
							{order.ticketNumber}
						</div>
						<div className="small mt-3" style={{ color: 'rgba(255,255,255,0.72)' }}>
							Submitted {new Date(order.createdAt).toLocaleString()}
							{order.updatedAt ? ` · Last updated ${new Date(order.updatedAt).toLocaleString()}` : ''}
						</div>
					</div>
					<div className="text-end">
						<Badge bg={statusVariant(order.status)} className="px-3 py-2 mb-3 rounded-pill" style={{ fontSize: 12, letterSpacing: '0.06em' }}>
							{STATUS_LABEL[order.status]}
						</Badge>
						<div className="display-6 fw-bold" style={{ color: CHAMPAGNE, lineHeight: 1.1 }}>
							{formatMoney(order.totalAmount, order.currency)}
						</div>
						{order.approvedAt ? (
							<div className="small mt-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
								Approved {new Date(order.approvedAt).toLocaleString()}
							</div>
						) : null}
					</div>
				</div>
			</div>

			{order.status === 'PENDING_ADMIN' ? (
				<div className="d-flex flex-wrap gap-2 mb-4">
					<Button
						variant="dark"
						disabled={actionBusy}
						onClick={() => void approve()}
						className="px-4 rounded-pill fw-semibold"
						style={{ backgroundColor: BROWN, borderColor: BROWN }}
					>
						{actionBusy ? 'Working…' : 'Approve order'}
					</Button>
					<Button variant="outline-danger" disabled={actionBusy} className="px-4 rounded-pill" onClick={() => setRejectModal(true)}>
						Reject order
					</Button>
				</div>
			) : null}

			<Row className="g-4 align-items-start">
				<Col lg={5} xl={4}>
					<div className="sticky-lg-top" style={{ top: 16 }}>
						<div className="p-1 rounded-4 mb-3" style={{ background: `linear-gradient(145deg, ${CHAMPAGNE}, ${BROWN})` }}>
							<div className="rounded-4 p-4" style={{ background: IVORY }}>
								<div className="d-flex align-items-center gap-2 mb-4 text-uppercase small fw-bold" style={{ color: BROWN, letterSpacing: '0.14em' }}>
									<MdInventory2 size={22} />
									Products
								</div>
								{order.items?.map((it, idx) => {
									const img = imageUrl(BASE_API, it.image)
									const lineTotal = (it.unitPrice || 0) * (it.quantity || 0)
									return (
										<div
											key={`${it.sku}-${idx}`}
											className={idx > 0 ? 'mt-4 pt-4' : ''}
											style={idx > 0 ? { borderTop: `1px solid ${BORDER}` } : undefined}
										>
											<div
												className="rounded-4 overflow-hidden position-relative mb-3"
												style={{
													aspectRatio: '1 / 1',
													maxHeight: 420,
													background: 'linear-gradient(180deg, #f0ebe4 0%, #e8dfd4 100%)',
													border: `1px solid ${BORDER}`,
												}}
											>
												{img ? (
													<img src={img} alt={it.name} className="w-100 h-100" style={{ objectFit: 'cover' }} />
												) : (
													<div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
														<MdInventory2 size={64} className="opacity-25" />
													</div>
												)}
											</div>
											<h5 className="fw-bold mb-1" style={{ color: BROWN }}>
												{it.name}
											</h5>
											<div className="small text-muted mb-2">SKU · {it.sku}</div>
											<div className="d-flex flex-wrap justify-content-between gap-2 small">
												<span className="text-muted">Quantity</span>
												<span className="fw-semibold" style={{ color: BROWN }}>{it.quantity}</span>
											</div>
											<div className="d-flex flex-wrap justify-content-between gap-2 small mt-1">
												<span className="text-muted">Unit price</span>
												<span className="fw-semibold" style={{ color: BROWN }}>
													{formatMoney(it.unitPrice, it.currency || order.currency)}
												</span>
											</div>
											<div className="d-flex flex-wrap justify-content-between gap-2 mt-2 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
												<span className="fw-semibold text-muted">Line total</span>
												<span className="fw-bold fs-5" style={{ color: BROWN }}>
													{formatMoney(lineTotal, it.currency || order.currency)}
												</span>
											</div>
										</div>
									)
								})}
							</div>
						</div>
					</div>
				</Col>

				<Col lg={7} xl={8}>
					<Row className="g-3 mb-3">
						<Col md={6}>
							<Card className="border-0 h-100" style={panelStyle}>
								<Card.Header
									className="border-0 py-3 d-flex align-items-center gap-2 fw-bold text-uppercase small"
									style={{ background: BROWN, color: CHAMPAGNE, letterSpacing: '0.12em' }}
								>
									<MdPerson size={20} />
									Customer
								</Card.Header>
								<Card.Body className="p-4">
									<dl className="row mb-0 small">
										<dt className="col-4 text-muted fw-normal">Name</dt>
										<dd className="col-8 mb-3 fw-semibold" style={{ color: BROWN }}>{order.customer?.username || '—'}</dd>
										<dt className="col-4 text-muted fw-normal">Email</dt>
										<dd className="col-8 mb-3" style={{ color: BROWN }}>{order.customer?.email || '—'}</dd>
										<dt className="col-4 text-muted fw-normal">Phone</dt>
										<dd className="col-8 mb-0" style={{ color: BROWN }}>{order.customer?.phone_number || '—'}</dd>
									</dl>
								</Card.Body>
							</Card>
						</Col>
						<Col md={6}>
							<Card className="border-0 h-100" style={panelStyle}>
								<Card.Header
									className="border-0 py-3 d-flex align-items-center gap-2 fw-bold text-uppercase small"
									style={{ background: BROWN, color: CHAMPAGNE, letterSpacing: '0.12em' }}
								>
									<MdStore size={20} />
									Store
								</Card.Header>
								<Card.Body className="p-4">
									<dl className="row mb-0 small">
										<dt className="col-5 text-muted fw-normal">Warehouse</dt>
										<dd className="col-7 mb-3 fw-semibold" style={{ color: BROWN }}>{order.warehouse?.name || '—'}</dd>
										<dt className="col-5 text-muted fw-normal">Location type</dt>
										<dd className="col-7 mb-0" style={{ color: BROWN }}>
											{order.warehouse?.isMain ? 'Main hub' : 'Store location'}
										</dd>
									</dl>
								</Card.Body>
							</Card>
						</Col>
					</Row>

					<Card className="border-0 mb-3" style={panelStyle}>
						<Card.Header
							className="border-0 py-3 d-flex align-items-center gap-2 fw-bold text-uppercase small"
							style={{ background: `linear-gradient(90deg, ${BROWN}, #5c3d28)`, color: CHAMPAGNE, letterSpacing: '0.12em' }}
						>
							<MdLocalShipping size={20} />
							Order summary
						</Card.Header>
						<Card.Body className="p-4">
							<dl className="row mb-0 small">
								<dt className="col-md-4 text-muted fw-normal">Requested by</dt>
								<dd className="col-md-8 mb-3" style={{ color: BROWN }}>{order.requestedByModel || 'Customer'}</dd>
								<dt className="col-md-4 text-muted fw-normal">Currency</dt>
								<dd className="col-md-8 mb-3" style={{ color: BROWN }}>{order.currency || 'USD'}</dd>
								<dt className="col-md-4 text-muted fw-normal">Line items</dt>
								<dd className="col-md-8 mb-0 fw-semibold" style={{ color: BROWN }}>{order.items?.length ?? 0}</dd>
							</dl>
							<div
								className="mt-4 pt-4 d-flex justify-content-between align-items-center flex-wrap gap-2"
								style={{ borderTop: `2px solid ${BORDER}` }}
							>
								<span className="text-uppercase small fw-bold" style={{ color: BROWN, letterSpacing: '0.1em' }}>
									Order total
								</span>
								<span className="fs-3 fw-bold" style={{ color: BROWN }}>
									{formatMoney(order.totalAmount, order.currency)}
								</span>
							</div>
						</Card.Body>
					</Card>

					{order.status === 'REJECTED' && order.rejection?.reason ? (
						<Card className="border-0 mb-0" style={{ ...panelStyle, border: '1px solid rgba(220, 53, 69, 0.35)' }}>
							<Card.Body className="p-4">
								<div className="fw-bold text-danger mb-2 text-uppercase small" style={{ letterSpacing: '0.08em' }}>
									Rejection
								</div>
								<p className="mb-2" style={{ color: '#4a3f36' }}>{order.rejection.reason}</p>
								{order.rejection.rejectedAt ? (
									<div className="small text-muted">{new Date(order.rejection.rejectedAt).toLocaleString()}</div>
								) : null}
							</Card.Body>
						</Card>
					) : null}
				</Col>
			</Row>

			<Modal show={rejectModal} onHide={() => !rejectSubmitting && setRejectModal(false)} centered>
				<Modal.Header closeButton={!rejectSubmitting} style={{ borderBottom: `1px solid ${BORDER}` }}>
					<Modal.Title>Reject order</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p className="small text-muted mb-2">
						Reference: <strong>{order.ticketNumber}</strong>
					</p>
					<Form.Group>
						<Form.Label>Reason</Form.Label>
						<Form.Control
							as="textarea"
							rows={3}
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							placeholder="Explain why this order is rejected…"
							disabled={rejectSubmitting}
						/>
					</Form.Group>
				</Modal.Body>
				<Modal.Footer style={{ borderTop: `1px solid ${BORDER}` }}>
					<Button variant="light" onClick={() => setRejectModal(false)} disabled={rejectSubmitting}>
						Cancel
					</Button>
					<Button variant="danger" onClick={() => void submitReject()} disabled={rejectSubmitting}>
						{rejectSubmitting ? 'Saving…' : 'Reject order'}
					</Button>
				</Modal.Footer>
			</Modal>
		</div>
	)
}
