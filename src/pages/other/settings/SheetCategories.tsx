import { PageBreadcrumb } from '@/components'
import { useAuthContext } from '@/common'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import Swal from 'sweetalert2'
import Select, { type MultiValue, type StylesConfig } from 'react-select'

type UserOption = {
	_id: string
	username?: string
	email?: string
}

type SheetCategoryRow = {
	_id: string
	title: string
	googleSheetUrl: string
	allowedUsers: UserOption[]
	createdBy?: { username?: string; email?: string }
	createdAt: string
}

type UserSelectOption = { value: string; label: string }

const selectStyles = {
	control: (base: Record<string, unknown>) => ({
		...base,
		minHeight: 44,
		borderRadius: 8,
		borderColor: '#dee2e6',
		boxShadow: 'none',
		'&:hover': { borderColor: '#adb5bd' },
	}),
	menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 9999 }),
	multiValue: (base: Record<string, unknown>) => ({
		...base,
		backgroundColor: '#e9ecef',
		borderRadius: 6,
	}),
	multiValueLabel: (base: Record<string, unknown>) => ({ ...base, color: '#212529', fontWeight: 500 }),
	multiValueRemove: (base: Record<string, unknown>) => ({
		...base,
		':hover': { backgroundColor: '#dee2e6', color: '#212529' },
	}),
	placeholder: (base: Record<string, unknown>) => ({ ...base, color: '#6c757d' }),
} as StylesConfig<UserSelectOption, true>

