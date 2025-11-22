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

// Approval History interface
interface ApprovalHistory {
	role: string
	approvedBy: string
	status: string
	date: string
	remarks?: string
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
	approvalStatus?: string
	approvalHistory?: ApprovalHistory[]
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
	const [showApprovalModal, setShowApprovalModal] = useState(false)
	const [approvalAction, setApprovalAction] = useState<'APPROVE' | 'DISAPPROVE' | null>(null)
	const [approvalRemarks, setApprovalRemarks] = useState('')
	// const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null)
	const [approvingSubmit, setApprovingSubmit] = useState(false)
	const statusColors = {
  	Pending: 'warning',      // Yellow
  	Shipped: 'primary',      // Blue
  	OnTheWay: 'info',        // Light blue / info
  	Delivered: 'success',    // Green
  	Returned: 'danger'       // Red
	};

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
				matchesCustomerStore ||
				matchesProductName ||
				matchesSpecialCategory
			)
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
			setValue('shippingStatus', selectedOrder?.shippingStatus)
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
	// const handleStatusUpdate = async (
	// 	orderId: string,
	// 	type: 'order' | 'payment',
	// 	newStatus: string,
	// 	currentStatus: string
	// ) => {
	// 	try {
	// 		if (currentStatus === 'Disapproved') {
	// 			toastService.error(
	// 				'This status is already Disapproved and cannot be changed.'
	// 			)
	// 			return
	// 		}
	// 		if (newStatus === 'Disapproved') {
	// 			const result = await Swal.fire({
	// 				title: 'Are you sure?',
	// 				text: 'Once disapproved, this order status cannot be changed again.',
	// 				icon: 'warning',
	// 				showCancelButton: true,
	// 				confirmButtonText: 'Yes, Disapprove',
	// 				cancelButtonText: 'Cancel',
	// 			})

	// 			if (!result.isConfirmed) {
	// 				return // user ne cancel kiya
	// 			}
	// 		}

	// 		// ✅ API Call
	// 		const response = await fetch(
	// 			`${BASE_API}/api/checkout/${orderId}/status`,
	// 			{
	// 				method: 'PUT',
	// 				headers: {
	// 					'Content-Type': 'application/json',
	// 					Authorization: `Bearer ${token}`,
	// 				},
	// 				body: JSON.stringify({
	// 					[type === 'order' ? 'orderStatus' : 'shippingStatus']: newStatus,
	// 				}),
	// 			}
	// 		)

	// 		if (!response.ok) {
	// 			const errorMessage = await response.json()
	// 			throw new Error(errorMessage.error || 'An error occurred')
	// 		}

	// 		toastService.success('Status updated successfully')
	// 		fetchOrders() // Refresh orders after update
	// 	} catch (error: any) {
	// 		toastService.error(error.message)
	// 	}
	// }
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

	// ************************ Approval Handler ********************************
	const handleApprovalSubmit = async () => {
		if (!selectedOrder || !approvalAction) return

		setApprovingSubmit(true)
		try {
			const response = await fetch(
				`${BASE_API}/api/checkout/${selectedOrder._id}/approve`,
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						action: approvalAction,
						remarks: approvalRemarks || undefined,
					}),
				}
			)

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || 'Failed to process approval')
			}

			toastService.success(
				`Order ${approvalAction === 'APPROVE' ? 'approved' : 'disapproved'} successfully!`
			)
			fetchOrders() // Refresh orders
			setShowApprovalModal(false)
			setApprovalAction(null)
			setApprovalRemarks('')
			// setApprovingOrderId(null)
		} catch (error: any) {
			toastService.error(error.message || 'Error processing approval')
		} finally {
			setApprovingSubmit(false)
		}
	}

	const handleShippingStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
        setApiLoading(true);
        const response = await fetch(
            `${BASE_API}/api/checkout/${orderId}/approve`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    // action: 'APPROVE',
                    shippingStatus: newStatus,
                    // remarks: 'Shipping status updated',
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update shipping status');
        }

        toastService.success('Shipping status updated successfully!');
        fetchOrders(); // Refresh orders
    } catch (error: any) {
        toastService.error(error.message || 'Error updating shipping status');
    } finally {
        setApiLoading(false);
    }
};

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
									<th>Approval Status</th>
									<th>Shipping Status</th>
									<th className=''>Order Confermation</th>
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
											<td>{record?.warehouse?.name || 'N/A'}</td>

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
												<span
													className={`badge bg-${
														record?.approvalStatus === 'PENDING'
															? 'warning'
															: record?.approvalStatus === 'APPROVED'
															? 'success'
															: 'danger'
													}`}>
													{record?.approvalStatus || 'N/A'}
												</span>
											</td>
											<td>
												<span
	 						
													className={`badge bg-${statusColors[record?.shippingStatus] || 'secondary'}`}>
  													{record?.shippingStatus.toUpperCase() || 'N/A'}
												</span>
											</td>
											{/* <td>
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
											</td> */}
											<td>
												<div className="d-flex gap-2 justify-content-center">
													{!record?.isFinalized && record?.approvalStatus === "PENDING" ? (
														<>
															<Button
																variant="success"
																size="sm"
																onClick={() => {
																	setSelectedOrder(record)
																	setApprovalAction('APPROVE')
																	setShowApprovalModal(true)
																}}
																title="Approve Order">
																✓
															</Button>
															<Button
																variant="danger"
																size="sm"
																onClick={() => {
																	setSelectedOrder(record)
																	setApprovalAction('DISAPPROVE')
																	setShowApprovalModal(true)
																}}
																title="Reject Order">
																✕
															</Button>
														</>
													) : (
														<span
        													className={`badge ${
        													record?.orderStatus === 'Processing'
        													? 'bg-success'
        													: record?.orderStatus === 'Cancelled'
        													? 'bg-danger'
        													: 'bg-warning'
        													}`}
      													>
        													{record?.orderStatus || 'N/A'}
      														</span>
													)
													}
												</div>
											</td>
											{/* <td>
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
											</td> */}
											<td>
												<div className="d-flex gap-2">
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
										<td colSpan={14} className="text-center">
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
					<Modal.Body className="p-4 p-md-5 bg-light">
  {selectedOrder && (
    <>
      {/* Define shipping steps order for stepper */}
      {(() => {
        const shippingSteps = ["Pending", "Shipped", "OnTheWay", "Delivered"] as const;
        const currentIndex = shippingSteps.indexOf(
          selectedOrder.shippingStatus || "Pending"
        );

        return (
          <>
            {/* Top Summary Bar */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-5 border border-light">
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <h4 className="fw-bold text-dark mb-1">Order Details</h4>
                  <p className="text-muted mb-0 fs-5">
                    Order ID: ORD-
                    {selectedOrder._id
                      ? selectedOrder._id.slice(-8).toUpperCase()
                      : "N/A"}
                  </p>
                </div>
                <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
                  <div className="d-flex justify-content-lg-end align-items-center gap-4">
                    <div className="text-center">
                      <small className="text-muted d-block">Order Status</small>
                      <span className="badge bg-primary px-4 py-2 fs-6 fw-bold">
                        {selectedOrder.orderStatus || "N/A"}
                      </span>
                    </div>
                    <div className="text-center">
                      <small className="text-muted d-block">Payment</small>
                      <span
                        className={`badge ${
                          selectedOrder.paymentStatus === "Paid"
                            ? "bg-success"
                            : "bg-warning text-dark"
                        } px-4 py-2 fs-6 fw-bold`}
                      >
                        {selectedOrder.paymentStatus || "N/A"}
                      </span>
                    </div>
                    <div className="text-center">
                      <small className="text-muted d-block mb-1">
                        Grand Total
                      </small>
                      <h3 className="text-primary fw-bold mb-0">
                        ${Number(selectedOrder.grandTotal || 0).toFixed(2)}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="row g-5">
              {/* Left: Items + Instructions */}
              <div className="col-lg-8">
                {/* Items Table */}
                <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                  <div className="card-header bg-transparent border-0 py-4">
                    <h5 className="mb-0 fw-bold text-dark">Order Items</h5>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover table-striped mb-0 align-middle">
                      <thead className="bg-light">
                        <tr>
                          <th className="ps-4 fw-medium">Product</th>
                          <th className="text-center">Qty</th>
                          <th className="text-end">Price</th>
                          <th className="text-center">Color</th>
                          <th className="text-end pe-4">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items?.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="ps-4 fw-medium">
                              {item.product?.name || "N/A"}
                            </td>
                            <td className="text-center">{item.quantity || 0}</td>
                            <td className="text-end">
                              ${Number(item.price || 0).toFixed(2)}
                            </td>
                            <td className="text-center">
                              <span className="badge bg-secondary-subtle text-dark px-3">
                                {item.color || "N/A"}
                              </span>
                            </td>
                            <td className="text-end pe-4 fw-bold">
                              $
                              {(
                                Number(item.quantity || 0) *
                                Number(item.price || 0)
                              ).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-top border-2 border-primary bg-light">
                          <td colSpan={4} className="text-end fw-bold fs-5">
                            Subtotal
                          </td>
                          <td className="text-end fw-bold fs-5 text-primary">
                            ${Number(selectedOrder.subtotal || 0).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Special Instructions */}
                {selectedOrder.specialInstructions && (
                  <div className="mt-4">
                    <div className="alert alert-info border-0 rounded-4 shadow-sm p-4 bg-opacity-10">
                      <h6 className="fw-bold mb-2">Special Instructions</h6>
                      <p className="mb-0 text-dark">
                        {selectedOrder.specialInstructions}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="col-lg-4">
                {/* Customer Info */}
                <div className="card shadow-sm border-0 rounded-4 mb-4">
                  <div className="card-header bg-transparent border-0 py-4">
                    <h5 className="mb-0 fw-bold text-dark">
                      Customer Information
                    </h5>
                  </div>
                  <div className="card-body pt-3">
                    <div className="d-grid gap-4">
                      {[
                        { label: "Name", value: selectedOrder.customer?.username },
                        { label: "Email", value: selectedOrder.customer?.email },
                        { label: "Phone", value: selectedOrder.customer?.phone_number },
                        { label: "Store", value: selectedOrder.warehouse?.name },
                      ].map((field) => (
                        <div
                          key={field.label}
                          className="d-flex justify-content-between"
                        >
                          <span className="text-muted">{field.label}</span>
                          <span className="fw-medium">
                            {field.value || "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="card shadow-sm border-0 rounded-4">
                  <div className="card-header bg-transparent border-0 py-4">
                    <h5 className="mb-0 fw-bold text-dark">
                      Payment Summary
                    </h5>
                  </div>
                  <div className="card-body pt-3">
                    <div className="d-grid gap-4">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Payment Method</span>
                        <span className="fw-medium">
                          {selectedOrder.paymentMethod || "N/A"}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Payment Status</span>
                        <span
                          className={`badge ${
                            selectedOrder.paymentStatus === "Paid"
                              ? "bg-success"
                              : "bg-danger"
                          } px-3 py-1`}
                        >
                          {selectedOrder.paymentStatus || "N/A"}
                        </span>
                      </div>
                      <hr className="my-3" />
                      <div className="d-flex justify-content-between fw-bold fs-5">
                        <span>Grand Total</span>
                        <span className="text-primary">
                          ${Number(selectedOrder.grandTotal || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Management */}
            <div className="mt-5">
              <div className="card shadow-sm border-0 rounded-4">
                <div className="card-header bg-transparent border-0 py-4">
                  <h5 className="mb-0 fw-bold text-dark">
                    Shipping Management
                  </h5>
                </div>
                <div className="card-body pt-4">
                  <div className="row align-items-end g-4 mb-5">
                    <div className="col-md-5">
                      <label className="form-label fw-medium">
                        Current Status
                      </label>
                      <div
                        className={`fw-bold fs-4 ${
                          selectedOrder.shippingStatus === "Returned"
                            ? "text-danger"
                            : "text-primary"
                        }`}
                      >
                        {selectedOrder.shippingStatus || "Pending"}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium">
                        Update Status
                      </label>
                      <Form.Select
                        value={selectedOrder.shippingStatus || ""}
                        onChange={(e) =>
                          handleShippingStatusUpdate(
                            selectedOrder._id,
                            e.target.value
                          )
                        }
                        disabled={
                          !selectedOrder?.isFinalized ||
                          selectedOrder?.orderStatus !== "Processing"
                        }
                        className="form-select-lg"
                      >
                        <option value="">Select Status</option>
                        {shippingSteps.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                        <option value="Returned">Returned</option>
                      </Form.Select>
                      {(!selectedOrder?.isFinalized ||
                        selectedOrder?.orderStatus !== "Processing") && (
                        <small className="text-danger d-block mt-1">
                          {selectedOrder?.isFinalized
                            ? "Only Processing orders can be updated"
                            : "Order must be finalized first"}
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Stepper */}
                  {selectedOrder.shippingStatus !== "Returned" && (
                    <div className="position-relative">
                      <div className="d-flex justify-content-between align-items-center">
                        {shippingSteps.map((step, index) => {
                          const isActive = index <= currentIndex;
                          const isCompleted = index < currentIndex;

                          return (
                            <div
                              key={step}
                              className="text-center position-relative flex-fill"
                            >
                              <div
                                className={`d-inline-flex align-items-center justify-content-center rounded-circle text-white fw-bold shadow-lg mb-3`}
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  backgroundColor: isActive
                                    ? "#198754"
                                    : "#6c757d",
                                  boxShadow: isActive
                                    ? "0 0 0 6px rgba(50,135,84,0.2)"
                                    : "none",
                                }}
                              >
                                {isCompleted ? "✓" : index === currentIndex ? "Now" : "Next"}
                              </div>
                              <p
                                className={`mb-0 fw-medium ${
                                  isActive ? "text-success" : "text-muted"
                                }`}
                              >
                                {step}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      {/* Progress Line */}
                     <div className="position-relative my-4" style={{ height: "20px" }}>

  	{/* Background Line */}
  	<div
  	  style={{
  	    position: "absolute",
  	    top: "50%",
  	    left: "90px",
  	    right: "90px",
  	    height: "5px",
  	    background: "#e5e5e5",
  	    borderRadius: "20px",
  	    transform: "translateY(-50%)",
  	    zIndex: 1,
  	  }}
  	/>

 	 {/* Progress Line */}
  	<div
    style={{
      position: "absolute",
      top: "50%",
      left: "90px",
      right: "96px",
      height: "4px",
      background: "#28a745",
      borderRadius: "20px",
    //   width: `${(currentIndex / (shippingSteps.length - 1)) * 100}%`,
      transform: "translateY(-50%)",
      zIndex: 1,
      transition: "width 0.3s ease",
    }}
  />

  {/* Circles (Steps) */}
  <div className="d-flex justify-content-between" style={{ padding: "0 90px", position: "relative", zIndex: 2 }}>
    {shippingSteps.map((step, index) => (
      <div
        key={index}
        style={{
          width: "18px",
          height: "18px",
          background: index <= currentIndex ? "#28a745" : "#d6d6d6",
          borderRadius: "50%",
          border: "2px solid white",
          boxShadow: "0 0 5px rgba(0,0,0,0.15)",
        }}
      ></div>
    ))}
  </div>
</div>

                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Approval History */}
            {selectedOrder.approvalHistory &&
              selectedOrder.approvalHistory.length > 0 && (
                <div className="mt-5">
                  <div className="card shadow-sm border-0 rounded-4">
                    <div className="card-header bg-transparent border-0 py-4">
                      <h5 className="mb-0 fw-bold text-dark">
                        Approval History
                      </h5>
                    </div>
                    <div className="card-body pt-4">
                      <div className="position-relative ps-5">
                        {selectedOrder.approvalHistory.map(
                          (history: any, idx: number) => (
                            <div
                              key={idx}
                              className="d-flex mb-5 position-relative"
                            >
                              <div className="flex-shrink-0 me-4">
                                <div
                                  className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow ${
                                    history.status === "APPROVED"
                                      ? "bg-success"
                                      : history.status === "DISAPPROVED"
                                      ? "bg-danger"
                                      : "bg-warning text-dark"
                                  }`}
                                  style={{ width: "44px", height: "44px" }}
                                >
                                  {history.status === "APPROVED"
                                    ? "✓"
                                    : history.status === "DISAPPROVED"
                                    ? "✗"
                                    : "!"}
                                </div>
                              </div>
                              <div className="flex-grow-1 bg-white rounded-4 shadow-sm p-4 border">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <h6 className="fw-bold mb-1">
                                      {history.role
                                        ? history.role.charAt(0).toUpperCase() +
                                          history.role.slice(1)
                                        : "Unknown Role"}
                                    </h6>
                                    <p className="text-muted small mb-2">
                                      {new Date(history.date).toLocaleString()}
                                    </p>
                                    {history.remarks && (
                                      <p className="mb-0 text-muted fst-italic">
                                        "{history.remarks}"
                                      </p>
                                    )}
                                  </div>
                                  <span
                                    className={`badge rounded-pill ${
                                      history.status === "APPROVED"
                                        ? "bg-success"
                                        : history.status === "DISAPPROVED"
                                        ? "bg-danger"
                                        : "bg-warning"
                                    } px-3`}
                                  >
                                    {history.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                        <div
                          className="position-absolute bg-light opacity-75"
                          style={{
                            left: "21px",
                            top: "22px",
                            bottom: "40px",
                            width: "4px",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </>
        );
      })()}
    </>
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
				<Modal.Header closeButton className={selectedOrder?.isFinalized ? 'bg-warning' : ''}>
					<div>
						<h4 className="modal-title">Update Order Details</h4>
						{selectedOrder?.isFinalized && (
							<small className="text-danger fw-bold">🔒 This order is finalized and cannot be edited</small>
						)}
					</div>
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
															disabled={selectedOrder?.isFinalized}
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
															disabled={selectedOrder?.isFinalized}
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
															disabled={selectedOrder?.isFinalized}
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
						<Button 
							variant="success" 
							type="submit"
							disabled={selectedOrder?.isFinalized || apiLoading}
						>
							{apiLoading ? 'Updating...' : selectedOrder?.isFinalized ? '🔒 Order Finalized' : 'Update Order'}
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>

			{/* Approval Modal */}
			{showApprovalModal && selectedOrder && (
  <Modal
    show={showApprovalModal}
    onHide={() => {
      setShowApprovalModal(false);
      setApprovalRemarks("");
      setApprovalAction(null);
    }}
    size="lg"
    centered
    backdrop="static"
    keyboard={false}
  >
    <Modal.Header closeButton className="border-0 pb-0">
      <div className="w-100">
        {/* Premium Gradient Header */}
        <div
          className="rounded-4 p-4 text-white mb-4 shadow-lg"
          style={{
            background:
              approvalAction === "APPROVE"
                ? "linear-gradient(135deg, #11998e, #38ef7d)"
                : "linear-gradient(135deg, #ff512f, #dd2476)",
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3 className="mb-1 fw-bold">
                {approvalAction === "APPROVE" ? "Approve Order" : "Reject Order"}
              </h3>
              <p className="mb-0 opacity-90 fs-5">
                ORD-{selectedOrder._id?.slice(-8).toUpperCase()}
              </p>
            </div>
            <div className="text-end">
              <h2 className="mb-0 fw-bold">
                ${Number(selectedOrder.grandTotal || 0).toFixed(2)}
              </h2>
              <small>Grand Total</small>
            </div>
          </div>
        </div>
      </div>
    </Modal.Header>

    <Modal.Body className="pt-3">
      {/* Order Items Table */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3 text-dark">Order Items</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Product</th>
                  <th className="text-center">Qty</th>
                  <th className="text-end">Price</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item: any, i: number) => (
                  <tr key={i}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-light rounded-3 d-flex align-items-center justify-content-center"
                          style={{ width: 48, height: 48 }}
                        >
                          <i className="ri-boxing-fill text-muted fs-4"></i>
                        </div>
                        <div>
                          <div className="fw-medium">{item.product?.name || "Unknown Product"}</div>
                          {item.color && <small className="text-muted">Color: {item.color}</small>}
                        </div>
                      </div>
                    </td>
                    <td className="text-center fw-bold">{item.quantity}</td>
                    <td className="text-end">${Number(item.price || 0).toFixed(2)}</td>
                    <td className="text-end fw-bold text-primary">
                      ${(item.quantity * Number(item.price || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="fw-bold fs-5">
                  <td colSpan={3} className="text-end bg-light">Grand Total</td>
                  <td className="text-end bg-light text-primary">
                    ${Number(selectedOrder.grandTotal || 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Customer + Store Info */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Customer Details</h6>
              <div className="vstack gap-3">
                {[
                  { icon: "ri-user-line", label: "Name", value: selectedOrder.customer?.username },
                  { icon: "ri-mail-line", label: "Email", value: selectedOrder.customer?.email },
                  { icon: "ri-phone-line", label: "Phone", value: selectedOrder.customer?.phone_number },
                ].map((item, i) => (
                  <div key={i} className="d-flex gap-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                      <i className={`${item.icon} text-primary`}></i>
                    </div>
                    <div>
                      <small className="text-muted">{item.label}</small>
                      <p className="mb-0 fw-medium">{item.value || "N/A"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Order Info</h6>
              <div className="vstack gap-3">
                <div className="d-flex gap-3">
                  <div className="bg-warning bg-opacity-10 rounded-circle p-2">
                    <i className="ri-store-2-line text-warning"></i>
                  </div>
                  <div>
                    <small className="text-muted">Store</small>
                    <p className="mb-0 fw-medium">{selectedOrder.warehouse?.name || "N/A"}</p>
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <div className="bg-info bg-opacity-10 rounded-circle p-2">
                    <i className="ri-calendar-check-line text-info"></i>
                  </div>
                  <div>
                    <small className="text-muted">Placed On</small>
                    <p className="mb-0 fw-medium">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval History - Vertical Timeline */}
      {selectedOrder.approvalHistory && selectedOrder.approvalHistory.length > 0 && (
        <div className="mb-5">
          <h6 className="fw-bold mb-4">Approval History</h6>
          <div className="position-relative">
            {selectedOrder.approvalHistory.map((h: any, i: number) => (
              <div key={i} className="d-flex mb-4">
                <div className="me-4 text-center">
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold  ${
                      h.status === "APPROVED" ? "bg-success" : "bg-danger"
                    } shadow`}
                    style={{ width: 40, height: 40 }}
                  >
                    {h.status === "APPROVED" ? "✓" : "✕"}
                  </div>
                  {i < selectedOrder.approvalHistory.length - 1 && (
                    <div className="position-absolute start-50 translate-middle-x bg-light" style={{ width: 3, height: 60, top: 40 }}></div>
                  )}
                </div>
                <div className="bg-white rounded-4 shadow-sm p-4 border flex-grow-1">
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>{h.role?.charAt(0).toUpperCase() + h.role?.slice(1)}</strong>
                      <small className="text-muted d-block">
                        {new Date(h.date).toLocaleString()}
                      </small>
                      {h.remarks && <p className="mb-0 mt-2 text-muted fst-italic">"{h.remarks}"</p>}
                    </div>
                    <span className={`badge rounded-pill d-flex align-items-center justify-content-center ${h.status === "APPROVED" ? "bg-success" : "bg-danger"}`}>
                      {h.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remarks Field - Floating Label + Validation */}
      <div className="form-floating mb-3">
        <textarea
          className={`form-control rounded-4 ${
            approvalAction === "DISAPPROVE" && !approvalRemarks.trim() && approvalRemarks !== ""
              ? "is-invalid"
              : ""
          }`}
          placeholder=" "
          id="remarks"
          style={{ height: "120px" }}
          value={approvalRemarks}
          onChange={(e) => setApprovalRemarks(e.target.value)}
        />
        <label htmlFor="remarks">
          {approvalAction === "APPROVE"
            ? "Approval Remarks (Optional)"
            : "Rejection Reason (Required)"}
        </label>
        {/* Live validation message */}
        {approvalAction === "DISAPPROVE" && !approvalRemarks.trim() && approvalRemarks.length > 0 && (
          <div className="text-danger small mt-1">
            Rejection reason is required
          </div>
        )}
      </div>
    </Modal.Body>

    <Modal.Footer className="border-0 pt-4">
      <Button
        variant="light"
        size="lg"
        className="px-5"
        onClick={() => {
          setShowApprovalModal(false);
          setApprovalRemarks("");
          setApprovalAction(null);
        }}
      >
        Cancel
      </Button>

      <Button
        variant={approvalAction === "APPROVE" ? "success" : "danger"}
        size="lg"
        className="px-2  shadow-lg"
        disabled={
          approvingSubmit ||
          (approvalAction === "DISAPPROVE" && !approvalRemarks.trim())
        }
        onClick={handleApprovalSubmit}
      >
        {approvingSubmit ? (
          <>
            <span className="spinner-border spinner-border-sm me-2"></span>
            Processing...
          </>
        ) : (
          <>
            {approvalAction === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}
          </>
        )}
      </Button>
    </Modal.Footer>
  </Modal>
)}
		</>
	)
}

export default EcommerceOrder
