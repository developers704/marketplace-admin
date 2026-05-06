import { PageBreadcrumb } from '@/components'
import { Badge, Button, Card, Form, Spinner } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import { LuArrowLeft, LuCheck, LuCheckCheck, LuMic, LuPaperclip, LuPlay, LuSendHorizonal, LuX , LuReply } from 'react-icons/lu'
import { io } from 'socket.io-client'

const GOLD = "#6f4e37"

const FULFILLMENT_STEPS = ['SUBMITTED', 'IN_PROCESS', 'SHIPPED', 'COMPLETED'] as const

type B2BPurchaseChatMsg = {
	_id: string
	text: string
	role: string
	senderId?: string
	senderName?: string
	replyToMessageId?: string | null
	replyToText?: string
	replyToSenderName?: string
	attachments?: Array<{ name?: string; url: string; mimeType?: string; size?: number }>
	voice?: { name?: string; url: string; mimeType?: string; size?: number; durationMs?: number } | null
	seenBy?: Array<{ userId: string; userModel: string; seenAt: string }>
	createdAt?: string
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

const fulfillmentStepLabel = (s: string) => {
	switch (s) {
		case 'SUBMITTED':
			return 'Submitted'
		case 'IN_PROCESS':
			return 'In process'
		case 'SHIPPED':
			return 'Shipped'
		case 'COMPLETED':
			return 'Completed'
		default:
			return s
	}
}

function effectiveFulfillment(fs: string | undefined, status: string): string {
	if (fs && fs !== 'NONE') return fs
	if (status === 'APPROVED') return 'SUBMITTED'
	return fs || 'NONE'
}

type ApproverCompact = { username?: string; email?: string }

type B2BPurchaseRequestDetail = {
	_id: string
	status: string
	quantity: number
	createdAt: string
	updatedAt: string
	vendorProductId?: {
		_id?: string
		vendorModel?: string
		title?: string
		brand?: string
		category?: string
	}
	skuId?: {
		_id: string
		sku?: string
		price?: number
		currency?: string
		metalColor?: string
		metalType?: string
		size?: string
		images?: string[]
		attributes?: Record<string, string | number | undefined | null>
	}
	storeWarehouseId?: { _id?: string; name?: string; isMain?: boolean }
	vendorWarehouseId?: { _id?: string; name?: string }
	requestedByUser?: ApproverCompact & { phone_number?: string }
	dmUserId?: ApproverCompact | string | null
	cmUserId?: ApproverCompact | string | null
	approvals?: {
		dm?: { userId?: string; approvedAt?: string | null }
		cm?: { userId?: string; approvedAt?: string | null }
		admin?: { userId?: string; approvedAt?: string | null }
	}
	rejection?: {
		reason?: string
		rejectedAt?: string | null
		rejectedBy?: string | null
	}
	cartItemPrice?: number | null
	cartItemCurrency?: string
	fulfillmentStatus?: string
	shippedAt?: string | null
	completedAt?: string | null
}

function imageUrl(base: string, path?: string): string {
	if (!path || !String(path).trim()) return ''
	const p = String(path).trim()
	if (p.startsWith('http://') || p.startsWith('https://')) return p
	const b = base.replace(/\/$/, '')
	return p.startsWith('/') ? `${b}${p}` : `${b}/${p}`
}

function humanizeAttrKey(key: string): string {
	if (!key || key.trim() === '') return ''
	const spaced = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim()
	return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : key
}

function hasVal(v: unknown): boolean {
	if (v === null || v === undefined) return false
	if (typeof v === 'string') return v.trim().length > 0
	if (typeof v === 'number') return !Number.isNaN(v)
	return true
}

const toDataUrl = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(String(reader.result || ''))
		reader.onerror = () => reject(new Error('Failed to read file'))
		reader.readAsDataURL(file)
	})

const formatDuration = (durationMs?: number) => {
	const sec = Math.max(0, Math.round((durationMs || 0) / 1000))
	const mm = Math.floor(sec / 60)
	const ss = sec % 60
	return `${mm}:${String(ss).padStart(2, '0')}`
}

const isImageAttachment = (a: { url: string; mimeType?: string }) => {
	const mime = String(a.mimeType || '').toLowerCase()
	const url = String(a.url || '').toLowerCase()
	return mime.startsWith('image/') || url.startsWith('data:image/')
}

const isAudioAttachment = (a: { url: string; mimeType?: string }) => {
	const mime = String(a.mimeType || '').toLowerCase()
	const url = String(a.url || '').toLowerCase()
	return mime.startsWith('audio/') || url.startsWith('data:audio/')
}

