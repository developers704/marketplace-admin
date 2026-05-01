import { PageBreadcrumb } from '@/components'
import { Badge, Button, Card, Form, Modal, Spinner, Table } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

type Row = {
	_id: string
	ticketNumber?: string
	status: string
	quantity: number
	unitPrice?: number
	vendorProductId?: { vendorModel?: string; title?: string }
	skuId?: { sku?: string }
	sourceWarehouseId?: { name?: string }
	destWarehouseId?: { name?: string }
	requestedBy?: { username?: string; email?: string }
}

type ChatMsg = {
	_id: string
	text: string
	role: string
	senderName?: string
	createdAt?: string
}

const statusBadge = (s: string) => {
	const u = String(s || '').toUpperCase()
	const map: Record<string, string> = {
		SUBMITTED: 'secondary',
		WIP: 'info',
		TRANSFER: 'primary',
		APPROVED: 'success',
		REJECTED: 'danger',
		DELIVERED: 'warning',
		RECEIVED: 'dark',
	}
	return <Badge bg={map[u] || 'secondary'}>{u}</Badge>
}

const StoreToStoreTransfers = () => {
	const BASE_API = import.meta.env.VITE_BASE_API
	const { user } = useAuthContext()
	const token = user?.token

	const [rows, setRows] = useState<Row[]>([])
	const [loading, setLoading] = useState(false)
	const [statusFilter, setStatusFilter] = useState('')
	const [chatOrder, setChatOrder] = useState<Row | null>(null)
	const [messages, setMessages] = useState<ChatMsg[]>([])
	const [chatLoading, setChatLoading] = useState(false)
	const [chatText, setChatText] = useState('')
	const [actionId, setActionId] = useState<string | null>(null)

	const headers = useMemo(
		() => ({
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		}),
		[token],
	)

	const load = useCallback(async () => {
		if (!token) return
		setLoading(true)
		try {
			const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''
			const res = await fetch(`${BASE_API}/api/v2/b2b/store-transfers/admin${q}`, { headers })
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message || 'Failed to load')
			setRows(json.data || [])
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : 'Load failed')
		} finally {
			setLoading(false)
		}
	}, [BASE_API, headers, token, statusFilter])

	useEffect(() => {
		void load()
	}, [load])

	const openChat = async (r: Row) => {
		setChatOrder(r)
		setChatLoading(true)
		try {
			const res = await fetch(`${BASE_API}/api/v2/b2b/store-transfers/${r._id}/chat-messages`, { headers })
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message || 'Chat load failed')
			setMessages(json.data || [])
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : 'Chat failed')
			setMessages([])
		} finally {
			setChatLoading(false)
		}
	}

	const sendChat = async () => {
		if (!chatOrder || !chatText.trim()) return
		try {
			const res = await fetch(`${BASE_API}/api/v2/b2b/store-transfers/${chatOrder._id}/chat-messages`, {
				method: 'POST',
				headers,
				body: JSON.stringify({ text: chatText.trim() }),
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message || 'Send failed')
			setChatText('')
			setMessages((m) => [...m, json.data])
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : 'Send failed')
		}
	}

	const patchStatus = async (id: string, status: string, reason?: string) => {
		setActionId(id)
		try {
			const res = await fetch(`${BASE_API}/api/v2/b2b/store-transfers/${id}/status`, {
				method: 'PATCH',
				headers,
				body: JSON.stringify({ status, reason }),
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message || 'Update failed')
			toast.success('Updated')
			await load()
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : 'Update failed')
		} finally {
			setActionId(null)
		}
	}

	const approve = async (id: string) => {
		setActionId(id)
		try {
			const res = await fetch(`${BASE_API}/api/v2/b2b/store-transfers/${id}/approve`, {
				method: 'POST',
				headers,
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json.message || 'Approve failed')
			toast.success(json.message || 'Approved')
			await load()
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : 'Approve failed')
		} finally {
			setActionId(null)
		}
	}

	return (
		<>
			<PageBreadcrumb title="Store to store transfers" subName="Orders" />
			<Card>
				<Card.Body>
					<div className="d-flex flex-wrap align-items-center gap-2 mb-3">
						<Form.Select
							style={{ maxWidth: 220 }}
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
						>
							<option value="">All statuses</option>
							<option value="SUBMITTED">Submitted</option>
							<option value="WIP">WIP</option>
							<option value="TRANSFER">Transfer</option>
							<option value="APPROVED">Approved</option>
							<option value="DELIVERED">Delivered</option>
							<option value="RECEIVED">Received</option>
							<option value="REJECTED">Rejected</option>
						</Form.Select>
						<Button variant="outline-secondary" size="sm" onClick={() => void load()} disabled={loading}>
							Refresh
						</Button>
					</div>

					{loading ? (
						<div className="text-center py-5">
							<Spinner animation="border" />
						</div>
					) : (
						<Table responsive hover className="align-middle">
							<thead className="table-light">
								<tr>
									<th>Ticket</th>
									<th>Product / SKU</th>
									<th>Qty</th>
									<th>From → To</th>
									<th>Requester</th>
									<th>Status</th>
									<th style={{ minWidth: 280 }}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((r) => (
									<tr key={r._id}>
										<td className="text-nowrap small">{r.ticketNumber || r._id}</td>
										<td>
											<div className="fw-semibold small">{r.vendorProductId?.title || r.vendorProductId?.vendorModel}</div>
											<div className="text-muted small font-monospace">{r.skuId?.sku}</div>
										</td>
										<td>{r.quantity}</td>
										<td className="small">
											{r.sourceWarehouseId?.name || '—'} → {r.destWarehouseId?.name || '—'}
										</td>
										<td className="small">{r.requestedBy?.username || r.requestedBy?.email || '—'}</td>
										<td>{statusBadge(r.status)}</td>
										<td>
											<div className="d-flex flex-wrap gap-1">
												<Button size="sm" variant="outline-primary" onClick={() => void openChat(r)}>
													Chat
												</Button>
												{['SUBMITTED', 'WIP', 'TRANSFER'].includes(r.status) ? (
													<Button
														size="sm"
														variant="success"
														disabled={actionId === r._id}
														onClick={() => void approve(r._id)}
													>
														Approve
													</Button>
												) : null}
												{['SUBMITTED', 'WIP', 'TRANSFER'].includes(r.status) ? (
													<>
														<Button size="sm" variant="outline-info" disabled={actionId === r._id} onClick={() => void patchStatus(r._id, 'WIP')}>
															WIP
														</Button>
														<Button
															size="sm"
															variant="outline-info"
															disabled={actionId === r._id}
															onClick={() => void patchStatus(r._id, 'TRANSFER')}
														>
															Transfer
														</Button>
													</>
												) : null}
												{r.status === 'APPROVED' ? (
													<Button
														size="sm"
														variant="outline-warning"
														disabled={actionId === r._id}
														onClick={() => void patchStatus(r._id, 'DELIVERED')}
													>
														Delivered
													</Button>
												) : null}
												{['SUBMITTED', 'WIP', 'TRANSFER'].includes(r.status) ? (
													<Button
														size="sm"
														variant="outline-danger"
														disabled={actionId === r._id}
														onClick={() => void patchStatus(r._id, 'REJECTED', 'Rejected by admin')}
													>
														Reject
													</Button>
												) : null}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</Table>
					)}
					{!loading && rows.length === 0 ? <p className="text-muted mb-0">No transfer requests.</p> : null}
				</Card.Body>
			</Card>

			<Modal show={!!chatOrder} onHide={() => setChatOrder(null)} size="lg" centered>
				<Modal.Header closeButton>
					<Modal.Title>Transfer chat · {chatOrder?.ticketNumber || chatOrder?._id}</Modal.Title>
				</Modal.Header>
				<Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
					{chatLoading ? (
						<div className="text-center py-4">
							<Spinner animation="border" size="sm" />
						</div>
					) : (
						<div className="d-flex flex-column gap-2">
							{messages.map((m) => (
								<div
									key={m._id}
									className={`p-2 rounded border small ${m.role === 'admin' ? 'bg-light' : 'bg-primary text-white ms-auto'}`}
									style={{ maxWidth: '85%' }}
								>
									<div className="opacity-75" style={{ fontSize: 11 }}>
										{m.senderName || m.role}
									</div>
									<div>{m.text}</div>
								</div>
							))}
						</div>
					)}
					<div className="d-flex gap-2 mt-3">
						<Form.Control
							placeholder="Message to store…"
							value={chatText}
							onChange={(e) => setChatText(e.target.value)}
						/>
						<Button onClick={() => void sendChat()} disabled={!chatText.trim()}>
							Send
						</Button>
					</div>
				</Modal.Body>
			</Modal>
		</>
	)
}

export default StoreToStoreTransfers
