import { FormInput, PageBreadcrumb } from '@/components'
import { Button, Card, Image, Modal, Table } from 'react-bootstrap'
import { useToggle } from '@/hooks'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import { useEffect, useRef, useState } from 'react'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { SimpleLoader } from '../other/SimpleLoader'
const LoyalityBanner = () => {
	const [isOpen, toggleModal] = useToggle()
	const [selectedImage, setSelectedImage] = useState<File | null>(null)
	const [sortOrder, setSortOrder] = useState<any>('')
	const fileUploaderRef = useRef<any>(null)
	const [formloading, setFormloading] = useState(false)
	const [bannerData, setBannerData] = useState<any>([])
	const { user, permissions, isSuperUser } = useAuthContext()
	const BASE_API = import.meta.env.VITE_BASE_API
	const [showImagePreview, setShowImagePreview] = useState(false)
	const [previewImageUrl, setPreviewImageUrl] = useState('')
	const [loading, setLoading] = useState(false)

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

	const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSortOrder(Number(e.target.value))
	}
	const handleSubmit = async (data: any) => {
		// ******************* basics *******************
		const formData = new FormData()
		formData.append('image', selectedImage as Blob)
		formData.append('sortOrder', sortOrder.toString())
		console.log('submittiing data ', {
			image: selectedImage,
			sortOrder: sortOrder,
		})
		console.log('form data ', ...formData)

		// ******************* api calls ************************
		try {
			setFormloading(true)
			const response = await fetch(`${BASE_API}/api/loyaltyBanners/upload`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			})
			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message)
			}
			const data_res = await response.json()
			if (data_res) {
				Swal.fire({
					title: 'Success!',
					text: 'Banner Added Successfully',
					icon: 'success',
					timer: 1500,
					showConfirmButton: false,
				})
				setSortOrder('')
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
	const deleteBanner = async (id: string) => {
		try {
			const response = await fetch(`${BASE_API}/api/loyaltyBanners/${id}`, {
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
				showConfirmButton: false,
			})
			getAllBanner()
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
			const response = await fetch(`${BASE_API}/api/loyaltyBanners`, {
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
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteBanner(id)
			}
		})
	}

	return (
		<>
			<PageBreadcrumb title="Loyality Banner" subName="Banners" />
			<Card>
				<Card.Header className="d-flex justify-content-between">
					<div>
						<h4 className="card-title mb-0">Loyality Banner</h4>
					</div>
					<div>
						<Button
							className="btn btn-soft-primary btn-sm"
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
								<th>Image</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{/* conditional rendering like if there is no banner data then show the message no data found */}
							{bannerData.length === 0 ? (
								<tr>
									<td colSpan={2} className="text-center">
										No data found
									</td>
								</tr>
							) : (
								bannerData.map((banner: any, index: number) => (
									<tr key={index}>
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
										<td>
											<Button
												variant="danger"
												className="ms-2"
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
						<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
							{'Recommended Size* : 910 x 420 px'}
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
						key="sortOrder"
						value={sortOrder}
						onChange={handleSortOrderChange}
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
export default LoyalityBanner
