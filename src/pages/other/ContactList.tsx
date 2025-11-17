import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageBreadcrumb } from '@/components'
import {
	Card,
	Col,
	Row,
	Button,
	Form,
	Table,
	Pagination as BootstrapPagination,
} from 'react-bootstrap'
import { MdEdit, MdDelete } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { TableRowSkeleton } from './SimpleLoader'

interface UserRecord {
	id_ui: number
	id: string
	name: string
	email: string
	role: string
	phone: string
	warehouse: any
	department: string
	wallet: any
}

const ContactList = () => {
	const { user, permissions, isSuperUser } = useAuthContext()
	const canUpdate = isSuperUser || permissions.Users?.Update
	const canDelete = isSuperUser || permissions.Users?.Delete
	const canCreate = isSuperUser || permissions.Users?.Create

	// States for table functionality
	const [selectedRows, setSelectedRows] = useState<string[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(15)
	const [showDeleteButton, setShowDeleteButton] = useState(false)
	const [selectAll, setSelectAll] = useState(false)
	const [loading, setLoading] = useState(false)
	const [userData, setUserData] = useState<UserRecord[]>([])
	// const [apiLoading, setApiLoading] = useState(false)

	const BASE_API = import.meta.env.VITE_BASE_API

	// Effect hooks
	useEffect(() => {
		setCurrentPage(1)
		setShowDeleteButton(selectedRows.length > 0)
	}, [itemsPerPage, selectedRows])

	useEffect(() => {
		fetchUserData()
	}, [])

	// Fetch user data
	const fetchUserData = async () => {
		try {
			setLoading(true)
			const response = await fetch(`${BASE_API}/api/users`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${user.token}`,
				},
			})

			if (!response.ok) {
				throw new Error('Failed to fetch user data')
			}

			const fetchedData = await response.json()
			const mappedData = fetchedData.map((item: any, index: number) => ({
				id_ui: index + 1,
				id: item._id,
				name: item.username || 'No Name',
				email: item.email || 'No Email',
				role: item.role ? item.role.role_name : 'No Role',
				phone: item.phone_number || 'No Phone Number',
				warehouse: item?.warehouse?.map((w:any) => w.name).join(", ")|| "N/A",
				department: item?.department?.name || "N/A",
			}))			

			setUserData(mappedData)
		} catch (error: any) {
			console.error('Error fetching user data:', error)
			Swal.fire('Error!', 'Failed to fetch user data.', 'error')
		} finally {
			setLoading(false)
		}
	}

	// Table functionality
	const filteredRecords = userData
		?.filter((record) =>
			Object.values(record).some((value) =>
				value.toString().toLowerCase().includes(searchTerm.toLowerCase())
			)
		)
		

	const totalPages = Math.ceil(filteredRecords?.length / itemsPerPage)
	const paginatedRecords = filteredRecords?.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)

	// Event handlers
	const handlePageChange = (page: number) => setCurrentPage(page)

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectAll(event.target.checked)
		setSelectedRows(
			event.target.checked ? paginatedRecords.map((record) => record.id) : []
		)
	}

	const handleSelectRow = (id: string) => {
		setSelectedRows((prev) => {
			const newSelection = prev.includes(id)
				? prev.filter((rowId) => rowId !== id)
				: [...prev, id]
			setSelectAll(newSelection.length === paginatedRecords.length)
			return newSelection
		})
	}


	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
		setCurrentPage(1)
	}

	// Delete functionality
	const handleDeleteUser = async (userId: string) => {
		try {
			const response = await fetch(`${BASE_API}/api/users/${userId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${user.token}`,
				},
			})

			if (!response.ok) {
				throw new Error('Failed to delete user')
			}

			await fetchUserData()
			setSelectedRows([])
			Swal.fire({
				title: 'Deleted!',
				text: 'User deleted successfully.',
				icon: 'success',
				timer: 1500,
				confirmButtonColor: "#9c5100",
			})
		} catch (error: any) {
			Swal.fire('Error!', 'User deletion failed.', 'error')
		}
	}

	const handleMultipeDeleteUser = async () => {
		try {
			// setApiLoading(true)
			const response = await fetch(`${BASE_API}/api/users/bulk-delete`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${user.token}`,
				},
				body: JSON.stringify({ ids: selectedRows }),
			})
			const data = await response.json()
			if (data) {
				setSelectedRows([])
				Swal.fire({
					title: 'Deleted!',
					text: 'Users deleted successfully.',
					icon: 'success',
					timer: 1500,
					confirmButtonColor: "#9c5100",
				})
				fetchUserData()
			}
			if (!response.ok) {
				throw new Error('Failed to delete user')
			}
		} catch (error: any) {
			Swal.fire('Error!', 'User deletion failed.', 'error')
		} finally {
			// setApiLoading(false)
		}
	}

	const handleDeleteSelected = () => {
		Swal.fire({
			title: 'Are you sure?',
			text: `All the ${selectedRows.length} selected users will be deleted!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: "#9c5100",
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete them!',
		}).then((result) => {
			if (result.isConfirmed) {
				handleMultipeDeleteUser()
			}
		})
	}

	const handleDeleteConfirmation = (userId: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'This user will be deleted!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: "#9c5100",
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!',
		}).then((result) => {
			if (result.isConfirmed) {
				handleDeleteUser(userId)
			}
		})
	}

	const storeHeaders: any[] = [
		{ width: '20px', type: 'checkbox' },
		{ width: '100px', type: 'text' },
		{ width: '100px', type: 'text' },
		{ width: '80px', type: 'number' },
		{ width: '80px', type: 'number' },
		{ width: '80px', type: 'number' },
		{ width: '80px', type: 'number' },
		{ width: '80px', type: 'number' },
		{ width: '100px', type: 'actions' }
	]
	return (
		<>
			<PageBreadcrumb title="Employee List" subName="User" />
			<Row>
				<Col>
					<Card>
						<Card.Header>
							<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
								<div>
									<h4 className="header-title">User List</h4>
									<p className="text-muted mb-0">
										A list of all registered users.
									</p>
								</div>
								<div className="mt-3 mt-lg-0">
									{showDeleteButton && (
										<Button
											variant="danger"
											className="me-2"
											onClick={handleDeleteSelected}>
											Delete Selected
										</Button>
									)}
									<Button
										disabled={!canCreate}
										style={{ border: 'none' }}
										variant="success">
										<Link
											to="/user/user-create"
											className="text-white text-decoration-none">
											<i className="bi bi-plus"></i> Add New User
										</Link>
									</Button>
								</div>
							</div>
							<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
								<div className="app-search d-none d-lg-block">
									<form>
										<div
											className="input-group"
											style={{
												backgroundColor: 'rgba(255, 255, 255, 0.8)',
												borderRadius: '10px',
												border: '1px solid rgba(0, 0, 0, 0.1)',
											}}>
											<input
												type="search"
												className="form-control"
												placeholder="Search User here..."
												value={searchTerm}
												onChange={handleSearch}
												style={{
													backgroundColor: 'transparent',
													border: 'none',
													paddingLeft: '10px',
													color: '#333',
												}}
											/>
											<span
												className="ri-search-line search-icon text-muted"
												style={{ marginRight: '10px', color: '#666' }}
											/>
										</div>
									</form>
								</div>
								<Form.Select
									value={itemsPerPage}
									style={{ zIndex: 1 }}
									onChange={(e) => setItemsPerPage(Number(e.target.value))}
									className="w-auto mt-3 mt-lg-0">
									<option value={15}>15 items</option>
									<option value={30}>30 items</option>
									<option value={40}>40 items</option>
								</Form.Select>
							</div>
						</Card.Header>
						<Card.Body>
							<div className="table-responsive">
								<Table className="table-striped table-centered mb-0">
									<thead>
										<tr>
											<th>
												<input
													type="checkbox"
													onChange={handleSelectAll}
													checked={selectAll}
												/>
											</th>
											{['S No', 'Name', 'Email', 'Role', "Store", "Department", 'Phone Number', 'Action'].map(
												(header) => (
													<th key={header}>
														<span>
															{header}{' '}
														</span>
													</th>
												)
											)}
										</tr>
									</thead>
									<tbody>
										{loading ? (
											<TableRowSkeleton headers={storeHeaders} rowCount={3} />
										) :

											paginatedRecords?.length > 0 ? (
												paginatedRecords?.map((record, idx) => (
													<tr key={record.id}>
														<td>
															<input
																type="checkbox"
																checked={selectedRows.includes(record.id)}
																onChange={() => handleSelectRow(record.id)}
															/>
														</td>
														<td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
														<td>{record.name}</td>
														<td>{record.email}</td>
														<td>{record.role}</td>
														<td>{record?.warehouse}</td>
														<td>{record?.department}</td>
														<td>{record.phone}</td>
														<td>
															<div className="d-flex">
																	<Link to={`/user/update/${record.id}`}>
																<Button variant="secondary" disabled={!canUpdate}>
																		<MdEdit />
																</Button>
																	</Link>
																<Button
																	variant="danger"
																	className="ms-2"
																	onClick={() =>
																		handleDeleteConfirmation(record.id)
																	}
																	disabled={!canDelete}>
																	<MdDelete />
																</Button>
															</div>
														</td>
													</tr>
												))
											) : (
												<tr>
													<td colSpan={7} className="text-center">
														No users found
													</td>
												</tr>
											)}
									</tbody>
								</Table>
								<nav className="d-flex justify-content-end mt-3">
									<BootstrapPagination className="pagination-rounded mb-0">
										<BootstrapPagination.Prev
											onClick={() =>
												currentPage > 1 && handlePageChange(currentPage - 1)
											}
										/>
										{Array.from({ length: totalPages }, (_, index) => (
											<BootstrapPagination.Item
												key={index + 1}
												active={index + 1 === currentPage}
												onClick={() => handlePageChange(index + 1)}>
												{index + 1}
											</BootstrapPagination.Item>
										))}
										<BootstrapPagination.Next
											onClick={() =>
												currentPage < totalPages &&
												handlePageChange(currentPage + 1)
											}
										/>
									</BootstrapPagination>
								</nav>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</>
	)
}

export default ContactList
