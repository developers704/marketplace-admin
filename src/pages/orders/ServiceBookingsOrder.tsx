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
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useAuthContext } from '@/common'
import { MdEdit, MdRemoveRedEye } from 'react-icons/md'
import ThermalReceiptPrint from '@/components/ThermalReceiptPrint'
import ReactDOM from 'react-dom'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import Swal from 'sweetalert2'
// basic tables

interface EcommerceOrderRecord {
    _id: string
    orderId: string
    customer: {
        _id: string
        username: string
        email: string
    }
    services: Array<{
        _id: string
        name: string
    }>
    startDate: string
    endDate: string
    totalPrice: number
    orderStatus: string
    paymentStatus: string
    paymentMethod: string
    startTime: string
    createdAt: string
}


const EcommerceOrder = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(6)
    const [orders, setOrders] = useState<EcommerceOrderRecord[]>([])
    const [orderStatuses, setOrderStatuses] = useState<Array<{ _id: string, name: string }>>([])
    const [paymentStatuses, setPaymentStatuses] = useState<Array<{ _id: string, name: string }>>([])
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [paymentFilter, setPaymentFilter] = useState<string>('all')
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [showSelectionModal, setShowSelectionModal] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
    const [isOpen, toggleModal] = useToggle()
    const [phoneValue, setPhoneValue] = useState<string | undefined>(undefined)
    const [apiLoading, setApiLoading] = useState(false)
    const [showOrderModal, setShowOrderModal] = useState(false);
    // const [orderItems, setOrderItems] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState(false)

    // ************************ Helping Functions ********************************
    const BASE_API = import.meta.env.VITE_BASE_API
    const { user } = useAuthContext()
    const { token } = user

    const {
        handleSubmit,
        register,
        reset,
        setValue,
        formState: { errors },
    } = useForm()


    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }

    const filteredRecords = orders
        ?.filter((record) => {

            if (statusFilter !== 'all' && record?.orderStatus !== statusFilter) {
                return false;
            }
            if (paymentFilter !== 'all' && record?.paymentStatus !== paymentFilter) {
                return false;
            }
            if (paymentMethodFilter !== 'all' && record?.paymentMethod !== paymentMethodFilter) {
                return false;
            }
            return record?.orderId.toLowerCase().includes(searchTerm.toLowerCase());
        });

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )
    const handleEditClick = (order: any) => {
        setSelectedCustomer(order.customer)
        setSelectedOrder(order)
        if (order.shippingAddress) {
            setValue('address', order?.shippingAddress?.address)
            setValue('title', order?.shippingAddress?.title)
        }
        setShowSelectionModal(true)
    }

    const handleGeneralInfoUpdate = () => {
        setShowSelectionModal(false)
        if (selectedCustomer) {
            setValue('username', selectedCustomer?.username)
            setValue('email', selectedCustomer?.email)
            setPhoneValue(selectedCustomer?.phone_number)
            toggleModal()
        }
    }
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Order Receipt - ${selectedOrder?.orderId}</title>
                        <link href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css" rel="stylesheet">
                        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                        <style>
                            .overflow-visible {
                                overflow: visible !important;
                            }
                            .bg-orange-400 {
                                background-color: #fb923c !important;
                            }
                            .-rotate-45 {
                                transform: rotate(-45deg) !important;
                            }
                            .absolute {
                                position: absolute !important;
                            }
                            .-left-6 {
                                left: -1.5rem !important;
                            }
                            .top-4 {
                                top: 1rem !important;
                            }
                            @media print {
                                body {
                                    width: 90mm;
                                    margin: 0;
                                    padding: 0;
                                }
                                * {
                                    -webkit-print-color-adjust: exact;
                                    print-color-adjust: exact;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div id="root"></div>
                    </body>
                </html>
            `);

            const root = printWindow.document.getElementById('root');
            if (root) {
                ReactDOM.render(
                    <ThermalReceiptPrint
                        order={selectedOrder}
                    />,
                    root
                );
            }

            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };
    const handleToggleModal = () => {
        if (isOpen) {
            reset({ username: '' })
            setPhoneValue('')
        }
        toggleModal()
    }

    const handleOrderDetailsUpdate = () => {
        setShowSelectionModal(false);
        if (selectedOrder) {
            setValue('startDate', selectedOrder.startDate.split('T')[0]);
            setValue('startTime', selectedOrder.startTime);
            setValue('totalPrice', selectedOrder.totalPrice);
        }
        setShowOrderModal(true);
    }

    // ************************ Apis Functions ********************************

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${BASE_API}/api/service-bookings`, {
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
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${BASE_API}/api/paymentStatus`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ])

            const orderData = await orderRes.json()
            const paymentData = await paymentRes.json()

            setOrderStatuses(orderData)
            setPaymentStatuses(paymentData)
        } catch (error) {
            console.error('Error fetching statuses:', error)
        }
    }
    const handleStatusUpdate = async (orderId: string, type: 'order' | 'payment', newStatus: string) => {
        try {
            const response = await fetch(`${BASE_API}/api/checkout/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    [type === 'order' ? 'orderStatus' : 'paymentStatus']: newStatus
                })
            })

            if (response.ok) {
                fetchOrders() // Refresh orders after update
            }
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    const handleUpdateBrand = async (brandData: any) => {
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

            const response = await fetch(`${BASE_API}/api/customers/${selectedCustomer?._id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to Update Customer')
            }

            Swal.fire({
                title: 'Updated!',
                text: 'Customer updated successfully!',
                icon: 'success',
                confirmButtonText: 'OK',
                timer: 1500,
            })
            reset()
            await fetchOrders() // Update this to your orders fetch function
            handleToggleModal()
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
    const handleUpdateOrderDetails = async (data: any) => {
        try {

            setApiLoading(true);

            const response = await fetch(`${BASE_API}/api/service-bookings/${selectedOrder._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    startDate: data.startDate,
                    startTime: data.startTime,
                    totalPrice: Number(data.totalPrice),
                    services: selectedOrder.services
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update booking details');
            }

            Swal.fire({
                title: 'Success',
                text: 'Booking details updated successfully',
                icon: 'success',
                timer: 1500
            });

            setShowOrderModal(false);
            fetchOrders();
        } catch (error: any) {
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error'
            });
        } finally {
            setApiLoading(false);
        }
    };


    // const handleCancelOrder = async (orderId: string) => {
    //     try {
    //         const result = await Swal.fire({
    //             title: 'Cancel Order?',
    //             text: 'Are you sure you want to cancel this order?',
    //             icon: 'warning',
    //             showCancelButton: true,
    //             confirmButtonColor: '#d33',
    //             cancelButtonColor: '#3085d6',
    //             confirmButtonText: 'Yes, cancel order',
    //             cancelButtonText: 'No, keep order'
    //         });

    //         if (result.isConfirmed) {
    //             // Show loading state
    //             Swal.fire({
    //                 title: 'Cancelling Order...',
    //                 didOpen: () => {
    //                     Swal.showLoading()
    //                 },
    //                 allowOutsideClick: false
    //             });

    //             const response = await fetch(`${BASE_API}/api/checkout/${orderId}/cancel`, {
    //                 method: 'PUT',
    //                 headers: {
    //                     Authorization: `Bearer ${token}`
    //                 }
    //             });

    //             if (!response.ok) {
    //                 throw new Error('Failed to cancel order');
    //             }

    //             // Success message
    //             Swal.fire({
    //                 title: 'Cancelled!',
    //                 text: 'Order has been cancelled successfully.',
    //                 icon: 'success',
    //                 timer: 1500
    //             });

    //             // Refresh orders list
    //             fetchOrders();
    //         }
    //     } catch (error: any) {
    //         Swal.fire({
    //             title: 'Error!',
    //             text: error.message || 'Failed to cancel order',
    //             icon: 'error'
    //         });
    //     }
    // }
    const handleExportOrders = async () => {
        setIsExporting(true)
        try {
            const response = await fetch(`${BASE_API}/api/checkout/orders/download-data`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
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
        setCurrentPage(1); // Reset to first page when filter changes
    }, [statusFilter, paymentFilter]);

    useEffect(() => {
        fetchOrders()
        fetchStatuses()
    }, [])
    useEffect(() => {
        setCurrentPage(1)
    }, [itemsPerPage])

    const orderHeaders: SkeletonHeader[] = [
        { width: '100px', type: 'text' }, // Order ID
        { width: '100px', type: 'text' }, // Customer
        { width: '100px', type: 'text' }, // Email
        { width: '80px', type: 'text' },  // Phone
        { width: '120px', type: 'text' }, // Products
        { width: '80px', type: 'number' }, // Total Amount
        { width: '100px', type: 'text' }, // Payment Method
        { width: '120px', type: 'text' }, // Payment Status
        { width: '120px', type: 'text' }, // Payment Status
        { width: '120px', type: 'text' }, // Order Status
        { width: '100px', type: 'actions' } // Actions
    ]

    // ************************ Render Section ********************************
    return (
        <>
            <PageBreadcrumb title="Service Bookings" subName="Orders" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">

                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                            <div>
                                <h4 className="header-title">Service Bookings Management</h4>
                                <p className="text-muted mb-0">
                                    Add and Manage your all Service Bookings here.
                                </p>
                            </div>
                        </div>

                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center ">
                            <button
                                className="btn btn-primary mt-3 mt-lg-0 me-2"
                                onClick={handleExportOrders}
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
                                        Export Orders Data
                                    </>
                                )}
                            </button>

                            <div className="app-search">
                                <form>
                                    <div className="input-group" style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0, 0, 0, 0.1)',
                                        minWidth: '400px'
                                    }}>
                                        <input
                                            type="search"
                                            className="form-control"
                                            placeholder="Search by Order ID..."
                                            value={searchTerm}
                                            onChange={handleSearch}
                                            style={{
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                paddingLeft: '10px',
                                                color: '#333',
                                                width: '100%'
                                            }}
                                        />
                                        <span className="ri-search-line search-icon text-muted"
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
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                    }}
                                    style={{ zIndex: 1 }}
                                    className="mb-2 mb-sm-0">
                                    <option value="all">Filter By Order Status</option>
                                    {orderStatuses.map(status => (
                                        <option key={status._id} value={status.name}>
                                            {status.name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Select
                                    value={paymentFilter}
                                    style={{ zIndex: 1 }}
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                    className="mb-2 mb-sm-0">
                                    <option value="all">Filter By Payment Status</option>
                                    {paymentStatuses.map(status => (
                                        <option key={status._id} value={status.name}>
                                            {status.name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Select
                                    value={paymentMethodFilter}
                                    style={{ zIndex: 1 }}
                                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                                    className="mb-2 mb-sm-0">
                                    <option value="all">Filter By Payment Method</option>
                                    <option value="COD">COD</option>
                                    <option value="Wallet">Wallet</option>
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
                </Card.Header>

                <Card.Body>
                    <div className="table-responsive">
                        <Table responsive className="table-striped table-centered mb-0">
                            <thead>
                                <tr>
                                    <th>S. No</th>
                                    <th>Booking ID</th>
                                    <th>Customer</th>
                                    <th>Email</th>
                                    <th>Services</th>
                                    <th>Start Date</th>
                                    <th>Start Time</th>
                                    <th>Total Price</th>
                                    <th>Payment Method</th>
                                    <th>Payment Status</th>
                                    <th>Order Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={orderHeaders} rowCount={5} />
                                ) :
                                    paginatedRecords?.map((record: EcommerceOrderRecord, index: number) => (
                                        <tr key={record?._id}>
                                            <th>{index + 1}</th>
                                            <td>{record?.orderId}</td>
                                            <td>{record?.customer?.username}</td>
                                            <td>{record?.customer?.email}</td>
                                            <td>{record?.services?.map(service => service?.name).join(', ')}</td>
                                            <td>{new Date(record?.startDate).toLocaleDateString()}</td>
                                            <td>{record?.startTime}</td>
                                            <td>$  {record?.totalPrice}</td>
                                            <td>{record?.paymentMethod}</td>
                                            <td>
                                                <Form.Select
                                                    size="sm"
                                                    value={record?.paymentStatus}
                                                    onChange={(e) => handleStatusUpdate(record?._id, 'payment', e.target.value)}
                                                    style={{ minWidth: '100px', maxWidth: '130px' }}
                                                >
                                                    {paymentStatuses?.map(status => (
                                                        <option key={status?._id} value={status?.name}>{status?.name}</option>
                                                    ))}
                                                </Form.Select>
                                            </td>
                                            <td>
                                                <Form.Select
                                                    size="sm"
                                                    value={record?.orderStatus}
                                                    onChange={(e) => handleStatusUpdate(record?._id, 'order', e.target.value)}
                                                    style={{ minWidth: '100px', maxWidth: '130px' }}
                                                >
                                                    {orderStatuses?.map(status => (
                                                        <option key={status?._id} value={status?.name}>{status?.name}</option>
                                                    ))}
                                                </Form.Select>
                                            </td>
                                            <td>
                                                <div className='d-flex'>
                                                    <Button variant="info" className="me-2" onClick={() => {
                                                        setSelectedOrder(record);
                                                        setShowModal(true);
                                                    }}>
                                                        <MdRemoveRedEye />
                                                    </Button>
                                                    <Button variant="secondary" className="me-2" onClick={() => handleEditClick(record)}>
                                                        <MdEdit />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </Table>


                    </div>
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
                </Card.Body>
            </Card>
            {/* View Modal */}
            <Modal size="xl" show={showModal} onHide={() => setShowModal(false)}>
                <div id="order-modal-content" className="order-details">
                    <Modal.Header closeButton className="bg-light">
                        <Modal.Title>
                            <i className="ri-calendar-check-line me-2"></i>
                            Service Booking #{selectedOrder?.orderId}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        {selectedOrder && (
                            <div className="order-details">
                                <div className="row">
                                    <div className="col-md-6 mb-4">
                                        <div className="card h-100">
                                            <div className="card-body">
                                                <h5 className="card-title mb-3">Customer Information</h5>
                                                <div className="table-responsive">
                                                    <table className="table table-borderless mb-0">
                                                        <tbody>
                                                            <tr>
                                                                <th scope="row" style={{ width: '35%' }}>Name:</th>
                                                                <td>{selectedOrder?.customer?.username || 'N/A'}</td>
                                                            </tr>
                                                            <tr>
                                                                <th scope="row">Email:</th>
                                                                <td>{selectedOrder?.customer?.email || 'N/A'}</td>
                                                            </tr>
                                                            <tr>
                                                                <th scope="row">Phone:</th>
                                                                <td>{selectedOrder?.customer?.phone_number || 'N/A'}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6 mb-4">
                                        <div className="card h-100">
                                            <div className="card-body">
                                                <h5 className="card-title mb-3">Booking Details</h5>
                                                <div className="table-responsive">
                                                    <table className="table table-borderless mb-0">
                                                        <tbody>
                                                            <tr>
                                                                <th scope="row" style={{ width: '35%' }}>Start Date:</th>
                                                                <td>{new Date(selectedOrder?.startDate).toLocaleDateString()}</td>
                                                            </tr>
                                                            <tr>
                                                                <th scope="row">Start Time:</th>
                                                                <td>{selectedOrder?.startTime}</td>
                                                            </tr>
                                                            <tr>
                                                                <th scope="row">End Date:</th>
                                                                <td>{new Date(selectedOrder?.endDate).toLocaleDateString()}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12 mb-4">
                                        <div className="card">
                                            <div className="card-body">
                                                <h5 className="card-title mb-3">Booked Services</h5>
                                                <div className="table-responsive">
                                                    <table className="table table-bordered">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Service Name</th>
                                                                <th style={{ width: '20%' }}>Price</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedOrder?.services?.map((service: any) => (
                                                                <tr key={service._id}>
                                                                    <td>{service.name}</td>
                                                                    <td>$  {service.price || 0}</td>
                                                                </tr>
                                                            ))}
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
                                                        <tbody>
                                                            <tr>
                                                                <td>Payment Method</td>
                                                                <td>{selectedOrder?.paymentMethod || 'N/A'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td>Payment Status</td>
                                                                <td>{selectedOrder?.paymentStatus || 'N/A'}</td>
                                                            </tr>
                                                            <tr className="table-light fw-bold">
                                                                <td>Total Amount</td>
                                                                <td>$  {selectedOrder?.totalPrice || 0}</td>
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
                    <Button variant="success" onClick={handlePrint}>
                        <i className="ri-printer-line me-1"></i>
                        Print Booking
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Selection Modal */}
            <Modal show={showSelectionModal} onHide={() => setShowSelectionModal(false)} dialogClassName="modal-dialog-centered">
                <Modal.Header closeButton>
                    <h4 className="modal-title">Choose Update Type</h4>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <Button variant="primary" className="me-2" onClick={handleGeneralInfoUpdate}>
                        Update General Info
                    </Button>
                    <Button variant="success" onClick={handleOrderDetailsUpdate}>
                        Update Order
                    </Button>
                </Modal.Body>
            </Modal>

            {/* General Modal */}
            <Modal show={isOpen} onHide={handleToggleModal} dialogClassName="modal-dialog-centered">
                <Modal.Header closeButton>
                    <h4 className="modal-title">
                        Update Customer
                    </h4>
                </Modal.Header>
                <Form onSubmit={handleSubmit(handleUpdateBrand)}>
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
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={handleToggleModal}>
                            Close
                        </Button>
                        <Button variant="soft-success" type="submit">
                            {apiLoading ? 'Updating...' : 'Update Customer'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>


            {/* Order Details Modal */}
            <Modal
                show={showOrderModal}
                onHide={() => setShowOrderModal(false)}
                dialogClassName="modal-dialog-centered modal-lg"
            >
                <Modal.Header closeButton>
                    <h4 className="modal-title">Update Service Booking Details</h4>
                </Modal.Header>
                <Form onSubmit={handleSubmit(handleUpdateOrderDetails)}>
                    <Modal.Body>
                        <div className="row">
                            <div className="col-12">
                                <h5 className="mb-3">Booked Services</h5>
                                <div className="table-responsive">
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Service Name</th>
                                                <th>Price</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder?.services?.map((service: any, index: number) => (
                                                <tr key={index}>
                                                    <td>{service?.name || 'N/A'}</td>
                                                    <td>$  {service?.price || 0}</td>
                                                    <td>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => {
                                                                const newServices = selectedOrder?.services?.filter((_: any, i: number) => i !== index) || [];
                                                                setSelectedOrder({ ...selectedOrder, services: newServices });
                                                            }}
                                                        >
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
                                <FormInput
                                    label="Start Date"
                                    type="date"
                                    name="startDate"
                                    containerClass="mb-3"
                                    register={register}
                                    key="startDate"
                                    errors={errors}
                                />
                            </div>

                            <div className="col-md-6">
                                <FormInput
                                    label="Start Time"
                                    type="time"
                                    name="startTime"
                                    containerClass="mb-3"
                                    register={register}
                                    key="startTime"
                                    errors={errors}
                                />
                            </div>

                            <div className="col-md-6">
                                <FormInput
                                    label="Total Price"
                                    type="number"
                                    name="totalPrice"
                                    containerClass="mb-3"
                                    register={register}
                                    key="totalPrice"
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
                            {apiLoading ? 'Updating...' : 'Update Booking'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>


        </>
    )
}
export default EcommerceOrder