const SheetCategories = () => {
	const BASE_API = import.meta.env.VITE_BASE_API
	const { user } = useAuthContext()
	const token = user?.token

	const [rows, setRows] = useState<SheetCategoryRow[]>([])
	const [users, setUsers] = useState<UserOption[]>([])
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [open, setOpen] = useState(false)
	const [editing, setEditing] = useState<SheetCategoryRow | null>(null)
	const [form, setForm] = useState({
		title: '',
		googleSheetUrl: '',
		allowedUsers: [] as string[],
	})

	const userSelectOptions: UserSelectOption[] = useMemo(
		() =>
			users.map((u) => ({
				value: u._id,
				label: [u?.username || '—', u?.email ? `(${u?.email})` : ''].filter(Boolean).join(' '),
			})),
		[users]
	)

	const selectedUserOptions = useMemo(
		() => userSelectOptions.filter((o) => form.allowedUsers.includes(o.value)),
		[userSelectOptions, form?.allowedUsers]
	)

	const loadData = async () => {
		if (!token) return
		setLoading(true)
		try {
			const [sheetRes, usersRes] = await Promise.all([
				fetch(`${BASE_API}/api/sheets/admin`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				fetch(`${BASE_API}/api/customers`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
			])
			const sheetJson = await sheetRes.json()
			const userJson = await usersRes.json()
			if (!sheetRes.ok) throw new Error(sheetJson?.message || 'Failed to load sheets')
			if (!usersRes.ok) throw new Error(userJson?.message || 'Failed to load users')

			setRows(Array.isArray(sheetJson?.data) ? sheetJson.data : [])
			const rawUsers = Array.isArray(userJson) ? userJson : userJson?.data ?? []
			setUsers(
				rawUsers.map((u: { _id?: string; username?: string; email?: string }) => ({
					_id: String(u._id || ''),
					username: u.username,
					email: u.email,
				})).filter((u: UserOption) => u._id)
			)
		} catch (e: any) {
			Swal.fire('Error', e?.message || 'Failed to load', 'error')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void loadData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token])

	const openCreate = () => {
		setEditing(null)
		setForm({ title: '', googleSheetUrl: '', allowedUsers: [] })
		setOpen(true)
	}

	const openEdit = (row: SheetCategoryRow) => {
		setEditing(row)
		setForm({
			title: row.title || '',
			googleSheetUrl: row.googleSheetUrl || '',
			allowedUsers: (row.allowedUsers || []).map((u) => String(u._id)),
		})
		setOpen(true)
	}

	const saveSheet = async () => {
		if (!token) return
		const title = form.title.trim()
		const googleSheetUrl = form.googleSheetUrl.trim()
		if (!title || !googleSheetUrl) {
			Swal.fire('Validation', 'Title and Google Sheet URL are required.', 'warning')
			return
		}

		setSaving(true)
		try {
			const url = editing
				? `${BASE_API}/api/sheets/${editing._id}`
				: `${BASE_API}/api/sheets`
			const res = await fetch(url, {
				method: editing ? 'PATCH' : 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					title,
					googleSheetUrl,
					allowedUsers: form.allowedUsers,
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json?.message || 'Save failed')
			Swal.fire('Saved', 'Sheet category saved successfully.', 'success')
			setOpen(false)
			void loadData()
		} catch (e: any) {
			Swal.fire('Error', e?.message || 'Save failed', 'error')
		} finally {
			setSaving(false)
		}
	}

	const deleteSheet = async (row: SheetCategoryRow) => {
		if (!token) return
		const ok = await Swal.fire({
			title: 'Delete sheet category?',
			text: `This will remove "${row.title}".`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Delete',
		})
		if (!ok.isConfirmed) return
		try {
			const res = await fetch(`${BASE_API}/api/sheets/${row._id}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json?.message || 'Delete failed')
			Swal.fire('Deleted', 'Sheet category removed.', 'success')
			void loadData()
		} catch (e: any) {
			Swal.fire('Error', e?.message || 'Delete failed', 'error')
		}
	}

	return (
		<>
			<PageBreadcrumb title="Sheets Categories" subName="Settings" allowNavigateBack />
			<Card>
				<Card.Header className="d-flex justify-content-between align-items-center">
					<div>
						<h4 className="mb-1">Google Sheets Access Control</h4>
						<div className="text-muted small">Create categories and assign users.</div>
					</div>
					<Button onClick={openCreate}>Add Sheet Category</Button>
				</Card.Header>
				<Card.Body>
					{loading ? (
						<div className="py-4 text-center">
							<Spinner animation="border" />
						</div>
					) : (
						<Table responsive hover>
							<thead>
								<tr>
									<th>Title</th>
									<th>Google Sheet</th>
									<th>Users</th>
									<th>Created</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{rows.length === 0 ? (
									<tr>
										<td colSpan={5} className="text-center text-muted">No sheet categories found.</td>
									</tr>
								) : (
									rows.map((r) => (
										<tr key={r._id}>
											<td className="fw-semibold">{r.title}</td>
											<td className="text-break">
												<a href={r.googleSheetUrl} target="_blank" rel="noreferrer">
													Open URL
												</a>
											</td>
											<td>
												<div className="d-flex flex-wrap gap-1">
													{(r?.allowedUsers || []).length ? (
														r.allowedUsers.map((u) => (
															<Badge key={u._id} bg="light" text="dark">
																{u?.username || u?.email || u?._id}
															</Badge>
														))
													) : (
														<span className="text-muted">No users</span>
													)}
												</div>
											</td>
											<td>{r?.createdAt ? new Date(r?.createdAt).toLocaleDateString() : '—'}</td>
											<td>
												<div className="d-flex gap-2">
													<Button size="sm" variant="outline-primary" onClick={() => openEdit(r)}>Edit</Button>
													<Button size="sm" variant="outline-danger" onClick={() => void deleteSheet(r)}>Delete</Button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</Table>
					)}
				</Card.Body>
			</Card>

			<Modal show={open} onHide={() => setOpen(false)} size="lg">
				<Modal.Header closeButton>
					<Modal.Title>{editing ? 'Edit Sheet Category' : 'Add Sheet Category'}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Row className="g-3">
						<Col md={12}>
							<Form.Label>Title</Form.Label>
							<Form.Control
								value={form.title}
								onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
								placeholder="Rolex"
							/>
						</Col>
						<Col md={12}>
							<Form.Label>Google Sheet URL</Form.Label>
							<Form.Control
								value={form.googleSheetUrl}
								onChange={(e) => setForm((p) => ({ ...p, googleSheetUrl: e.target.value }))}
								placeholder="https://docs.google.com/spreadsheets/..."
							/>
						</Col>
						<Col md={12}>
							<div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
								<Form.Label className="mb-0">Allowed users</Form.Label>
								<div className="d-flex flex-wrap gap-2">
									<Button
										type="button"
										variant="outline-secondary"
										size="sm"
										disabled={userSelectOptions.length === 0}
										onClick={() =>
											setForm((p) => ({
												...p,
												allowedUsers: userSelectOptions.map((o) => o.value),
											}))
										}
									>
										Select all users
									</Button>
									<Button
										type="button"
										variant="outline-secondary"
										size="sm"
										disabled={form.allowedUsers.length === 0}
										onClick={() => setForm((p) => ({ ...p, allowedUsers: [] }))}
									>
										Clear all
									</Button>
								</div>
							</div>
							<Select<UserSelectOption, true>
								isMulti
								isSearchable
								closeMenuOnSelect={false}
								hideSelectedOptions={false}
								blurInputOnSelect={false}
								options={userSelectOptions}
								value={selectedUserOptions}
								onChange={(next: MultiValue<UserSelectOption>) => {
									setForm((p) => ({
										...p,
										allowedUsers: next.map((o) => o.value),
									}))
								}}
								placeholder="Search by name or email, then select…"
								noOptionsMessage={() => 'No users match your search'}
								styles={selectStyles}
								menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
								menuPosition="fixed"
								classNamePrefix="sheet-users-select"
							/>
							<Form.Text className="text-muted">
								Type to filter the list. Selected users can open this sheet in the storefront.
							</Form.Text>
						</Col>
					</Row>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
					<Button onClick={() => void saveSheet()} disabled={saving}>
						{saving ? 'Saving...' : 'Save'}
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default SheetCategories
