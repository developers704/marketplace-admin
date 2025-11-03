import { FormInput, PageBreadcrumb } from '@/components'
import { Button, Card, Image, Modal, Table } from 'react-bootstrap'
import { useToggle } from '@/hooks'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import { useEffect, useRef, useState } from 'react'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { PolicyPageLoader } from '../other/SimpleLoader'
import { MdEdit } from 'react-icons/md'
import { toastService } from '@/common/context/toast.service'

const MainBanner = () => {
	const [isOpen, toggleModal] = useToggle()
	const [selectedImage, setSelectedImage] = useState<File | null>(null)
	const [loading, setLoading] = useState(false)
	const [sortOrder, setSortOrder] = useState<any>('')
	const fileUploaderRef = useRef<any>(null)
	const [formloading, setFormloading] = useState(false)
	const [bannerData, setBannerData] = useState<any>([])
	const { user, permissions, isSuperUser } = useAuthContext()
	const BASE_API = import.meta.env.VITE_BASE_API
	const [showImagePreview, setShowImagePreview] = useState(false)
	const [previewImageUrl, setPreviewImageUrl] = useState('')
	const [isMobileOpen, toggleMobileModal] = useToggle()
	const [mobileBannerData, setMobileBannerData] = useState<any>([])
	const [selectedMobileImage, setSelectedMobileImage] = useState<File | null>(
		null
	)
	const [bannerLink, setBannerLink] = useState('')
	const [mobileBannerLink, setMobileBannerLink] = useState('')
	const [mobileSortOrder, setMobileSortOrder] = useState<any>('')
	const mobileFileUploaderRef = useRef<any>(null)
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [isMobileEditModalOpen, setIsMobileEditModalOpen] = useState(false)
	const [editingBanner, setEditingBanner] = useState<any>(null)
	const [editingSortOrder, setEditingSortOrder] = useState('')
	const [editingLink, setEditingLink] = useState('')

	const canCreate = isSuperUser || permissions.Banners?.Create
	const canDelete = isSuperUser || permissions.Banners?.Delete

	const { token } = user

	const handleToggleModal = () => {
		if (isOpen) {
			setSortOrder('')
			setBannerLink('')
			setSelectedImage(null)
			if (fileUploaderRef.current) {
				fileUploaderRef.current.resetFileInput()
			}
		}
		toggleModal()
	}
	const handleMobileToggleModal = () => {
		if (isMobileOpen) {
			setMobileSortOrder('')
			setMobileBannerLink('')
			setSelectedMobileImage(null)
			if (mobileFileUploaderRef.current) {
				mobileFileUploaderRef.current.resetFileInput()
			}
		}
		toggleMobileModal()
	}

	const handleImagePreview = (imageUrl: string) => {
		setPreviewImageUrl(`${BASE_API}/${imageUrl}`)
		setShowImagePreview(true)
	}

	const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSortOrder(Number(e.target.value))
	}
	const handleSubmit = async (data: any) => {
		// ******************* basics *******************
		const formData = new FormData()
		formData.append('image', selectedImage as Blob)
		formData.append('sortOrder', sortOrder.toString())
		formData.append('link', bannerLink)

		// ******************* api calls ************************
		try {
			setFormloading(true)
			const response = await fetch(`${BASE_API}/api/slider/upload`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			})

			const responseData = await response.json()

			if (!response.ok) {
				throw new Error(responseData.error || responseData.message || 'Something went wrong')
			}

			if (responseData) {
				Swal.fire({
					title: 'Success!',
					text: 'Banner Added Successfully',
					icon: 'success',
					timer: 1500,
					confirmButtonColor: "#9c5100",
				})
				setSortOrder('')
				setBannerLink('')
				setSelectedImage(null)
				if (fileUploaderRef.current) {
					fileUploaderRef.current.resetFileInput()
				}
				getAllBanner()
			}
		} catch (error: any) {
			Swal.fire({
				title: 'Oops!',
				text: error.message,
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setFormloading(false)
		}

	}
	const deleteBanner = async (id: string, type: 'slider' | 'mobileSlider') => {
		try {
			const endpoint = type === 'slider' ? 'slider' : 'mobileSlider'
			const response = await fetch(`${BASE_API}/api/${endpoint}/${id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message)
			}
			Swal.fire({
				title: 'Deleted!',
				text: `${type === 'slider' ? 'Banner' : 'Mobile Banner'
					} Deleted Successfully`,
				icon: 'success',
				timer: 1500,
				confirmButtonColor: "#9c5100",
			})

			// Refresh the appropriate list
			if (type === 'slider') {
				getAllBanner()
			} else {
				getAllMobileBanner()
			}
		} catch (error: any) {
			Swal.fire({
				title: 'Oops!',
				text: error.message,
				icon: 'error',
				timer: 1500,
			})
		}
	}

	const getAllBanner = async () => {
		try {
			setLoading(true)
			const response = await fetch(`${BASE_API}/api/slider`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message)
			}
			const data_res = await response.json()
			if (data_res) {
				setBannerData(data_res)
				console.log('get the data of banner ', data_res)
			}
		} catch (error: any) {
			console.error('Error fetching banners:', error)
		} finally {
			setLoading(false)
		}
	}
	const handleUpdateBanner = async (id: string) => {
		try {
			const response = await fetch(`${BASE_API}/api/slider/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					sortOrder: Number(editingSortOrder),
					link: editingLink
				}),
			})

			const responseData = await response.json()

			if (!response.ok) {
				throw new Error(responseData.error || responseData.message || 'Something went wrong')
			}
			getAllBanner()
			setIsEditModalOpen(false)
			setEditingBanner(null)

			Swal.fire({
				title: 'Success!',
				text: 'Banner updated successfully',
				icon: 'success',
				timer: 1500,
			})
		} catch (error: any) {
			toastService.error(error.message || 'Failed to update banner')
		}
	}

	const handleMobileSortOrderChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setMobileSortOrder(Number(e.target.value))
	}

	const handleMobileSubmit = async () => {
		const formData = new FormData()
		formData.append('image', selectedMobileImage as Blob)
		formData.append('sortOrder', mobileSortOrder.toString())
		formData.append('link', mobileBannerLink)

		try {
			setFormloading(true)
			const response = await fetch(`${BASE_API}/api/mobileSlider/upload`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			})
			const responseData = await response.json()

			if (!response.ok) {
				throw new Error(responseData.error || responseData.message || 'Something went wrong')
			}
			if (responseData) {
				Swal.fire({
					title: 'Success!',
					text: 'Mobile Banner Added Successfully',
					icon: 'success',
					timer: 1500,
					confirmButtonColor: "#9c5100",
				})
				setMobileSortOrder('')
				setMobileBannerLink('')
				setSelectedMobileImage(null)
				if (mobileFileUploaderRef.current) {
					mobileFileUploaderRef.current.resetFileInput()
				}
				getAllMobileBanner()
			}
		} catch (error: any) {
			Swal.fire({
				title: 'Oops!',
				text: error.message,
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setFormloading(false)
		}
	}

	const getAllMobileBanner = async () => {
		try {
			setLoading(true)
			const response = await fetch(`${BASE_API}/api/mobileSlider`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message)
			}
			const data_res = await response.json()
			if (data_res) {
				setMobileBannerData(data_res)
			}
		} catch (error: any) {
			console.error('Error fetching mobile banners:', error)
		} finally {
			setLoading(false)
		}
	}
	const handleUpdateMobileBanner = async (id: string) => {
		try {
			const response = await fetch(`${BASE_API}/api/mobileSlider/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					sortOrder: Number(editingSortOrder),
					link: editingLink
				}),
			})

			const responseData = await response.json()

			if (!response.ok) {
				throw new Error(responseData.error || responseData.message || 'Something went wrong')
			}

			getAllMobileBanner()
			setIsMobileEditModalOpen(false)
			setEditingBanner(null)

			Swal.fire({
				title: 'Success!',
				text: 'Mobile banner updated successfully',
				icon: 'success',
				timer: 1500,
			})
		} catch (error: any) {
			toastService.error(error.message || 'Failed to update banner')
		}
	}
	// ******************* helping functions *************************
	useEffect(() => {
		getAllBanner()
		getAllMobileBanner()
	}, [])

	const handledeleteBannerConfirm = (
		id: string,
		type: 'slider' | 'mobileSlider'
	) => {
		Swal.fire({
			title: 'Are you sure?',
			text: `Did You want to remove this ${type === 'slider' ? 'banner' : 'mobile banner'
				} Image!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: "#9c5100",
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteBanner(id, type)
			}
		})
	}

	if (loading) {
		return <PolicyPageLoader />
	}

	return (
		<>
			<PageBreadcrumb title="Main Banner" subName="Banners" />
			<Card>
				<Card.Header className="d-flex justify-content-between">
					<div>
						<h4 className="header-title">Main Desktop Banner</h4>
						<p className="text-muted mb-0">
							Add and Manage your all Desktop banners here.
						</p>
					</div>
					<div>
						<Button
							className="btn btn-soft-success me-2"
							onClick={handleToggleModal}
							disabled={!canCreate}>
							<i className="bi bi-plus"></i> Add New Banner
						</Button>
					</div>
				</Card.Header>
				<Card.Body>
					<div className='table-responsive-sm'>
						<Table className="table-striped table-centered mb-0">
							<thead>
								<tr>
									<th>S. No</th>
									<th>Image</th>
									<th>Sort Order</th>
									<th>Link</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{/* conditional rendering like if there is no banner data then show the message no data found */}
								{bannerData?.length === 0 ? (
									<tr>
										<td colSpan={5} className="text-center">
											No data found
										</td>
									</tr>
								) : (
									(bannerData || [])?.map((banner: any, index: number) => (
										<tr key={index}>
											<td>{index + 1}</td>
											<td className="">
												{banner?.imageUrl ? (
													<Image
														src={`${BASE_API}/${banner?.imageUrl}`}
														alt="banner"
														className="rounded cursor-pointer"
														width={200}
														fluid
														onClick={() => handleImagePreview(banner.imageUrl)}
														style={{
															cursor: 'pointer',
															height: '100px',
															objectFit: 'cover',
														}}
													/>
												) : (
													<div
														className="d-flex align-items-center justify-content-center bg-light rounded"
														style={{
															width: '200px',
															height: '100px'
														}}
													>
														<div className="text-center text-muted">
															<i className="ri-image-2-line fs-2"></i>
															<div className="mt-1">No Image Available</div>
														</div>
													</div>
												)}
											</td>

											<td>{banner?.sortOrder}</td>
											<td>
												<a>
													{banner?.link}
												</a>
											</td>
											<td>
												<Button
													variant="secondary"
													className="me-2"
													onClick={() => {
														setEditingBanner(banner)
														setEditingSortOrder(banner.sortOrder)
														setEditingLink(banner.link)
														setIsEditModalOpen(true)
													}}>
													<MdEdit />
												</Button>
												<Button
													variant="danger"
													className="ms-2"
													onClick={() =>
														handledeleteBannerConfirm(banner?._id, 'slider')
													}
													disabled={!canDelete}>
													<i className="bi bi-trash"></i>
												</Button>
											</td>
										</tr>
									))
								)}
							</tbody>
						</Table>
					</div >
				</Card.Body>
			</Card>
			{/* Mobile Banner Section */}
			<Card className="mt-4">
				<Card.Header className="d-flex justify-content-between">
					<div>
						<h4 className="header-title">Main Mobile Banner</h4>
						<p className="text-muted mb-0">
							Add and Manage your all Mobile banners here.
						</p>
					</div>
					<div>
						<Button
							className="btn btn-soft-success "
							onClick={handleMobileToggleModal}
							disabled={!canCreate}>
							<i className="bi bi-plus"></i> Add New Banner
						</Button>
					</div>
				</Card.Header>
				<Card.Body>
					<div className='table-responsive-sm'>
						<Table className="table-striped table-centered mb-0">
							<thead>
								<tr>
									<th>S. No</th>
									<th>Image</th>
									<th>Sort Order</th>
									<th>Link</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{mobileBannerData?.length === 0 ? (
									<tr>
										<td colSpan={5} className="text-center">
											No data found
										</td>
									</tr>
								) : (
									(mobileBannerData || [])?.map((banner: any, index: number) => (
										<tr key={index}>
											<td>{index + 1}</td>
											<td>
												<Image
													src={`${BASE_API}/${banner?.imageUrl}`}
													alt="mobile banner"
													className="rounded cursor-pointer"
													width={200}
													fluid
													onClick={() => handleImagePreview(banner?.imageUrl)}
													style={{
														cursor: 'pointer',
														height: '100px',
														objectFit: 'cover',
													}}
												/>
											</td>
											<td>{banner?.sortOrder}</td>
											<td>
												<a>
													{banner?.link}
												</a>
											</td>
											<td>
												<Button
													variant="secondary"
													className="me-2"
													onClick={() => {
														setEditingBanner(banner)
														setEditingSortOrder(banner.sortOrder)
														setEditingLink(banner.link)
														setIsMobileEditModalOpen(true)
													}}>
													<MdEdit />
												</Button>
												<Button
													variant="danger"
													className="me-2"
													onClick={() =>
														handledeleteBannerConfirm(banner._id, 'mobileSlider')
													}
													disabled={!canDelete}>
													<i className="bi bi-trash"></i>
												</Button>
											</td>
										</tr>
									))
								)}
							</tbody>
						</Table>
					</div>

				</Card.Body>
			</Card>

			<Modal
				show={isOpen}
				onHide={handleToggleModal}
				dialogClassName="modal-dialog-centered">
				<Modal.Header closeButton>
					<h4 className="modal-title">Add New Banner</h4>
				</Modal.Header>
				<Modal.Body>
					<h4>Upload Banner</h4>
					<div className="mb-2">
						<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
							{'File Size: Upload images up to 5 MB.'}
						</p>
						<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
							{'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
						</p>
						<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
							{'Upload Limit: Only 1 image can be uploaded.'}
						</p>
					</div>
					<SingleFileUploader
						ref={fileUploaderRef}
						icon="ri-upload-cloud-2-line"
						text="Drop file here or click to upload a brand image."
						onFileUpload={(file: File) => setSelectedImage(file)}
					/>
					<FormInput
						label="Sort Order (Optional)"
						type="number"
						name="sortOrder"
						containerClass="mt-3"
						value={sortOrder}
						onChange={handleSortOrderChange}
					/>
					<FormInput
						label="Banner Link"
						type="url"
						name="bannerLink"
						containerClass="mt-3"
						value={bannerLink}
						onChange={(e) => setBannerLink(e.target.value)}
						placeholder="Enter banner link"
					/>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="light" onClick={handleToggleModal}>
						Close
					</Button>
					<Button variant="soft-success" onClick={handleSubmit}>
						{formloading ? 'Saving..' : 'Save Banner'}
					</Button>
				</Modal.Footer>
			</Modal>
			<Modal
				show={isEditModalOpen}
				onHide={() => setIsEditModalOpen(false)}
				dialogClassName="modal-dialog-centered"
			>
				<Modal.Header closeButton>
					<h4 className="modal-title">Update Banner</h4>
				</Modal.Header>
				<Modal.Body>
					<FormInput
						label="Sort Order"
						type="number"
						name="editSortOrder"
						containerClass="mb-3"
						value={editingSortOrder}
						onChange={(e) => setEditingSortOrder(e.target.value)}
					/>
					<FormInput
						label="Banner Link"
						type="url"
						name="editLink"
						containerClass="mb-3"
						value={editingLink}
						onChange={(e) => setEditingLink(e.target.value)}
						placeholder="Enter banner link"
					/>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="light" onClick={() => setIsEditModalOpen(false)}>
						Close
					</Button>
					<Button
						variant="success"
						onClick={() => handleUpdateBanner(editingBanner._id)}
					>
						Update Banner
					</Button>
				</Modal.Footer>
			</Modal>
			<Modal
				show={showImagePreview}
				onHide={() => setShowImagePreview(false)}
				size="lg"
				centered>
				<Modal.Header closeButton>
					<Modal.Title>Banner Preview</Modal.Title>
				</Modal.Header>
				<Modal.Body className="text-center">
					<Image src={previewImageUrl} alt="Banner Preview" fluid />
				</Modal.Body>
			</Modal>
			<Modal
				show={isMobileOpen}
				onHide={handleMobileToggleModal}
				dialogClassName="modal-dialog-centered">
				<Modal.Header closeButton>
					<h4 className="modal-title">Add New Mobile Banner</h4>
				</Modal.Header>
				<Modal.Body>
					<h4>Upload Mobile Banner</h4>
					<div className="mb-2">
						<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
							{'File Size: Upload images up to 5 MB.'}
						</p>
						<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
							{'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
						</p>
						<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
							{'Upload Limit: Only 1 image can be uploaded.'}
						</p>
					</div>
					<SingleFileUploader
						ref={mobileFileUploaderRef}
						icon="ri-upload-cloud-2-line"
						text="Drop file here or click to upload a mobile banner image."
						onFileUpload={(file: File) => setSelectedMobileImage(file)}
					/>
					<FormInput
						label="Sort Order (Optional)"
						type="number"
						name="mobileSortOrder"
						containerClass="mt-3"
						value={mobileSortOrder}
						onChange={handleMobileSortOrderChange}
					/>
					<FormInput
						label="Banner Link"
						type="url"
						name="mobileBannerLink"
						containerClass="mt-3"
						value={mobileBannerLink}
						onChange={(e) => setMobileBannerLink(e.target.value)}
						placeholder="Enter banner link"
					/>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="light" onClick={handleMobileToggleModal}>
						Close
					</Button>
					<Button variant="soft-success" onClick={handleMobileSubmit}>
						{formloading ? 'Saving..' : 'Save Mobile Banner'}
					</Button>
				</Modal.Footer>
			</Modal>
			<Modal
				show={isMobileEditModalOpen}
				onHide={() => setIsMobileEditModalOpen(false)}
				dialogClassName="modal-dialog-centered"
			>
				<Modal.Header closeButton>
					<h4 className="modal-title">Update Mobile Banner</h4>
				</Modal.Header>
				<Modal.Body>
					<FormInput
						label="Sort Order"
						type="number"
						name="editMobileSortOrder"
						containerClass="mb-3"
						value={editingSortOrder}
						onChange={(e) => setEditingSortOrder(e.target.value)}
					/>
					<FormInput
						label="Banner Link"
						type="url"
						name="editMobileLink"
						containerClass="mb-3"
						value={editingLink}
						onChange={(e) => setEditingLink(e.target.value)}
						placeholder="Enter banner link"
					/>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="light" onClick={() => setIsMobileEditModalOpen(false)}>
						Close
					</Button>
					<Button
						variant="success"
						onClick={() => handleUpdateMobileBanner(editingBanner._id)}
					>
						Update Mobile Banner
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}
export default MainBanner
