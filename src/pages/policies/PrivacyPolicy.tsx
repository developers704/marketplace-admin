import { FormInput, PageBreadcrumb } from '@/components'
import {
	Button,
	Card,
	Form,
	Table,
	Pagination as BootstrapPagination,
	Modal,
	Offcanvas as BootstrapOffcanvas,
	Row,
	Col,
} from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { MdDelete, MdEdit, MdVisibility } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import { TableRowSkeleton } from '../other/SimpleLoader'
import Select from 'react-select'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'

interface SelectOption {
	value: string
	label: string
}

interface PolicyRecord {
	_id: string
	title: string
	content: string
	version: string
	isActive: boolean
	showFirst: boolean
	sequence: number
	applicableRoles: any[]
	applicableWarehouses: any[]
	picture?: string
	createdAt: string
	updatedAt: string
}

interface PolicyResponse {
	policies: PolicyRecord[]
}

interface RoleRecord {
	_id: string
	role_name: string
}

interface WarehouseRecord {
	_id: string
	name: string
	location: string
}

const PrivacyPolicy = () => {
	const { isSuperUser, permissions, user } = useAuthContext()
	const canUpdate = isSuperUser || permissions.University?.Update
	const canDelete = isSuperUser || permissions.University?.Delete
	const canCreate = isSuperUser || permissions.University?.Create

	// States
	const [selectedRows, setSelectedRows] = useState<string[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(15)
	const [showDeleteButton, setShowDeleteButton] = useState(false)
	const [apiLoading, setApiLoading] = useState(false)
	const [loading, setLoading] = useState(false)
	const [policyData, setPolicyData] = useState<PolicyRecord[]>([])
	const [rolesData, setRolesData] = useState<RoleRecord[]>([])
	const [warehousesData, setWarehousesData] = useState<WarehouseRecord[]>([])
	const [editingPolicy, setEditingPolicy] = useState<PolicyRecord | null>(null)
	const [viewingPolicy, setViewingPolicy] = useState<PolicyRecord | null>(null)
	const [expandedMessages, setExpandedMessages] = useState<any>({})
	const [selectedImage, setSelectedImage] = useState<File | null>(null)
	const [selectedWarehouses, setSelectedWarehouses] = useState<SelectOption[]>(
		[]
	)
	const [selectedRoles, setSelectedRoles] = useState<SelectOption[]>([])
	const [content, setContent] = useState('')
	// API basics
	const BASE_API = import.meta.env.VITE_BASE_API
	const { token } = user

	const {
		handleSubmit,
		register,
		reset,
		control,
		setValue,
		formState: { errors },
	} = useForm()

	// Modal and Offcanvas toggles
	const [isModalOpen, toggleModal] = useToggle()
	const [isOffcanvasOpen, toggleOffcanvas] = useToggle()

	const warehouseOptions = warehousesData.map((warehouse) => ({
		value: warehouse._id,
		label: `${warehouse.name} - ${warehouse.location}`,
	}))

	const roleOptions = rolesData.map((role) => ({
		value: role._id,
		label: role.role_name,
	}))
	// Handle functions
	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelectedRows(policyData.map((record) => record._id))
		} else {
			setSelectedRows([])
		}
	}

	const handleSelectRow = (id: string) => {
		setSelectedRows((prev) =>
			prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
		)
	}
	const stripHtmlTags = (html: string) => {
		const tmp = document.createElement('div')
		tmp.innerHTML = html
		return tmp.textContent || tmp.innerText || ''
	}

	const truncateText = (text: any, limit: number = 50) => {
		if (!text) return ''
		return text.length > limit ? `${text.substring(0, limit)}...` : text
	}

	const toggleMessage = (messageId: string) => {
		setExpandedMessages((prev: any) => ({
			...prev,
			[messageId]: !prev[messageId],
		}))
	}

	const handleDeleteConfirmation = (policyId: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'This Policy will be deleted!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Remove!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteSelectedPolicies([policyId])
			}
		})
	}

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
	}

	const handleBulkDelete = () => {
		Swal.fire({
			title: 'Are you sure?',
			text: `All the ${selectedRows.length} selected policies will be deleted!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete them!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteSelectedPolicies()
			}
		})
	}

	const toggleEditModal = (policy: PolicyRecord) => {
		setEditingPolicy(policy)
		setValue('title', policy.title)
		setContent(policy.content) // Set content for ReactQuill
		setValue('version', policy.version)
		setValue('isActive', policy.isActive)
		setValue('showFirst', policy.showFirst)
		setValue('sequence', policy.sequence)

		const selectedWarehouseOptions = policy?.applicableWarehouses
			?.map((warehouseId) => {
				return {
					value: warehouseId._id,
					label: `${warehouseId?.name} - ${warehouseId?.location}`,
				}
			})
			.filter(Boolean) as SelectOption[]

		// Set roles
		const selectedRoleOptions = policy.applicableRoles
			.map((roleId) => {
				return {
					value: roleId?._id,
					label: roleId?.role_name,
				}
			})
			.filter(Boolean) as SelectOption[]

		setSelectedWarehouses(selectedWarehouseOptions)
		setSelectedRoles(selectedRoleOptions)

		toggleModal()
	}
	const handleViewPolicy = (policy: PolicyRecord) => {
		setViewingPolicy(policy)
		toggleOffcanvas()
	}

	const filteredRecords = policyData?.filter((record) =>
		record?.title?.toLowerCase()?.includes(searchTerm.toLowerCase())
	)

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}

	const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
	const paginatedRecords = filteredRecords.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)
	const handleToggleModal = () => {
		if (isModalOpen) {
			reset()
			setEditingPolicy(null)
			setSelectedImage(null)
			setContent('') // Reset rich text content
			setSelectedRoles([]) // Reset react-select
			setSelectedWarehouses([]) // Reset react-select
		}
		toggleModal()
	}

	// API Calls
	const handleAddPolicy = async (policyData: any) => {
		setApiLoading(true)
		try {
			const formData = new FormData()
			formData.append('title', policyData.title)
			formData.append('content', content) // Use rich text content
			formData.append('version', policyData.version)
			formData.append('isActive', policyData.isActive)
			formData.append('showFirst', policyData.showFirst)
			formData.append('sequence', policyData.sequence.toString())

			// Handle react-select arrays
			selectedRoles.forEach((role) => {
				formData.append('applicableRoles[]', role.value)
			})
			selectedWarehouses.forEach((warehouse) => {
				formData.append('applicableWarehouses[]', warehouse.value)
			})

			if (selectedImage) {
				formData.append('picture', selectedImage)
			}
			const response = await fetch(`${BASE_API}/api/policy`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			})

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to Add Policy')
			}

			const data_res = await response.json()
			if (data_res) {
				Swal.fire({
					title: 'SUCCESS!',
					text: data_res.message || 'Policy added successfully!',
					icon: 'success',
					confirmButtonText: 'OK',
					timer: 1500,
				})
				getPolicies()
				reset()
				setSelectedImage(null)
				toggleModal()
			}
		} catch (error: any) {
			console.error('Error Adding Policy', error)
			Swal.fire({
				title: 'Error',
				text: error.message,
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setApiLoading(false)
		}
	}

	const getPolicies = async () => {
		try {
			setLoading(true)
			const response = await fetch(`${BASE_API}/api/policy`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to get policies')
			}

			const data_res: PolicyResponse = await response.json()
			if (data_res && data_res.policies) {
				setPolicyData(data_res.policies) // Access the policies array
			}
		} catch (error: any) {
			console.error('Error fetching policies:', error)
		} finally {
			setLoading(false)
		}
	}

	const getRoles = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/users/role`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				throw new Error('Failed to fetch roles')
			}

			const fetchedData = await response.json()
			setRolesData(fetchedData)
		} catch (error: any) {
			console.error('Error fetching roles:', error)
		}
	}

	const getWarehouses = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/warehouses`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				throw new Error('Failed to get warehouses')
			}

			const data_res: WarehouseRecord[] = await response.json()
			if (data_res) {
				setWarehousesData(data_res)
			}
		} catch (error: any) {
			console.error('Error fetching warehouses:', error)
		}
	}

	const handleUpdatePolicy = async (policyData: any) => {
		setApiLoading(true)
		try {
			const formData = new FormData()
			formData.append('title', policyData.title)
			formData.append('content', content) // Use the content state from ReactQuill
			formData.append('version', policyData.version)
			formData.append('isActive', policyData.isActive)
			formData.append('showFirst', policyData.showFirst)
			formData.append('sequence', policyData.sequence.toString())

			// Handle arrays from React-Select state
			selectedRoles.forEach((role) => {
				formData.append('applicableRoles[]', role.value)
			})
			selectedWarehouses.forEach((warehouse) => {
				formData.append('applicableWarehouses[]', warehouse.value)
			})

			if (selectedImage) {
				formData.append('picture', selectedImage)
			}

			const response = await fetch(
				`${BASE_API}/api/policy/${editingPolicy?._id}`,
				{
					method: 'PUT',
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				}
			)

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to Update Policy')
			}

			const data_res = await response.json()
			if (data_res) {
				getPolicies()
				handleToggleModal()
				Swal.fire({
					title: 'SUCCESS!',
					text: data_res.message || 'Policy updated successfully!',
					icon: 'success',
					confirmButtonText: 'OK',
					timer: 1500,
				})
				reset()
				setEditingPolicy(null)
				setSelectedImage(null)
				setContent('') // Reset content state
				setSelectedRoles([]) // Reset roles state
				setSelectedWarehouses([]) // Reset warehouses state
			}
		} catch (error: any) {
			console.error('Error Updating Policy', error)
			Swal.fire({
				title: 'Error',
				text: error.message,
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setApiLoading(false)
		}
	}


	const deleteSelectedPolicies = async (policyIds?: string[]) => {
		try {
			const idsToDelete = policyIds || selectedRows
			const response = await fetch(`${BASE_API}/api/policy/bulk-delete`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ policyIds: idsToDelete }),
			})

			if (!response.ok) {
				throw new Error('Failed to delete Policies')
			}

			const data_res = await response.json()
			getPolicies()
			setSelectedRows([])
			const deleteCount = idsToDelete.length
			Swal.fire({
				title: 'SUCCESS!',
				text: data_res.message || `${deleteCount} ${deleteCount === 1 ? 'Policy' : 'Policies'} ${deleteCount === 1 ? 'has' : 'have'} been deleted successfully.`,
				icon: 'success',
				timer: 1500,
			})
		} catch (error: any) {
			Swal.fire('Error', 'Failed to delete Policies', 'error')
		}
	}

	const allOption: SelectOption = { value: '*', label: 'Select All' }

	const handleSelectAllStores = (selected: SelectOption[] | null) => {
		if (!selected) {
			setSelectedWarehouses([])
			return
		}

		// Check if "Select All" option was chosen
		if (selected.some((option) => option.value === allOption.value)) {
			// Select all except "Select All" option itself
			setSelectedWarehouses(warehouseOptions)
		} else {
			setSelectedWarehouses(selected)
		}
	}

	const handleSelectAllRoles = (selected: SelectOption[] | null) => {
		if (!selected) {
			setSelectedRoles([])
			return
		}

		// Check if "Select All" option was chosen
		if (selected.some((option) => option.value === allOption.value)) {
			// Select all except "Select All" option itself
			setSelectedRoles(roleOptions)
		} else {
			setSelectedRoles(selected)
		}
	}

	// Effects
	useEffect(() => {
		if (!isModalOpen) {
			reset()
			setEditingPolicy(null)
			setSelectedImage(null)
		}
	}, [isModalOpen, reset])

	useEffect(() => {
		if (editingPolicy && warehousesData.length > 0 && rolesData.length > 0) {
			setValue('title', editingPolicy.title)
			setContent(editingPolicy.content) // Set content for ReactQuill
			setValue('version', editingPolicy.version)
			setValue('isActive', editingPolicy.isActive)
			setValue('showFirst', editingPolicy.showFirst)
			setValue('sequence', editingPolicy.sequence)

			// Set warehouses
			const selectedWarehouseOptions = editingPolicy?.applicableWarehouses
				?.map((warehouseId) => {
					return {
						value: warehouseId._id,
						label: `${warehouseId?.name} - ${warehouseId?.location}`,
					}
				})
				.filter(Boolean) as SelectOption[]

			// Set roles
			const selectedRoleOptions = editingPolicy.applicableRoles
				.map((roleId) => {
					return {
						value: roleId?._id,
						label: roleId?.role_name,
					}
				})
				.filter(Boolean) as SelectOption[]

			setSelectedWarehouses(selectedWarehouseOptions)
			setSelectedRoles(selectedRoleOptions)
		} else if (!editingPolicy) {
			reset()
			setContent('')
			setSelectedRoles([])
			setSelectedWarehouses([])
		}
	}, [editingPolicy, setValue, reset, warehousesData, rolesData])

	useEffect(() => {
		getPolicies()
		getRoles()
		getWarehouses()
	}, [])

	useEffect(() => {
		setCurrentPage(1)
		setShowDeleteButton(selectedRows.length > 0)
	}, [itemsPerPage, selectedRows])

	const policyHeaders: any[] = [
		{ width: '20px', type: 'checkbox' },
		{ width: '150px', type: 'text' },
		{ width: '200px', type: 'text' },
		{ width: '80px', type: 'text' },
		{ width: '60px', type: 'text' },
		{ width: '60px', type: 'text' },
		{ width: '80px', type: 'number' },
		{ width: '120px', type: 'actions' },
	]

	return (
		<>
			<PageBreadcrumb
				title="Privacy Policies"
				subName="Settings"
				allowNavigateBack={true}
			/>
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">Privacy Policy Management</h4>
							<p className="text-muted mb-0">
								Add and Manage all your Privacy Policies here.
							</p>
						</div>
						<div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
							<Button
								disabled={!canCreate}
								variant="success"
								onClick={toggleModal}
								className="mb-2 mb-sm-0">
								<i className="bi bi-plus"></i> Add New Policy
							</Button>
							{showDeleteButton && (
								<Button
									variant="danger"
									className="ms-sm-2 mt-2 mt-sm-0"
									onClick={handleBulkDelete}>
									Delete All Selected
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
										placeholder="Search Policy here..."
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
					<div className="table-responsive-sm">
						<Table className="table-striped table-centered mb-0">
							<thead>
								<tr>
									<th>
										<input
											type="checkbox"
											onChange={handleSelectAll}
											checked={
												selectedRows.length > 0 &&
												selectedRows.length === policyData.length
											}
										/>
									</th>
									<th>
										<span>Title</span>
									</th>
									<th>Content</th>
									<th>Version</th>
									<th>Active</th>
									<th>Show First</th>
									<th>Sequence</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<TableRowSkeleton headers={policyHeaders} rowCount={5} />
								) : paginatedRecords.length > 0 ? (
									paginatedRecords.map((policy, idx) => {
										const isSelected = selectedRows.includes(policy._id)
										return (
											<tr key={idx}>
												<td>
													<input
														type="checkbox"
														checked={isSelected}
														onChange={() => handleSelectRow(policy._id)}
													/>
												</td>
												<td>{policy?.title}</td>
												<td
													onClick={() => toggleMessage(policy._id.toString())}
													style={{ cursor: 'pointer' }}
													title="Click to expand/collapse">
													{expandedMessages[policy._id]
														? stripHtmlTags(policy.content)
														: truncateText(stripHtmlTags(policy.content))}
												</td>
												<td>{policy?.version}</td>
												<td>
													<span
														className={`badge ${policy.isActive ? 'bg-success' : 'bg-danger'}`}>
														{policy?.isActive ? 'Active' : 'Inactive'}
													</span>
												</td>
												<td>
													<span
														className={`badge ${policy.showFirst ? 'bg-primary' : 'bg-secondary'}`}>
														{policy?.showFirst ? 'Yes' : 'No'}
													</span>
												</td>
												<td>{policy?.sequence}</td>
												<td>
													<div className="d-flex gap-1">
														<Button
															variant="info"
															size="sm"
															onClick={() => handleViewPolicy(policy)}>
															<MdVisibility />
														</Button>
														<Button
															variant="secondary"
															size="sm"
															disabled={!canUpdate}
															onClick={() => toggleEditModal(policy)}>
															<MdEdit />
														</Button>
														<Button
															variant="danger"
															size="sm"
															onClick={() =>
																handleDeleteConfirmation(policy._id.toString())
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
										<td colSpan={8} className="text-center">
											No Policy found
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

								{currentPage > 2 && (
									<>
										<BootstrapPagination.Item
											onClick={() => handlePageChange(1)}>
											1
										</BootstrapPagination.Item>
										{currentPage > 3 && <BootstrapPagination.Ellipsis />}
									</>
								)}

								{Array.from({ length: totalPages }, (_, index) => {
									const pageNumber = index + 1
									if (
										pageNumber === currentPage ||
										pageNumber === currentPage - 1 ||
										pageNumber === currentPage + 1
									) {
										return (
											<BootstrapPagination.Item
												key={pageNumber}
												active={pageNumber === currentPage}
												onClick={() => handlePageChange(pageNumber)}>
												{pageNumber}
											</BootstrapPagination.Item>
										)
									}
									return null
								})}

								{currentPage < totalPages - 1 && (
									<>
										{currentPage < totalPages - 2 && (
											<BootstrapPagination.Ellipsis />
										)}
										<BootstrapPagination.Item
											onClick={() => handlePageChange(totalPages)}>
											{totalPages}
										</BootstrapPagination.Item>
									</>
								)}

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

			{/* Add/Edit Modal */}
			<Modal
				show={isModalOpen}
				onHide={handleToggleModal}
				size="lg"
				dialogClassName="modal-dialog-centered">
				<Modal.Header closeButton>
					<h4 className="modal-title">
						{editingPolicy ? 'Update Policy' : 'Add New Policy'}
					</h4>
				</Modal.Header>
				<Form
					onSubmit={handleSubmit(
						editingPolicy ? handleUpdatePolicy : handleAddPolicy
					)}>
					<Modal.Body>
						<Row>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Applicable Stores</Form.Label>
									<Select
										isMulti
										options={[allOption, ...warehouseOptions]} // Add "Select All" at the top
										value={selectedWarehouses}
										onChange={(selected) =>
											handleSelectAllStores(selected as SelectOption[])
										}
										placeholder="Select stores..."
										className="react-select-container"
										classNamePrefix="react-select"
									/>
								</Form.Group>
							</Col>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Applicable Roles</Form.Label>
									{/* <Select
										isMulti
										options={roleOptions}
										value={selectedRoles}
										onChange={(selected) =>
											setSelectedRoles(selected as SelectOption[])
										}
										placeholder="Select roles..."
										className="react-select-container"
										classNamePrefix="react-select"
									/> */}
									<Select
										isMulti
										options={[allOption, ...roleOptions]} // Add "Select All" at the top
										value={selectedRoles}
										onChange={(selected) =>
											handleSelectAllRoles(selected as SelectOption[])
										}
										placeholder="Select roles..."
										className="react-select-container"
										classNamePrefix="react-select"
									/>
								</Form.Group>
							</Col>
						</Row>

						<Row>
							<Col md={4}>
								<Form.Group className="mb-3">
									<Form.Check
										type="checkbox"
										label="Is Active"
										{...register('isActive')}
									/>
								</Form.Group>
							</Col>
							<Col md={4}>
								<Form.Group className="mb-3">
									<Form.Check
										type="checkbox"
										label="Show First"
										{...register('showFirst')}
									/>
								</Form.Group>
							</Col>

							<Col md={4}>
								<FormInput
									label="Sequence"
									type="number"
									name="sequence"
									containerClass="mb-3"
									register={register}
									placeholder="Enter Sequence"
									errors={errors}
									control={control}
								/>
							</Col>
						</Row>

						<Form.Group className="mb-3">
							<Form.Label className="d-flex align-items-center">
								Title <span className="text-danger ms-1">*</span>
							</Form.Label>
							<FormInput
								type="text"
								name="title"
								containerClass="mb-3"
								register={register}
								placeholder="Enter Policy Title"
								errors={errors}
								control={control}
							/>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label className="d-flex align-items-center">
								Content <span className="text-danger ms-1">*</span>
							</Form.Label>
							<ReactQuill
								theme="snow"
								value={content}
								onChange={setContent}
								placeholder="Enter Policy Content"
								style={{ height: '200px', marginBottom: '50px' }}
								modules={{
									toolbar: [
										[{ header: [1, 2, false] }],
										['bold', 'italic', 'underline', 'strike'],
										[{ list: 'ordered' }, { list: 'bullet' }],
										['link', 'image'],
										['clean'],
									],
								}}
							/>
						</Form.Group>

						<Form.Group className="mb-3">
							<FormInput
								label="Version"
								type="text"
								name="version"
								containerClass="mb-3"
								register={register}
								placeholder="Enter Version (e.g., 1.0)"
								errors={errors}
								control={control}
							/>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Policy Image</Form.Label>
							<div className="mb-2">
								<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
									{'File Size: Upload images up to 5 MB.'}
								</p>
								<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
									{'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
								</p>
							</div>
							<SingleFileUploader
								icon="ri-upload-cloud-2-line"
								text="Drop file here or click to upload a policy image."
								onFileUpload={(file: File) => setSelectedImage(file)}
							/>
							{editingPolicy?.picture && (
								<div className="mt-3 d-flex flex-column">
									<Form.Label>Current Image</Form.Label>
									<img
										src={`${BASE_API}/${editingPolicy.picture}`}
										alt="Policy"
										className="img-thumbnail mb-3"
										style={{ width: '100px', height: '100px' }}
									/>
								</div>
							)}
						</Form.Group>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="light" onClick={handleToggleModal}>
							Close
						</Button>
						<Button
							variant="soft-success"
							type="submit"
							disabled={editingPolicy ? !canUpdate : !canCreate}>
							{apiLoading
								? editingPolicy
									? 'Updating...'
									: 'Adding...'
								: editingPolicy
									? 'Update Policy'
									: 'Save Policy'}
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>

			{/* View Policy Offcanvas */}
			<BootstrapOffcanvas
				show={isOffcanvasOpen}
				onHide={toggleOffcanvas}
				placement="end"
				style={{ width: '500px' }}>
				<BootstrapOffcanvas.Header closeButton>
					<BootstrapOffcanvas.Title>Policy Details</BootstrapOffcanvas.Title>
				</BootstrapOffcanvas.Header>
				<BootstrapOffcanvas.Body>
					{viewingPolicy && (
						<div>
							<div className="mb-4">
								<h5 className="text-primary">{viewingPolicy.title}</h5>
								<div className="d-flex gap-2 mb-3">
									<span
										className={`badge ${viewingPolicy.isActive ? 'bg-success' : 'bg-danger'}`}>
										{viewingPolicy.isActive ? 'Active' : 'Inactive'}
									</span>
									<span
										className={`badge ${viewingPolicy.showFirst ? 'bg-primary' : 'bg-secondary'}`}>
										{viewingPolicy.showFirst ? 'Show First' : 'Normal'}
									</span>
									<span className="badge bg-info">
										v{viewingPolicy.version}
									</span>
									<span className="badge bg-warning">
										Seq: {viewingPolicy.sequence}
									</span>
								</div>
							</div>

							<div className="mb-4">
								<h6 className="fw-bold">Content:</h6>
								<div className="p-3 bg-light rounded">
									<div
										dangerouslySetInnerHTML={{ __html: viewingPolicy.content }}
										style={{
											wordBreak: 'break-word',
											lineHeight: '1.6',
										}}
									/>
								</div>
							</div>

							{viewingPolicy?.picture && (
								<div className="mb-4">
									<h6 className="fw-bold">Policy Image:</h6>
									<img
										src={`${BASE_API}/${viewingPolicy.picture}`}
										alt="Policy"
										className="img-fluid rounded"
										style={{ maxHeight: '200px' }}
									/>
								</div>
							)}

							<div className="mb-4">
								<h6 className="fw-bold">Applicable Stores:</h6>
								<div className="d-flex flex-wrap gap-1">
									{viewingPolicy.applicableWarehouses?.map((warehouseId) => {
										return (
											<span key={warehouseId} className="badge bg-primary">
												{warehouseId?.name}
											</span>
										)
									})}
								</div>
							</div>

							<div className="mb-4">
								<h6 className="fw-bold">Applicable Roles:</h6>
								<div className="d-flex flex-wrap gap-1">
									{viewingPolicy.applicableRoles?.map((roleId) => {
										return (
											<span key={roleId} className="badge bg-secondary">
												{roleId?.role_name}
											</span>
										)
									})}
								</div>
							</div>

							<div className="mb-4">
								<h6 className="fw-bold">Timestamps:</h6>
								<small className="text-muted">
									<div>
										Created:{' '}
										{new Date(viewingPolicy.createdAt).toLocaleString()}
									</div>
									<div>
										Updated:{' '}
										{new Date(viewingPolicy.updatedAt).toLocaleString()}
									</div>
								</small>
							</div>
						</div>
					)}
				</BootstrapOffcanvas.Body>
			</BootstrapOffcanvas>
		</>
	)
}

export default PrivacyPolicy
