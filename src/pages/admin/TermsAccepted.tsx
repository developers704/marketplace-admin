import { PageBreadcrumb } from '@/components'
import {  Card, Form, Table, Pagination as BootstrapPagination, Badge, Row, Col } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/common'
import { TableRowSkeleton } from '../other/SimpleLoader'
import Select from 'react-select'
interface WarehouseRecord {
    _id: string
    name: string
    location: string
}

interface DepartmentRecord {
    _id: string
    name: string
    description: string
}

interface SelectOption {
    value: string
    label: string
}
interface AcceptedUser {
    _id: string
    username: string
    email: string
    phone_number: string
    city: string | null
    gender: string | null
    profileImage: string | null
    termsAcceptedDate: string
    warehouse: WarehouseRecord | null
    department: DepartmentRecord | null
}

interface CurrentTerms {
    _id: string
    content: string
    createdAt: string
    updatedAt: string
    __v: number
}

interface Pagination {
    currentPage: number
    totalPages: number
    hasNext: boolean
}

interface TermsAcceptedResponse {
    success: boolean
    data: {
        acceptedUsers: AcceptedUser[]
        totalAccepted: number
        currentTerms: CurrentTerms
        pagination: Pagination
    }
}

const TermsAccepted = () => {
    const { user } = useAuthContext()

    // States
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [loading, setLoading] = useState(false)
    const [termsData, setTermsData] = useState<TermsAcceptedResponse | null>(null)
    const [warehousesData, setWarehousesData] = useState<WarehouseRecord[]>([])
    const [departmentsData, setDepartmentsData] = useState<DepartmentRecord[]>([])
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
    const [selectedDepartment, setSelectedDepartment] = useState<string>('')
    // API basics
    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    // Handle functions
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked && termsData?.data.acceptedUsers) {
            setSelectedRows(termsData.data.acceptedUsers.map((user) => user._id))
        } else {
            setSelectedRows([])
        }
    }

    const handleSelectRow = (id: string) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        )
    }

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
        setCurrentPage(1)
    }

    // Replace your existing filteredUsers with this
    const filteredUsers = termsData?.data.acceptedUsers?.filter((user) => {
        const matchesSearch = user?.username?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            user?.email?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            user?.phone_number?.toLowerCase()?.includes(searchTerm.toLowerCase())

        const matchesWarehouse = !selectedWarehouse || user?.warehouse?._id === selectedWarehouse
        const matchesDepartment = !selectedDepartment || user?.department?._id === selectedDepartment

        return matchesSearch && matchesWarehouse && matchesDepartment
    }) || []


    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )
    // Add these option arrays
    const warehouseOptions: SelectOption[] = [
        { value: '', label: 'All Stores' },
        ...warehousesData.map(warehouse => ({
            value: warehouse._id,
            label: `${warehouse.name} - ${warehouse.location}`
        }))
    ]

    const departmentOptions: SelectOption[] = [
        { value: '', label: 'All Departments' },
        ...departmentsData.map(department => ({
            value: department._id,
            label: department.name
        }))
    ]

    // API Call
    const getTermsAcceptedUsers = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/auth/terms/accepted-users`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get terms accepted users')
            }

            const data = await response.json()
            console.log('Terms Accepted Users Response:', data)
            setTermsData(data)
        } catch (error: any) {
            console.error('Error fetching terms accepted users:', error)
        } finally {
            setLoading(false)
        }
    }
    // Add these API functions
    const getWarehouses = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/warehouses`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to get warehouses')
            }

            const data_res: WarehouseRecord[] = await response.json()
            if (data_res) {
                setWarehousesData(data_res)
            }
        } catch (error: any) {
            console.error('Error fetching warehouses:', error)
        }
    }

    const getDepartments = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/departments`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to get departments')
            }

            const data_res: DepartmentRecord[] = await response.json()
            if (data_res) {
                setDepartmentsData(data_res)
            }
        } catch (error: any) {
            console.error('Error fetching departments:', error)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getTimeSinceAcceptance = (dateString: string) => {
        const acceptedDate = new Date(dateString)
        const now = new Date()
        const diffInMs = now.getTime() - acceptedDate.getTime()
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

        if (diffInDays === 0) {
            const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
            if (diffInHours === 0) {
                const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
                return `${diffInMinutes} minutes ago`
            }
            return `${diffInHours} hours ago`
        } else if (diffInDays === 1) {
            return '1 day ago'
        } else if (diffInDays < 30) {
            return `${diffInDays} days ago`
        } else if (diffInDays < 365) {
            const diffInMonths = Math.floor(diffInDays / 30)
            return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
        } else {
            const diffInYears = Math.floor(diffInDays / 365)
            return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`
        }
    }

    useEffect(() => {
        getTermsAcceptedUsers()
        getWarehouses()
        getDepartments()
    }, [])
    useEffect(() => {
        setCurrentPage(1)
    }, [selectedWarehouse, selectedDepartment, searchTerm])
    useEffect(() => {
        setCurrentPage(1)
    }, [itemsPerPage])

    const userHeaders: any[] = [
        { width: '20px', type: 'checkbox' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '120px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '120px', type: 'text' }
    ]

    return (
        <>
            <PageBreadcrumb title="Terms Accepted" subName="Admin" allowNavigateBack={true} />



            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Terms & Conditions Acceptance</h4>
                            <p className="text-muted mb-0">
                                View all users who have accepted the current terms and conditions.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <Badge bg="success" className="fs-6">
                                <i className="bi bi-shield-check me-1"></i>
                                {termsData?.data.totalAccepted || 0} Users Compliant
                            </Badge>
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
                        <div className="d-flex flex-column flex-lg-row gap-3 align-items-lg-center">
                            <div className="app-search">
                                <form>
                                    <div className="input-group" style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0, 0, 0, 0.1)',
                                        minWidth: '250px'
                                    }}>
                                        <input
                                            type="search"
                                            className="form-control"
                                            placeholder="Search users..."
                                            value={searchTerm}
                                            onChange={handleSearch}
                                            style={{
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                paddingLeft: '10px',
                                                color: '#333'
                                            }}
                                        />
                                        <span className="ri-search-line search-icon text-muted"
                                            style={{ marginRight: '10px', color: '#666' }}
                                        />
                                    </div>
                                </form>
                            </div>

                            {/* Store Filter Dropdown */}
                            <div style={{ minWidth: '200px' }}>
                                <Select
                                    options={warehouseOptions}
                                    value={warehouseOptions.find(option => option.value === selectedWarehouse) || warehouseOptions[0]}
                                    onChange={(selectedOption) => {
                                        setSelectedWarehouse(selectedOption?.value || '')
                                        setCurrentPage(1)
                                    }}
                                    placeholder="Select Store..."
                                    isClearable={false}
                                    isSearchable={true}
                                    className="react-select-container"
                                    classNamePrefix="react-select"

                                />
                            </div>

                            {/* Department Filter Dropdown */}
                            <div style={{ minWidth: '180px' }}>
                                <Select
                                    options={departmentOptions}
                                    value={departmentOptions.find(option => option.value === selectedDepartment) || departmentOptions[0]}
                                    onChange={(selectedOption) => {
                                        setSelectedDepartment(selectedOption?.value || '')
                                        setCurrentPage(1)
                                    }}
                                    placeholder="Select Department..."
                                    isClearable={false}
                                    isSearchable={true}
                                    className="react-select-container"
                                    classNamePrefix="react-select"

                                />
                            </div>
                        </div>

                        <Form.Select
                            value={itemsPerPage}
                            style={{ zIndex: 1, minWidth: '120px' }}
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
                                            checked={selectedRows.length > 0 && selectedRows.length === filteredUsers.length}
                                        />
                                    </th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Phone Number</th>
                                    <th>Department</th>
                                    <th>Store</th>
                                    <th>Acceptance Date</th>
                                    <th>Time Since</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={userHeaders} rowCount={5} />
                                ) : paginatedUsers.length > 0 ? (
                                    paginatedUsers.map((user, idx) => {
                                        const isSelected = selectedRows.includes(user._id)

                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectRow(user._id)}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar-sm me-2">
                                                            {user.profileImage ? (
                                                                <img
                                                                    src={user.profileImage}
                                                                    alt={user.username}
                                                                    className="rounded-circle"
                                                                    style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                                />
                                                            ) : (
                                                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                                                                    style={{ width: '32px', height: '32px' }}>
                                                                    {user.username.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <strong className="text-truncate d-block">{user.username}</strong>
                                                            <Badge bg="success" className="badge-sm">
                                                                <i className="bi bi-check-circle me-1"></i>
                                                                Accepted
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-truncate">{user.email}</td>
                                                <td>{user.phone_number || 'N/A'}</td>
                                                <td>
                                                    <div>
                                                        <strong className="d-block text-truncate">
                                                            {user.department?.name || 'N/A'}
                                                        </strong>
                                                        {user.department?.name && (
                                                            <small className="text-muted">
                                                                <i className="bi bi-building me-1"></i>
                                                                Department
                                                            </small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong className="d-block text-truncate">
                                                            {user.warehouse?.name || 'N/A'}
                                                        </strong>
                                                        {user.warehouse?.location && (
                                                            <small className="text-muted">
                                                                <i className="bi bi-geo-alt me-1"></i>
                                                                {user.warehouse.location}
                                                            </small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong className="d-block">{formatDate(user.termsAcceptedDate)}</strong>
                                                        <small className="text-muted">
                                                            <i className="bi bi-calendar-check me-1"></i>
                                                            {new Date(user.termsAcceptedDate).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge
                                                        bg={
                                                            getTimeSinceAcceptance(user.termsAcceptedDate).includes('minutes') ||
                                                                getTimeSinceAcceptance(user.termsAcceptedDate).includes('hours') ? 'success' :
                                                                getTimeSinceAcceptance(user.termsAcceptedDate).includes('day') ? 'info' :
                                                                    getTimeSinceAcceptance(user.termsAcceptedDate).includes('month') ? 'warning' : 'secondary'
                                                        }
                                                        className="badge-sm"
                                                    >
                                                        {getTimeSinceAcceptance(user.termsAcceptedDate)}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="text-center py-4">
                                            <div className="text-muted">
                                                <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                                {searchTerm ? 'No users found matching your search' : 'No users have accepted terms yet'}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <nav className="d-flex justify-content-end mt-3">
                                <BootstrapPagination className="pagination-rounded mb-0">
                                    <BootstrapPagination.Prev
                                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    />

                                    {currentPage > 2 && (
                                        <>
                                            <BootstrapPagination.Item onClick={() => handlePageChange(1)}>
                                                1
                                            </BootstrapPagination.Item>
                                            {currentPage > 3 && <BootstrapPagination.Ellipsis />}
                                        </>
                                    )}

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
                                        disabled={currentPage === totalPages}
                                    />
                                </BootstrapPagination>
                            </nav>
                        )}
                    </div>

                    {/* Footer Summary */}
                    <div className="mt-3 pt-3 border-top">
                        <Row>
                            <Col md={6}>
                                <small className="text-muted">
                                    Showing {paginatedUsers.length} of {filteredUsers.length} users
                                    {searchTerm && ` (filtered from ${termsData?.data.totalAccepted || 0} total)`}
                                </small>
                            </Col>
                            <Col md={6} className="text-end">
                                <small className="text-muted">
                                    <i className="bi bi-shield-check me-1"></i>
                                    All displayed users have accepted the current terms & conditions
                                </small>
                            </Col>
                        </Row>
                    </div>
                </Card.Body>
            </Card>

            {/* Terms Content Preview */}
            {termsData?.data.currentTerms && (
                <Card className="mt-4">
                    <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <i className="bi bi-file-text me-2"></i>
                                Current Terms & Conditions Preview
                            </h5>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <div className="bg-light p-3 rounded">
                            <div className="mb-3">
                                <Row>
                                    <Col md={6}>
                                        <small className="text-muted d-block">Created Date:</small>
                                        <strong>{formatDate(termsData.data.currentTerms.createdAt)}</strong>
                                    </Col>
                                    <Col md={6}>
                                        <small className="text-muted d-block">Last Updated:</small>
                                        <strong>{formatDate(termsData.data.currentTerms.updatedAt)}</strong>
                                    </Col>
                                </Row>
                            </div>
                            <div className="border-top pt-3">
                                <small className="text-muted d-block mb-2">Terms Content:</small>
                                <div
                                    className="terms-content"
                                    style={{
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5'
                                    }}
                                >
                                    {termsData.data.currentTerms.content.length > 500 ? (
                                        <>
                                            {termsData.data.currentTerms.content.substring(0, 500)}...
                                            <div className="mt-2">
                                                <Badge bg="secondary">Content truncated for preview</Badge>
                                            </div>
                                        </>
                                    ) : (
                                        termsData.data.currentTerms.content
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            )}

        </>
    )
}

export default TermsAccepted

