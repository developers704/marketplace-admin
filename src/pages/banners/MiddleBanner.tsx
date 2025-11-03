import { FormInput, PageBreadcrumb } from '@/components'
import { Button, Card, Image, Modal, Table } from 'react-bootstrap'
import { useToggle } from '@/hooks'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import { useEffect, useRef, useState } from 'react'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { SimpleLoader } from '../other/SimpleLoader'
import { MdEdit } from 'react-icons/md'
import { toastService } from '@/common/context/toast.service'
const MiddleBanner = () => {
	const [isOpen, toggleModal] = useToggle()
	const [formloading, setFormloading] = useState(false)
	const [bannerData, setBannerData] = useState<any>([])
	const { user, permissions, isSuperUser } = useAuthContext()
	const [loading, setLoading] = useState(false)
	const BASE_API = import.meta.env.VITE_BASE_API
	const [showImagePreview, setShowImagePreview] = useState(false)
	const [previewImageUrl, setPreviewImageUrl] = useState('')
	const [selectedImage, setSelectedImage] = useState<File | null>(null)
	const [mobileImage, setMobileImage] = useState<File | null>(null)
	const [sortOrder, setSortOrder] = useState('')
	const [linkOne, setLinkOne] = useState('')
	const [linkTwo, setLinkTwo] = useState('')
	const fileUploaderRef = useRef<any>(null)
	const mobileFileUploaderRef = useRef<any>(null)
	const [isEditMode, setIsEditMode] = useState(false)
	const [selectedBanner, setSelectedBanner] = useState<any>(null)
	const [updateLoading, setUpdateLoading] = useState(false)

	const canCreate = isSuperUser || permissions.Banners?.Create
	const canDelete = isSuperUser || permissions.Banners?.Delete

	const { token } = user

	const handleToggleModal = () => {
		toggleModal()
	}
	const handleImagePreview = (imageUrl: string) => {
		setPreviewImageUrl(`${BASE_API}/${imageUrl}`)
		setShowImagePreview(true)
	}

	const handleSubmit = async () => {
		const formData = new FormData()
		if (selectedImage) formData.append('image', selectedImage)
		if (mobileImage) formData.append('mobileImage', mobileImage)
		formData.append('sortOrder', sortOrder)
		formData.append('linkOne', linkOne)
		formData.append('linkTwo', linkTwo)

		try {
			setFormloading(true)
			const response = await fetch(`${BASE_API}/api/middleBanners/upload`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			})

			if (!response.ok) {
				throw new Error('Failed to upload banners')
			}

			Swal.fire({
				title: 'Success!',
				text: 'Banners Added Successfully',
				icon: 'success',
				timer: 1500,
				confirmButtonColor: "#9c5100",
			})

			// Reset all fields
			setSelectedImage(null)
			setMobileImage(null)
			setSortOrder('')
			setLinkOne('')
			setLinkTwo('')
			if (fileUploaderRef.current) fileUploaderRef.current.resetFileInput()
			if (mobileFileUploaderRef.current) mobileFileUploaderRef.current.resetFileInput()

			getAllBanner()
			toggleModal()
		} catch (error) {
			Swal.fire('Error', 'Failed to upload banners', 'error')
		} finally {
			setFormloading(false)
		}
	}
	const handleUpdate = async () => {
		if (!selectedBanner) return

		try {
			setUpdateLoading(true)
			const response = await fetch(`${BASE_API}/api/middleBanners/${selectedBanner._id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					sortOrder: Number(sortOrder),
					linkOne: linkOne,
					linkTwo: linkTwo,
				}),
			})

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message)
			}

			Swal.fire({
				title: 'Success!',
				text: 'Banner Updated Successfully',
				icon: 'success',
				timer: 1500,
				confirmButtonColor: "#9c5100",
			})

			getAllBanner()
			handleToggleModal()
			setIsEditMode(false)
			setSelectedBanner(null)
		} catch (error:any) {
			toastService.error(error.message || 'Failed to update banner')
		} finally {
			setUpdateLoading(false)
		}
	}
	const deleteBanner = async (id: string) => {
		try {
			const response = await fetch(`${BASE_API}/api/middleBanners/${id}`, {
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
				text: 'Banner Deleted Successfully',
				icon: 'success',
				timer: 1500,
				confirmButtonColor: "#9c5100",
			})
			getAllBanner()
		} catch (error: any) {
			Swal.fire({
				title: 'Oops!',
				text: error.message,
				icon: 'error',
				timer: 1500,
				confirmButtonColor: "#9c5100",
			})
		}
	}
	const getAllBanner = async () => {
		try {
			setLoading(true)
			const response = await fetch(`${BASE_API}/api/middleBanners/`, {
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

	// ******************* helping functions *************************
	useEffect(() => {
		getAllBanner()
	}, [])
	if (loading) {
		return <SimpleLoader />
	}
	const handledeleteBannerConfirm = (id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Did You want to remove this banner Image!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: "#9c5100",
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteBanner(id)
			}
		})
	}
	const handleEditClick = (banner: any) => {
		setIsEditMode(true)
		setSelectedBanner(banner)
		setSortOrder(banner.sortOrder)
		setLinkOne(banner.linkOne)
		setLinkTwo(banner.linkTwo)
		handleToggleModal()
	}
	return (
		<>
			<PageBreadcrumb title="Last Banner" subName="Banners" />
			<Card>
				<Card.Header className="d-flex justify-content-between">
					<div>
						<h4 className="card-title mb-0">Last Banner</h4>
					</div>
					<div>
						<Button
							className="btn btn-soft-success"
							onClick={handleToggleModal}
							disabled={!canCreate}>
							<i className="bi bi-plus"></i> Add New Banner
						</Button>
					</div>
				</Card.Header>
				<Card.Body>
					<Table className="table-striped table-centered mb-0">
						<thead>
							<tr>
								<th>S. No</th>
								<th>Desktop Image</th>
								<th>Mobile Image</th>
								<th>Google Play Link</th>
								<th>App Store Link</th>
								<th>SortOrder</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{/* conditional rendering like if there is no banner data then show the message no data found */}
							{bannerData.length === 0 ? (
								<tr>
									<td colSpan={7} className="text-center">
										No data found
									</td>
								</tr>
							) : (
								bannerData.map((banner: any, index: number) => (
									<tr key={index}>
										<td>{index + 1}</td>
										<td className="">
											<Image
												src={`${BASE_API}/${banner.imageUrl}`}
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
										</td>
										<td className="">
											<Image
												src={`${BASE_API}/${banner.mobileImageUrl}`}
												alt="banner"
												className="rounded cursor-pointer"
												width={200}
												fluid
												onClick={() => handleImagePreview(banner.mobileImageUrl)}
												style={{
													cursor: 'pointer',
													height: '100px',
													objectFit: 'cover',
												}}
											/>
										</td>
										<td>{banner?.linkOne}</td>
										<td>{banner?.linkTwo}</td>
										<td>{banner?.sortOrder}</td>
										<td>
											<Button
												variant="secondary"
												className="me-2"
												onClick={() => handleEditClick(banner)}
											>
													<MdEdit />
											</Button>
											<Button
												variant="danger"
												className="me-2"
												disabled={!canDelete}
												onClick={() => handledeleteBannerConfirm(banner._id)}>
												<i className="bi bi-trash"></i>
											</Button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</Table>
				</Card.Body>
			</Card>
			<Modal show={isOpen} onHide={handleToggleModal}>
				<Modal.Header closeButton>
					<h4 className="modal-title">
						{isEditMode ? 'Update Banner' : 'Add New Banners'}
					</h4>
				</Modal.Header>
				<Modal.Body>
					{!isEditMode && (
						<>
							<h4>Upload Desktop Banner</h4>
							<div className="mb-2">
								<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
									File Size: Upload images up to 5 MB.
								</p>
								<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
									Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).
								</p>
								<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
									Recommended Size* : 910 x 420 px
								</p>
							</div>
							<SingleFileUploader
								ref={fileUploaderRef}
								icon="ri-upload-cloud-2-line"
								text="Drop file here or click to upload desktop banner."
								onFileUpload={(file: File) => setSelectedImage(file)}
							/>

							<h4 className="mt-4">Upload Mobile Banner</h4>
							<SingleFileUploader
								ref={mobileFileUploaderRef}
								icon="ri-upload-cloud-2-line"
								text="Drop file here or click to upload mobile banner."
								onFileUpload={(file: File) => setMobileImage(file)}
							/>
						</>
					)}
					<FormInput
						label="Google Play Link"
						type="url"
						name="linkOne"
						containerClass="mt-3"
						value={linkOne}
						onChange={(e) => setLinkOne(e.target.value)}
						placeholder="Enter desktop banner link"
					/>

					<FormInput
						label="App Store Link"
						type="url"
						name="linkTwo"
						containerClass="mt-3"
						value={linkTwo}
						onChange={(e) => setLinkTwo(e.target.value)}
						placeholder="Enter mobile banner link"
					/>

					<FormInput
						label="Sort Order (Optional)"
						type="number"
						name="sortOrder"
						containerClass="mt-3"
						value={sortOrder}
						onChange={(e) => setSortOrder(e.target.value)}
					/>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="light" onClick={handleToggleModal}>
						Close
					</Button>
					<Button
						variant="soft-success"
						onClick={isEditMode ? handleUpdate : handleSubmit}
					>
						{isEditMode
							? (updateLoading ? 'Updating...' : 'Update Banner')
							: (formloading ? 'Saving...' : 'Save Banners')
						}
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
		</>
	)
}
export default MiddleBanner
