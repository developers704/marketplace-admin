import { FormInput, PageBreadcrumb } from '@/components'
import {
	Button,
	Card,
	Form,
	Table,
	Pagination as BootstrapPagination,
	Modal,
} from 'react-bootstrap'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
// import { FaDownload, FaFileCsv } from 'react-icons/fa6'
import { TableRowSkeleton } from '../other/SimpleLoader'

interface TableRecord {
	_id: number
	name: string
	logo?: string
}
const Brands = () => {
	const { isSuperUser, permissions, user } = useAuthContext()
	const canUpdate = isSuperUser || permissions.Products?.Update
	const canDelete = isSuperUser || permissions.Products?.Delete
	const canCreate = isSuperUser || permissions.Products?.Create

	const [selectedRows, setSelectedRows] = useState<number[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(15)
	const [sortedAsc, setSortedAsc] = useState(true)
	const [showDeleteButton, setShowDeleteButton] = useState(false)
	const [selectedImage, setSelectedImage] = useState<File | null>(null)
	const [apiLoading, setApiLoading] = useState(false)
	const [loading, setLoading] = useState(false)
	const [brandsData, setBrandsData] = useState<any[]>([])
	const [editingBrand, setEditingBrand] = useState<TableRecord | null>(null)
	// const fileInputRef = useRef<HTMLInputElement>(null)
	// const [isExporting, setIsExporting] = useState(false);

	const BASE_API = import.meta.env.VITE_BASE_API
	const { token } = user
	const {
		handleSubmit,
		register,
		control,
		reset,
		setValue,
		formState: { errors },
	} = useForm()

	useEffect(() => {
		setShowDeleteButton(selectedRows.length > 0)
	}, [selectedRows])

	useEffect(() => {
		setCurrentPage(1)
	}, [itemsPerPage])

	const deleteSelectedBrands = async () => {
		try {
			console.log(' selected Rows ', selectedRows)

			const response = await fetch(
				`${BASE_API}/api/brands/bulk-delete`, // Correct endpoint
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ ids: selectedRows }), // Include the IDs in the body
				}
			)

			if (!response.ok) {
				throw new Error('Failed to delete brands')
			}

			getAllBrands() // Refresh the data after deletion
			Swal.fire({
				title: 'Deleted!',
				text: `All the selected ${selectedRows.length} Brands deleted successfully.`,
				icon: 'success',
				timer: 1500,
			})
		} catch (error: any) {
			Swal.fire('Oops!', 'Brands deletion failed.', 'error')
		}
	}
	const handleDeleteSelected = () => {
		Swal.fire({
			title: 'Are you sure?',
			text: `All the ${selectedRows.length} selected items will be deleted!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteSelectedBrands()
			}
		})
		console.log('Delete IDs:', selectedRows)
	}
	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelectedRows(brandsData.map((record) => record._id))
		} else {
			setSelectedRows([])
		}
	}
	// const handleFileChange = async (
	// 	event: React.ChangeEvent<HTMLInputElement>
	// ) => {
	// 	const file = event.target.files?.[0]
	// 	if (!file) return

	// 	if (!file.name.endsWith('.csv')) {
	// 		Swal.fire({
	// 			title: 'Error',
	// 			text: 'Please upload a CSV file',
	// 			icon: 'error',
	// 			timer: 1500,
	// 		})
	// 		return
	// 	}

	// 	const formData = new FormData()
	// 	formData.append('file', file)

	// 	try {
	// 		setApiLoading(true)
	// 		const response = await fetch(`${BASE_API}/api/brands/bulk-upload`, {
	// 			method: 'POST',
	// 			headers: {
	// 				Authorization: `Bearer ${token}`,
	// 			},
	// 			body: formData,
	// 		})

	// 		if (!response.ok) {
	// 			throw new Error('Failed to upload brands')
	// 		}
	// 		const response_data = await response.json()

	// 		Swal.fire({
	// 			title: 'Upload Complete!',
	// 			html: `
	// 			<div class="text-left">
	// 			<p>✅ ${response_data.created} brands created successfully</p>
	// 			${response_data.skipped > 0
	// 					? `<p>${response_data.skipped} brands skipped (already exist)</p>`
	// 					: ''
	// 				}
	// 			</div>
	// 			`,
	// 			icon: 'success',
	// 			confirmButtonText: 'Great!',
	// 		})
	// 		await getAllBrands()
	// 	} catch (error: any) {
	// 		Swal.fire({
	// 			title: 'Error',
	// 			text: error.message || 'Failed to upload brands',
	// 			icon: 'error',
	// 			timer: 1500,
	// 		})
	// 	} finally {
	// 		setApiLoading(false)
	// 		if (fileInputRef.current) {
	// 			fileInputRef.current.value = ''
	// 		}
	// 	}
	// }
	// Add this function inside the Brands component
	// const handleDownloadTemplate = async () => {
	// 	try {
	// 		const response = await fetch(
	// 			`${BASE_API}/api/brands/download-brand-template`,
	// 			{
	// 				method: 'GET',
	// 				headers: {
	// 					Authorization: `Bearer ${token}`,
	// 				},
	// 			}
	// 		)

	// 		if (!response.ok) throw new Error('Failed to download template')

	// 		const blob = await response.blob()
	// 		const url = window.URL.createObjectURL(blob)
	// 		const a = document.createElement('a')
	// 		a.href = url
	// 		a.download = 'brands-template.csv'
	// 		document.body.appendChild(a)
	// 		a.click()
	// 		document.body.removeChild(a)
	// 		window.URL.revokeObjectURL(url)
	// 	} catch (error) {
	// 		Swal.fire({
	// 			title: 'Error',
	// 			text: 'Failed to download template',
	// 			icon: 'error',
	// 			timer: 1500,
	// 		})
	// 	}
	// }

	const handleSelectRow = (id: number) => {
		setSelectedRows((prev) =>
			prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
		)
	}
	const deleteItem = async (user_id: string) => {
		try {
			const response = await fetch(`${BASE_API}/api/brands/${user_id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			})
			if (!response.ok) {
				throw new Error('Failed to delete category')
			}

			Swal.fire({
				title: 'Deleted!',
				text: 'Brand deleted successfully.',
				icon: 'success',
				timer: 1500,
			})
			getAllBrands() // Refresh the data after deletion
		} catch (error: any) {
			console.error('Error deleting brands:', error)
			Swal.fire({
				title: 'Oops!',
				text: error.message,
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setLoading(false)
		}
	}
	const handleDeleteConfirmation = (userId: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'This Item will be deleted!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Remove!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteItem(userId)
			}
		})
	}
	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
	}

	const handleSort = () => {
		setSortedAsc(!sortedAsc)
	}

	const filteredRecords = brandsData
		.filter((record) =>
			record.name.toLowerCase().includes(searchTerm.toLowerCase())
		)
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

	const getAllBrands = async () => {
		try {
			setLoading(true)
			const response = await fetch(`${BASE_API}/api/brands`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			})
			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to get subcategories')
			}
			const data: TableRecord[] = await response.json()

			console.log('data from brands ', data)

			if (data) {
				setBrandsData(data)
			}
		} catch (error: any) {
			console.error('Error getting brands data :', error)
		} finally {
			setLoading(false)
		}
	}

	const handleAddBrand = async (brandData: any) => {
		console.log('Brand Data:', brandData)

		const formData = new FormData()
		formData.append('name', brandData.name)

		if (selectedImage) {
			formData.append('image', selectedImage)
		}

		try {
			setApiLoading(true)
			const response = await fetch(`${BASE_API}/api/brands`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			})

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to add new Brand')
			}

			const data_res = await response.json()
			if (data_res) {
				Swal.fire({
					title: 'ADDED!',
					text: 'Brand added successfully!',
					icon: 'success',
					confirmButtonText: 'OK',
					timer: 1500,
				})
				getAllBrands()
			}
		} catch (error: any) {
			console.error('Error adding brand:', error)
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
	// const handleExportBrands = async () => {
	// 	setIsExporting(true);
	// 	try {
	// 		const response = await fetch(`${BASE_API}/api/brands/download-data`, {
	// 			headers: {
	// 				Authorization: `Bearer ${token}`,
	// 			},
	// 		});
	// 		const blob = await response.blob();
	// 		const url = window.URL.createObjectURL(blob);
	// 		const a = document.createElement('a');
	// 		a.href = url;
	// 		a.download = 'brands.csv';
	// 		document.body.appendChild(a);
	// 		a.click();
	// 		document.body.removeChild(a);
	// 	} catch (error) {
	// 		console.error('Error exporting brands:', error);
	// 	} finally {
	// 		setIsExporting(false);
	// 	}
	// };


	useEffect(() => {
		getAllBrands()
	}, [])

	const handleToggleModal = () => {
		if (isOpen) {
			reset({ name: '' })
			setSelectedImage(null)
			setEditingBrand(null)
		}
		toggleModal()
	}

	const toggleEditModal = (brand: TableRecord) => {
		setEditingBrand(brand)
		setValue('name', brand.name)
		toggleModal()
	}

	// Add this function to handle brand update
	const handleUpdateBrand = async (brandData: any) => {
		console.log('Updating Brand Data:', brandData)

		const formData = new FormData()
		formData.append('name', brandData.name)
		if (selectedImage) {
			formData.append('image', selectedImage)
		}

		try {
			setApiLoading(true)
			const response = await fetch(
				`${BASE_API}/api/brands/${editingBrand?._id}`,
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
				throw new Error(errorMessage.message || 'Failed to Update Brand')
			}

			const data_res = await response.json()
			if (data_res) {
				handleToggleModal()
				await getAllBrands()
				Swal.fire({
					title: 'Updated!',
					text: 'Brand updated successfully!',
					icon: 'success',
					confirmButtonText: 'OK',
					timer: 1500,
				})
				reset()
				setEditingBrand(null)
			}
		} catch (error: any) {
			console.error('Error Updating Brand:', error)
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

	// Add these useEffect hooks for form management
	useEffect(() => {
		if (!isOpen) {
			reset()
			setSelectedImage(null)
			setEditingBrand(null)
		}
	}, [isOpen, reset])

	useEffect(() => {
		if (editingBrand) {
			setValue('name', editingBrand.name)
		} else {
			reset({ name: '' })
		}
	}, [editingBrand, setValue, reset])

	const categoryHeaders: any = [
		{ width: '20px', type: 'checkbox' },
		{ width: '80px', type: 'image' },
		{ width: '150px', type: 'text' },
		{ width: '100px', type: 'actions' }
	]


	return (
		<>
			<PageBreadcrumb title="Brands" subName="Products" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">Brand Management</h4>
							<p className="text-muted mb-0">
								Add and Manage your all Product brands here.
							</p>
						</div>
						<div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
							{/* <Button
								className="btn btn-primary mt-3 mt-lg-0 me-2"
								onClick={handleExportBrands}
								disabled={isExporting}
							>
								{isExporting ? (
									<>
										<span className="spinner-border spinner-border-sm me-1" role="status" />
										Downloading...
									</>
								) : (
									<>
										<i className="ri-download-2-line me-1"></i>
										Export Brands
									</>
								)}
							</Button>
							<Button
								variant="info"
								className="d-flex align-items-center mb-2 mb-sm-0"
								onClick={handleDownloadTemplate}>
								<FaDownload className="me-2" />
								Download Template
							</Button>
							<Button
								disabled={!canCreate || apiLoading}
								variant="primary"
								className="d-flex align-items-center mb-2 mb-sm-0"
								onClick={() => fileInputRef.current?.click()}>
								<FaFileCsv className="me-2" />
								{apiLoading ? 'Uploading...' : 'Bulk Upload Brands'}
							</Button>
							<input
								type="file"
								accept=".csv"
								ref={fileInputRef}
								style={{ display: 'none' }}
								onChange={handleFileChange}
							/> */}
							<Button
								style={{ border: 'none' }}
								variant="success"
								disabled={!canCreate}
								onClick={toggleModal}
								className="mb-2 mb-sm-0">
								<i className="bi bi-plus"></i> Add New Brand
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
										placeholder="Search Brands here..."
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
											checked={selectedRows.length === brandsData.length}
										/>{' '}
									</th>
									<th>Image</th>
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
								) :

									paginatedRecords.length > 0 ? (
										(paginatedRecords || []).map((record, idx) => {
											const isSelected = selectedRows.includes(record._id)
											return (
												<tr key={idx}>
													<td>
														<input
															type="checkbox"
															checked={isSelected}
															onChange={() => handleSelectRow(record._id)}
														/>
													</td>
													<td className="table-user">
														{record?.logo ? (
															<img
																src={`${BASE_API}/${record.logo}`}
																alt="brands"
																className="me-2 rounded-circle"
															/>
														) : (
															''
														)}
													</td>
													<td>{record.name}</td>
													<td>
														<div className="d-flex">
															<Button
																variant="secondary"
																disabled={!canUpdate}
																onClick={() => toggleEditModal(record)}>
																<MdEdit />
															</Button>
															<Button
																variant="danger"
																className="ms-2"
																onClick={() =>
																	handleDeleteConfirmation(record._id.toString())
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
												No records found
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
				{/* Modal for adding a new brand */}
				<Modal
					show={isOpen}
					onHide={handleToggleModal}
					dialogClassName="modal-dialog-centered">
					<Modal.Header closeButton>
						<h4 className="modal-title">
							{editingBrand ? 'Update Brand' : 'Add New Brand'}
						</h4>
					</Modal.Header>
					<Form
						onSubmit={handleSubmit(
							editingBrand ? handleUpdateBrand : handleAddBrand
						)}>
						<Modal.Body>
							<Form.Group className="mb-3">
								<FormInput
									label="Name"
									type="text"
									name="name"
									containerClass="mb-3"
									register={register}
									placeholder="Enter Brand Name here.."
									errors={errors}
									control={control}
								/>
							</Form.Group>
							<Form.Group className="mb-2">
								<Form.Label>
									{editingBrand ? 'Upload New Image' : 'Upload Image'}
								</Form.Label>
								<div className="mb-2">
									<p
										style={{ fontSize: '0.8rem' }}
										className="text-danger mb-0">
										{'File Size: Upload images up to 5 MB.'}
									</p>
									<p
										style={{ fontSize: '0.8rem' }}
										className="text-danger mb-0">
										{'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
									</p>
									<p
										style={{ fontSize: '0.8rem' }}
										className="text-danger mb-0">
										{'Upload Limit: Only 1 image can be uploaded.'}
									</p>
								</div>
								<SingleFileUploader
									icon="ri-upload-cloud-2-line"
									text="Drop file here or click to upload a brand image."
									onFileUpload={(file: File) => setSelectedImage(file)}
								/>
								{editingBrand?.logo && (
									<div className="mt-3 d-flex flex-column">
										<Form.Label>Current Image</Form.Label>
										<img
											src={`${BASE_API}/${editingBrand.logo}`}
											alt="Brand"
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
								disabled={editingBrand ? !canUpdate : !canCreate}>
								{apiLoading
									? editingBrand
										? 'Updating...'
										: 'Adding...'
									: editingBrand
										? 'Update Brand'
										: 'Save Brand'}
							</Button>
						</Modal.Footer>
					</Form>
				</Modal>
			</Card>
		</>
	)
}

export default Brands
