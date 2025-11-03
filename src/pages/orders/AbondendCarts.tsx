import { PageBreadcrumb } from '@/components'
import {
    Card,
    Form,
    Table,
    Pagination as BootstrapPagination,
} from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { TableRowSkeleton } from '../other/SimpleLoader'

interface TableRecord {
    _id: number
    content: string
    isActive: boolean
}
interface CartItem {
    _id: string
    customer: {
        _id: string
        username: string
        email: string
        phone_number: string
    }
    items: Array<{
        item: {
            _id: string
            name: string
            sku: string
            image: string | null
        }
        quantity: number
        price: number
        _id: string
    }>
    total: number
    createdAt: string
    updatedAt: string
}

const AbondendCarts = () => {
    const { user } = useAuthContext()

    const [selectedRows, setSelectedRows] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [loading, setLoading] = useState(false)
    const [EditingScrollMsg, setEditingScrollMsg] = useState<TableRecord | null>(null)
    const [isOpen] = useToggle()
    const [cartData, setCartData] = useState<CartItem[]>([])




    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user
    const {
        reset,
        setValue,
    } = useForm()

    const filteredRecords = cartData
        .filter((record) =>
            record.customer.username.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.customer.username.localeCompare(b.customer.username))
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(cartData.map((record) => record._id))
        } else {
            setSelectedRows([])
        }
    }
    const handleSelectRow = (id: any) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        )
    }
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )
    const fetchCartData = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/analytics/cartdetailed-data`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = await response.json()
            setCartData(data)
        } catch (error) {
            console.error('Error fetching cart data:', error)
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        if (!isOpen) {
            reset()
            setEditingScrollMsg(null)
        }
    }, [isOpen, reset])

    useEffect(() => {
        if (EditingScrollMsg) {
            setValue('content', EditingScrollMsg.content)
        } else {
            reset({ content: '' })
        }
    }, [EditingScrollMsg, setValue, reset])

    useEffect(() => {
        fetchCartData()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
    }, [itemsPerPage, selectedRows])

    const warehouseHeaders: any[] = [
        { width: '20px', type: 'checkbox' },
        { width: '100px', type: 'text' }, // Customer Name
        { width: '120px', type: 'text' }, // Email
        { width: '100px', type: 'text' }, // Phone
        { width: '150px', type: 'text' }, // Product Name
        { width: '100px', type: 'text' }, // SKU
        { width: '80px', type: 'text' },  // Quantity
        { width: '100px', type: 'text' }, // Total Amount
        { width: '100px', type: 'text' }, // Created Date
        { width: '100px', type: 'text' }  // Last Updated
    ]


    return (
        <>
            <PageBreadcrumb title="Abondend Carts" subName="Products" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Abondend Carts</h4>
                            <p className="text-muted mb-0">
                                See and Manage your all Abondend Carts here.
                            </p>
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
                                        placeholder="Search carts here..."
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
                                            checked={selectedRows.length === cartData.length}
                                        />{' '}
                                    </th>
                                    <th>User Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Product Name</th>
                                    <th>SKU</th>
                                    <th>Quantity</th>
                                    <th>Total Amount</th>
                                    <th>Created Date</th>
                                    <th>Last Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={warehouseHeaders} rowCount={3} />
                                ) : paginatedRecords?.length > 0 ? (
                                    (paginatedRecords || []).map((record: CartItem, idx) => {
                                        const isSelected = selectedRows.includes(record?._id)
                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectRow(record._id)}
                                                    />
                                                </td>
                                                <td>{record?.customer?.username}</td>
                                                <td>{record?.customer?.email}</td>
                                                <td>{record?.customer?.phone_number}</td>
                                                <td>
                                                    {record.items.map((item, index) => (
                                                        <div key={item._id}>
                                                            {item?.item?.name}
                                                            {index < record?.items?.length - 1 && ', '}
                                                        </div>
                                                    ))}
                                                </td>
                                                <td>
                                                    {record?.items.map((item, index) => (
                                                        <div key={item?._id}>
                                                            {item?.item?.sku}
                                                            {index < record?.items?.length - 1 && ', '}
                                                        </div>
                                                    ))}
                                                </td>
                                                <td>
                                                    {record.items.map((item, index) => (
                                                        <div key={item?._id}>
                                                            {item?.quantity}
                                                            {index < record?.items?.length - 1 && ', '}
                                                        </div>
                                                    ))}
                                                </td>
                                                <td>$  {record?.total}</td>
                                                <td>{new Date(record?.createdAt).toLocaleDateString()}</td>
                                                <td>{new Date(record?.updatedAt).toLocaleDateString()}</td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="text-center">
                                            No abandoned carts found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>


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
                    </div>
                </Card.Body>
            </Card>
        </>
    )
}

export default AbondendCarts
