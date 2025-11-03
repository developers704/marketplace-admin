import { FormInput, PageBreadcrumb } from '@/components'
import {
	Button,
	Card,
	Form,
	Table,
	Pagination as BootstrapPagination,
	Modal,
} from 'react-bootstrap'
import { useEffect, useRef, useState } from 'react'
import { MdDelete } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import { FaDownload, FaFileCsv } from 'react-icons/fa6'
import { TableRowSkeleton } from '../other/SimpleLoader'

// basic tables
interface Tag {
	_id: string
	name: string
}
const ProductTags = () => {
	const { isSuperUser, permissions, user } = useAuthContext()
	// const canUpdate = isSuperUser || permissions.Users?.Update
	const canDelete = isSuperUser || permissions.Users?.Delete
	const [selectedRows, setSelectedRows] = useState<any[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(15)
	const [sortedAsc, setSortedAsc] = useState(true)
	const [showDeleteButton, setShowDeleteButton] = useState(false)
	const [tags, setTags] = useState<Tag[]>([])
	const [loading, setLoading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [apiLoading, setApiLoading] = useState(false)
	const BASE_API = import.meta.env.VITE_BASE_API
	const { token } = user

	const {
		handleSubmit,
		register,
		control,
		reset,
		formState: { errors },
	} = useForm()

	useEffect(() => {
		setShowDeleteButton(selectedRows.length > 0)
	}, [selectedRows])

	useEffect(() => {
		setCurrentPage(1)
	}, [itemsPerPage])


	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelectedRows(filteredRecords.map((record) => record._id))
		} else {
			setSelectedRows([])
		}
	}
	const handleToggleModal = () => {
		if (isOpen) {
			reset({ name: '' })
		}
		toggleModal()
	}

	const handleSelectRow = (id: any) => {
		setSelectedRows((prev) =>
			prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
		)
	}
	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
	}

	const handleSort = () => {
		setSortedAsc(!sortedAsc)
	}

	const filteredRecords = tags
		.filter((tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
		.sort((a, b) =>
			sortedAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
		)

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}
	const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
	const paginatedRecords = filteredRecords.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)
	const [isOpen, toggleModal] = useToggle() // Using toggle for modal state

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0]
		if (!file) return

		if (!file.name.endsWith('.csv')) {
			Swal.fire({
				title: 'Error',
				text: 'Please upload a CSV file',
				icon: 'error',
				timer: 1500,
			})
			return
		}

		const formData = new FormData()
		formData.append('file', file)

		try {
			setApiLoading(true)
			const response = await fetch(`${BASE_API}/api/tags/bulk-upload`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			})

			if (!response.ok) {
				throw new Error('Failed to upload tags')
			}
			const response_data = await response.json()

			Swal.fire({
				title: 'Upload Complete!',
				html: `
				<div class="text-left">
				<p>✅ ${response_data.created} tags created successfully</p>
				${response_data.skipped > 0
						? `<p>${response_data.skipped} tags skipped (already exist)</p>`
						: ''
					}
				</div>
				`,
				icon: 'success',
				confirmButtonText: 'Great!',
			})
			await getAllTags()
		} catch (error: any) {
			Swal.fire({
				title: 'Error',
				text: error.message || 'Failed to upload tags',
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setApiLoading(false)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		}
	}

	const handleDownloadTemplate = async () => {
		try {
			const response = await fetch(
				`${BASE_API}/api/brands/download-brand-template`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			)

			if (!response.ok) throw new Error('Failed to download template')

			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'tags-template.csv'
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			window.URL.revokeObjectURL(url)
		} catch (error) {
			Swal.fire({
				title: 'Error',
				text: 'Failed to download template',
				icon: 'error',
				timer: 1500,
			})
		}
	}
	const getAllTags = async () => {
		try {
			setLoading(true)
			const response = await fetch(`${BASE_API}/api/tags/`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				throw new Error('Failed to fetch tags')
			}

			const data = await response.json()
			console.log('response form tags ', data)

			setTags(data)
		} catch (error: any) {
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

	const handleAddtags = async (formData: any) => {
		setApiLoading(true)
		try {
			const response = await fetch(`${BASE_API}/api/tags/`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			})

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to create tag')
			}

			const data_res = await response.json()
			if (data_res) {
				Swal.fire({
					title: 'ADDED!',
					text: 'Tag added successfully!',
					icon: 'success',
					confirmButtonText: 'OK',
					timer: 1500,
				})
				toggleModal()
				getAllTags()
				reset()
			}
		} catch (error: any) {
			Swal.fire({
				title: 'Oops!',
				text: error.message,
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setApiLoading(false)
		}
	}

	const deleteTag = async (tagId: any) => {
		try {
			const id_select = typeof tagId === 'string' ? [tagId] : tagId
			const response = await fetch(`${BASE_API}/api/tags/bulk-delete`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ ids: id_select }),
			})

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to delete tag(s)')
			}

			const data_res = await response.json()
			if (data_res) {
				Swal.fire({
					title: 'Deleted!',
					text: data_res.message,
					icon: 'success',
					confirmButtonText: 'OK',
				})
				await getAllTags()
			}
		} catch (error: any) {
			console.error('Error deleting tag(s):', error)
			Swal.fire({
				title: 'Oops!',
				text: error.message,
				icon: 'error',
			})
		}
	}

	// For single delete
	const handleDeleteConfirmation = (tagId: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'This tag will be deleted!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Remove!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteTag(tagId)
			}
		})
	}

	// For bulk delete
	const handleDeleteSelected = () => {
		Swal.fire({
			title: 'Are you sure?',
			text: `All the ${selectedRows.length} selected tags will be deleted!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete them!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteTag(selectedRows)
			}
		})
	}

	useEffect(() => {
		getAllTags()
	}, [])

	const categoryHeaders: any = [
		{ width: '20px', type: 'checkbox' },
		{ width: '80px', type: 'text' },
		{ width: '80px', type: 'actions' }
	]
	return (
		<>
			<PageBreadcrumb title="Tags" subName="Products" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">Tags Management</h4>
							<p className="text-muted mb-0">
								Add and Manage your all Product Tags here.
							</p>
						</div>
						<div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
							<Button
								variant="info"
								className="d-flex align-items-center mb-2 mb-sm-0"
								onClick={handleDownloadTemplate}>
								<FaDownload className="me-2" />
								Download Template
							</Button>
							<Button
								disabled={apiLoading}
								variant="primary"
								className="d-flex align-items-center mb-2 mb-sm-0"
								onClick={() => fileInputRef.current?.click()}>
								<FaFileCsv className="me-2" />
								{apiLoading ? 'Uploading...' : 'Bulk Upload Tags'}
							</Button>
							<input
								type="file"
								accept=".csv"
								ref={fileInputRef}
								style={{ display: 'none' }}
								onChange={handleFileChange}
							/>
							<Button
								style={{ border: 'none' }}
								variant="success"
								onClick={toggleModal}>
								<i className="bi bi-plus"></i> Add New Tags
							</Button>
							{showDeleteButton && (
								<Button
									variant="danger"
									className="ms-sm-2 mt-2 mt-sm-0"
									onClick={handleDeleteSelected}>
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
										placeholder="Search Tags here..."
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
											checked={selectedRows.length === filteredRecords.length}
										/>{' '}
									</th>

									<th>
										<span onClick={handleSort} style={{ cursor: 'pointer' }}>
											Name {sortedAsc ? '↑' : '↓'}
										</span>
									</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<TableRowSkeleton headers={categoryHeaders} rowCount={6} />
								) : paginatedRecords.length > 0 ? (
									paginatedRecords.map((tag) => {
										const isSelected = selectedRows.includes(tag._id)
										return (
											<tr key={tag._id}>
												<td>
													<input
														type="checkbox"
														checked={isSelected}
														onChange={() => handleSelectRow(tag._id)}
													/>
												</td>
												<td>{tag.name}</td>
												<td>
													<div className="d-flex">
														<Button
															variant="danger"
															className="ms-2"
															onClick={() => handleDeleteConfirmation(tag._id)}
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
										<td colSpan={3} className="text-center">
											No tags found
										</td>
									</tr>
								)}
							</tbody>
						</Table>
						<nav className="d-flex justify-content-end mt-3">
							<BootstrapPagination className="pagination-rounded mb-0">
								<BootstrapPagination.Prev
									onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
								/>

								{/* Show first page if not in first set */}
								{currentPage > 2 && (
									<>
										<BootstrapPagination.Item onClick={() => handlePageChange(1)}>
											1
										</BootstrapPagination.Item>
										{currentPage > 3 && <BootstrapPagination.Ellipsis />}
									</>
								)}

								{/* Show 3 pages around current page */}
								{Array.from({ length: totalPages }, (_, index) => {
									const pageNumber = index + 1;
									if (
										pageNumber === currentPage ||
										pageNumber === currentPage - 1 ||
										pageNumber === currentPage + 1
									) {
										return (
											<BootstrapPagination.Item
												key={pageNumber}
												active={pageNumber === currentPage}
												onClick={() => handlePageChange(pageNumber)}
											>
												{pageNumber}
											</BootstrapPagination.Item>
										);
									}
									return null;
								})}

								{/* Show last page if not in last set */}
								{currentPage < totalPages - 1 && (
									<>
										{currentPage < totalPages - 2 && <BootstrapPagination.Ellipsis />}
										<BootstrapPagination.Item onClick={() => handlePageChange(totalPages)}>
											{totalPages}
										</BootstrapPagination.Item>
									</>
								)}

								<BootstrapPagination.Next
									onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
								/>
							</BootstrapPagination>
						</nav>
					</div>
				</Card.Body>
				{/* Modal for adding a new category */}
				<Modal
					show={isOpen}
					onHide={toggleModal}
					dialogClassName="modal-dialog-centered">
					<Modal.Header closeButton>
						<h4 className="modal-title">Add New Tags</h4>
					</Modal.Header>
					<Form onSubmit={handleSubmit(handleAddtags)}>
						<Modal.Body>
							<Form.Group className="mb-3">
								<FormInput
									label="Name"
									type="text"
									name="name"
									containerClass="mb-3"
									register={register}
									placeholder="Enter Tag Name here.."
									errors={errors}
									control={control}
								/>
							</Form.Group>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="light" onClick={handleToggleModal}>
								Close
							</Button>
							<Button variant="soft-success" type="submit">
								{apiLoading ? 'Adding...' : 'Save Tag'}
							</Button>
						</Modal.Footer>
					</Form>
				</Modal>
			</Card>
		</>
	)
}
export default ProductTags
