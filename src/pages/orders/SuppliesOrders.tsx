import { PageBreadcrumb } from '@/components'
import { Card, Button, Badge, Modal, Form, Spinner } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toastService } from '@/common/context/toast.service'
import Swal from 'sweetalert2'
import { MdAutoAwesome, MdFilterList, MdInventory2 } from 'react-icons/md'

type SuppliesOrderStatus = 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED'

interface SuppliesOrderRow {
	_id: string
	ticketNumber: string
	customer?: { username?: string; email?: string; phone_number?: string }
	items: Array<{
		name: string
		sku: string
		quantity: number
		unitPrice: number
		currency: string
	}>
	totalAmount: number
	currency: string
	status: SuppliesOrderStatus
	rejection?: { reason?: string; rejectedAt?: string | null }
	approvedAt?: string | null
	createdAt: string
}

const STATUS_LABEL: Record<SuppliesOrderStatus, string> = {
	PENDING_ADMIN: 'Pending',
	APPROVED: 'Approved',
	REJECTED: 'Rejected',
}

export default function SuppliesOrders() {
	const BASE_API = import.meta.env.VITE_BASE_API as string
	const { user } = useAuthContext()
	const { token } = user

	const [loading, setLoading] = useState(true)
	const [orders, setOrders] = useState<SuppliesOrderRow[]>([])
	const [filter, setFilter] = useState<'' | SuppliesOrderStatus>('')
	const [rejectModal, setRejectModal] = useState<{ order: SuppliesOrderRow | null }>({ order: null })
	const [rejectReason, setRejectReason] = useState('')
	const [rejectSubmitting, setRejectSubmitting] = useState(false)

	const fetchOrders = useCallback(async () => {
		if (!token) return
		setLoading(true)
		try {
			const qs = filter ? `?status=${encodeURIComponent(filter)}` : ''
			const res = await fetch(`${BASE_API}/api/v2/supplies/orders/admin${qs}`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok || json.success === false) {
				throw new Error(json.message || 'Failed to load supplies orders')
			}
			setOrders(Array.isArray(json.data) ? json.data : [])
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : 'Failed to load'
			toastService.error(msg)
			setOrders([])
		} finally {
			setLoading(false)
		}
	}, [BASE_API, token, filter])

	useEffect(() => {
		void fetchOrders()
	}, [fetchOrders])

	const filteredCount = useMemo(() => orders.length, [orders])

	const approve = async (order: SuppliesOrderRow) => {
		const r = await Swal.fire({
			title: 'Approve supplies order?',
			html: `<div style="text-align:left;font-size:14px;color:#4a3f36">${order.ticketNumber}<br/><strong>${order.totalAmount?.toFixed(2)} ${order.currency}</strong></div>`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Approve',
			confirmButtonColor: '#3d2914',
			cancelButtonColor: '#928982',
		})
		if (!r.isConfirmed) return
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
			void fetchOrders()
		} catch (e: unknown) {
			toastService.error(e instanceof Error ? e.message : 'Approve failed')
		}
	}

	const openReject = (order: SuppliesOrderRow) => {
		setRejectReason('')
		setRejectModal({ order })
	}

	const submitReject = async () => {
		const order = rejectModal.order
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
			setRejectModal({ order: null })
			void fetchOrders()
		} catch (e: unknown) {
			toastService.error(e instanceof Error ? e.message : 'Reject failed')
		} finally {
			setRejectSubmitting(false)
		}
	}

	const statusVariant = (s: SuppliesOrderStatus) => {
		if (s === 'APPROVED') return 'success'
		if (s === 'REJECTED') return 'danger'
		return 'warning'
	}

	return (
		<>
			<PageBreadcrumb title="Supplies orders" subName="Orders" />

			<div
				className="mb-4 rounded-3 p-4 text-white"
				style={{
					background: 'linear-gradient(135deg, #3d2914 0%, #2c1810 55%, #1a1009 100%)',
					boxShadow: '0 12px 40px rgba(44,24,16,0.25)',
				}}
			>
				<div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
					<div className="d-flex align-items-center gap-3">
						<div
							className="rounded-circle d-flex align-items-center justify-content-center"
							style={{
								width: 48,
								height: 48,
								background: 'rgba(230, 213, 181, 0.15)',
								border: '1px solid rgba(230,213,181,0.35)',
							}}
						>
							<MdAutoAwesome size={26} color="#e8d5b5" />
						</div>
						<div>
							<h4 className="mb-0 fw-semibold" style={{ letterSpacing: '0.02em' }}>
								Supplies commerce
							</h4>
							<small className="text-white-50">
								Review store-submitted supplies carts · separate from warehouse inventory flow
							</small>
						</div>
					</div>
					<div className="text-end">
						<div className="small text-white-50 text-uppercase" style={{ letterSpacing: '0.18em' }}>
							Queue
						</div>
						<div className="fs-4 fw-semibold">{filteredCount}</div>
					</div>
				</div>
			</div>

			<Card className="border-0 shadow-sm" style={{ borderRadius: 16, overflow: 'hidden' }}>
				<Card.Header
					className="d-flex flex-wrap align-items-center justify-content-between gap-2 py-3"
					style={{
						background: 'linear-gradient(180deg, #faf8f5 0%, #ffffff 100%)',
						borderBottom: '1px solid #e8dfd4',
					}}
				>
					<div className="d-flex align-items-center gap-2 text-secondary">
						<MdFilterList size={20} />
						<span className="fw-semibold text-dark">Filters</span>
					</div>
					<div className="d-flex flex-wrap gap-2">
						{(['', 'PENDING_ADMIN', 'APPROVED', 'REJECTED'] as const).map((s) => (
							<Button
								key={s || 'all'}
								size="sm"
								variant={filter === s ? 'dark' : 'outline-secondary'}
								onClick={() => setFilter(s)}
								style={
									filter === s
										? { backgroundColor: '#3d2914', borderColor: '#3d2914' }
										: { borderColor: '#d4c9bc', color: '#4a3f36' }
								}
							>
								{s ? STATUS_LABEL[s] : 'All'}
							</Button>
						))}
					</div>
				</Card.Header>
				<Card.Body className="p-0">
					{loading ? (
						<div className="d-flex justify-content-center py-5">
							<Spinner animation="border" variant="secondary" />
						</div>
					) : orders.length === 0 ? (
						<div className="text-center py-5 px-4 text-muted">
							<MdInventory2 size={40} className="mb-3 opacity-50" />
							<p className="mb-0 fw-medium">No supplies orders in this view.</p>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover mb-0 align-middle">
								<thead style={{ background: '#faf8f5', borderBottom: '2px solid #e8dfd4' }}>
									<tr className="small text-uppercase text-secondary" style={{ letterSpacing: '0.06em' }}>
										<th className="ps-4 py-3">Ticket</th>
										<th className="py-3">Store</th>
										<th className="py-3">Items</th>
										<th className="py-3">Total</th>
										<th className="py-3">Status</th>
										<th className="pe-4 py-3 text-end">Actions</th>
									</tr>
								</thead>
								<tbody>
									{orders.map((o) => (
										<tr key={o._id}>
											<td className="ps-4">
												<code className="text-dark fw-semibold">{o.ticketNumber}</code>
												<div className="small text-muted">
													{new Date(o.createdAt).toLocaleString()}
												</div>
											</td>
											<td>
												<div className="fw-medium text-dark">{o.customer?.username || '—'}</div>
												<div className="small text-muted">{o.customer?.email || ''}</div>
											</td>
											<td>
												<div className="small text-dark">
													{o.items?.slice(0, 2).map((it) => (
														<div key={it.sku + it.name}>
															{it.name}{' '}
															<span className="text-muted">
																×{it.quantity}
															</span>
														</div>
													))}
													{(o.items?.length || 0) > 2 ? (
														<span className="text-muted">+{o.items.length - 2} more</span>
													) : null}
												</div>
											</td>
											<td className="fw-semibold text-dark">
												{o.totalAmount?.toFixed(2)} {o.currency}
											</td>
											<td>
												<Badge bg={statusVariant(o.status)} className="px-2 py-1">
													{STATUS_LABEL[o.status]}
												</Badge>
												{o.status === 'REJECTED' && o.rejection?.reason ? (
													<div className="small text-danger mt-1" style={{ maxWidth: 180 }}>
														{o.rejection.reason}
													</div>
												) : null}
											</td>
											<td className="pe-4 text-end">
												{o.status === 'PENDING_ADMIN' ? (
													<div className="d-flex gap-2 justify-content-end flex-wrap">
														<Button
															size="sm"
															variant="outline-dark"
															style={{ borderColor: '#3d2914', color: '#3d2914' }}
															onClick={() => void approve(o)}
														>
															Approve
														</Button>
														<Button size="sm" variant="outline-danger" onClick={() => openReject(o)}>
															Reject
														</Button>
													</div>
												) : (
													<span className="small text-muted">—</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</Card.Body>
			</Card>

			<Modal show={!!rejectModal.order} onHide={() => !rejectSubmitting && setRejectModal({ order: null })} centered>
				<Modal.Header closeButton={!rejectSubmitting} style={{ borderBottom: '1px solid #e8dfd4' }}>
					<Modal.Title>Reject order</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p className="small text-muted mb-2">
						Ticket: <strong>{rejectModal.order?.ticketNumber}</strong>
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
				<Modal.Footer style={{ borderTop: '1px solid #e8dfd4' }}>
					<Button variant="light" onClick={() => setRejectModal({ order: null })} disabled={rejectSubmitting}>
						Cancel
					</Button>
					<Button variant="danger" onClick={() => void submitReject()} disabled={rejectSubmitting}>
						{rejectSubmitting ? 'Saving…' : 'Reject order'}
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}
