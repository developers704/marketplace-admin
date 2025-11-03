import { FormInput, PageBreadcrumb } from '@/components'
import {
	Button,
	Card,
	Form,
	Table,
	Pagination as BootstrapPagination,
	Modal,
} from 'react-bootstrap'
import avatar2 from '@/assets/images/users/avatar-2.jpg'
import avatar3 from '@/assets/images/users/avatar-3.jpg'
import avatar4 from '@/assets/images/users/avatar-4.jpg'
import avatar5 from '@/assets/images/users/avatar-5.jpg'
import { useEffect, useState } from 'react'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import { useForm } from 'react-hook-form'

// basic tables
interface TableRecord {
	id: number
	name: string
	phoneNo: string
	dob: string
	country: string
	accountNo: string
	image: string
	cell: string
	activeClass?: string
}
const records: TableRecord[] = [
	{
		id: 1,
		name: 'Risa D. Pearson',
		phoneNo: '336-508-2157',
		dob: 'July 24, 1950',
		country: 'India',
		accountNo: 'AC336 508 2157',
		image: avatar2,
		cell: 'Cell',
		activeClass: 'table-active',
	},
	{
		id: 2,
		name: 'Ann C. Thompson',
		phoneNo: '646-473-2057',
		dob: 'January 25, 1959',
		country: 'USA',
		accountNo: 'SB646 473 2057',
		image: avatar3,
		cell: 'Cell',
	},
	{
		id: 3,
		name: 'Paul J. Friend',
		phoneNo: '281-308-0793',
		dob: 'September 1, 1939',
		country: 'Canada',
		accountNo: 'DL281 308 0793',
		image: avatar4,
		cell: 'Cell',
	},
	{
		id: 4,
		name: 'Linda G. Smith',
		phoneNo: '606-253-1207',
		dob: 'May 3, 1962',
		country: 'Brazil',
		accountNo: 'CA269 714 6825',
		image: avatar5,
		cell: 'Cell',
	},
	{
		id: 5,
		name: 'Linda G. Smith',
		phoneNo: '606-253-1207',
		dob: 'May 3, 1962',
		country: 'Brazil',
		accountNo: 'CA269 714 6825',
		image: avatar5,
		cell: 'Cell',
	},
	{
		id: 6,
		name: 'Linda G. Smith',
		phoneNo: '606-253-1207',
		dob: 'May 3, 1962',
		country: 'Brazil',
		accountNo: 'CA269 714 6825',
		image: avatar5,
		cell: 'Cell',
	},
	{
		id: 7,
		name: 'Linda G. Smith',
		phoneNo: '606-253-1207',
		dob: 'May 3, 1962',
		country: 'Brazil',
		accountNo: 'CA269 714 6825',
		image: avatar5,
		cell: 'Cell',
	},
	{
		id: 8,
		name: 'Linda G. Smith',
		phoneNo: '606-253-1207',
		dob: 'May 3, 1962',
		country: 'Brazil',
		accountNo: 'CA269 714 6825',
		image: avatar5,
		cell: 'Cell',
	},
	{
		id: 9,
		name: 'Linda G. Smith',
		phoneNo: '606-253-1207',
		dob: 'May 3, 1962',
		country: 'Brazil',
		accountNo: 'CA269 714 6825',
		image: avatar5,
		cell: 'Cell',
	},
	{
		id: 10,
		name: 'Linda G. Smith',
		phoneNo: '606-253-1207',
		dob: 'May 3, 1962',
		country: 'Brazil',
		accountNo: 'CA269 714 6825',
		image: avatar5,
		cell: 'Cell',
	},
	{
		id: 11,
		name: 'Linda G. Smith',
		phoneNo: '606-253-1207',
		dob: 'May 3, 1962',
		country: 'Brazil',
		accountNo: 'CA269 714 6825',
		image: avatar5,
		cell: 'Cell',
	},
]
const SampleBasics = () => {
	const { isSuperUser, permissions } = useAuthContext()
	const canUpdate = isSuperUser || permissions.Users?.Update
	const canDelete = isSuperUser || permissions.Users?.Delete
	const [selectedRows, setSelectedRows] = useState<number[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(15)
	const [sortedAsc, setSortedAsc] = useState(true)
	const [showDeleteButton, setShowDeleteButton] = useState(false)
	const [selectedImage, setSelectedImage] = useState<File | null>(null)

	const {
		handleSubmit,
		register,
		control,
		formState: { errors },
	} = useForm()

	useEffect(() => {
		setCurrentPage(1)
		setShowDeleteButton(selectedRows.length > 0)
	}, [itemsPerPage, selectedRows])

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
				// deleteUser(userId)
				console.log('delete user success')
			}
		})
		console.log('Delete IDs:', selectedRows)
	}
	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelectedRows(records.map((record) => record.id))
		} else {
			setSelectedRows([])
		}
	}

	const handleSelectRow = (id: number) => {
		setSelectedRows((prev) =>
			prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
		)
	}
	const handleDeleteConfirmation = (userId: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'This Items will be deleted!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Remove!',
		}).then((result) => {
			if (result.isConfirmed) {
				// deleteUser(userId)
				console.log('delete user success')
			}
		})
	}
	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
	}

	const handleSort = () => {
		setSortedAsc(!sortedAsc)
	}

	const filteredRecords = records
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
	const handleAddCategory = (categoryData: any) => {
		// You can further handle this data and send it to an API endpoint here
		console.log('Category Data:', categoryData)

		const formData = new FormData()
		formData.append('name', categoryData.name)
		formData.append('description', categoryData.description)

		if (selectedImage) {
			formData.append('image', selectedImage)
		}
		// console.log('Name:', formData.get('name'))
		// console.log('Description:', formData.get('description'))
		// console.log('Image:', formData.get('image'))
	}
	return (
		<>
			<PageBreadcrumb title="Categories" subName="Products" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">Category Management</h4>
							<p className="text-muted mb-0">
								Add and Manage your all Product categories here.
							</p>
						</div>
						<div className="mt-3 mt-lg-0">
							{' '}
							{/* Responsive margin for small screens */}
							<Button
								style={{ border: 'none' }}
								variant="success"
								onClick={toggleModal}>
								<i className="bi bi-plus"></i> Add New Category
							</Button>
							{showDeleteButton && (
								<Button
									variant="danger"
									className="ms-2"
									onClick={handleDeleteSelected}>
									Delete All Selected
								</Button>
							)}
						</div>
					</div>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
						<Form.Control
							type="text"
							placeholder="Search Category by name"
							value={searchTerm}
							onChange={handleSearch}
							className="me-2"
						/>
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
											checked={selectedRows.length === records.length}
										/>{' '}
									</th>

									<th>Image</th>
									<th>
										<span onClick={handleSort} style={{ cursor: 'pointer' }}>
											Name {sortedAsc ? '↑' : '↓'}
										</span>
									</th>
									<th>Description</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{paginatedRecords.length > 0 ? (
									(paginatedRecords || []).map((record, idx) => {
										const isSelected = selectedRows.includes(record.id)
										return (
											<tr key={idx}>
												<td>
													<input
														type="checkbox"
														checked={isSelected}
														onChange={() => handleSelectRow(record.id)}
													/>
												</td>

												<td className="table-user">
													<img
														src={record.image}
														alt="table-user"
														className="me-2 rounded-circle"
													/>
												</td>
												<td>{record.name}</td>
												<td>{record.dob}</td>
												<td>
													<div className="d-flex">
														<Button
															variant="secondary"
															disabled={!canUpdate}
															onClick={toggleModal}>
															<MdEdit />
														</Button>
														<Button
															variant="danger"
															className="ms-2"
															onClick={() =>
																handleDeleteConfirmation(record.id.toString())
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
				{/* Modal for adding a new category */}
				<Modal
					show={isOpen}
					onHide={toggleModal}
					dialogClassName="modal-dialog-centered">
					<Modal.Header closeButton>
						<h4 className="modal-title">Add New Category</h4>
					</Modal.Header>
					<Form onSubmit={handleSubmit(handleAddCategory)}>
						<Modal.Body>
							<Form.Group className="mb-3">
								<FormInput
									label="Name"
									type="text"
									name="name"
									containerClass="mb-3"
									register={register}
									placeholder="Enter Category Name here.."
									errors={errors}
									control={control}
								/>
							</Form.Group>
							<Form.Group className="mb-3">
								<FormInput
									label="Description"
									type="textarea"
									name="description"
									containerClass="mb-3"
									register={register}
									placeholder="Enter Description here.."
									errors={errors}
									control={control}
								/>
							</Form.Group>
							<Form.Group className="mb-3">
								<Form.Label>Image</Form.Label>
								<SingleFileUploader
									icon="ri-upload-cloud-2-line"
									text="Drop file here or click to upload a product image."
									onFileUpload={(file: File) => setSelectedImage(file)} // Handle image selection separately
								/>
							</Form.Group>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="light" onClick={toggleModal}>
								Close
							</Button>
							<Button variant="soft-success" type="submit">
								Save Category
							</Button>
						</Modal.Footer>
					</Form>
				</Modal>
			</Card>
		</>
	)
}
export default SampleBasics

// const getCustomerData = async () => {
// 		try {
// 			setLoading(true)
// 			const response = await fetch(`${BASE_API}/api/customers`, {
// 				method: 'GET',
// 				headers: {
// 					Authorization: `Bearer ${token}`,
// 					'Content-Type': 'application/json',
// 				},
// 			})

// 			if (!response.ok) {
// 				const errorMessage = await response.json()
// 				throw new Error(errorMessage.message || 'Failed to fetch customer data')
// 			}

// 			const data_res = await response.json()

// 			// Set both the main data and paginated data
// 			setEmployeeRecords(data_res)
// 			sizePerPageList[3].value = data_res.length
// 		} catch (error: any) {
// 			console.error('Error getting all customers data:', error)
// 		} finally {
// 			setLoading(false)
// 		}
// 	}

{/* <Modal
						show={isOpen}
						onHide={handleToggleModal}
						dialogClassName="modal-dialog-centered">
						<Form onSubmit={handleSubmit(onSubmit)}>
							<Modal.Header closeButton>
								<h4 className="modal-title">Add New Customer</h4>
							</Modal.Header>
							<Modal.Body>
								<FormInput
									label="Name"
									type="text"
									name="username"
									containerClass="mb-3"
									register={register}
									key="username"
									errors={errors}
								/>

								<FormInput
									label="Email (Optional)"
									type="email"
									name="email"
									containerClass="mb-3"
									register={register}
									key="email"
									errors={errors}
								/>

								<div className="mb-3">
									<label className="form-label">Phone Number</label>
									<PhoneInput
										defaultCountry="PK"
										value={phoneValue}
										onChange={(value) => {
											setPhoneValue(value)
										}}
										placeholder="03xxx xxxxxx"
										className="form-control"
										international
									/>
								</div>
								<FormInput
									label="Password"
									type="password"
									name="password"
									containerClass="mb-3"
									register={register}
									key="password"
									errors={errors}
								// control={control}
								/>
							</Modal.Body>
							<Modal.Footer>
								<Button variant="light" onClick={handleToggleModal}>
									Close
								</Button>
								<Button variant="soft-success" type="submit" disabled={loading}>
									{apiLoading ? 'Adding...' : 'Save Customer'}
								</Button>
							</Modal.Footer>
						</Form>
					</Modal> */}


// const DummyImage = () => (
// 	<div className="rounded-circle avatar-sm bg-light border-0 d-flex align-items-center justify-content-center">
// 		<i className="ri-user-3-fill" style={{ fontSize: '20px' }}></i>
// 	</div>
// )

// const RealImage = ({ link }: { link: string }) => {
// 	const BASE_API = import.meta.env.VITE_BASE_API
// 	const formattedLink = link.replace(/\\/g, '/')

// 	return (
// 		<div className="rounded-circle avatar-sm bg-light border-0 d-flex align-items-center justify-content-center">
// 			<img
// 				src={`${BASE_API}/${formattedLink}`}
// 				alt="user"
// 				className="rounded-circle avatar-sm"
// 			/>
// 		</div>
// 	)
// }
