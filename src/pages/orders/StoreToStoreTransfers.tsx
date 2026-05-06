import { PageBreadcrumb } from '@/components'
import { Button, Card, Dropdown, Form, Spinner, Table } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
	attributesSummary,
	statusBadgeEl,
	type StoreTransferRow,
} from './storeTransferUtils'

const GOLD = '#C6A87D'

const TABLE_BODY_SCROLL_STYLE = {
	maxHeight: 'calc(100vh - 268px)',
	overflowY: 'auto' as const,
	WebkitOverflowScrolling: 'touch' as const,
}

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n).trim()}…`)

const StoreToStoreTransfers = () => {
	const BASE_API = import.meta.env.VITE_BASE_API
	const { user } = useAuthContext()
	const token = user?.token
	const navigate = useNavigate()

	const [rows, setRows] = useState<StoreTransferRow[]>([])
	const [loading, setLoading] = useState(false)
	const [statusFilter, setStatusFilter] = useState('')
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

	const descriptionLine = (r: StoreTransferRow) => {
		const d = r.skuId?.attributes?.descriptionname
		if (d != null && String(d).trim()) return String(d).trim()
		return r.vendorProductId?.title || r.vendorProductId?.vendorModel || '—'
	}

	return (
		<>
			<PageBreadcrumb title="Store to store transfers" subName="Orders" />

			<Card
				className="border-0 shadow"
				style={{
					borderRadius: '1rem',
					borderBottom: `3px solid ${GOLD}`,
					overflow: 'hidden',
				}}
			>
				<div
					className="px-4 py-3 text-white"
					style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}
				>
					<div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
						<div>
							<div className="text-white-50 small text-uppercase mb-0" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
								B2B logistics
							</div>
							<h5 className="mb-0 fw-semibold">Transfer requests</h5>
						</div>
						<div className="d-flex flex-wrap align-items-center gap-2">
							<Form.Select
								style={{ maxWidth: 220, borderRadius: '0.5rem' }}
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
							<Button
								variant="light"
								size="sm"
								className="rounded-pill px-3"
								onClick={() => void load()}
								disabled={loading}
							>
								Refresh
							</Button>
						</div>
					</div>
				</div>

				<Card.Body className="p-0">
					{loading ? (
						<div className="text-center py-5">
							<Spinner animation="border" />
						</div>
					) : (
						<div className="table-responsive" style={TABLE_BODY_SCROLL_STYLE}>
							<Table hover className="align-middle mb-0">
								<thead className="table-light sticky-top border-bottom" style={{ zIndex: 5 }}>
									<tr className="small text-uppercase text-muted" style={{ fontSize: 11, letterSpacing: '0.05em' }}>
										<th className="ps-4 bg-light">Ticket</th>
										<th className="bg-light">Product / SKU</th>
										<th className="bg-light" style={{ minWidth: 160 }}>
											Description
										</th>
										<th className="bg-light" style={{ minWidth: 220 }}>
											Attributes
										</th>
										<th className="bg-light">Qty</th>
										<th className="bg-light">From → To</th>
										<th className="bg-light">Requester</th>
										<th className="bg-light">Status</th>
										<th className="pe-4 text-end bg-light" style={{ minWidth: 140 }}>
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((r) => {
										const attr = r.skuId?.attributes
										const sum = attributesSummary(attr, 6)
										const early = ['SUBMITTED', 'WIP', 'TRANSFER'].includes(r.status)
										return (
											<tr key={r._id}>
												<td className="ps-4 text-nowrap small font-monospace fw-semibold">
													{r.ticketNumber || r._id}
												</td>
												<td>
													<div className="fw-semibold small">{r.vendorProductId?.title || r.vendorProductId?.vendorModel}</div>
													<div className="text-muted small font-monospace">{r.skuId?.sku}</div>
												</td>
												<td className="small text-secondary" style={{ maxWidth: 200 }}>
													<span title={descriptionLine(r)}>{clip(descriptionLine(r), 72)}</span>
												</td>
												<td className="small text-muted" style={{ maxWidth: 280 }}>
													<span title={sum || undefined} className="d-inline-block" style={{ lineHeight: 1.35 }}>
														{sum ? clip(sum, 140) : '—'}
													</span>
												</td>
												<td>{r.quantity}</td>
												<td className="small">
													{r.sourceWarehouseId?.name || '—'} <span className="text-muted">→</span>{' '}
													{r.destWarehouseId?.name || '—'}
												</td>
												<td className="small">{r.requestedBy?.username || r.requestedBy?.email || '—'}</td>
												<td>{statusBadgeEl(r.status)}</td>
												<td className="pe-4 text-end">
													<Dropdown align="end">
														<Dropdown.Toggle
															variant="outline-dark"
															size="sm"
															className="rounded-pill px-3"
															id={`actions-${r._id}`}
															style={{ borderColor: '#dee2e6' }}
														>
															Actions
														</Dropdown.Toggle>
														<Dropdown.Menu className="shadow border-0 rounded-3 py-2">
															<Dropdown.Item onClick={() => navigate(`/orders/store-to-store-transfers/${r._id}`)}>
																View details
															</Dropdown.Item>
															<Dropdown.Divider />
															{early ? (
																<>
																	<Dropdown.Item
																		onClick={() => void approve(r._id)}
																		disabled={actionId === r._id}
																	>
																		Approve
																	</Dropdown.Item>
																	<Dropdown.Item
																		onClick={() => void patchStatus(r._id, 'WIP')}
																		disabled={actionId === r._id}
																	>
																		Set WIP
																	</Dropdown.Item>
																	<Dropdown.Item
																		onClick={() => void patchStatus(r._id, 'TRANSFER')}
																		disabled={actionId === r._id}
																	>
																		Set Transfer
																	</Dropdown.Item>
																	<Dropdown.Item
																		className="text-danger"
																		onClick={() => void patchStatus(r._id, 'REJECTED', 'Rejected by admin')}
																		disabled={actionId === r._id}
																	>
																		Reject
																	</Dropdown.Item>
																</>
															) : null}
															{r.status === 'APPROVED' ? (
																<Dropdown.Item
																	onClick={() => void patchStatus(r._id, 'DELIVERED')}
																	disabled={actionId === r._id}
																>
																	Mark delivered
																</Dropdown.Item>
															) : null}
														</Dropdown.Menu>
													</Dropdown>
												</td>
											</tr>
										)
									})}
								</tbody>
							</Table>
						</div>
					)}
					{!loading && rows.length === 0 ? (
						<p className="text-muted mb-0 px-4 py-4">No transfer requests.</p>
					) : null}
				</Card.Body>
			</Card>
		</>
	)
}

export default StoreToStoreTransfers
