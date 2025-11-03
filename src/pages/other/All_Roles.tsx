import { useAuthContext } from '@/common'
import { PageBreadcrumb } from '@/components'
import {
	Button,
	Card,
	Table,
	Pagination as BootstrapPagination,
} from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { MdDelete, MdEdit } from 'react-icons/md'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import { TableRowSkeleton } from './SimpleLoader'

interface RoleRecord {
	_id: string
	role_name: string
	id_ui: number
}

const All_Roles = () => {
	const { user, permissions, isSuperUser } = useAuthContext()
	const canUpdate = isSuperUser || permissions.Users?.Update
	const canDelete = isSuperUser || permissions.Users?.Delete
	const canCreate = isSuperUser || permissions.Users?.Create

	// States
	const [selectedRows, setSelectedRows] = useState<string[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(15)
	const [showDeleteButton, setShowDeleteButton] = useState(false)
	const [loading, setLoading] = useState(false)
	const [selectAll, setSelectAll] = useState(false)
	const [rolesData, setRolesData] = useState<RoleRecord[]>([])

	const BASE_API = import.meta.env.VITE_BASE_API
	const { token } = user

	// Effects
	useEffect(() => {
		setCurrentPage(1)
		setShowDeleteButton(selectedRows.length > 0)
	}, [itemsPerPage, selectedRows])

	useEffect(() => {
		fetchRolesData()
	}, [])

	// Filtering and Sorting
	const filteredRecords = rolesData
		.filter((record) =>
			record.role_name.toLowerCase().includes(searchTerm.toLowerCase())
		)
		

	// Pagination
	const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
	const paginatedRecords = filteredRecords.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)

	// Handlers
	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectAll(event.target.checked)
		if (event.target.checked) {
			setSelectedRows(rolesData.map((record) => record._id))
		} else {
			setSelectedRows([])
		}
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
	}


	const handleDeleteConfirmation = (roleId: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'This Role will be deleted!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: "#9c5100",
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteRole(roleId)
			}
		})
	}

	// **************** api reamaining her eto add ***********************
	const handleMultipeDeleteRoles = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/users/roles/bulk-delete`, {
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
					text: 'Roles deleted successfully.',
					icon: 'success',
					timer: 1500,
					confirmButtonColor: "#9c5100",
				})
				fetchRolesData()
			}
			if (!response.ok) {
				throw new Error('Failed to delete user')
			}
		} catch (error: any) {
			Swal.fire('Error!', 'Role deletion failed.', 'error')
		}
	}

	const handleDeleteSelected = () => {
		Swal.fire({
			title: 'Are you sure?',
			text: `All the ${selectedRows.length} selected roles will be deleted!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: "#9c5100",
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete them!',
		}).then((result) => {
			if (result.isConfirmed) {
				handleMultipeDeleteRoles()
			}
		})
	}

	// API Functions
	const fetchRolesData = async () => {
		try {
			setLoading(true)
			const response = await fetch(`${BASE_API}/api/users/role`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				throw new Error('Failed to fetch user roles data.')
			}

			const fetchedData = await response.json()
			const mappedData = fetchedData.map((item: any, index: number) => ({
				_id: item._id,
				role_name: item.role_name,
				id_ui: index + 1,
			}))

			setRolesData(mappedData)
		} catch (error: any) {
			console.error('Error fetching roles:', error)
			Swal.fire({
				title: 'Error!',
				text: error.message,
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setLoading(false)
		}
	}

	const deleteRole = async (roleId: string | string[]) => {
		try {
			const response = await fetch(`${BASE_API}/api/users/role/${roleId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				throw new Error('Failed to delete role(s)')
			}

			Swal.fire({
				title: 'Deleted!',
				text: 'Role(s) deleted successfully.',
				icon: 'success',
				timer: 1500,
				confirmButtonColor: "#9c5100",
			})
			fetchRolesData()
			setSelectedRows([])
		} catch (error: any) {
			console.error('Error deleting role(s):', error)
			Swal.fire({
				title: 'Error!',
				text: error.message,
				icon: 'error',
				timer: 1500,
			})
		}
	}

	const storeHeaders: any[] = [
		{ width: '20px', type: 'checkbox' },
		{ width: '100px', type: 'text' },
		{ width: '100px', type: 'text' },
		{ width: '100px', type: 'actions' }
	]

	return (
		<>
			<PageBreadcrumb title="Roles List" subName="User" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">Roles List</h4>
							<p className="text-muted mb-0">
								A list of all Roles in the system
							</p>
						</div>
						<div className="mt-3 mt-lg-0">
							<Button
								disabled={!canCreate}
								style={{ border: 'none' }}
								variant="success">
								<Link
									to="/user/roles"
									className="text-white text-decoration-none">
									<i className="bi bi-plus"></i> Add New Role
								</Link>
							</Button>
							{showDeleteButton && (
								<Button
									variant="danger"
									className="ms-2"
									onClick={handleDeleteSelected}
									disabled={!canDelete}>
									Delete Selected
								</Button>
							)}
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
										placeholder="Search Role here..."
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
						<select
							className="form-select w-auto mt-3 mt-lg-0"
							value={itemsPerPage}
							style={{ zIndex: 1 }}
							onChange={(e) => setItemsPerPage(Number(e.target.value))}>
							<option value={15}>15 items</option>
							<option value={25}>25 items</option>
							<option value={30}>30 items</option>
						</select>
					</div>
				</Card.Header>
				<Card.Body>
					<div className="table-responsive-sm">
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
									<th>ID</th>
									<th>
										<span>
											Role Name 
										</span>
									</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<TableRowSkeleton headers={storeHeaders} rowCount={3} />
								) :

									paginatedRecords.length > 0 ? (
										paginatedRecords.map((record) => {
											const isSelected = selectedRows.includes(record._id)
											return (
												<tr key={record._id}>
													<td>
														<input
															type="checkbox"
															checked={isSelected}
															onChange={() => handleSelectRow(record._id)}
														/>
													</td>
													<td>{record.id_ui}</td>
													<td>{record.role_name}</td>
													<td>
														<div className="d-flex">
															<Button variant="secondary" disabled={!canUpdate}>
																<Link
																	to={`/user/update/role/${record._id}`}
																	className="text-white">
																	<MdEdit />
																</Link>
															</Button>
															<Button
																variant="danger"
																className="ms-2"
																onClick={() =>
																	handleDeleteConfirmation(record._id)
																}
																disabled={!canDelete}>
																<MdDelete />
															</Button>
														</div>
													</td>
												</tr>
											)
										})
									) : (
										<tr>
											<td colSpan={4} className="text-center">
												No roles found
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
									disabled={currentPage === 1}
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
									disabled={currentPage === totalPages}
								/>
							</BootstrapPagination>
						</nav>
					</div>
				</Card.Body>
			</Card>
		</>
	)
}

export default All_Roles
