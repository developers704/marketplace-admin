import { PageBreadcrumb } from '@/components'
import {
    Card,
    Form,
    Table,
    Pagination as BootstrapPagination,
} from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/common'
import { SkeletonHeader, TableRowSkeleton } from '../other/SimpleLoader'


interface ServiceOrderRecord {
    _id: string
    orderId: string
    customer: {
        username: string
        email: string
        phone_number: string
    }
    pet: {
        name: string
    }
    service: {
        _id: string
        name: string
    }
    startDate: string
    price: number
    endDate?: string
    orderStatus: string
    paymentStatus: string
    startTime: string
}

const ServiceOrder = () => {
    // const { isSuperUser, permissions } = useAuthContext()
    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [sortedAsc, setSortedAsc] = useState(true)
    const [loading, setLoading] = useState(false)
    // const [showDeleteButton, setShowDeleteButton] = useState(false)
    const [orders, setOrders] = useState<ServiceOrderRecord[]>([])
    const [orderStatuses, setOrderStatuses] = useState<Array<{ _id: string, name: string }>>([])
    const [paymentStatuses, setPaymentStatuses] = useState<Array<{ _id: string, name: string }>>([])
    const [serviceFilter, setServiceFilter] = useState<string>('all');
    const [availableServices, setAvailableServices] = useState<Array<{ _id: string, name: string }>>([]);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [paymentFilter, setPaymentFilter] = useState<string>('all');

    const BASE_API = import.meta.env.VITE_BASE_API
    const { user } = useAuthContext()
    const { token } = user


    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(orders.map((record) => Number(record._id)))
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
        console.log(setSortedAsc(true));

    }
    const filteredRecords = orders
        .filter((record) => {

            if (serviceFilter !== 'all') {
                return record.service._id === serviceFilter;
            }
            if (statusFilter !== 'all' && record.orderStatus !== statusFilter) {
                return false;
            }
            if (paymentFilter !== 'all' && record.paymentStatus !== paymentFilter) {
                return false;
            }
            return true; // Show all records when "all" is selected
        })
        .filter((record) =>
            record.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.customer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.pet.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) =>
            sortedAsc ? a.orderId.localeCompare(b.orderId) : b.orderId.localeCompare(a.orderId)
        );

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )
    const fetchOrders = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${BASE_API}/api/bookings/`, {
                headers: {
                    'Content-Type': 'application/json',
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
            const response = await fetch(`${BASE_API}/api/bookings/${orderId}`, {
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
    const fetchServices = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/services`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await response.json();
            setAvailableServices(data);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchStatuses();
        fetchServices();
    }, []);

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filter changes
    }, [serviceFilter]);


    const orderHeaders: SkeletonHeader[] = [
        { width: '20px', type: 'checkbox' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '80px', type: 'text' },
        { width: '80px', type: 'number' },
        { width: '80px', type: 'number' },
        { width: '80px', type: 'number' },
        { width: '100px', type: 'date' },
        { width: '120px', type: 'text' },
        { width: '120px', type: 'text' }
    ]


    return (
        <>
            <PageBreadcrumb title="Service Order" subName="Orders" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Service Order Management</h4>
                            <p className="text-muted mb-0">
                                Add and Manage your all Service Order here.
                            </p>
                        </div>

                        <div className="app-search mt-3 mt-lg-0">
                            <form>
                                <div className="input-group"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0, 0, 0, 0.1)',
                                        minWidth: '400px' // Added minimum width
                                    }}>
                                    <input
                                        type="search"
                                        className="form-control"
                                        placeholder="Search by Order ID, Customer Name or Pet Name..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        style={{
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            paddingLeft: '10px',
                                            color: '#333',
                                            width: '100%' // Ensure input takes full width
                                        }}
                                    />
                                    <span className="ri-search-line search-icon text-muted"
                                        style={{ marginRight: '10px', color: '#666' }}
                                    />
                                </div>
                            </form>
                        </div>

                    </div>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
                        <div className="mt-3">
                            <div className="d-flex flex-column flex-sm-row gap-2">
                                <Form.Select
                                    value={serviceFilter}
                                    onChange={(e) => setServiceFilter(e.target.value)}
                                    className="mb-2 mb-sm-0">
                                    <option value="all">Filter By Service Type</option>
                                    {availableServices.map(service => (
                                        <option key={service._id} value={service._id}>
                                            {service.name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                    }}
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
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                    className="mb-2 mb-sm-0">
                                    <option value="all">Filter By Payment Status</option>
                                    {paymentStatuses.map(status => (
                                        <option key={status._id} value={status.name}>
                                            {status.name}
                                        </option>
                                    ))}
                                </Form.Select>

                            </div>
                        </div>
                        <div className="d-flex flex-column flex-sm-row mt-2">
                            <Form.Select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                                <option value={15}>15 items</option>
                                <option value={30}>30 items</option>
                                <option value={40}>40 items</option>
                            </Form.Select>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="table-responsive">
                        <Table className="table-striped table-centered mb-0">
                            <thead>
                                <tr>
                                    <th>
                                        <input type="checkbox" onChange={handleSelectAll} />
                                    </th>
                                    <th>Order ID</th>
                                    <th>Customer Name</th>
                                    <th>Pet Name</th>
                                    <th>Service Type</th>
                                    <th>Start Date</th>
                                    <th>Start Time</th>
                                    <th>Price</th>
                                    <th>Order Status</th>
                                    <th>Payment Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={orderHeaders} rowCount={5} />
                                ) : paginatedRecords.length > 0 ? (
                                    paginatedRecords.map((record) => (
                                        <tr key={record._id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.includes(Number(record._id))}
                                                    onChange={() => handleSelectRow(Number(record._id))}
                                                />
                                            </td>
                                            <td>{record.orderId}</td>
                                            <td>{record.customer.username}</td>
                                            <td>{record.pet.name}</td>
                                            <td>{record.service.name}</td>
                                            <td>
                                                {record.service._id === '674edf6d1397cde5a452ac50' ? (
                                                    `${new Date(record.startDate).toLocaleDateString()} - ${record.endDate ? new Date(record.endDate).toLocaleDateString() : 'N/A'}`
                                                ) : (
                                                    new Date(record.startDate).toLocaleDateString()
                                                )}
                                            </td>
                                            <td>{record.startTime ? record.startTime : "N/A"}</td>
                                            <td>$  {record.price}</td>
                                            <td>
                                                <Form.Select
                                                    size="sm"
                                                    value={record.orderStatus}
                                                    onChange={(e) => handleStatusUpdate(record._id, 'order', e.target.value)}
                                                    className="w-100"
                                                    style={{ minWidth: '100px', maxWidth: '130px' }}
                                                >
                                                    {orderStatuses.map(status => (
                                                        <option key={status._id} value={status.name}>
                                                            {status.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </td>
                                            <td>
                                                <Form.Select
                                                    size="sm"
                                                    value={record.paymentStatus}
                                                    onChange={(e) => handleStatusUpdate(record._id, 'payment', e.target.value)}
                                                    className="w-100"
                                                    style={{ minWidth: '100px', maxWidth: '130px' }}
                                                >
                                                    {paymentStatuses.map(status => (
                                                        <option key={status._id} value={status.name}>
                                                            {status.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="text-center">
                                            No orders found
                                        </td>
                                    </tr>
                                )
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
            </Card>
        </>
    )
}
export default ServiceOrder
