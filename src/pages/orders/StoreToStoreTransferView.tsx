import { PageBreadcrumb } from '@/components'
import { Button, Card, Dropdown, Form, Spinner } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { LuArrowLeft } from 'react-icons/lu'
import { io } from 'socket.io-client'
import {
	type StoreTransferRow,
	getAttrEntries,
	humanizeAttrKey,
	statusBadgeEl,
} from './storeTransferUtils'

const GOLD = '#C6A87D'

const CHAT_PREVIEW = 88

type ReplyCtx = { id: string; sender: string; preview: string }

type ChatMsg = {
	_id: string
	text: string
	role: string
	senderName?: string
	createdAt?: string
	replyToMessageId?: string | null
	replyToText?: string
	replyToSenderName?: string
}

const getSocketOrigin = (baseApi: string) => {
	const raw = String(baseApi || '')
		.trim()
		.replace(/\/$/, '')
	try {
		return new URL(raw).origin
	} catch {
		return raw
	}
}

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

const StoreToStoreTransferView = () => {
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
		roleNorm === 'superuser'||
		roleNorm === 'Super User'

	const [order, setOrder] = useState<StoreTransferRow | null>(null)
	const [messages, setMessages] = useState<ChatMsg[]>([])
	const [loading, setLoading] = useState(true)
	const [chatText, setChatText] = useState('')
	const [replyTo, setReplyTo] = useState<ReplyCtx | null>(null)
	const [actionId, setActionId] = useState<string | null>(null)
	const [sending, setSending] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const msgRefs = useRef<Record<string, HTMLDivElement | null>>({})

	const headers = useCallback(
		() => ({
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		}),
		[token],
	)

	const loadOrder = useCallback(async () => {
		if (!token || !id) return
		setLoading(true)
		try {
			const res = await fetch(`${BASE_API}/api/v2/b2b/store-transfers/${id}`, { headers: headers() })
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message || 'Failed to load')
			setOrder(json.data || null)
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : 'Failed to load')
			setOrder(null)
		} finally {
			setLoading(false)
		}
	}, [BASE_API, id, token, headers])

	const loadChat = useCallback(async () => {
		if (!token || !id) return
		try {
			const res = await fetch(`${BASE_API}/api/v2/b2b/store-transfers/${id}/chat-messages`, {
				headers: headers(),
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message || 'Chat load failed')
			setMessages(json.data || [])
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : 'Chat failed')
			setMessages([])
		}
	}, [BASE_API, id, token, headers])

	useEffect(() => {
		void loadOrder()
	}, [loadOrder])

	useEffect(() => {
		if (order?._id) void loadChat()
	}, [order?._id, loadChat])

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages.length])

	useEffect(() => {
		if (!id || !token || !order?._id) return
		const origin = getSocketOrigin(BASE_API)
		const socket = io(origin, {
			transports: ['websocket', 'polling'],
			auth: { token },
		})
		socket.emit(
			'subscribeB2bStoreTransfer',
			{ orderId: id, token },
			(ack: { ok?: boolean; error?: string }) => {
				if (ack && ack.ok === false && ack.error) console.warn('Transfer socket:', ack.error)
			},
		)
		socket.on('b2bStoreTransferChatMessage', (msg: ChatMsg) => {
			setMessages((prev) => {
				if (prev.some((m) => String(m._id) === String(msg._id))) return prev
				return [...prev, msg]
			})
		})
		return () => {
			socket.emit('unsubscribeB2bStoreTransfer', id)
			socket.disconnect()
		}
	}, [BASE_API, id, token, order?._id])

	const makePreview = (t: string) => {
		const c = String(t || '').replace(/\s+/g, ' ').trim()
		return c.length > CHAT_PREVIEW ? `${c.slice(0, CHAT_PREVIEW)}…` : c
	}

	const jumpTo = (id?: string | null) => {
		if (!id) return
		msgRefs.current[String(id)]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
	}

	const sendChat = async () => {
		if (!order || !chatText.trim()) return
		setSending(true)
		try {
			const res = await fetch(`${BASE_API}/api/v2/b2b/store-transfers/${order._id}/chat-messages`, {
				method: 'POST',
				headers: headers(),
				body: JSON.stringify({
					text: chatText.trim(),
					...(replyTo?.id ? { replyToMessageId: replyTo.id } : {}),
				}),
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message || 'Send failed')
			setChatText('')
			setReplyTo(null)
			if (json.data) setMessages((m) => [...m, json.data])
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : 'Send failed')
		} finally {
			setSending(false)
		}
	}

	const patchStatus = async (status: string, reason?: string) => {
		if (!order) return
		setActionId(order._id)
		try {
			const res = await fetch(`${BASE_API}/api/v2/b2b/store-transfers/${order._id}/status`, {
				method: 'PATCH',
				headers: headers(),
				body: JSON.stringify({ status, reason }),
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message || 'Update failed')
			toast.success('Updated')
			await loadOrder()
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : 'Update failed')
		} finally {
			setActionId(null)
		}
	}

	const approve = async () => {
		if (!order) return
		setActionId(order._id)
		try {
			const res = await fetch(`${BASE_API}/api/v2/b2b/store-transfers/${order._id}/approve`, {
				method: 'POST',
				headers: headers(),
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message || 'Approve failed')
			toast.success(json.message || 'Approved')
			await loadOrder()
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : 'Approve failed')
		} finally {
			setActionId(null)
		}
	}

	if (!id) {
		return (
			<>
				<PageBreadcrumb title="Transfer" subName="Orders" />
				<p className="text-muted">Invalid link.</p>
			</>
		)
	}

	if (loading && !order) {
		return (
			<>
				<PageBreadcrumb title="Loading…" subName="Orders" />
				<div className="text-center py-5">
					<Spinner animation="border" />
				</div>
			</>
		)
	}

	if (!order) {
		return (
			<>
				<PageBreadcrumb title="Not found" subName="Orders" />
				<Button variant="outline-secondary" onClick={() => navigate('/orders/store-to-store-transfers')}>
					<LuArrowLeft className="me-1" /> Back to list
				</Button>
			</>
		)
	}

	const sku = order.skuId
	const attr = sku?.attributes || {}
	const description =
		(attr.descriptionname != null && String(attr.descriptionname).trim()
			? String(attr.descriptionname)
			: '') ||
		order.vendorProductId?.title ||
		order.vendorProductId?.vendorModel ||
		'—'
	const imageList = (sku?.images || []).filter((u) => typeof u === 'string' && u.trim().length > 0)
	const chatLocked =
		(order.status === 'REJECTED' || order.status === 'RECEIVED') && !isPrivilegedAdmin
	const attrEntries = getAttrEntries(attr as Record<string, string | number | undefined | null>).filter(
		([k]) => k !== 'descriptionname',
	)

	return (
		<>
			<PageBreadcrumb title={order.ticketNumber || 'Store transfer'} subName="Orders" />

			<div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
				<Button
					variant="link"
					className="text-decoration-none text-dark p-0 d-inline-flex align-items-center fw-semibold"
					onClick={() => navigate('/orders/store-to-store-transfers')}
				>
					<LuArrowLeft className="me-2" size={20} />
					Back to transfers
				</Button>

				<Dropdown align="end">
					<Dropdown.Toggle
						variant="dark"
						size="sm"
						className="px-4 rounded-pill border-0"
						style={{ background: `linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)`, borderBottom: `2px solid ${GOLD}` }}
						disabled={!!actionId}
					>
						Actions
					</Dropdown.Toggle>
					<Dropdown.Menu className="shadow border-0 rounded-3 py-2">
						{isPrivilegedAdmin && (order.status === 'REJECTED' || order.status === 'RECEIVED') ? (
							<>
								<Dropdown.Header className="small text-muted text-uppercase">Admin · reopen</Dropdown.Header>
								<Dropdown.Item onClick={() => void patchStatus('WIP')} disabled={actionId === order._id}>
									Set WIP
								</Dropdown.Item>
								<Dropdown.Item onClick={() => void patchStatus('TRANSFER')} disabled={actionId === order._id}>
									Set Transfer
								</Dropdown.Item>
								<Dropdown.Item onClick={() => void patchStatus('SUBMITTED')} disabled={actionId === order._id}>
									Set Submitted
								</Dropdown.Item>
								{order.status === 'RECEIVED' ? (
									<Dropdown.Item onClick={() => void patchStatus('DELIVERED')} disabled={actionId === order._id}>
										Rollback to Delivered
									</Dropdown.Item>
								) : null}
								<Dropdown.Divider />
							</>
						) : null}
						{['SUBMITTED', 'WIP', 'TRANSFER'].includes(order.status) ? (
							<>
								<Dropdown.Item onClick={() => void approve()} disabled={actionId === order._id}>
									Approve
								</Dropdown.Item>
								<Dropdown.Item onClick={() => void patchStatus('WIP')} disabled={actionId === order._id}>
									Set WIP
								</Dropdown.Item>
								<Dropdown.Item onClick={() => void patchStatus('TRANSFER')} disabled={actionId === order._id}>
									Set Transfer
								</Dropdown.Item>
								<Dropdown.Divider />
								<Dropdown.Item
									className="text-danger"
									onClick={() => void patchStatus('REJECTED', 'Rejected by admin')}
									disabled={actionId === order._id}
								>
									Reject
								</Dropdown.Item>
							</>
						) : null}
						{order.status === 'APPROVED' ? (
							<Dropdown.Item onClick={() => void patchStatus('DELIVERED')} disabled={actionId === order._id}>
								Mark delivered
							</Dropdown.Item>
						) : null}
					</Dropdown.Menu>
				</Dropdown>
			</div>

			<div className="row g-4">
				<div className="col-lg-7">
					<Card
						className="border-0 shadow-sm overflow-hidden mb-4"
						style={{ borderRadius: '1rem', borderBottom: `3px solid ${GOLD}` }}
					>
						<div
							className="text-white px-4 py-4"
							style={{
								background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
							}}
						>
							<div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
								<div>
									<div className="text-white-50 small text-uppercase letter-spacing-1 mb-1">Transfer</div>
									<h4 className="mb-1 fw-bold">{order.ticketNumber || order._id}</h4>
									<div className="d-flex align-items-center gap-2 flex-wrap">
										{statusBadgeEl(order.status)}
										<span className="text-white-50 small">
											{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
										</span>
									</div>
								</div>
								<div className="text-end small">
									<div className="text-white-50">Requester</div>
									<div className="fw-semibold">{order.requestedBy?.username || order.requestedBy?.email || '—'}</div>
								</div>
							</div>
						</div>

						<Card.Body className="p-4">
							<div className="row g-4">
								{imageList.length > 0 ? (
									<div className="col-sm-auto">
										<div
											className="rounded-3 overflow-hidden bg-light border"
											style={{ width: 200, height: 200 }}
										>
											<img
												src={imageUrl(BASE_API, imageList[0])}
												alt=""
												className="w-100 h-100 object-fit-contain"
												style={{ objectFit: 'contain' }}
											/>
										</div>
										{imageList.length > 1 ? (
											<div className="d-flex gap-2 mt-2 flex-wrap">
												{imageList.slice(1, 5).map((src, i) => (
													<div key={`${src}-${i}`} className="rounded-2 overflow-hidden border" style={{ width: 56, height: 56 }}>
														<img src={imageUrl(BASE_API, src)} alt="" className="w-100 h-100 object-fit-cover" />
													</div>
												))}
											</div>
										) : null}
									</div>
								) : null}

								<div className="col min-w-0">
									<h5 className="fw-bold mb-3" style={{ color: '#1a1a1a' }}>
										{description}
									</h5>
									<div className="row g-2">
										{sku?.sku ? (
											<div className="col-12 col-md-6">
												<div className="rounded-3 border bg-light px-3 py-2">
													<div className="text-muted text-uppercase small fw-semibold" style={{ fontSize: 10 }}>
														SKU
													</div>
													<div className="font-monospace fw-medium">{sku.sku}</div>
												</div>
											</div>
										) : null}
										<div className="col-12 col-md-6">
											<div className="rounded-3 border bg-light px-3 py-2">
												<div className="text-muted text-uppercase small fw-semibold" style={{ fontSize: 10 }}>
													Line total
												</div>
												<div className="fw-medium">{formatMoney(order.unitPrice != null ? order.unitPrice * order.quantity : undefined, order.currency)}</div>
											</div>
										</div>
										<div className="col-12 col-md-6">
											<div className="rounded-3 border bg-light px-3 py-2">
												<div className="text-muted text-uppercase small fw-semibold" style={{ fontSize: 10 }}>
													Unit price
												</div>
												<div className="fw-medium">{formatMoney(sku?.price ?? order.unitPrice, order.currency)}</div>
											</div>
										</div>
										<div className="col-12 col-md-6">
											<div className="rounded-3 border bg-light px-3 py-2">
												<div className="text-muted text-uppercase small fw-semibold" style={{ fontSize: 10 }}>
													Qty
												</div>
												<div className="fw-medium">{order.quantity}</div>
											</div>
										</div>
										<div className="col-12">
											<div className="rounded-3 border bg-light px-3 py-2">
												<div className="text-muted text-uppercase small fw-semibold" style={{ fontSize: 10 }}>
													Route
												</div>
												<div className="fw-medium">
													{order.sourceWarehouseId?.name || '—'}{' '}
													<span className="text-muted px-1">→</span>{' '}
													{order.destWarehouseId?.name || '—'}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<hr className="my-4 opacity-25" />

							<h6 className="text-uppercase small fw-bold mb-3 letter-spacing-1" style={{ color: GOLD }}>
								Attributes
							</h6>
							{attrEntries.length === 0 ? (
								<p className="text-muted small mb-0">No extra attributes.</p>
							) : (
								<div className="row g-2">
									{attrEntries.map(([key, val]) => (
										<div key={key} className="col-12 col-md-6">
											<div className="d-flex align-items-baseline gap-2 rounded-3 border px-3 py-2 bg-white">
												<span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: 10 }}>
													{humanizeAttrKey(key)}
												</span>
												<span className="small text-dark ms-auto text-end">{val}</span>
											</div>
										</div>
									))}
								</div>
							)}

							{order.status === 'REJECTED' && order.rejection?.reason ? (
								<div className="mt-4 p-3 rounded-3 border border-danger-subtle bg-danger-subtle">
									<div className="small fw-bold text-danger text-uppercase mb-1">Rejection</div>
									<div className="small">{order.rejection.reason}</div>
								</div>
							) : null}
						</Card.Body>
					</Card>
				</div>

				<div className="col-lg-5">
					<Card className="border-0 shadow-sm h-100 d-flex flex-column" style={{ borderRadius: '1rem', minHeight: 420 }}>
						<Card.Header
							className="border-0 py-3 text-white fw-semibold"
							style={{
								background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
								borderBottom: `2px solid ${GOLD}`,
								borderRadius: '1rem 1rem 0 0',
							}}
						>
							Messages
						</Card.Header>
						<Card.Body className="flex-grow-1 d-flex flex-column p-0" style={{ minHeight: 320 }}>
							<div className="flex-grow-1 overflow-auto px-3 py-3" style={{ maxHeight: 'min(55vh, 480px)' }}>
								<div className="d-flex flex-column gap-2">
									{messages.map((m) => (
										<div
											key={m._id}
											ref={(el) => {
												msgRefs.current[String(m._id)] = el
											}}
											className={`p-3 rounded-3 border small ${m.role === 'admin' ? 'bg-light align-self-start' : 'bg-primary text-white align-self-end'}`}
											style={{ maxWidth: '92%' }}
										>
											<div className="opacity-75 mb-1" style={{ fontSize: 11 }}>
												{m.senderName || m.role}
												{m.createdAt ? ` · ${new Date(m.createdAt).toLocaleString()}` : ''}
											</div>
											{m.replyToMessageId && m.replyToText ? (
												<button
													type="button"
													className={`btn btn-sm w-100 text-start mb-2 py-2 px-2 rounded-3 border small ${
														m.role === 'admin'
															? 'bg-white border-secondary-subtle text-secondary-emphasis'
															: 'bg-white bg-opacity-25 border-white border-opacity-50 text-white'
													}`}
													onClick={() => jumpTo(m.replyToMessageId)}
												>
													<div className="fw-semibold small">
														Reply to {m.replyToSenderName || 'message'}
													</div>
													<div className="text-truncate opacity-90">{m.replyToText}</div>
												</button>
											) : null}
											<div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
											{!chatLocked ? (
												<button
													type="button"
													className={`btn btn-link btn-sm p-0 mt-2 text-decoration-none ${
														m.role === 'admin' ? 'text-primary' : 'text-white'
													}`}
													onClick={() =>
														setReplyTo({
															id: String(m._id),
															sender:
																m.role === 'admin'
																	? m.senderName || 'Admin'
																	: m.senderName || 'Store',
															preview: makePreview(m.text || ''),
														})
													}
												>
													Reply
												</button>
											) : null}
										</div>
									))}
									<div ref={messagesEndRef} />
								</div>
							</div>
							{!chatLocked ? (
								<div className="p-3 border-top bg-white rounded-bottom">
									{replyTo ? (
										<div className="d-flex align-items-start justify-content-between gap-2 rounded-3 border border-warning-subtle bg-warning-subtle p-2 mb-2 small">
											<div className="min-w-0">
												<span className="fw-semibold text-dark">Replying to {replyTo.sender}</span>
												<div className="text-truncate text-secondary">&quot;{replyTo.preview}&quot;</div>
											</div>
											<button
												type="button"
												className="btn btn-sm btn-link text-secondary text-decoration-none shrink-0 p-0"
												onClick={() => setReplyTo(null)}
											>
												✕
											</button>
										</div>
									) : null}
									<div className="d-flex gap-2 align-items-end">
										<Form.Control
											as="textarea"
											rows={2}
											maxLength={4000}
											placeholder="Message to store…"
											value={chatText}
											onChange={(e) => setChatText(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter' && !e.shiftKey) {
													e.preventDefault()
													void sendChat()
												}
											}}
											className="rounded-3"
											style={{ resize: 'none', minHeight: 44 }}
										/>
										<Button
											className="rounded-3 px-4"
											style={{ background: GOLD, border: 'none' }}
											onClick={() => void sendChat()}
											disabled={!chatText.trim() || sending}
										>
											Send
										</Button>
									</div>
								</div>
							) : (
								<div className="p-3 small text-muted border-top">
									{order.status === 'REJECTED'
										? 'This transfer was rejected — chat is closed for stores.'
										: 'Chat closed — transfer received (stores only).'}
								</div>
							)}
						</Card.Body>
					</Card>
				</div>
			</div>
		</>
	)
}

export default StoreToStoreTransferView