const statusBadge = (status: string) => {
	switch (status) {
		case 'PENDING_DM':
		case 'PENDING_CM':
		case 'PENDING_ADMIN':
			return (
				<Badge bg="warning" text="dark" className="rounded-pill px-3 py-2 fw-semibold">
					{status.replace(/_/g, ' ')}
				</Badge>
			)
		case 'APPROVED':
			return (
				<Badge bg="success" className="rounded-pill px-3 py-2 fw-semibold">
					Approved
				</Badge>
			)
		case 'REJECTED':
			return (
				<Badge bg="danger" className="rounded-pill px-3 py-2 fw-semibold">
					Rejected
				</Badge>
			)
		default:
			return (
				<Badge bg="secondary" className="rounded-pill px-3 py-2">
					{status}
				</Badge>
			)
	}
}

const DetailCell = ({ label, value }: { label: string; value: ReactNode }) => (
	<div className="rounded-3 border border-light bg-white px-3 py-2 h-100 shadow-sm">
		<div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: 10, letterSpacing: '0.04em' }}>
			{label}
		</div>
		<div className="small text-dark fw-medium">{value ?? '—'}</div>
	</div>
)

const listApprovers = (label: string, u: ApproverCompact | string | null | undefined) => {
	if (!u || typeof u === 'string') return null
	return (
		<div className="small">
			<span className="text-muted">{label}: </span>
			<span className="fw-medium">{u.username || u.email || '—'}</span>
		</div>
	)
}

