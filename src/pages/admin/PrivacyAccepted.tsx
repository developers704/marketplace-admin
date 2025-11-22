import { PageBreadcrumb } from '@/components'
import { Button, Card, Form, Table, Pagination as BootstrapPagination, Badge, Row, Col, Alert, Modal } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/common'
import Select from 'react-select'
import { TableRowSkeleton } from '../other/SimpleLoader'
import { toastService } from '@/common/context/toast.service'

interface WarehouseRecord {
    _id: string
    name: string
    location: string
}
interface SelectOption {
    value: string
    label: string
}

interface DepartmentRecord {
    _id: string
    name: string
    description: string
}

interface Customer {
    id: string 
    username: string
    email: string
    phone_number: string
    role: {
        id: string
        name: string
        permissions: any
    }
    warehouse: {
        id: string
        name: string
        location: string
    }
    department: {
        id: string
        name: string
        description: string
    }
}

interface Policy {
    id: string
    title: string
    version: string
    content: string
    isActive: boolean
    showFirst: boolean
    sequence: number
    picture: string | null
    applicableRoles: Array<{
        id: string
        name: string
        permissions: any
    }>
    applicableWarehouses: Array<{
        id: string
        name: string
        location: string
    }>
}

interface PolicyAcceptance {
    id: string
    customer: Customer
    policy: Policy
    acceptedAt: string
    policyVersion: string
    documentUrl: string
}

interface PolicyAcceptanceResponse {
    totalCount: number
    totalPages: number
    currentPage: number
    acceptances: PolicyAcceptance[]
}

