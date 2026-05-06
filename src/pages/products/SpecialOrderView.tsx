import { PageBreadcrumb } from '@/components'
import { Badge, Button, Card, Form, Modal, Spinner } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { LuArrowLeft } from 'react-icons/lu'
import { io } from 'socket.io-client'

const GOLD = '#C6A87D'

type SpoChatMessage = {
	_id: string
	text: string
	role: 'user' | 'admin'
	senderName?: string
	replyToMessageId?: string | null
	replyToText?: string
	replyToSenderName?: string
	createdAt: string
}

type ReplyContext = {
	id: string
	sender: string
	preview: string
}

const CHAT_REPLY_PREVIEW = 88

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
	chatMessages?: SpoChatMessage[]
}

const getSocketOrigin = (baseApi: string) => {
	const raw = String(baseApi || '').trim().replace(/\/$/, '')
	try {
		return new URL(raw).origin
	} catch {
		return raw
	}
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
		COMPLETED: 'success',
		CLOSED: 'info',
		FINALIZED: 'dark',
	}
	return <Badge bg={map[status] || 'secondary'}>{statusLabel(status)}</Badge>
}

const DetailCell = ({ label, value }: { label: string; value: React.ReactNode }) => (
	<div className="rounded-3 border border-light bg-white px-3 py-2 h-100 shadow-sm">
		<div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: 10, letterSpacing: '0.04em' }}>
			{label}
		</div>
		<div className="small text-dark fw-medium">{value ?? '—'}</div>
	</div>
)

