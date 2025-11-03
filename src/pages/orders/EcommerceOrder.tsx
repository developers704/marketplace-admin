import { FormInput, PageBreadcrumb } from '@/components'
import {
	Card,
	Form,
	Table,
	Pagination as BootstrapPagination,
	Button,
	Modal,
} from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { SkeletonHeader, TableRowSkeleton } from '../other/SimpleLoader'
import 'react-phone-number-input/style.css'
import { useAuthContext } from '@/common'
import { MdEdit, MdRemoveRedEye } from 'react-icons/md'
import { useForm } from 'react-hook-form'
import Swal from 'sweetalert2'
import { toastService } from '@/common/context/toast.service'
// basic tables
interface Customer {
	_id: string
	username: string
	phone_number: string
	email: string
	warehouse: any
}

interface PriceInfo {
	city: string
	amount: number
	buyPrice: number
	salePrice: number
	_id: string
}

interface ProductDetails {
	_id: string
	name: string
	productVariant: string
	type: string
	prices: PriceInfo[]
	description: string
	gallery: string[]
	sku: string
	stock: number
	specialCategory: string
	status: string
	isActive: boolean
	createdAt: string
	updatedAt: string
	__v: number
	inventory: string[]
	productVariants: string[]
}

interface OrderItem {
	itemType: string
	product: ProductDetails
	quantity: number
	price: number
	_id: string
}

interface City {
	_id: string
	name: string
	__v: number
}

// Main Order interface
interface EcommerceOrderRecord {
	_id: string
	orderId: string
	customer: Customer
	items: OrderItem[]
	shippingMethod: string | null
	subtotal: number
	shippingCost: number
	grandTotal: number
	paymentMethod: string
	orderStatus: string | null
	specialInstructions: string
	couponUsed: string | null
	paymentStatus: string | null
	shippingStatus: string | null
	city: City
	createdAt: string
	updatedAt: string
	__v: number
	adminNotes: string
}