const PrivacyAccepted = () => {
    const { user } = useAuthContext()

    // States
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [loading, setLoading] = useState(false)
    const [policyData, setPolicyData] = useState<PolicyAcceptanceResponse | null>(null)
    const [showDocumentModal, setShowDocumentModal] = useState(false)
    const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
    const [selectedPolicy, setSelectedPolicy] = useState<PolicyAcceptance | null>(null)
    const [warehousesData, setWarehousesData] = useState<WarehouseRecord[]>([])
    const [departmentsData, setDepartmentsData] = useState<DepartmentRecord[]>([])
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
    const [selectedDepartment, setSelectedDepartment] = useState<string>('')

    // console.log('Policy Data:', policyData)

    // API basics
    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

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
    // Handle functions
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked && policyData?.acceptances) {
            setSelectedRows(policyData.acceptances.map((acceptance) => acceptance.id))
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

 const filteredAcceptances = policyData?.acceptances?.filter((acceptance) => {
  if (!acceptance.customer || !acceptance.policy) return false;

  const searchTermLower = searchTerm.toLowerCase();

  const matchesSearch =
    acceptance.customer.username?.toLowerCase().includes(searchTermLower) ||
    acceptance.customer.email?.toLowerCase().includes(searchTermLower) ||
    acceptance.policy.title?.toLowerCase().includes(searchTermLower) ||
    acceptance.customer.phone_number?.toLowerCase().includes(searchTermLower) ||
    acceptance.customer.warehouse?.name?.toLowerCase().includes(searchTermLower) ||
    acceptance.customer.warehouse?.location?.toLowerCase().includes(searchTermLower);

  const matchesWarehouse = !selectedWarehouse || acceptance.customer.warehouse?.id === selectedWarehouse;
  const matchesDepartment = !selectedDepartment || acceptance.customer.department?.id === selectedDepartment;

  return matchesSearch && matchesWarehouse && matchesDepartment;
}) || [];


    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const totalPages = Math.ceil(filteredAcceptances?.length / itemsPerPage)
    const paginatedAcceptances = filteredAcceptances?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleViewDocument = (acceptance: PolicyAcceptance) => {
        setSelectedPolicy(acceptance)
        setSelectedDocument(`${BASE_API}${acceptance.documentUrl}`)
        setShowDocumentModal(true)
    }

    const handleForcePolicy = async (customerId: string, policyId: string) => {
    
        try {
            // alert(`Force policy ${policyId} for customer ${customerId}`);
            const response = await fetch(`${BASE_API}/api/policy/force/${customerId}`, {
                method: 'POST',
                headers: {  
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ policyId }), 
            })
            const data = await response.json();
            if (response.ok) {
                toastService.success( data.message || 'Error forcing policy:');
                 
            }else {
                toastService.error( data.message || 'Error forcing policy:');
            }
                
        } catch (error : any) {
                toastService.error( error.message || 'Error forcing policy:'); 
        }

        
    }

    // API Call
    const getPolicyAcceptances = async () => {
        try {
            setLoading(true)
             const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: itemsPerPage.toString(),
            policyId: '',        // Or selectedPolicyId
            customerId: '',      // Or selectedCustomerId
            fromDate: '',        // Or selectedFromDate
            toDate: '',          // Or selectedToDate
        });
           
        const response = await fetch(`${BASE_API}/api/policy-acceptance?${params.toString()}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get policy acceptances')
            }

            const data = await response.json()
            console.log('Policy Acceptances Response:', data)
            setPolicyData(data)
        } catch (error: any) {
            console.error('Error fetching policy acceptances:', error)
        } finally {
            setLoading(false)
        }
    }
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

const getPolicyTypeColor = (title?: string) => {
    if (!title) return 'secondary' // fallback color
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('privacy')) return 'primary'
    if (lowerTitle.includes('safety')) return 'danger'
    if (lowerTitle.includes('login') || lowerTitle.includes('security')) return 'warning'
    if (lowerTitle.includes('terms')) return 'info'
    return 'secondary'
}

    useEffect(() => {
        getPolicyAcceptances()
        getWarehouses()
        getDepartments()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
    }, [selectedWarehouse, selectedDepartment, searchTerm])

    useEffect(() => {
        setCurrentPage(1)
    }, [itemsPerPage])

    const acceptanceHeaders: any[] = [
        { width: '20px', type: 'checkbox' },
        { width: '150px', type: 'text' },
        { width: '200px', type: 'text' },
        { width: '180px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '120px', type: 'text' },
        { width: '100px', type: 'actions' }
    ]

    return (
        <>
            <PageBreadcrumb title="Policy Acceptances" subName="Admin" allowNavigateBack={true} />
            {/* Policy Types Overview */}
            {policyData && (
                <Alert variant="info" className="mb-4">
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <Alert.Heading className="h6 mb-2">
                                <i className="bi bi-info-circle me-2"></i>
                                Policy Types Overview
                            </Alert.Heading>
                            <div className="d-flex flex-wrap gap-2">
                                {Array.from(new Set(policyData?.acceptances?.map(a => a?.policy?.title)))?.map((title, idx) => (
                                    <Badge key={idx} bg={getPolicyTypeColor(title)} className="me-1">
                                        {title}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <Badge bg="info" className="fs-6">
                            {policyData?.totalPages} Page{policyData?.totalPages > 1 ? 's' : ''}
                        </Badge>
                    </div>
                </Alert>
            )}
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Policy & Privacy Acceptances</h4>
                            <p className="text-muted mb-0">
                                View all users who have accepted various policies and privacy agreements.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <Badge bg="success" className="fs-6">
                                <i className="bi bi-shield-check me-1"></i>
                                {policyData?.totalCount || 0} Total Acceptances
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
                                            placeholder="Search acceptances..."
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

                            {/* Store Filter Dropdown with react-select */}
                            <div style={{ minWidth: '200px' }}>
                                <Select
                                    options={warehouseOptions}
                                    value={warehouseOptions?.find(option => option?.value === selectedWarehouse) || warehouseOptions[0]}
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

                            {/* Department Filter Dropdown with react-select */}
                            <div style={{ minWidth: '180px' }}>
                                <Select
                                    options={departmentOptions}
                                    value={departmentOptions?.find(option => option?.value === selectedDepartment) || departmentOptions[0]}
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
                                            checked={selectedRows?.length > 0 && selectedRows?.length === filteredAcceptances?.length}
                                        />
                                    </th>
                                    <th>User</th>
                                    <th>Contact Info</th>
                                    <th>Store</th>
                                    <th>Policy</th>
                                    <th>Version</th>
                                    <th>Acceptance Date</th>
                                    <th>Time Since</th>
                                    <th className=''>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={acceptanceHeaders} rowCount={5} />
                                ) : paginatedAcceptances?.length > 0 ? (
                                    paginatedAcceptances?.map((acceptance, idx) => {
                                        const isSelected = selectedRows?.includes(acceptance?.id)

                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectRow(acceptance?.id)}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar-sm me-2">
                                                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                                                                style={{ width: '32px', height: '32px' }}>
                                                                {acceptance.customer?.username?.charAt(0).toUpperCase() || "-"}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <strong className="text-truncate d-block">{acceptance?.customer?.username || '-'}</strong>
                                                            <Badge bg="success" className="badge-sm">
                                                                <i className="bi bi-check-circle me-1"></i>
                                                                Accepted
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong className="d-block text-truncate">{acceptance?.customer?.email || "-"}</strong>
                                                        <small className="text-muted">
                                                            <i className="bi bi-telephone me-1"></i>
                                                            {acceptance?.customer?.phone_number || '-' }
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong className="d-block text-truncate">{acceptance?.customer?.warehouse?.name || "-"}</strong>
                                                        <small className="text-muted">
                                                            <i className="bi bi-geo-alt me-1"></i>
                                                            {acceptance?.customer?.warehouse?.location || '-'}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <Badge bg={getPolicyTypeColor(acceptance?.policy?.title)} className="mb-1">
                                                            {acceptance?.policy?.title || '-'}
                                                        </Badge>
                                                        <br />

                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg="outline-secondary" text="dark">
                                                        v{acceptance?.policyVersion || '-'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong className="d-block">{formatDate(acceptance?.acceptedAt)}</strong>
                                                        <small className="text-muted">
                                                            <i className="bi bi-calendar-check me-1"></i>
                                                            {new Date(acceptance?.acceptedAt)?.toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge
                                                        bg={
                                                            getTimeSinceAcceptance(acceptance?.acceptedAt).includes('minutes') ||
                                                                getTimeSinceAcceptance(acceptance?.acceptedAt).includes('hours') ? 'success' :
                                                                getTimeSinceAcceptance(acceptance?.acceptedAt).includes('day') ? 'info' :
                                                                    getTimeSinceAcceptance(acceptance?.acceptedAt).includes('month') ? 'warning' : 'secondary'
                                                        }
                                                        className="badge-sm"
                                                    >
                                                        {getTimeSinceAcceptance(acceptance?.acceptedAt)}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            variant="info"
                                                            size="sm"
                                                            onClick={() => handleViewDocument(acceptance)}
                                                            title="View Document">
                                                            <i className="bi bi-file-earmark-text"></i>
                                                        </Button>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => window.open(`${BASE_API}${acceptance?.documentUrl}`, '_blank')}
                                                            title="Download Document">
                                                            <i className="bi bi-download"></i>
                                                        </Button>
                                                        <Button
                                                            variant="info"
                                                            size="sm"
                                                            onClick={() => handleForcePolicy(acceptance.customer.id, acceptance.policy.id)}
                                                            title="Force Policy">
                                                            {/* <i className="bi bi-cloud-check-fill"></i> */}
                                                            Forced Policy
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="text-center py-4">
                                            <div className="text-muted">
                                                <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                                {searchTerm ? 'No policy acceptances found matching your search' : 'No policy acceptances found'}
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
                                    Showing {paginatedAcceptances?.length} of {filteredAcceptances?.length} acceptances
                                    {searchTerm && ` (filtered from ${policyData?.totalCount || 0} total)`}
                                </small>
                            </Col>
                            <Col md={6} className="text-end">
                                <small className="text-muted">
                                    <i className="bi bi-shield-check me-1"></i>
                                    All displayed records represent valid policy acceptances
                                </small>
                            </Col>
                        </Row>
                    </div>
                </Card.Body>
            </Card>
            {/* Document View Modal */}
            <Modal show={showDocumentModal} onHide={() => setShowDocumentModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-file-earmark-text me-2"></i>
                        Policy Document
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPolicy && (
                        <div className="mb-3">
                            <Row>
                                <Col md={6}>
                                    <strong>Policy:</strong> {selectedPolicy?.policy?.title || '-'}
                                    <br />
                                    <strong>Version:</strong> {selectedPolicy?.policyVersion || '-'}
                                    <br />
                                    <strong>User:</strong> {selectedPolicy?.customer?.username || '-'}
                                </Col>
                                <Col md={6}>
                                    <strong>Email:</strong> {selectedPolicy?.customer?.email || '-'}
                                    <br />
                                    <strong>Accepted:</strong> {formatDate(selectedPolicy?.acceptedAt)}
                                    <br />
                                </Col>
                            </Row>
                        </div>
                    )}

                    {selectedDocument && (
                        <div className="text-center">
                            <img
                                src={selectedDocument}
                                alt="Policy Document"
                                className="img-fluid border rounded"
                                style={{ maxHeight: '500px', width: 'auto' }}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className = 'alert alert-warning';
                                    errorDiv.innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>Document could not be loaded. It may be in a different format or the file may be missing.';
                                    target.parentNode?.appendChild(errorDiv);
                                }}
                            />
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDocumentModal(false)}>
                        Close
                    </Button>
                    {selectedDocument && (
                        <Button
                            variant="primary"
                            onClick={() => window.open(selectedDocument, '_blank')}
                        >
                            <i className="bi bi-download me-1"></i>
                            Download
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default PrivacyAccepted