const SpecialOrderView = () => {
	const BASE_API = import.meta.env.VITE_BASE_API
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { user, isSuperUser, role } = useAuthContext()
	const token = user?.token
	const roleNorm = String(role ?? user?.role ?? '').toLowerCase().trim()
	const isPrivilegedAdmin =
		isSuperUser ||
		roleNorm === 'admin' ||
		roleNorm === 'super admin' ||
		roleNorm === 'superuser'

	const [order, setOrder] = useState<SpecialOrder | null>(null)
	const [loading, setLoading] = useState(true)
	const [editModal, setEditModal] = useState(false)
	const [editForm, setEditForm] = useState({ status: '', assignedTo: '', eta: '', notes: '' })
	const [saving, setSaving] = useState(false)
	const [messages, setMessages] = useState<SpoChatMessage[]>([])
	const [chatInput, setChatInput] = useState('')
	const [sendingChat, setSendingChat] = useState(false)
	const [replyTo, setReplyTo] = useState<ReplyContext | null>(null)
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
	const chatEndRef = useRef<HTMLDivElement | null>(null)
	const messageRefs = useRef<Record<string, HTMLDivElement | null>>({})

	const makePreview = (text: string) => {
		const compact = String(text || '').replace(/\s+/g, ' ').trim()
		return compact.length > CHAT_REPLY_PREVIEW ? `${compact.slice(0, CHAT_REPLY_PREVIEW)}...` : compact
	}

	const jumpToMessage = (messageId?: string | null) => {
		if (!messageId) return
		const el = messageRefs.current[String(messageId)]
		if (!el) return
		el.scrollIntoView({ behavior: 'smooth', block: 'center' })
		setHighlightedMessageId(String(messageId))
		window.setTimeout(() => {
			setHighlightedMessageId((prev) => (prev === String(messageId) ? null : prev))
		}, 1800)
	}

	const fetchOrder = async () => {
		if (!id) return
		setLoading(true)
		try {
			const [res, resChat] = await Promise.all([
				fetch(`${BASE_API}/api/special-orders/${id}`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				fetch(`${BASE_API}/api/special-orders/${id}/chat-messages`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
			])
			const data = await res.json()
			if (!res.ok) throw new Error(data?.message || 'Failed to fetch')
			setOrder(data?.data || null)
			setEditForm({
				status: data?.data?.status || '',
				assignedTo: data?.data?.assignedTo || '',
				eta: data?.data?.eta ? data.data.eta.split('T')[0] : '',
				notes: data?.data?.notes || '',
			})
			const chatJson = await resChat.json().catch(() => ({}))
			if (resChat.ok && Array.isArray(chatJson.data)) setMessages(chatJson.data)
			else setMessages([])
		} catch (err: any) {
			Swal.fire({ title: 'Error', text: err?.message || 'Failed to load', icon: 'error' })
			navigate('/products/special-orders')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (!token || !isPrivilegedAdmin || !id) return
		fetchOrder()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token, isPrivilegedAdmin, id])

	useEffect(() => {
		if (!token || !id || !order) return
		const origin = getSocketOrigin(BASE_API)
		const socket = io(origin, {
			transports: ['websocket', 'polling'],
			auth: { token },
		})
		socket.emit('subscribeSpoOrder', { orderId: id, token }, () => {})
		socket.on('spoChatMessage', (msg: SpoChatMessage) => {
			setMessages((prev) => {
				if (prev.some((m) => String(m._id) === String(msg._id))) return prev
				return [...prev, msg]
			})
		})
		return () => {
			socket.emit('unsubscribeSpoOrder', id)
			socket.disconnect()
		}
	}, [token, id, order?._id, BASE_API])

	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages.length])

	const handleSaveEdit = async () => {
		if (!order) return
		setSaving(true)
		try {
			let body: Record<string, unknown>
			if (order.status === 'FINALIZED' && !isPrivilegedAdmin) {
				body = {
					assignedTo: editForm.assignedTo,
					eta: editForm.eta,
					notes: editForm.notes,
				}
			} else if (isPrivilegedAdmin && editForm.status === 'FINALIZED') {
				// API rejects PATCH with status FINALIZED (only store finalize flow); allow notes/ETA/assign while staying received
				body = {
					assignedTo: editForm.assignedTo,
					eta: editForm.eta,
					notes: editForm.notes,
				}
			} else {
				body = editForm
			}
			const res = await fetch(`${BASE_API}/api/special-orders/${order._id}`, {
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
			setEditModal(false)
			fetchOrder()
		} catch (err: any) {
			Swal.fire({ title: 'Error', text: err?.message || 'Failed to update', icon: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const handleSendChat = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!id || !chatInput.trim() || (order?.status === 'FINALIZED' && !isPrivilegedAdmin)) return
		setSendingChat(true)
		try {
			const res = await fetch(`${BASE_API}/api/special-orders/${id}/chat-messages`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					text: chatInput.trim(),
					replyToMessageId: replyTo?.id || null,
				}),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data?.message || 'Failed to send')
			const saved = data?.data as SpoChatMessage
			if (saved?._id) {
				setMessages((prev) => {
					if (prev.some((m) => String(m._id) === String(saved._id))) return prev
					return [...prev, saved]
				})
			}
			setChatInput('')
			setReplyTo(null)
		} catch (err: any) {
			Swal.fire({ title: 'Error', text: err?.message || 'Send failed', icon: 'error' })
		} finally {
			setSendingChat(false)
		}
	}

	if (!isPrivilegedAdmin) {
		return (
			<>
				<PageBreadcrumb title="Special Order" subName="Products" />
				<Card className="border-0 shadow-sm" style={{ borderRadius: '1rem' }}>
					<Card.Body className="py-5 text-center text-muted">Access denied.</Card.Body>
				</Card>
			</>
		)
	}

	if (loading || !order) {
		return (
			<>
				<PageBreadcrumb title="Special Order" subName="Products" />
				<div className="text-center py-5">
					<Spinner animation="border" style={{ color: GOLD }} />
				</div>
			</>
		)
	}

	const videos = (order.attachments || []).filter(isVideo)
	const images = (order.attachments || []).filter(isImage)
	const hasDiagram = !!order.canvasDrawing
	const chatClosed = order.status === 'FINALIZED' && !isPrivilegedAdmin

	return (
		<>
			<PageBreadcrumb title={order.ticketNumber} subName="Products" />

			<div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
				<Button
					variant="link"
					className="text-decoration-none text-dark p-0 d-inline-flex align-items-center fw-semibold"
					onClick={() => navigate('/products/special-orders')}
				>
					<LuArrowLeft size={22} className="me-2" />
					Back to list
				</Button>
				<Button
					className="rounded-pill px-4 fw-semibold"
					style={{ background: GOLD, border: 'none' }}
					onClick={() => setEditModal(true)}
				>
					Edit order
				</Button>
			</div>

			<Card
				className="border-0 shadow-sm mb-4 overflow-hidden"
				style={{ borderRadius: '1rem', borderBottom: `3px solid ${GOLD}` }}
			>
				<div
					className="text-white px-4 py-4"
					style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}
				>
					<div className="row align-items-center g-3">
						<div className="col-md-8">
							<div className="text-white-50 small text-uppercase mb-1" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
								Special order
							</div>
							<h3 className="mb-2 fw-bold text-white">{order.ticketNumber}</h3>
							<div className="d-flex flex-wrap align-items-center gap-2 gap-md-3">
								{statusBadge(order.status)}
								<span className="text-white-50 small">{order.storeId?.name}</span>
								<span className="text-white-50 small">·</span>
								<span className="text-white-50 small">
									{new Date(order.createdAt).toLocaleString()}
								</span>
							</div>
						</div>
						<div className="col-md-4 text-md-end">
							<div className="text-white-50 small text-uppercase mb-1">Requester</div>
							<div className="fw-semibold text-white">{order.requestedBy?.username || '—'}</div>
							{order.requestedBy?.email && (
								<div className="small text-white-50">{order.requestedBy.email}</div>
							)}
						</div>
					</div>
				</div>
			</Card>

			<div className="row g-4 align-items-start">
				<div className="col-lg-7">
					<Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '1rem' }}>
						<Card.Header
							className="border-0 py-3 text-white fw-semibold rounded-top"
							style={{
								background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
								borderBottom: `2px solid ${GOLD}`,
								borderRadius: '1rem 1rem 0 0',
							}}
						>
							Order details
						</Card.Header>
						<Card.Body className="p-4">
							<div className="row g-2">
								<div className="col-md-6">
									<DetailCell label="Receipt" value={order.receiptNumber} />
								</div>
								<div className="col-md-6">
									<DetailCell label="Customer #" value={order.customerNumber} />
								</div>
								<div className="col-md-6">
									<DetailCell label="Type of request" value={order.typeOfRequest?.replace(/_/g, ' ')} />
								</div>
								<div className="col-md-6">
									<DetailCell label="Reference SKU" value={order.referenceSkuNumber} />
								</div>
								<div className="col-md-6">
									<DetailCell label="Metal quality" value={order.metalQuality?.replace(/_/g, ' ')} />
								</div>
								<div className="col-md-6">
									<DetailCell label="Diamond type" value={order.diamondType?.replace(/_/g, ' ')} />
								</div>
								<div className="col-md-6">
									<DetailCell label="Diamond color" value={order.diamondColor} />
								</div>
								<div className="col-md-6">
									<DetailCell label="Diamond clarity" value={order.diamondClarity} />
								</div>
								<div className="col-12">
									<DetailCell label="Diamond details" value={order.diamondDetails} />
								</div>
								<div className="col-12">
									<DetailCell label="Customization" value={order.customization} />
								</div>
								<div className="col-md-6">
									<DetailCell label="Assigned to" value={order.assignedTo?.replace(/_/g, ' ') || '—'} />
								</div>
								<div className="col-md-6">
									<DetailCell
										label="ETA"
										value={order.eta ? new Date(order.eta).toLocaleDateString() : '—'}
									/>
								</div>
							</div>
							<div className="mt-4 p-3 rounded-3 border bg-light bg-opacity-50">
								<div className="text-muted text-uppercase fw-semibold small mb-2" style={{ fontSize: 10 }}>
									Notes
								</div>
								<div className="small text-dark">{order.notes || '—'}</div>
							</div>
						</Card.Body>
					</Card>

					<Card className="border-0 shadow-sm" style={{ borderRadius: '1rem' }}>
						<Card.Header
							className="border-0 py-3 text-white fw-semibold rounded-top"
							style={{
								background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
								borderBottom: `2px solid ${GOLD}`,
								borderRadius: '1rem 1rem 0 0',
							}}
						>
							Attachments & diagram
						</Card.Header>
						<Card.Body className="p-4">
							{videos.length === 0 && images.length === 0 && !hasDiagram ? (
								<p className="text-muted small mb-0">No attachments.</p>
							) : (
								<div className="d-flex flex-column gap-4">
									{videos.length > 0 && (
										<div>
											<h6 className="mb-3 fw-semibold text-uppercase small" style={{ color: GOLD }}>
												Videos
											</h6>
											<div className="d-flex flex-wrap gap-3">
												{videos.map((url) => (
													<div
														key={url}
														className="rounded-4 overflow-hidden shadow-sm bg-dark"
														style={{ maxWidth: 320 }}
													>
														<video controls className="w-100" src={`${BASE_API}/uploads/${url}`} />
													</div>
												))}
											</div>
										</div>
									)}
									{images.length > 0 && (
										<div>
											<h6 className="mb-3 fw-semibold text-uppercase small" style={{ color: GOLD }}>
												Images
											</h6>
											<div className="d-flex flex-wrap gap-3">
												{images.map((url) => (
													<a
														key={url}
														href={`${BASE_API}/uploads/${url}`}
														target="_blank"
														rel="noreferrer"
														className="rounded-4 overflow-hidden shadow-sm d-block border"
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
											<h6 className="mb-3 fw-semibold text-uppercase small" style={{ color: GOLD }}>
												Customer diagram
											</h6>
											<div className="rounded-4 overflow-hidden border shadow-sm p-3 bg-light">
												<img
													src={`${BASE_API}/uploads/${order.canvasDrawing}`}
													alt="Diagram"
													className="img-fluid rounded-3"
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

				<div className="col-lg-5">
					<Card
						className="border-0 shadow-sm sticky-lg-top"
						style={{ borderRadius: '1rem', top: '1rem', minHeight: 420 }}
					>
						<Card.Header
							className="border-0 py-3 text-white fw-semibold rounded-top"
							style={{
								background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
								borderBottom: `2px solid ${GOLD}`,
								borderRadius: '1rem 1rem 0 0',
							}}
						>
							Live chat with store
						</Card.Header>
						<Card.Body className="p-0 d-flex flex-column">
							<div
								className="flex-grow-1 overflow-auto px-3 py-3 bg-light bg-opacity-50"
								style={{ maxHeight: 'min(55vh, 520px)' }}
							>
								{messages.length === 0 ? (
									<p className="text-muted small mb-0 py-3 text-center">No messages yet.</p>
								) : (
									messages.map((m) => (
										<div
											key={m._id}
											ref={(el) => {
												messageRefs.current[String(m._id)] = el
											}}
											className={`mb-3 p-3 rounded-4 small shadow-sm ${
												m.role === 'admin'
													? 'bg-primary text-white ms-3'
													: 'bg-white border me-3'
											} ${highlightedMessageId === String(m._id) ? 'border border-warning shadow' : ''}`}
										>
											<div className="fw-semibold opacity-90" style={{ fontSize: 11 }}>
												{m.role === 'admin' ? m.senderName || 'Admin' : 'Store'}
												{m.createdAt && (
													<span className="opacity-75 fw-normal ms-1">
														· {new Date(m.createdAt).toLocaleString()}
													</span>
												)}
											</div>
											{m.replyToMessageId && m.replyToText && (
												<button
													type="button"
													onClick={() => jumpToMessage(m.replyToMessageId)}
													className={`w-100 text-start rounded-3 border p-2 mb-2 small mt-2 ${
														m.role === 'admin'
															? 'bg-white text-dark border-light'
															: 'bg-warning-subtle border-0 text-dark'
													}`}
												>
													<div className="fw-semibold" style={{ fontSize: 10 }}>
														Reply to {m.replyToSenderName || 'message'}
													</div>
													<div className="text-truncate" style={{ fontSize: 11 }}>
														{m.replyToText}
													</div>
												</button>
											)}
											<div className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>
												{m.text}
											</div>
											{!chatClosed && (
												<Button
													variant={m.role === 'admin' ? 'light' : 'outline-secondary'}
													size="sm"
													className="mt-2 py-0 px-2 rounded-pill"
													onClick={() =>
														setReplyTo({
															id: String(m._id),
															sender: m.role === 'admin' ? m.senderName || 'Admin' : 'Store',
															preview: makePreview(String(m.text || '')),
														})
													}
												>
													Reply
												</Button>
											)}
										</div>
									))
								)}
								<div ref={chatEndRef} />
							</div>

							{chatClosed ? (
								<div className="p-3 border-top small text-muted bg-white rounded-bottom">
									Order received — chat is closed.
								</div>
							) : (
								<div className="p-3 border-top bg-white rounded-bottom">
									<Form onSubmit={handleSendChat}>
										{replyTo && (
											<div className="mb-2 rounded-3 border border-warning-subtle bg-warning-subtle p-2 small d-flex justify-content-between align-items-start gap-2">
												<div className="text-truncate">
													<div className="fw-semibold">Replying to {replyTo.sender}</div>
													<div className="text-muted text-truncate">&quot;{replyTo.preview}&quot;</div>
												</div>
												<Button
													variant="link"
													className="p-0 small text-decoration-none text-dark"
													onClick={() => setReplyTo(null)}
												>
													Cancel
												</Button>
											</div>
										)}
										<div className="d-flex gap-2">
											<Form.Control
												className="rounded-3"
												value={chatInput}
												onChange={(e) => setChatInput(e.target.value)}
												placeholder="Message the store…"
												maxLength={4000}
											/>
											<Button
												type="submit"
												className="rounded-3 px-4 fw-semibold"
												style={{ background: GOLD, border: 'none' }}
												disabled={sendingChat || !chatInput.trim()}
											>
												{sendingChat ? '…' : 'Send'}
											</Button>
										</div>
									</Form>
								</div>
							)}
						</Card.Body>
					</Card>
				</div>
			</div>

			<Modal
				show={editModal}
				onHide={() => setEditModal(false)}
				centered
				contentClassName="border-0 rounded-4 overflow-hidden shadow"
			>
				<div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: `2px solid ${GOLD}` }}>
					<Modal.Header closeButton closeVariant="white" className="border-0 text-white py-3">
						<Modal.Title className="fw-semibold">Edit · {order.ticketNumber}</Modal.Title>
					</Modal.Header>
				</div>
				<Modal.Body className="px-4 py-4">
					<Form.Group className="mb-3">
						<Form.Label className="small text-muted text-uppercase fw-semibold">Status</Form.Label>
						{order.status === 'FINALIZED' && !isPrivilegedAdmin ? (
							<div>
								<Badge bg="dark">Received</Badge>
								<div className="text-muted small mt-1">Confirmed by the store.</div>
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
				</Modal.Body>
				<Modal.Footer className="border-0 px-4 pb-4 bg-light bg-opacity-50">
					<Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setEditModal(false)}>
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

export default SpecialOrderView