const B2BPurchaseRequestView = () => {
	const BASE_API = import.meta.env.VITE_BASE_API
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { user } = useAuthContext()
	const token = user?.token

	const [order, setOrder] = useState<B2BPurchaseRequestDetail | null>(null)
	const [loading, setLoading] = useState(true)
	const [inventoryQty, setInventoryQty] = useState<number | null>(null)
	const [actionBusy, setActionBusy] = useState(false)
	const [messages, setMessages] = useState<B2BPurchaseChatMsg[]>([])
	const [chatText, setChatText] = useState('')
	const [sendingChat, setSendingChat] = useState(false)
	const [fulfillmentBusy, setFulfillmentBusy] = useState(false)
	const [replyTo, setReplyTo] = useState<{ id: string; sender: string; preview: string } | null>(null)
	const [attachments, setAttachments] = useState<Array<{ name: string; url: string; mimeType: string; size: number }>>([])
	const [recording, setRecording] = useState(false)
	const [voiceNote, setVoiceNote] = useState<{ name: string; url: string; mimeType: string; size: number; durationMs: number } | null>(null)
	const voiceStartRef = useRef<number>(0)
	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const recordedChunksRef = useRef<BlobPart[]>([])
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const chatEndRef = useRef<HTMLDivElement>(null)
	const msgRefs = useRef<Record<string, HTMLDivElement | null>>({})
	const CHAT_PREVIEW = 88

	const fetchSkuInventory = useCallback(
		async (skuId: string) => {
			try {
				const response = await fetch(`${BASE_API}/api/v2/skus/${skuId}`, {
					headers: { Authorization: `Bearer ${token}` },
				})
				if (response.ok) {
					const data = await response.json()
					return data?.data?.totalQuantity ?? 0
				}
			} catch {
				/* ignore */
			}
			return null
		},
		[BASE_API, token],
	)

	const load = useCallback(async () => {
		if (!token || !id) return
		setLoading(true)
		try {
			const [res, resChat] = await Promise.all([
				fetch(`${BASE_API}/api/v2/b2b/status/${id}`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				fetch(`${BASE_API}/api/v2/b2b/requests/${id}/chat-messages`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
			])
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message || 'Failed to load')
			const data = json.data as B2BPurchaseRequestDetail
			setOrder(data || null)
			const chatJson = await resChat.json().catch(() => ({}))
			if (resChat.ok && Array.isArray(chatJson.data)) setMessages(chatJson.data)
			else setMessages([])
			if (data?.skuId?._id) {
				const q = await fetchSkuInventory(data.skuId._id)
				setInventoryQty(q)
			} else {
				setInventoryQty(null)
			}
		} catch (e: unknown) {
			Swal.fire({ title: 'Error', text: e instanceof Error ? e.message : 'Failed to load', icon: 'error' })
			setOrder(null)
		} finally {
			setLoading(false)
		}
	}, [BASE_API, id, token, fetchSkuInventory])

	const markSeen = useCallback(async () => {
		if (!id || !token) return
		try {
			await fetch(`${BASE_API}/api/v2/b2b/requests/${id}/chat-messages/seen`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
			})
		} catch {
			/* ignore seen sync errors */
		}
	}, [BASE_API, id, token])

	useEffect(() => {
		void load()
	}, [load])

	useEffect(() => {
		if (messages.length > 0) void markSeen()
	}, [messages.length, markSeen])

	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages.length])

	useEffect(() => {
		if (!id || !token || !order?._id) return
		const origin = getSocketOrigin(BASE_API)
		const socket = io(origin, {
			transports: ['websocket', 'polling'],
			auth: { token },
		})
		socket.emit(
			'subscribeB2bPurchase',
			{ purchaseId: id, orderId: id, token },
			(ack: { ok?: boolean; error?: string }) => {
				if (ack && ack.ok === false && ack.error) console.warn('B2B purchase socket:', ack.error)
			},
		)
		socket.on('b2bPurchaseChatMessage', (msg: B2BPurchaseChatMsg) => {
			setMessages((prev) => {
				if (prev.some((m) => String(m._id) === String(msg._id))) return prev
				return [...prev, msg]
			})
			void markSeen()
		})
		socket.on('b2bPurchaseChatSeen', (evt: { viewerId?: string; viewerModel?: string; seenAt?: string }) => {
			const viewerId = String(evt?.viewerId || '')
			if (!viewerId) return
			setMessages((prev) =>
				prev.map((m) => {
					if (String(m.senderId || '') === viewerId) return m
					const exists = (m.seenBy || []).some((s) => String(s.userId) === viewerId)
					if (exists) return m
					return {
						...m,
						seenBy: [
							...(m.seenBy || []),
							{
								userId: viewerId,
								userModel: String(evt?.viewerModel || 'User'),
								seenAt: String(evt?.seenAt || new Date().toISOString()),
							},
						],
					}
				}),
			)
		})
		return () => {
			socket.emit('unsubscribeB2bPurchase', id)
			socket.disconnect()
		}
	}, [BASE_API, id, token, order?._id, markSeen])

	const patchFulfillment = async (fulfillmentStatus: string) => {
		if (!order?._id) return
		setFulfillmentBusy(true)
		try {
			const res = await fetch(`${BASE_API}/api/v2/b2b/requests/${order._id}/fulfillment`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ fulfillmentStatus }),
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message || 'Update failed')
			setOrder(json.data || null)
			Swal.fire({ title: 'Updated', icon: 'success', timer: 1200 })
		} catch (e: unknown) {
			Swal.fire({ title: 'Error', text: e instanceof Error ? e.message : 'Update failed', icon: 'error' })
		} finally {
			setFulfillmentBusy(false)
		}
	}

	const sendChat = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!id || order?.status === 'REJECTED') return
		if (!chatText.trim() && attachments.length === 0 && !voiceNote) return
		setSendingChat(true)
		try {
			const res = await fetch(`${BASE_API}/api/v2/b2b/requests/${id}/chat-messages`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					text: chatText.trim() || '[attachment]',
					replyToMessageId: replyTo?.id || null,
					attachments,
					voice: voiceNote,
				}),
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message || 'Send failed')
			setChatText('')
			setReplyTo(null)
			setAttachments([])
			setVoiceNote(null)
			if (json.data)
				setMessages((prev) => {
					if (prev.some((m) => String(m._id) === String(json.data._id))) return prev
					return [...prev, json.data]
				})
		} catch (e: unknown) {
			Swal.fire({ title: 'Error', text: e instanceof Error ? e.message : 'Send failed', icon: 'error' })
		} finally {
			setSendingChat(false)
		}
	}

	const onPickAttachments = async (evt: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(evt.target.files || []).slice(0, 4)
		if (!files.length) return
		try {
			const built = await Promise.all(
				files.map(async (file) => ({
					name: file.name,
					url: await toDataUrl(file),
					mimeType: file.type || 'application/octet-stream',
					size: file.size,
				})),
			)
			setAttachments((prev) => [...prev, ...built].slice(0, 4))
		} catch (err) {
			Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Attachment failed', icon: 'error' })
		} finally {
			evt.target.value = ''
		}
	}

	const removeAttachment = (idx: number) => {
		setAttachments((prev) => prev.filter((_, i) => i !== idx))
	}

	const toggleVoiceRecording = async () => {
		if (recording) {
			mediaRecorderRef.current?.stop()
			setRecording(false)
			return
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			const rec = new MediaRecorder(stream)
			recordedChunksRef.current = []
			voiceStartRef.current = Date.now()
			rec.ondataavailable = (ev) => {
				if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data)
			}
			rec.onstop = async () => {
				const blob = new Blob(recordedChunksRef.current, { type: rec.mimeType || 'audio/webm' })
				const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || 'audio/webm' })
				const url = await toDataUrl(file)
				setVoiceNote({
					name: file.name,
					url,
					mimeType: file.type || 'audio/webm',
					size: file.size,
					durationMs: Date.now() - voiceStartRef.current,
				})
				stream.getTracks().forEach((t) => t.stop())
			}
			mediaRecorderRef.current = rec
			rec.start()
			setRecording(true)
		} catch {
			Swal.fire({ title: 'Mic permission needed', icon: 'warning' })
		}
	}

	const makePreview = (text: string) => {
		const compact = String(text || '').replace(/\s+/g, ' ').trim()
		return compact.length > CHAT_PREVIEW ? `${compact.slice(0, CHAT_PREVIEW)}…` : compact
	}
			const getAvatarText = (name?: string, fallback = 'U') => {
			const parts = String(name || fallback)
				.trim()
				.split(/\s+/)
				.filter(Boolean)

			return parts
				.slice(0, 2)
				.map((p) => p[0])
				.join('')
				.toUpperCase()
		}
	const jumpToMsg = (mid?: string | null) => {
		if (!mid) return
		msgRefs.current[String(mid)]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
	}

	const approveRequest = async () => {
		if (!order?._id) return
		setActionBusy(true)
		try {
			const response = await fetch(`${BASE_API}/api/v2/b2b/approve/${order._id}`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
			})
			const data = await response.json()
			if (!response.ok) throw new Error(data?.message || 'Approve failed')
			Swal.fire({ title: 'Approved', icon: 'success', timer: 1200 })
			await load()
		} catch (error: unknown) {
			Swal.fire({ title: 'Error', text: error instanceof Error ? error.message : 'Approve failed', icon: 'error' })
		} finally {
			setActionBusy(false)
		}
	}

	const rejectRequest = async () => {
		if (!order?._id) return
		const { value: reason } = await Swal.fire({
			title: 'Reject request',
			input: 'text',
			inputLabel: 'Reason (optional)',
			showCancelButton: true,
		})
		if (reason === undefined) return
		setActionBusy(true)
		try {
			const response = await fetch(`${BASE_API}/api/v2/b2b/reject/${order._id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ reason }),
			})
			const data = await response.json()
			if (!response.ok) throw new Error(data?.message || 'Reject failed')
			Swal.fire({ title: 'Rejected', icon: 'success', timer: 1200 })
			await load()
		} catch (error: unknown) {
			Swal.fire({ title: 'Error', text: error instanceof Error ? error.message : 'Reject failed', icon: 'error' })
		} finally {
			setActionBusy(false)
		}
	}

	if (!id) {
		return (
			<>
				<PageBreadcrumb title="Purchase request" subName="Products" />
				<p className="text-muted">Invalid link.</p>
			</>
		)
	}

	if (loading && !order) {
		return (
			<>
				<PageBreadcrumb title="Loading…" subName="Products" />
				<div className="text-center py-5">
					<Spinner animation="border" style={{ color: GOLD }} />
				</div>
			</>
		)
	}

	if (!order) {
		return (
			<>
				<PageBreadcrumb title="Not found" subName="Products" />
				<Button variant="outline-secondary" onClick={() => navigate('/products/b2b-purchase-requests-v2')}>
					<LuArrowLeft className="me-1" /> Back
				</Button>
			</>
		)
	}

	const sku = order.skuId
	const images = (sku?.images || []).filter((u) => typeof u === 'string' && u.trim().length > 0)
	const attrEntries = Object.entries(sku?.attributes || {}).filter(
		([k, v]) => k !== '' && String(k).trim() !== '' && hasVal(v),
	)
	const productTitle =
		order.vendorProductId?.title || order.vendorProductId?.vendorModel || sku?.sku || 'Purchase request'

	const canApprove =
		order.status === 'PENDING_ADMIN' && inventoryQty !== null && inventoryQty >= order.quantity

	return (
		<>
			<PageBreadcrumb title={productTitle.slice(0, 48)} subName="Products" />

			<div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
				<Button
					variant="link"
					className="text-decoration-none text-dark p-0 d-inline-flex align-items-center fw-semibold"
					onClick={() => navigate('/products/b2b-purchase-requests-v2')}
				>
					<LuArrowLeft size={22} className="me-2" />
					Back to list
				</Button>

				{order.status === 'PENDING_ADMIN' ? (
					<div className="d-flex flex-wrap gap-2">
						<Button
							className="rounded-pill px-4 fw-semibold"
							style={{
								background: canApprove ? '#198754' : '#adb5bd',
								border: 'none',
							}}
							disabled={!canApprove || actionBusy}
							onClick={() => void approveRequest()}
							title={
								!canApprove && inventoryQty !== null && inventoryQty < order.quantity
									? `Only ${inventoryQty} available · need ${order.quantity}`
									: undefined
							}
						>
							Approve
						</Button>
						<Button
							variant="outline-danger"
							className="rounded-pill px-4 fw-semibold"
							disabled={actionBusy}
							onClick={() => void rejectRequest()}
						>
							Reject
						</Button>
					</div>
				) : null}
			</div>

			<Card
				className="border-0 shadow-sm mb-4 overflow-hidden"
				style={{ borderRadius: '1rem', borderBottom: `3px solid ${GOLD}` }}
			>
				<div
					className="text-white px-4 py-4"
					style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}
				>
					<div className="row align-items-start g-3">
						<div className="col-lg-8">
							<div className="text-white-50 small text-uppercase mb-1" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
								B2B purchase request
							</div>
							<h4 className="fw-bold text-white mb-2">{order.vendorProductId?.vendorModel || '—'}</h4>
							<p className="text-white-50 small mb-2">{order.vendorProductId?.title}</p>
							<div className="d-flex flex-wrap align-items-center gap-2">{statusBadge(order.status)}</div>
						</div>
						<div className="col-lg-4 text-lg-end">
							<div className="text-white-50 small">Quantity</div>
							<div className="display-6 fw-bold text-white">{order.quantity}</div>
							<div className="text-white-50 small mt-2">
								Updated {new Date(order.updatedAt).toLocaleString()}
							</div>
						</div>
					</div>
				</div>
			</Card>

			<div className="row g-4">
				<div className="col-lg-7">
					
					<Card
						className="border-0 shadow-sm mb-4 d-flex flex-column"
						style={{ borderRadius: '1rem', minHeight: 380 }}
					>
						<Card.Header
							className="border-0 py-3 text-white fw-semibold rounded-top"
							style={{
								background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
								borderBottom: `2px solid ${GOLD}`,
								borderRadius: '1rem 1rem 0 0',
							}}
						>
							Messages
						</Card.Header>
						<Card.Body className="p-0 d-flex flex-column flex-grow-1">
							<div
								className="flex-grow-1 overflow-auto px-3 py-3 bg-light bg-opacity-50"
								style={{ maxHeight: 'min(45vh, 420px)' }}
							>
								{messages.length === 0 ? (
									<p className="text-muted small mb-0 py-3 text-center">No messages yet.</p>
								) : (
								messages.map((m, idx) => {
								const isMine = m.role === 'admin'
								const selfId = String(user?._id || user?.id || '')
								const seen = (m.seenBy || []).some((s) => String(s.userId) !== selfId)
								const delivered = messages.slice(idx + 1).some((n) => n.role !== m.role)

								const avatarText = getAvatarText(
									m.senderName,
									isMine ? 'Admin' : 'Store'
								)

								const timeText = m.createdAt
									? new Date(m.createdAt).toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit',
										})
									: ''

							return (
								<div
									key={m._id}
									ref={(el) => {
										msgRefs.current[String(m._id)] = el
									}}
									className={`mb-2 d-flex align-items-end gap-2 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}
								>
									{!isMine ? (
										<div
											className="rounded-circle d-inline-flex align-items-center justify-content-center  fw-bold flex-shrink-0 "
											style={{ width: 32, height: 32, fontSize: 11, backgroundColor:'#EDE8D0' }}
											title={m.senderName || 'Store'}
										>
											{avatarText}
										</div>
									) : null}

									<div
										className={`message-bubble position-relative px-3 py-2 rounded-4 small shadow-sm ${
											isMine ? 'text-white' : 'text-dark'
										}`}
										style={{
											maxWidth: '78%',
											width: 'fit-content',
											minWidth: 0,
											backgroundColor: isMine ? '#6f4e37' : '#EDE8D0',

										}}
									>
										{m.replyToMessageId && m.replyToText ? (
											<button
												type="button"
												onClick={() => jumpToMsg(m.replyToMessageId)}
												className={`w-100 text-start rounded-3 border p-2 mb-2 small ${
													isMine ? 'bg-white text-dark border-light' : ' border-0 text-dark'
												}`}
											>
												<div className="text-truncate" style={{ fontSize: 11 }}>
													{m.replyToText}
												</div>
											</button>
										) : null}

										{Array.isArray(m.attachments) && m.attachments.length > 0 ? (
											<div className="d-flex flex-wrap gap-2 mb-1">
												{m.attachments.map((a, idx) =>
													isImageAttachment(a) ? (
														<img
															key={`${a.url}-${idx}`}
															src={a.url}
															alt={a.name || ''}
															className="rounded-3 border"
															style={{ width: '100%', maxHeight: 220, objectFit: 'cover' }}
														/>
													) : isAudioAttachment(a) ? (
														<audio key={`${a.url}-${idx}`} controls src={a.url} style={{ width: '100%' }} />
													) : (
														<a
															key={`${a.url}-${idx}`}
															href={a.url}
															download={a.name || `Attachment-${idx + 1}`}
															className={`small text-decoration-none ${isMine ? 'text-white' : 'text-primary'}`}
														>
															<LuPaperclip className="me-1" />
															{a.name || `Attachment ${idx + 1}`}
														</a>
													)
												)}
											</div>
										) : null}

											{m.voice?.url ? (
											<div
												className={`mb-1 rounded-3 px-2 py-1 w-100 ${
												isMine ? 'bg-[#EDE8D0] ' : 'bg-light border'
												}`}
												style={{ minWidth: 260, maxWidth: 360 }}
											>
												<audio
												controls
												src={m.voice.url}
												style={{ width: '100%', display: 'block' , }}
												/>
											</div>
											) : null}

										{m.text !== '[attachment]' ? (
											<div
												className="pe-4"
												style={{
													whiteSpace: 'pre-wrap',
													wordBreak: 'break-word',
												}}
											>
												{m.text}
											</div>
										) : null}

										<div
											className={`d-flex align-items-center justify-content-end gap-1 mt-1 ${
												isMine ? 'text-white-50' : 'text-muted'
											}`}
											style={{ fontSize: 10, lineHeight: 1 }}
										>
											<span>{timeText}</span>

											{isMine ? (
												seen ? (
													<LuCheckCheck className="text-info" size={13} />
												) : delivered ? (
													<LuCheckCheck size={13} />
												) : (
													<LuCheck size={13} />
												)
											) : null}
										</div>

										{order.status !== 'REJECTED' ? (
											<Button
												type="button"
												variant={isMine ? 'light' : 'outline-secondary'}
												size="sm"
												className="message-reply-btn position-absolute rounded-circle d-inline-flex align-items-center justify-content-center p-0"
												style={{
													width: 26,
													height: 26,
													top: -8,
													...(isMine ? { left: -8 } : { right: -8 }),
												}}
												title="Reply"
												onClick={() =>
													setReplyTo({
														id: String(m._id),
														sender: isMine ? m.senderName || 'Admin' : 'Store',
														preview: makePreview(String(m.text || '')),
													})
												}
											>
												<LuReply size={13} />
											</Button>
										) : null}
											</div>

											{isMine ? (
												<div
													className="rounded-circle d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary fw-bold flex-shrink-0"
													style={{ width: 32, height: 32, fontSize: 11 }}
													title={m.senderName || 'Admin'}
												>
													{avatarText}
												</div> 
														) : null}
													</div>
												)
											})
											)}
								<div ref={chatEndRef} />
							</div>
							{order.status === 'REJECTED' ? (
								<div className="p-3 border-top small text-muted bg-white rounded-bottom">
									Chat closed for rejected requests.
								</div>
							) : (
								<div className="p-3 border-top bg-white rounded-bottom">
									<Form onSubmit={sendChat}>
										{replyTo && (
											<div className="mb-2 rounded-3 border border-warning-subtle bg-warning-subtle p-2 small d-flex justify-content-between align-items-start gap-2">
												<div className="text-truncate">
													<div className="fw-semibold">Replying to {replyTo.sender}</div>
													<div className="text-muted text-truncate">&quot;{replyTo.preview}&quot;</div>
												</div>
												<Button variant="link" className="p-0 small text-decoration-none text-dark" onClick={() => setReplyTo(null)}>
													Cancel
												</Button>
											</div>
										)}
										<input ref={fileInputRef} type="file" className="d-none" accept="image/*,.pdf,.doc,.docx,.txt,audio/*" multiple onChange={onPickAttachments} />
										{attachments.length > 0 ? (
											<div className="d-flex flex-wrap gap-2 mb-2">
												{attachments.map((a, idx) => (
													<span key={`${a.url}-${idx}`} className="badge text-bg-light border d-inline-flex align-items-center gap-1">
														<LuPaperclip />
														{a.name}
														<button type="button" className="btn btn-link p-0 text-muted" onClick={() => removeAttachment(idx)}>
															<LuX />
														</button>
													</span>
												))}
											</div>
										) : null}
										{voiceNote ? (
											<div className="mb-2 rounded-3 border bg-light p-2 d-flex align-items-center justify-content-between small">
												<span className="d-inline-flex align-items-center gap-1">
													<LuPlay /> Voice note ({formatDuration(voiceNote.durationMs)})
												</span>
												<Button variant="link" className="p-0 text-decoration-none" onClick={() => setVoiceNote(null)}>
													Remove
												</Button>
											</div>
										) : null}
										<div className="d-flex gap-2">
											<Form.Control
												className="rounded-3"
												as="textarea"
												rows={2}
												value={chatText}
												onChange={(e) => setChatText(e.target.value)}
												placeholder="Message the store…"
												maxLength={4000}
											/>
											<Button
											type="button"
											variant="light"
											className="chat-action-btn border rounded-circle d-flex align-items-center justify-content-center text-white"
											style={{ background: "#6f4e37", width: 40, height: 40 }}
											onClick={() => fileInputRef.current?.click()}
											title="Attach files"
											>
											<LuPaperclip size={20} />
											</Button>

											<Button
											type="button"
											variant={recording ? 'danger' : 'light'}
											className="chat-action-btn rounded-circle border d-flex align-items-center justify-content-center text-white"
											style={{ background: "#6f4e37", width: 40, height: 40 }}
											onClick={() => void toggleVoiceRecording()}
											title={recording ? 'Stop recording' : 'Record voice'}
											>
											<LuMic size={24} />
											</Button>

											<Button
											type="submit"
											className="chat-action-btn rounded-circle d-flex align-items-center justify-content-center text-white"
											style={{ background: GOLD, border: 'none', width: 40, height: 40 }}
											disabled={sendingChat || (!chatText.trim() && attachments.length === 0 && !voiceNote)}
											>
											{sendingChat ? '…' : <LuSendHorizonal size={21} />}
											</Button>
										</div>
									</Form>
								</div>
							)}
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
							SKU & pricing
						</Card.Header>
						<Card.Body className="p-4">
							<div className="row g-3 mb-2">
									<div className="col-sm-6 col-md-5">
										<div
											className="rounded-4 overflow-hidden border bg-light d-flex align-items-center justify-content-center"
											style={{ width: '100%', maxWidth: 280, aspectRatio: '1', maxHeight: 280 }}
										>
											<img
												src={imageUrl(BASE_API, images[0])}
												alt=""
												className="p-2"
												style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
											/>
										</div>
									</div>
									{images.length > 1 ? (
										<div className="col-12 col-md-7 d-flex flex-wrap gap-2 align-content-start">
											{images.slice(1).map((src, i) => (
												<a
													key={`${src}-${i}`}
													href={imageUrl(BASE_API, src)}
													target="_blank"
													rel="noreferrer"
													className="rounded-3 overflow-hidden border d-block"
													style={{ width: 72, height: 72 }}
												>
													<img src={imageUrl(BASE_API, src)} alt="" className="w-100 h-100 object-fit-cover" />
												</a>
											))}
										</div>
									) : null}
								</div>
							<div className="row g-2">
								<div className="col-md-6">
									<DetailCell label="SKU" value={<span className="font-monospace">{sku?.sku || '—'}</span>} />
								</div>
								<div className="col-md-6">
									<DetailCell
										label="Unit price"
										value={
											sku?.price != null
												? `${sku.price} ${sku.currency || order.cartItemCurrency || 'USD'}`
												: '—'
										}
									/>
								</div>
								<div className="col-md-6">
									<DetailCell label="Metal" value={[sku?.metalType, sku?.metalColor].filter(Boolean).join(' · ') || '—'} />
								</div>
								<div className="col-md-6">
									<DetailCell label="Size" value={sku?.size || '—'} />
								</div>
								<div className="col-md-6">
									<DetailCell
										label="Cart line (snapshot)"
										value={
											order.cartItemPrice != null
												? `${order.cartItemPrice} ${order.cartItemCurrency || 'USD'}`
												: '—'
										}
									/>
								</div>
								<div className="col-md-6">
									<DetailCell
										label="Vendor stock (live)"
										value={
											inventoryQty !== null ? (
												<span className={inventoryQty < order.quantity ? 'text-danger fw-bold' : 'text-success'}>
													{inventoryQty}
												</span>
											) : (
												'—'
											)
										}
									/>
								</div>
							</div>

							{attrEntries.length > 0 ? (
								<>
									<hr className="my-4 opacity-25" />
									<h6 className="text-uppercase small fw-bold mb-3" style={{ color: GOLD }}>
										SKU attributes
									</h6>
									<div className="row g-2">
										{attrEntries.map(([key, val]) => (
											<div key={key} className="col-md-6">
												<DetailCell label={humanizeAttrKey(key)} value={String(val)} />
											</div>
										))}
									</div>
								</>
							) : null}
						</Card.Body>
					</Card>

					
				</div>

				<div className="col-lg-5">
					{order.status === 'APPROVED' ? (
						<Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '1rem' }}>
							<Card.Header
								className="border-0 py-3 text-white fw-semibold rounded-top"
								style={{
									background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
									borderBottom: `2px solid ${GOLD}`,
									borderRadius: '1rem 1rem 0 0',
								}}
							>
								Shipping / fulfillment
							</Card.Header>
							<Card.Body className="p-4">
								<Form.Label className="small text-muted text-uppercase fw-semibold">Status</Form.Label>
								<Form.Select
									className="rounded-3"
									value={effectiveFulfillment(order.fulfillmentStatus, order.status)}
									onChange={(e) => void patchFulfillment(e.target.value)}
									disabled={fulfillmentBusy}
								>
									{FULFILLMENT_STEPS.map((s) => (
										<option key={s} value={s}>
											{fulfillmentStepLabel(s)}
										</option>
									))}
								</Form.Select>
								<p className="small text-muted mt-3 mb-0">
									Submitted → In process → Shipped unlocks &quot;Mark received&quot; for the store. You may roll back
									including after completed if needed.
								</p>
							</Card.Body>
						</Card>
					) : null}
					
					<Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '1rem' }}>
						<Card.Header
							className="border-0 py-3 text-white fw-semibold rounded-top"
							style={{
								background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
								borderBottom: `2px solid ${GOLD}`,
								borderRadius: '1rem 1rem 0 0',
							}}
						>
							Warehouses & requester
						</Card.Header>
						<Card.Body className="p-4">
							<DetailCell label="Destination store" value={order.storeWarehouseId?.name || '—'} />
							<div className="mt-2">
								<DetailCell label="Vendor warehouse" value={order.vendorWarehouseId?.name || '—'} />
							</div>
							<hr className="opacity-25" />
							<div className="fw-semibold small text-muted text-uppercase mb-2">Requested by</div>
							<div className="small">
								<div className="fw-medium">{order.requestedByUser?.username || '—'}</div>
								<div className="text-muted">{order.requestedByUser?.email}</div>
								{order.requestedByUser?.phone_number && (
									<div className="text-muted">{order.requestedByUser.phone_number}</div>
								)}
							</div>
							{listApprovers('District manager', order.dmUserId)}
							{listApprovers('Corporate manager', order.cmUserId)}
						</Card.Body>
					</Card>

					<Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '1rem' }}>
						<Card.Header
							className="border-0 py-3 text-white fw-semibold rounded-top"
							style={{
								background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
								borderBottom: `2px solid ${GOLD}`,
								borderRadius: '1rem 1rem 0 0',
							}}
						>
							Timeline & approvals
						</Card.Header>
						<Card.Body className="p-4 small">
							<div className="mb-2">
								<span className="text-muted">Created: </span>
								{new Date(order.createdAt).toLocaleString()}
							</div>
							<div className="mb-3">
								<span className="text-muted">Updated: </span>
								{new Date(order.updatedAt).toLocaleString()}
							</div>
							{order.approvals?.dm?.approvedAt && (
								<div className="mb-1">
									<Badge bg="info" className="me-2">
										DM
									</Badge>
									{new Date(order.approvals.dm.approvedAt).toLocaleString()}
								</div>
							)}
							{order.approvals?.cm?.approvedAt && (
								<div className="mb-1">
									<Badge bg="info" className="me-2">
										CM
									</Badge>
									{new Date(order.approvals.cm.approvedAt).toLocaleString()}
								</div>
							)}
							{order.approvals?.admin?.approvedAt && (
								<div className="mb-1">
									<Badge bg="success" className="me-2">
										Admin
									</Badge>
									{new Date(order.approvals.admin.approvedAt).toLocaleString()}
								</div>
							)}
							{order.rejection?.reason ? (
								<div className="mt-3 p-3 rounded-3 border border-danger-subtle bg-danger-subtle small">
									<div className="fw-bold text-danger mb-1">Rejection</div>
									{order.rejection.reason}
									{order.rejection.rejectedAt && (
										<div className="text-muted mt-1">{new Date(order.rejection.rejectedAt).toLocaleString()}</div>
									)}
								</div>
							) : null}
						</Card.Body>
					</Card>
				</div>
			</div>
		<style>
	{`
		.message-bubble .message-reply-btn {
			opacity: 0;
			pointer-events: none;
			transform: translateY(2px);
			transition: opacity 0.15s ease, transform 0.15s ease;
			z-index: 5;

		}

		.message-bubble:hover .message-reply-btn {
			opacity: 1;
			pointer-events: auto;
			transform: translateY(0);
		}
			.chat-action-btn {
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }

    .chat-action-btn:hover {
      transform: translateY(-2px) scale(1.08);
      box-shadow: 0 8px 18px rgba(111, 78, 55, 0.35);
    }

    .chat-action-btn:hover svg {
      transform: scale(1.18);
    }

    .chat-action-btn svg {
      transition: transform 0.18s ease;
    }

    .chat-action-btn:active {
      transform: scale(0.94);
    }
	`}
</style>
		</>

	)
}

export default B2BPurchaseRequestView 