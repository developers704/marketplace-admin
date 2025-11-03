import { PageBreadcrumb } from '@/components'
import {
	Button,
	Card,
	Form,
	Table,
	Pagination as BootstrapPagination,
	Modal,
} from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import { FileUploader } from '@/components/FileUploader'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import { Image } from 'react-bootstrap'

// basic tables
interface ProductImage {
	_id: string
	imageUrl: string
	sku: string
	status: 'unattached' | 'attached'
	createdAt: string
	updatedAt: string
}
const FeatureImages = () => {
	const { isSuperUser, permissions, user } = useAuthContext()
	const canUpdate = isSuperUser || permissions.Users?.Update
	const canDelete = isSuperUser || permissions.Users?.Delete
	const [selectedRows, setSelectedRows] = useState<string[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(15)
	const [showDeleteButton, setShowDeleteButton] = useState(false)
	const [gallery, setGallery] = useState<File[]>([])
	const [apiLoading, setApiLoading] = useState(false)
	const [showImagePreview, setShowImagePreview] = useState(false)
	const [previewImageUrl, setPreviewImageUrl] = useState('')
	const [images, setImages] = useState<ProductImage[]>([])
	const [selectedImage, setSelectedImage] = useState<File | null>(null)
	const [editingSku, setEditingSku] = useState<string | null>(null)
	const [updateModalOpen, setUpdateModalOpen] = useState(false)

	const BASE_API = import.meta.env.VITE_BASE_API
	const { token } = user

	const { handleSubmit } = useForm()

	useEffect(() => {
		getAllImages()
	}, [])

	useEffect(() => {
		setShowDeleteButton(selectedRows.length > 0)
	}, [selectedRows])

	const handleDeleteConfirmation = (sku: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'This image will be deleted!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Remove!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteImages([sku]) // Pass single SKU as array
			}
		})
	}

	const handleDeleteSelected = () => {
		Swal.fire({
			title: 'Are you sure?',
			text: `All the ${selectedRows.length} selected images will be deleted!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete them!',
		}).then((result) => {
			if (result.isConfirmed) {
				// Get SKUs from selected rows
				const selectedSkus = images
					.filter((img) => selectedRows.includes(img._id))
					.map((img) => img.sku)
				deleteImages(selectedSkus)
			}
		})
	}
	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelectedRows(images.map((img) => img._id))
		} else {
			setSelectedRows([])
		}
	}

	const handleSelectRow = (id: string) => {
		setSelectedRows((prev) =>
			prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
		)
	}

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
		setCurrentPage(1)
	}

	const handleImagePreview = (imageUrl: string) => {
		setPreviewImageUrl(`${BASE_API}${imageUrl}`)
		setShowImagePreview(true)
	}
	const handleUpdateImage = async (sku: string) => {
		setEditingSku(sku)
		setUpdateModalOpen(true)
	}

	// const filteredRecords = records
	// 	.filter((record) =>
	// 		record.name.toLowerCase().includes(searchTerm.toLowerCase())
	// 	)
	// 	.sort((a, b) =>
	// 		sortedAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
	// 	)

	// const handlePageChange = (page: number) => {
	// 	setCurrentPage(page)
	// }
	const filteredImages = images.filter((image) =>
		image.sku.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const totalPages = Math.ceil(filteredImages.length / itemsPerPage)
	const paginatedImages = filteredImages.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)
	const [isOpen, toggleModal] = useToggle() // Using toggle for modal state

	const getAllImages = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/product-images`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (!response.ok) {
				throw new Error('Failed to fetch images')
			}
			const data = await response.json()
			console.log('data get from the api is ', data)

			setImages(data)
		} catch (error) {
			console.error('Error fetching images:', error)
		}
	}
	const handleUploadImages = async (imagesData: any) => {
		const formData = new FormData()

		if (gallery.length > 0) {
			gallery.forEach((file) => {
				formData.append('images', file)
			})
		}

		try {
			setApiLoading(true)
			const response = await fetch(
				`${BASE_API}/api/product-images/bulk-upload`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				}
			)

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message)
			}

			const responseData = await response.json()
			Swal.fire({
				title: 'Upload Complete!',
				html: `
                    <div class="text-left">
                        <p>✅ ${responseData.successfullyUploaded
					} images uploaded successfully</p>
                        ${responseData.skipped > 0
						? `<p>⚠️ ${responseData.skipped} images skipped</p>`
						: ''
					}
                    </div>
                `,
				icon: 'success',
				confirmButtonText: 'Great!',
			})
			setGallery([])
			toggleModal()
			getAllImages() // Refresh the images list
		} catch (error: any) {
			Swal.fire({
				title: 'Error!',
				text: error.message,
				icon: 'error',
			})
		} finally {
			setApiLoading(false)
		}
	}

	const deleteImages = async (skus: string[]) => {
		try {
			const response = await fetch(
				`${BASE_API}/api/product-images/bulk-delete`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ skus }),
				}
			)

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to delete image(s)')
			}

			const data = await response.json()
			if (data) {
				Swal.fire({
					title: 'Deleted!',
					text: data.message,
					icon: 'success',
					confirmButtonText: 'OK',
					timer: 1500,
				})
				await getAllImages() // Refresh the images list
				setSelectedRows([]) // Clear selected rows
			}
		} catch (error: any) {
			console.error('Error deleting image(s):', error)
			Swal.fire({
				title: 'Oops!',
				text: error.message,
				icon: 'error',
			})
		}
	}
	// Add this function with your other functions
	const handleSyncImages = async () => {
		try {
			setApiLoading(true)
			const response = await fetch(
				`${BASE_API}/api/product-images/sync-images`,
				{
					method: 'PUT',
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			)

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message)
			}

			const data = await response.json()

			Swal.fire({
				title: 'Sync Complete!',
				html: `
                <div class="text-left">
                    <p>✅ Images synchronized successfully</p>
                    <p>Updated: ${data.updatedCount || 0} images</p>
                </div>
            `,
				icon: 'success',
				confirmButtonText: 'Great!',
				timer: 1500,
			})

			getAllImages() // Refresh the images list
		} catch (error: any) {
			Swal.fire({
				title: 'Error!',
				text: error.message,
				icon: 'error',
			})
		} finally {
			setApiLoading(false)
		}
	}

	const handleUpdateSubmit = async () => {
		if (!selectedImage || !editingSku) return

		const formData = new FormData()
		formData.append('image', selectedImage)

		try {
			setApiLoading(true)
			const response = await fetch(
				`${BASE_API}/api/product-images/${editingSku}`,
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
				throw new Error(errorMessage.message || 'Failed to update image')
			}

			const data = await response.json()

			// Update local state immediately with cache-busting
			setImages((prevImages) =>
				prevImages.map((img) =>
					img.sku === editingSku
						? {
							...img,
							imageUrl: `${data.productImage.imageUrl}?t=${Date.now()}`,
						}
						: img
				)
			)

			Swal.fire({
				title: 'Updated!',
				text: 'Image updated successfully!',
				icon: 'success',
				confirmButtonText: 'OK',
				timer: 1500,
			})
			setUpdateModalOpen(false)
			setSelectedImage(null)
			setEditingSku(null)
		} catch (error: any) {
			Swal.fire({
				title: 'Error!',
				text: error.message,
				icon: 'error',
			})
		} finally {
			setApiLoading(false)
		}
	}

	useEffect(() => {
		getAllImages()
	}, [])

	return (
		<>
			<PageBreadcrumb title="Images" subName="Products" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">Feature Image Management</h4>
							<p className="text-muted mb-0">
								Add and Manage your all Product Image here.
							</p>
						</div>
						<div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
							<Button
								style={{ border: 'none' }}
								variant="info"
								className="d-flex align-items-center mb-2 mb-sm-0"
								onClick={handleSyncImages}
								disabled={apiLoading}>
								{apiLoading ? 'Syncing...' : 'Sync Images'}
							</Button>
							<Button
								style={{ border: 'none' }}
								variant="success"
								className="d-flex align-items-center mb-2 mb-sm-0"
								onClick={toggleModal}>
								<i className="bi bi-plus me-2"></i> Bulk Import Image
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
							<Form>
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
										placeholder="Search Images here..."
										value={searchTerm}
										onChange={handleSearch}
										style={{
											backgroundColor: 'transparent',
											border: 'none',
											paddingLeft: '10px',
											color: '#333',
										}}
									/>
									<span className="ri-search-line search-icon text-muted" />
								</div>
							</Form>
						</div>
						<Form.Select
							value={itemsPerPage}
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
											checked={selectedRows.length === images.length}
										/>
									</th>
									<th>Image</th>
									<th>SKU</th>
									<th>Status</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{paginatedImages.length > 0 ? (
									paginatedImages.map((image, idx) => {
										const isSelected = selectedRows.includes(image._id)
										return (
											<tr key={idx}>
												<td>
													<input
														type="checkbox"
														checked={isSelected}
														onChange={() => handleSelectRow(image._id)}
													/>
												</td>
												<td>
													<img
														src={`${BASE_API}${image.imageUrl}`}
														alt="product-image"
														className="rounded cursor-pointer"
														style={{
															width: '150px',
															height: '100px',
															objectFit: 'cover',
															cursor: 'pointer',
														}}
														onClick={() => handleImagePreview(image.imageUrl)}
													/>
												</td>
												<td>{image.sku}</td>
												<td>
													<span
														className={`badge bg-${image.status === 'unattached'
																? 'warning'
																: 'success'
															}`}>
														{image.status}
													</span>
												</td>
												<td>
													<div className="d-flex">
														<Button
															variant="secondary"
															disabled={!canUpdate}
															onClick={() => handleUpdateImage(image.sku)}>
															<MdEdit />
														</Button>

														<Button
															variant="danger"
															className="ms-2"
															onClick={() =>
																handleDeleteConfirmation(image.sku)
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
										<td colSpan={5} className="text-center">
											No records found
										</td>
									</tr>
								)}
							</tbody>
						</Table>
						<nav className="d-flex justify-content-end mt-3">
							<BootstrapPagination className="pagination-rounded mb-0">
								<BootstrapPagination.Prev
									onClick={() =>
										currentPage > 1 && setCurrentPage(currentPage - 1)
									}
								/>
								{Array.from({ length: totalPages }, (_, index) => (
									<BootstrapPagination.Item
										key={index + 1}
										active={index + 1 === currentPage}
										onClick={() => setCurrentPage(index + 1)}>
										{index + 1}
									</BootstrapPagination.Item>
								))}
								<BootstrapPagination.Next
									onClick={() =>
										currentPage < totalPages && setCurrentPage(currentPage + 1)
									}
								/>
							</BootstrapPagination>
						</nav>
					</div>
				</Card.Body>

				{/* Upload Modal */}
				<Modal
					show={isOpen}
					onHide={toggleModal}
					dialogClassName="modal-dialog-centered">
					<Modal.Header closeButton>
						<h4 className="modal-title">Add Bulk Images</h4>
					</Modal.Header>
					<Form onSubmit={handleSubmit(handleUploadImages)}>
						<Modal.Body>
							<Form.Group className="mb-3">
								<Form.Label>Image</Form.Label>
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
								</div>
								<FileUploader
									icon="ri-upload-cloud-2-line"
									text="Drop files here or click to upload."
									onFileUpload={(files: any) => setGallery(files)}
								/>
							</Form.Group>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="light" onClick={toggleModal}>
								Close
							</Button>
							<Button variant="soft-success" type="submit">
								{apiLoading ? 'Saving..' : 'Save Images'}
							</Button>
						</Modal.Footer>
					</Form>
				</Modal>

				{/* Image Preview Modal */}
				<Modal
					show={showImagePreview}
					onHide={() => setShowImagePreview(false)}
					size="lg"
					centered>
					<Modal.Header closeButton>
						<Modal.Title>Image Preview</Modal.Title>
					</Modal.Header>
					<Modal.Body className="text-center">
						<Image src={previewImageUrl} alt="Image Preview" fluid />
					</Modal.Body>
				</Modal>

				{/* update Modal */}
				<Modal
					show={updateModalOpen}
					onHide={() => {
						setUpdateModalOpen(false)
						setSelectedImage(null)
						setEditingSku(null)
					}}
					dialogClassName="modal-dialog-centered">
					<Modal.Header closeButton>
						<h4 className="modal-title">Update Image</h4>
					</Modal.Header>
					<Modal.Body>
						<Form.Group className="mb-3">
							<Form.Label>Update Image</Form.Label>
							<div className="mb-2">
								<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
									{'File Size: Upload image up to 5 MB.'}
								</p>
								<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
									{'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
								</p>
							</div>
							<SingleFileUploader
								icon="ri-upload-cloud-2-line"
								text="Drop files here or click to upload."
								onFileUpload={(file: any) => setSelectedImage(file)}
							/>
						</Form.Group>
					</Modal.Body>
					<Modal.Footer>
						<Button
							variant="light"
							onClick={() => {
								setUpdateModalOpen(false)
								setSelectedImage(null)
								setEditingSku(null)
							}}>
							Close
						</Button>
						<Button
							variant="soft-success"
							onClick={handleUpdateSubmit}
							disabled={apiLoading}>
							{apiLoading ? 'Updating...' : 'Update Image'}
						</Button>
					</Modal.Footer>
				</Modal>
			</Card>
		</>
	)
}
export default FeatureImages