const EcommerceOrder = () => {
	const [selectedRows] = useState<number[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(6)
	const [orders, setOrders] = useState<EcommerceOrderRecord[]>([])
	const [orderStatuses, setOrderStatuses] = useState<
		Array<{ _id: string; name: string }>
	>([])
	const [paymentStatuses, setPaymentStatuses] = useState<
		Array<{ _id: string; name: string }>
	>([])
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [paymentFilter, setPaymentFilter] = useState<string>('all')
	const [paymentMethodFilter] = useState<string>('all')
	const [showModal, setShowModal] = useState(false)
	const [selectedOrder, setSelectedOrder] = useState<any>(null)

	const [apiLoading, setApiLoading] = useState(false)
	const [showOrderModal, setShowOrderModal] = useState(false)
	const [orderItems, setOrderItems] = useState<any[]>([])
	const [isExporting, setIsExporting] = useState(false)
	const [productTypeFilter, setProductTypeFilter] = useState<string>('all')

	// ************************ Helping Functions ********************************
	const BASE_API = import.meta.env.VITE_BASE_API
	const { user } = useAuthContext()
	const { token } = user

	const {
		handleSubmit,
		register,
		setValue,
		formState: { errors },
	} = useForm()



	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
		setCurrentPage(1)
	}

	const filteredRecords = orders?.filter((record) => {
		// Apply Order Status filter
		if (statusFilter !== 'all' && record?.orderStatus !== statusFilter) {
			return false
		}

		// Apply Payment Status filter
		if (paymentFilter !== 'all' && record?.shippingStatus !== paymentFilter) {
			return false
		}

		// Apply Payment Method filter
		if (
			paymentMethodFilter !== 'all' &&
			record?.paymentMethod !== paymentMethodFilter
		) {
			return false
		}

		// Apply Product Type filter - check if any item in the order matches the selected product type
		if (productTypeFilter !== 'all') {
			const hasMatchingProductType = record.items.some(
				(item) =>
					item.itemType === productTypeFilter ||
					(item.product && item.product.type === productTypeFilter)
			)

			if (!hasMatchingProductType) {
				return false
			}
		}

		// Enhanced search functionality across multiple fields
		if (searchTerm) {
			const lowerSearchTerm = searchTerm.toLowerCase()

			// Search in Order ID
			const matchesOrderId = record?.orderId
				.toLowerCase()
				.includes(lowerSearchTerm)

			// Search in Customer info (name, email)
			const matchesCustomerName = record?.customer?.username
				?.toLowerCase()
				?.includes(lowerSearchTerm)
			const matchesCustomerEmail = record?.customer?.email
				?.toLowerCase()
				?.includes(lowerSearchTerm)
			const matchesCustomerStore = record?.customer?.warehouse?.name
				?.toLowerCase()
				?.includes(lowerSearchTerm)

			// Search in Product names
			const matchesProductName = record.items.some((item) =>
				item.product?.name?.toLowerCase()?.includes(lowerSearchTerm)
			)

			// Search in specialized category or warehouse/store info
			const matchesSpecialCategory = record.items.some((item) =>
				item?.product?.specialCategory?.toLowerCase()?.includes(lowerSearchTerm)
			)

			// Return true if any field matches
			return (
				matchesOrderId ||
				matchesCustomerName ||
				matchesCustomerEmail ||
				matchesCustomerStore
			)
			matchesProductName || matchesSpecialCategory
		}

		return true // If no search term, include all records that passed the filters
	})

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}
	const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
	const paginatedRecords = filteredRecords.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)
	const truncateText = (text: string, maxLength: number = 15) => {
		return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
	}
	const handleEditClick = (order: any) => {
		setSelectedOrder(order)
		if (selectedOrder) {
			setOrderItems(selectedOrder?.items)
			setValue('subtotal', selectedOrder?.subtotal)
			setValue('shippingCost', selectedOrder?.shippingCost)
			setValue('grandTotal', selectedOrder?.grandTotal)
			setValue('specialInstructions', selectedOrder?.specialInstructions)
			setValue('couponUsed', selectedOrder?.couponUsed)
			setValue('adminNotes', selectedOrder?.adminNotes)
		}
		setShowOrderModal(true)
	}

	// ************************ Apis Functions ********************************

	const fetchOrders = async () => {
		setLoading(true)
		try {
			const response = await fetch(`${BASE_API}/api/checkout/order`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			const data = await response.json()
			setOrders(data)
		} catch (error) {
			console.error('Error fetching orders:', error)
		} finally {
			setLoading(false)
		}
	}
	const fetchStatuses = async () => {
		try {
			const [orderRes, paymentRes] = await Promise.all([
				fetch(`${BASE_API}/api/order-statuses`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				fetch(`${BASE_API}/api/paymentStatus`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
			])

			const orderData = await orderRes.json()
			const paymentData = await paymentRes.json()

			setOrderStatuses(orderData)
			setPaymentStatuses(paymentData)
		} catch (error) {
			console.error('Error fetching statuses:', error)
		}
	}
	const handleStatusUpdate = async (
		orderId: string,
		type: 'order' | 'payment',
		newStatus: string,
		currentStatus: string
	) => {
		try {
			if (currentStatus === 'Disapproved') {
				toastService.error(
					'This status is already Disapproved and cannot be changed.'
				)
				return
			}
			if (newStatus === 'Disapproved') {
				const result = await Swal.fire({
					title: 'Are you sure?',
					text: 'Once disapproved, this order status cannot be changed again.',
					icon: 'warning',
					showCancelButton: true,
					confirmButtonText: 'Yes, Disapprove',
					cancelButtonText: 'Cancel',
				})

				if (!result.isConfirmed) {
					return // user ne cancel kiya
				}
			}

			// ✅ API Call
			const response = await fetch(
				`${BASE_API}/api/checkout/${orderId}/status`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						[type === 'order' ? 'orderStatus' : 'shippingStatus']: newStatus,
					}),
				}
			)

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.error || 'An error occurred')
			}

			toastService.success('Status updated successfully')
			fetchOrders() // Refresh orders after update
		} catch (error: any) {
			toastService.error(error.message)
		}
	}
	const handleUpdateOrderDetails = async (data: any) => {
		try {
			setApiLoading(true)
			const subtotal = orderItems.reduce(
				(sum, item) => sum + item.quantity * item.price,
				0
			)
			const response = await fetch(
				`${BASE_API}/api/checkout/admin/${selectedOrder._id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						subtotal: subtotal,
						shippingCost: Number(data.shippingCost),
						grandTotal: subtotal,
						specialInstructions: data.specialInstructions,
						adminNotes: data.adminNotes,
						items: orderItems,
					}),
				}
			)

			if (!response.ok) {
				throw new Error('Failed to update order details')
			}

			Swal.fire({
				title: 'Success',
				text: 'Order details updated successfully',
				icon: 'success',
				timer: 1500,
			})

			setShowOrderModal(false)
			fetchOrders()
		} catch (error: any) {
			Swal.fire({
				title: 'Error',
				text: error.message,
				icon: 'error',
			})
		} finally {
			setApiLoading(false)
		}
	}
	const handleExportOrders = async () => {
		setIsExporting(true)
		try {
			const response = await fetch(
				`${BASE_API}/api/checkout/orders/download-data`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			)
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'orders.csv'
			a.click()
		} catch (error) {
			console.error('Error exporting orders:', error)
		} finally {
			setIsExporting(false)
		}
	}

	// ************************ useEffect Functions ********************************
	useEffect(() => {
		setCurrentPage(1) // Reset to first page when filter changes
	}, [
		statusFilter,
		paymentFilter,
		paymentMethodFilter,
		productTypeFilter,
		searchTerm,
	])

	useEffect(() => {
		fetchOrders()
		fetchStatuses()
	}, [])
	useEffect(() => {
		setCurrentPage(1)
	}, [itemsPerPage, selectedRows])

	const orderHeaders: SkeletonHeader[] = [
		{ width: '20px', type: 'checkbox' },
		{ width: '100px', type: 'text' }, // Order ID
		{ width: '100px', type: 'text' }, // Customer
		{ width: '100px', type: 'text' }, // Email
		{ width: '80px', type: 'text' }, // Phone
		{ width: '80px', type: 'text' }, // Phone
		{ width: '80px', type: 'text' }, // Phone
		{ width: '120px', type: 'text' }, // Products
		{ width: '80px', type: 'number' }, // Total Amount
		{ width: '120px', type: 'text' }, // Order Status
		{ width: '100px', type: 'actions' }, // Actions
	]

	// ************************ Render Section ********************************
	return (
		<>
			<PageBreadcrumb title="Order Management" subName="Orders" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
							<div>
								<h4 className="header-title">Order Management</h4>
								<p className="text-muted mb-0">
									Add and Manage your all Order here.
								</p>
							</div>
						</div>

						<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center ">
							<button
								className="btn btn-primary mt-3 mt-lg-0 me-2"
								onClick={handleExportOrders}
								disabled={isExporting}>
								{isExporting ? (
									<>
										<span
											className="spinner-border spinner-border-sm me-1"
											role="status"
										/>
										Downloading...
									</>
								) : (
									<>
										<i className="ri-download-2-line me-1"></i>
										Export Orders Data
									</>
								)}
							</button>

							<div className="app-search">
								<form>
									<div
										className="input-group"
										style={{
											backgroundColor: 'rgba(255, 255, 255, 0.8)',
											borderRadius: '10px',
											border: '1px solid rgba(0, 0, 0, 0.1)',
											minWidth: '400px',
										}}>
										<input
											type="search"
											className="form-control"
											placeholder="Search by Order ID, Name, Email, or Store..."
											value={searchTerm}
											onChange={handleSearch}
											style={{
												backgroundColor: 'transparent',
												border: 'none',
												paddingLeft: '10px',
												color: '#333',
												width: '100%',
											}}
										/>
										<span
											className="ri-search-line search-icon text-muted"
											style={{ marginRight: '10px', color: '#666' }}
										/>
									</div>
								</form>
							</div>
						</div>
					</div>

					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
						<div className="mt-3">
							<div className="d-flex flex-column flex-sm-row gap-2">
								<Form.Select
									value={productTypeFilter}
									style={{ zIndex: 1 }}
									onChange={(e) => {
										setProductTypeFilter(e.target.value)
										setCurrentPage(1) // Reset to first page when filter changes
									}}
									className="mb-2 mb-sm-0">
									<option value="all">Filter By Product Type</option>
									<option value="Product">Main Product</option>
									<option value="SpecialProduct">Special Product</option>
								</Form.Select>
								<Form.Select
									value={statusFilter}
									onChange={(e) => {
										setStatusFilter(e.target.value)
									}}
									style={{ zIndex: 1 }}
									className="mb-2 mb-sm-0">
									<option value="all">Filter By Order Status</option>
									{orderStatuses.map((status) => (
										<option key={status._id} value={status.name}>
											{status.name}
										</option>
									))}
								</Form.Select>
								{/* New Product Type Filter */}
								<Form.Select
									value={paymentFilter}
									style={{ zIndex: 1 }}
									onChange={(e) => setPaymentFilter(e.target.value)}
									className="mb-2 mb-sm-0">
									<option value="all">Filter By Shipping Status</option>
									{paymentStatuses.map((status) => (
										<option key={status._id} value={status.name}>
											{status.name}
										</option>
									))}
								</Form.Select>
							</div>
						</div>

						<Form.Select
							value={itemsPerPage}
							onChange={(e) => setItemsPerPage(Number(e.target.value))}
							className="w-auto mt-3 mt-lg-0"
							style={{ zIndex: 1 }}>
							<option value={6}>6 items</option>
							<option value={15}>15 items</option>
							<option value={30}>30 items</option>
						</Form.Select>
					</div>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-1">
						<div className="d-flex gap-3 mt-3">
							<div className="status-box">
								<div className="d-flex align-items-center">
									<div
										className="color-indicator bg-warning me-2"
										style={{
											width: '20px',
											height: '20px',
											marginLeft: '4px',
										}}></div>
									<span>
										Pending Order (
										{
											orders?.filter(
												(order) =>
													order?.orderStatus === 'Pending Approval' &&
													order?.shippingStatus === 'Pending'
											).length
										}{' '}
										)
									</span>
								</div>
							</div>
							<div className="status-box">
								<div className="d-flex align-items-center">
									<div
										className="color-indicator bg-info me-2"
										style={{ width: '20px', height: '20px' }}></div>
									<span>
										Pending Shipping (
										{
											orders.filter(
												(order) =>
													order?.orderStatus === 'Confirmed' &&
													order?.shippingStatus === 'Pending'
											).length
										}{' '}
										)
									</span>
								</div>
							</div>
							<div className="status-box">
								<div className="d-flex align-items-center">
									<div
										className="color-indicator me-2"
										style={{
											width: '20px',
											height: '20px',
											backgroundColor: '#f8d7da',
										}}></div>
									<span>
										Disapproved Order (
										{
											orders.filter(
												(order) => order?.orderStatus === 'Disapproved'
											).length
										}{' '}
										)
									</span>
								</div>
							</div>
						</div>
					</div>
				</Card.Header>

				<Card.Body>
					<div className="table-responsive">
						<Table className="table-centered mb-0">
							<thead>
								<tr>
									<th>S No</th>
									<th>Order ID</th>
									<th>User Name</th>
									<th>Email</th>
									<th>Phone</th>
									<th>Store</th>
									<th>Products</th>
									<th>Quantity</th>
									<th>Total Amount</th>
									<th>Shipping Status</th>
									<th>Order Status</th>
									<th>Actions</th>
								</tr>
							</thead>

							<tbody>
								{loading ? (
									<TableRowSkeleton headers={orderHeaders} rowCount={5} />
								) : paginatedRecords?.length > 0 ? (
									paginatedRecords.map((record: any, idx: any) => (
										<tr
											key={record?._id}
											style={{
												backgroundColor:
													record?.orderStatus === 'Pending Approval' &&
													record?.shippingStatus === 'Pending'
														? '#fff3cd' // warning background
														: record?.orderStatus === 'Confirmed' &&
															  record?.shippingStatus === 'Pending'
															? '#cff4fc' // info background
															: record?.orderStatus === 'Disapproved'
																? '#f8d7da'
																: 'inherit',
											}}>
											<td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
											<td>{record?.orderId || 'N/A'}</td>
											<td>{record?.customer?.username || 'N/A'}</td>
											<td>{record?.customer?.email || 'N/A'}</td>
											<td>{record?.customer?.phone_number || 'N/A'}</td>
											<td>{record?.customer?.warehouse?.name || 'N/A'}</td>

											<td>
												{record?.items
													?.map((item: any) =>
														truncateText(item?.product?.name || 'N/A')
													)
													.join(' , ')}
											</td>
											<td>
												{record?.items
													?.map((item: any) =>
														truncateText(item?.quantity || 'N/A')
													)
													.join(' , ')}
											</td>
											<td>$ {record?.grandTotal || 0}</td>
											<td>
												<Form.Select
													size="sm"
													value={record?.shippingStatus || ''}
													onChange={(e) =>
														handleStatusUpdate(
															record?._id || '',
															'payment',
															e.target.value,
															record?.shippingStatus
														)
													}
													className="w-100"
													style={{ minWidth: '120px', maxWidth: '130px' }}>
													{paymentStatuses?.map((status) => (
														<option
															key={status?._id}
															value={status?.name || ''}>
															{status?.name || 'N/A'}
														</option>
													))}
												</Form.Select>
											</td>
											<td>
												<Form.Select
													size="sm"
													value={record?.orderStatus || ''}
													onChange={(e) =>
														handleStatusUpdate(
															record?._id || '',
															'order',
															e.target.value,
															record?.orderStatus
														)
													}
													className="w-100"
													style={{ minWidth: '120px', maxWidth: '130px' }}>
													{orderStatuses?.map((status) => (
														<option
															key={status?._id}
															value={status?.name || ''}>
															{status?.name || 'N/A'}
														</option>
													))}
												</Form.Select>
											</td>
											<td>
												<div className="d-flex">
													<Button
														variant="info"
														className="me-2"
														onClick={() => {
															setSelectedOrder(record)
															setShowModal(true)
														}}>
														<MdRemoveRedEye />
													</Button>
													<Button
														variant="secondary"
														className="me-2"
														onClick={() => handleEditClick(record)}>
														<MdEdit />
													</Button>
												</div>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan={11} className="text-center">
											No orders found
										</td>
									</tr>
								)}
							</tbody>
						</Table>
					</div>
					<nav className="d-flex justify-content-end mt-3">
						<BootstrapPagination className="pagination-rounded mb-0">
							<BootstrapPagination.Prev
								onClick={() =>
									currentPage > 1 && handlePageChange(currentPage - 1)
								}
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

							{/* Show last page if not in last set */}
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
									currentPage < totalPages && handlePageChange(currentPage + 1)
								}
							/>
						</BootstrapPagination>
					</nav>
				</Card.Body>
			</Card>
			{/* View Modal */}
			<Modal size="xl" show={showModal} onHide={() => setShowModal(false)}>
				<div id="order-modal-content" className="order-details">
					<Modal.Header closeButton className="bg-light">
						<Modal.Title>
							<i className="ri-shopping-bag-line me-2"></i>
							Order Details #{selectedOrder?.orderId}
						</Modal.Title>
					</Modal.Header>
					<Modal.Body className="p-4">
						{selectedOrder && (
							<div className="order-details">
								<div className="row">
									<div className="col-12 mb-4">
										<div className="card">
											<div className="card-body">
												<h5 className="card-title mb-3">Order Items</h5>
												<div className="table-responsive">
													<table className="table table-bordered">
														<thead className="table-light">
															<tr>
																<th>Product</th>
																<th style={{ width: '15%' }}>Quantity</th>
																<th style={{ width: '15%' }}>Price</th>
																<th style={{ width: '15%' }}>Color</th>
																<th style={{ width: '15%' }}>Total</th>
															</tr>
														</thead>
														<tbody>
															{selectedOrder?.items?.map(
																(item: any, index: any) => (
																	<tr key={index}>
																		<td>{item?.product?.name || 'N/A'}</td>
																		<td>{item?.quantity || 0}</td>
																		<td>$ {item?.price || 0}</td>
																		<td>{item?.color || 'N/A'}</td>
																		<td>
																			${' '}
																			{(item?.quantity || 0) *
																				(item?.price || 0)}
																		</td>
																	</tr>
																)
															)}
														</tbody>
													</table>
												</div>
											</div>
										</div>
									</div>

									<div className="col-md-6 mb-4">
										<div className="card h-100">
											<div className="card-body">
												<h5 className="card-title mb-3">
													Customer Information
												</h5>
												<div className="table-responsive">
													<table className="table table-borderless mb-0">
														<tbody>
															<tr>
																<th scope="row" style={{ width: '35%' }}>
																	Name:
																</th>
																<td>
																	{selectedOrder?.customer?.username || 'N/A'}
																</td>
															</tr>
															<tr>
																<th scope="row">Email:</th>
																<td>
																	{selectedOrder?.customer?.email || 'N/A'}
																</td>
															</tr>
															<tr>
																<th scope="row">Phone:</th>
																<td>
																	{selectedOrder?.customer?.phone_number ||
																		'N/A'}
																</td>
															</tr>
															<tr>
																<th scope="row">Store:</th>
																<td>
																	{selectedOrder?.customer?.warehouse?.name ||
																		'N/A'}
																</td>
															</tr>
														</tbody>
													</table>
												</div>
											</div>
										</div>
									</div>

									<div className="col-md-6">
										<div className="card">
											<div className="card-body">
												<h5 className="card-title mb-3">Payment Summary</h5>
												<div className="table-responsive">
													<table className="table table-bordered">
														<thead className="table-light">
															<tr>
																<th>Description</th>
																<th style={{ width: '30%' }}>Amount</th>
															</tr>
														</thead>
														<tbody>
															{selectedOrder?.specialInstructions && (
																<tr>
																	<td>Special Instructions</td>
																	<td>
																		{selectedOrder?.specialInstructions ||
																			'N/A'}
																	</td>
																</tr>
															)}
															<tr>
																<td>Payment Method</td>
																<td>{selectedOrder?.paymentMethod || 'N/A'}</td>
															</tr>
															<tr>
																<td>Shipping Status</td>
																<td>{selectedOrder?.paymentStatus || 'N/A'}</td>
															</tr>
															<tr>
																<td>Subtotal</td>
																<td>$ {selectedOrder?.subtotal || 0}</td>
															</tr>
															<tr className="table-light fw-bold">
																<td>Grand Total</td>
																<td>$ {selectedOrder?.grandTotal || 0}</td>
															</tr>
														</tbody>
													</table>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}
					</Modal.Body>
				</div>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowModal(false)}>
						Close
					</Button>
				</Modal.Footer>
			</Modal>
			{/* Order Details Modal */}
			<Modal
				show={showOrderModal}
				onHide={() => setShowOrderModal(false)}
				dialogClassName="modal-dialog-centered modal-lg">
				<Modal.Header closeButton>
					<h4 className="modal-title">Update Order Details</h4>
				</Modal.Header>
				<Form onSubmit={handleSubmit(handleUpdateOrderDetails)}>
					<Modal.Body>
						<div className="row">
							<div className="col-12">
								<h5 className="mb-3">Order Items</h5>
								<div className="table-responsive">
									<table className="table table-bordered">
										<thead>
											<tr>
												<th>Product</th>
												<th>Quantity</th>
												<th>Price</th>
												<th>Total</th>
												<th>Action</th>
											</tr>
										</thead>
										<tbody>
											{orderItems?.map((item, index) => (
												<tr key={index}>
													<td>{item?.product?.name || 'N/A'}</td>
													<td>
														<input
															type="number"
															className="form-control form-control-sm"
															value={item?.quantity || 0}
															onChange={(e) => {
																const newItems = [...(orderItems || [])]
																if (newItems[index]) {
																	newItems[index].quantity = Number(
																		e.target.value
																	)
																	setOrderItems(newItems)
																}
															}}
														/>
													</td>
													<td>
														<input
															type="number"
															className="form-control form-control-sm"
															value={item?.price || 0}
															onChange={(e) => {
																const newItems = [...(orderItems || [])]
																if (newItems[index]) {
																	newItems[index].price = Number(e.target.value)
																	setOrderItems(newItems)
																}
															}}
														/>
													</td>
													<td>
														$ {(item?.quantity || 0) * (item?.price || 0)}
													</td>
													<td>
														<Button
															variant="danger"
															size="sm"
															onClick={() => {
																const newItems =
																	orderItems?.filter((_, i) => i !== index) ||
																	[]
																setOrderItems(newItems)
															}}>
															<i className="ri-delete-bin-line"></i>
														</Button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
							<div className="col-md-6">
								<div className="mb-3">
									<label className="form-label">
										GrandTotal{' '}
										<span
											className="text-muted"
											style={{ fontSize: '0.75rem' }}>
											(readonly)
										</span>
									</label>
									<input
										type="number"
										className="form-control"
										value={orderItems.reduce(
											(sum, item) => sum + item.quantity * item.price,
											0
										)}
										readOnly
									/>
								</div>
							</div>
							<div className="col-12">
								<FormInput
									label="Special Instructions"
									type="textarea"
									name="specialInstructions"
									containerClass="mb-3"
									register={register}
									key="specialInstructions"
									errors={errors}
								/>
							</div>
							<div className="col-12">
								<FormInput
									label="Admin Notes"
									type="textarea"
									name="adminNotes"
									containerClass="mb-3"
									register={register}
									key="adminNotes"
									errors={errors}
								/>
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="light" onClick={() => setShowOrderModal(false)}>
							Close
						</Button>
						<Button variant="success" type="submit">
							{apiLoading ? 'Updating...' : 'Update Order'}
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>
		</>
	)
}

export default EcommerceOrder
