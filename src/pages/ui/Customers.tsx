import { FormInput, PageBreadcrumb } from '@/components'
import {
	Button,
	Card,
	Form,
	Table,
	Pagination as BootstrapPagination,
	Modal,
} from 'react-bootstrap'
import { MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import { TableRowSkeleton } from '../other/SimpleLoader'
import { useEffect, useState } from 'react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { toastService } from '@/common/context/toast.service'

interface Customer {
	_id: any;
	username: string;
	email: string;
	phone_number: string;
	date_of_birth: string;
	gender: string | null;
	profileImage: string | null;
	barcode: string;
	city: string | null;
	verified: boolean;
	isDeactivated: boolean;
	addresses: any[];
	createdAt: string;
}

const Brands = () => {
	const { isSuperUser, permissions, user } = useAuthContext()
	const canUpdate = isSuperUser || permissions.Products?.Update
	const canCreate = isSuperUser || permissions.Products?.Create

	const [selectedRows, setSelectedRows] = useState<number[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(15)
	const [sortedAsc, setSortedAsc] = useState(true)
	const [apiLoading, setApiLoading] = useState(false)
	const [loading, setLoading] = useState(false)
	const [brandsData, setBrandsData] = useState<any[]>([])
	const [editingBrand, setEditingBrand] = useState<Customer | null>(null)
	const [phoneValue, setPhoneValue] = useState<string | undefined>(undefined)
	const [showSelectionModal, setShowSelectionModal] = useState(false)
	const [showAddressModal, setShowAddressModal] = useState(false)
	const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
	const [isOpen, toggleModal] = useToggle()
	const [isExporting, setIsExporting] = useState(false)
	const [isExportingSubscribers, setIsExportingSubscribers] = useState(false)


	const BASE_API = import.meta.env.VITE_BASE_API
	const { token } = user
	const {
		handleSubmit,
		register,
		reset,
		setValue,
		formState: { errors },
	} = useForm()

	// ******************************** handle functions ****************************
	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelectedRows(brandsData.map((record) => record._id))
		} else {
			setSelectedRows([])
		}
	}

	const handleSelectRow = (id: number) => {
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

	const filteredRecords = brandsData
		?.filter((record) =>
			record?.username?.toLowerCase().includes(searchTerm?.toLowerCase())
		)
		?.sort((a, b) =>
			sortedAsc ? a?.username.localeCompare(b?.username) : b?.username.localeCompare(a?.username)
		)

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}
	const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
	const paginatedRecords = filteredRecords?.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)

	const handleToggleModal = () => {
		if (isOpen) {
			reset({ username: '' })
			setPhoneValue('');
			setEditingBrand(null)
		}
		toggleModal()
	}
	const handleGeneralInfoUpdate = () => {
		setShowSelectionModal(false)
		if (selectedCustomer) {
			setEditingBrand(selectedCustomer)
			setValue('username', selectedCustomer.username)
			setValue('email', selectedCustomer.email)
			setPhoneValue(selectedCustomer.phone_number)
			toggleModal()
		}
	}
	const handleAddressUpdate = () => {
		setShowSelectionModal(false)
		setShowAddressModal(true)
	}
	const handleEditClick = (customer: Customer) => {
		setSelectedCustomer(customer)
		if (customer.addresses && customer.addresses.length > 0) {
			const defaultAddress = customer.addresses.find(addr => addr.isDefault) || customer.addresses[0]
			if (defaultAddress) {
				setSelectedCustomerId(defaultAddress._id)
				setValue('address', defaultAddress.address)
				setValue('title', defaultAddress.title)
			}
		} else {
			setValue('address', '')
			setValue('title', '')
			setSelectedCustomerId(null)
		}
		setShowSelectionModal(true)
	}

	const handleCloseAddressModal = () => {
		setShowAddressModal(false)
		setValue('address', '')
		setValue('title', '')
		setSelectedCustomerId(null)
		setSelectedCustomer(null)
	}

	// *************************** Api Callings ******************************

	const getAllBrands = async () => {
		try {
			setLoading(true)
			const response = await fetch(`${BASE_API}/api/customers`, {
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
			const data: Customer[] = await response.json()
			console.log('Fetched customers data:', data)
			setBrandsData(data)
		} catch (error: any) {
			console.error('Error getting customers data:', error)
		} finally {
			setLoading(false)
		}
	}
	const handleAddressUpdates = async (data: any) => {
		try {
			setApiLoading(true)
			if (!selectedCustomerId) {
				Swal.fire({
					title: 'Oops',
					text: 'Sorry, this customer has no addresses',
					icon: 'error'
				});
				return;
			}
			const response = await fetch(`${BASE_API}/api/addresses/admin/${selectedCustomerId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					address: data.address,
					title: data.title
				})
			});

			if (!response.ok) {
				throw new Error('Failed to update address');
			}

			Swal.fire({
				title: 'Success',
				text: 'Address updated successfully',
				icon: 'success',
				timer: 1500
			});

			setShowAddressModal(false);
			getAllBrands(); // Refresh the data
		} catch (error: any) {
			Swal.fire({
				title: 'Error',
				text: error.message,
				icon: 'error'
			});
		} finally {
			setApiLoading(false)
		}
	}
	const handleAddBrand = async (brandData: any) => {
		try {
			setApiLoading(true)
			if (!phoneValue) {
				Swal.fire({
					icon: 'error',
					title: 'Phone Required',
					text: 'Please enter phone number',
					timer: 1500,
					showConfirmButton: true,
				})
				return
			}
			const requestBody = {
				username: brandData.username,
				password: brandData.password,
				phone_number: phoneValue,
				...(brandData.email && { email: brandData.email }),
			}
			const response = await fetch(`${BASE_API}/api/customers/admin`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to add new Brand')
			}

			const data_res = await response.json()
			if (data_res) {
				Swal.fire({
					title: 'ADDED!',
					text: 'Customer added successfully!',
					icon: 'success',
					confirmButtonText: 'OK',
					timer: 1500,
				})
				getAllBrands()
				reset()
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
	const handleUpdateBrand = async (brandData: any) => {
		console.log('Updating Brand Data:', brandData)

		try {
			setApiLoading(true)
			if (!phoneValue) {
				Swal.fire({
					icon: 'error',
					title: 'Phone Required',
					text: 'Please enter phone number',
					timer: 1500,
					showConfirmButton: true,
				})
				return
			}
			const formData = new FormData()
			formData.append('username', brandData.username)
			formData.append('phone_number', phoneValue?.toString())
			if (brandData.email) {
				formData.append('email', brandData.email)
			}
			if (brandData.password) {
				formData.append('password', brandData.password)
			}
			const response = await fetch(`${BASE_API}/api/customers/${selectedCustomer?._id}`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData
			});

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to Update Customer')
			}

			const data_res = await response.json()
			if (data_res) {
				Swal.fire({
					title: 'Updated!',
					text: 'Customer updated successfully!',
					icon: 'success',
					confirmButtonText: 'OK',
					timer: 1500,
				})
				reset()
				setEditingBrand(null)
				await getAllBrands()
				handleToggleModal()
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
	const handleExportCustomers = async () => {
		setIsExporting(true)
		try {
			const response = await fetch(`${BASE_API}/api/customers/export/csv`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'customers.csv'
			a.click()
		} catch (error) {
			console.error('Error exporting customers:', error)
		} finally {
			setIsExporting(false)
		}
	}
	const handleExportSubscribers = async () => {
		setIsExportingSubscribers(true)
		try {
			const response = await fetch(`${BASE_API}/api/subscribers/export`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (!response.ok) {
				throw { status: response.status }
			}
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'subscribers.csv'
			a.click()
			toastService.success('Subscribers exported successfully')
		} catch (error: any) {
			console.error('Error exporting subscribers:', error)
			toastService.error({
				status: error.status,
				message: 'Failed to upload sub-subcategories'
			})
		} finally {
			setIsExportingSubscribers(false)
		}
	}
	// *************************** useEffect ******************************
	useEffect(() => {
		if (!isOpen) {
			reset()
			setPhoneValue('');
			setEditingBrand(null)
		}
	}, [isOpen, reset])
	useEffect(() => {
		if (editingBrand) {
			setValue('username', editingBrand.username)
			setPhoneValue(editingBrand.phone_number)
			setValue('email', editingBrand.email)
		} else {
			reset({ name: '' })
		}
	}, [editingBrand, setValue, reset])
	useEffect(() => {
		getAllBrands()
	}, [])
	useEffect(() => {
		setCurrentPage(1)
	}, [itemsPerPage, selectedRows])

	// if (loading) {
	// 	return <SimpleLoader />
	// }
	const categoryHeaders: any = [
        { width: '20px', type: 'checkbox' },
        { width: '80px', type: 'image' },
        { width: '100px', type: 'text' },
        { width: '120px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '100px', type: 'actions' }
    ]

	return (
		<>
			<PageBreadcrumb title="All Customers" subName="Customers" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">Customers</h4>
							<p className="text-muted mb-0">
								See, Add and Manage all your customers here.
							</p>
						</div>
						<div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
							<button
								className="btn btn-info mt-3 mt-lg-0 me-2"
								onClick={handleExportSubscribers}
								disabled={isExportingSubscribers}
							>
								{isExportingSubscribers ? (
									<>
										<span className="spinner-border spinner-border-sm me-1" role="status" />
										Downloading...
									</>
								) : (
									<>
										<i className="ri-mail-download-line me-1"></i>
										Export Subscribers
									</>
								)}
							</button>
							<button
								className="btn btn-primary mt-3 mt-lg-0 me-2"
								onClick={handleExportCustomers}
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
										Export Customers
									</>
								)}
							</button>
							<Button
								style={{ border: 'none' }}
								variant="success"
								disabled={!canCreate}
								onClick={toggleModal}
								className="mb-2 mb-sm-0">
								<i className="bi bi-plus"></i> Add New Customer
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
										/>
									</th>
									<th>Profile</th>
									<th onClick={handleSort} style={{ cursor: 'pointer' }}>
										Username {sortedAsc ? '↑' : '↓'}
									</th>
									<th>Email</th>
									<th>Phone</th>
									<th>Default Address</th>
									<th>Status</th>
									<th>Joined Date</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
                                    <TableRowSkeleton headers={categoryHeaders} rowCount={6} />
                                ) :   

								paginatedRecords?.map((customer, idx) => (
									<tr key={idx}>
										<td>
											<input
												type="checkbox"
												checked={selectedRows.includes(customer?._id)}
												onChange={() => handleSelectRow(customer?._id)}
											/>
										</td>
										<td>
											{customer?.profileImage ? (
												<img
													src={`${BASE_API}/${customer.profileImage}`}
													alt="profile"
													className="rounded-circle"
													width="32"
												/>
											) : (
												<div className="avatar-sm">
													<span className="avatar-title  rounded-circle" style={{ backgroundColor: '#333333' }}>
														{customer?.username?.charAt(0).toUpperCase()}
													</span>
												</div>
											)}
										</td>
										<td>{customer?.username}</td>
										<td>{customer?.email}</td>
										<td>{customer?.phone_number}</td>
										<td>
											{customer?.addresses?.find((addr: any) => addr?.isDefault)?.address ||
												customer?.addresses?.[0]?.address ||
												'-'}
										</td>

										<td>
											<span className={`badge ${customer.verified ? 'bg-success' : 'bg-warning'}`}>
												{customer.verified ? 'Verified' : 'Pending'}
											</span>
											{customer.isDeactivated &&
												<span className="badge bg-danger ms-1">Deactivated</span>
											}
										</td>
										<td>{new Date(customer?.createdAt)?.toLocaleDateString()}</td>
										<td>
											<div className="d-flex">
												<Button
													variant="secondary"
													disabled={!canUpdate}
													onClick={() => handleEditClick(customer)}>
													<MdEdit />
												</Button>
											</div>
										</td>
									</tr>
								))
								
								}
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
				{/* *************** confirmation Modal ************************ */}
				<Modal show={showSelectionModal} onHide={() => setShowSelectionModal(false)} dialogClassName="modal-dialog-centered">
					<Modal.Header closeButton>
						<h4 className="modal-title">Choose Update Type</h4>
					</Modal.Header>
					<Modal.Body className="text-center">
						<Button variant="primary" className="me-2" onClick={handleGeneralInfoUpdate}>
							Update General Info
						</Button>
						<Button variant="info" onClick={handleAddressUpdate}>
							Update Address
						</Button>
					</Modal.Body>
				</Modal>
				{/* *************** General Modal ************************ */}
				<Modal
					show={isOpen}
					onHide={handleToggleModal}
					dialogClassName="modal-dialog-centered">
					<Modal.Header closeButton>
						<h4 className="modal-title">
							{editingBrand ? 'Update Customer' : 'Add New Customer'}
						</h4>
					</Modal.Header>
					<Form
						onSubmit={handleSubmit(
							editingBrand ? handleUpdateBrand : handleAddBrand
						)}>
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
							{!editingBrand &&
								<FormInput
									label="Password"
									type="password"
									name="password"
									containerClass="mb-3"
									register={register}
									key="password"
									errors={errors}
								/>
							}
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
										? 'Update Customer'
										: 'Save Customer'}
							</Button>
						</Modal.Footer>
					</Form>
				</Modal>
				{/* *************** Address Modal ************************ */}
				<Modal show={showAddressModal} onHide={handleCloseAddressModal} dialogClassName="modal-dialog-centered">
					<Modal.Header closeButton>
						<h4 className="modal-title">Update Address</h4>
					</Modal.Header>
					<Form onSubmit={handleSubmit(handleAddressUpdates)}>
						<Modal.Body>
							<FormInput
								label="Address"
								type="text"
								name="address"
								containerClass="mb-3"
								register={register}
								key="address"
								errors={errors}
								defaultValue={selectedCustomer?.addresses.find(addr => addr.isDefault)?.address || selectedCustomer?.addresses[0]?.address}
							/>
							<FormInput
								label="Title"
								type="text"
								name="title"
								containerClass="mb-3"
								register={register}
								key="title"
								errors={errors}
								defaultValue={selectedCustomer?.addresses.find(addr => addr.isDefault)?.title || selectedCustomer?.addresses[0]?.title}
							/>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="light" onClick={() => setShowAddressModal(false)}>
								Close
							</Button>
							<Button variant="success" type="submit">
								Update Address
							</Button>
						</Modal.Footer>
					</Form>
				</Modal>
			</Card>
		</>
	)
}

export default Brands
