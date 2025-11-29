import { PageBreadcrumb } from '@/components'
import { Button, Card, Table, Pagination as BootstrapPagination, Badge, Form } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/common'
import { TableRowSkeleton } from '../other/SimpleLoader'
import PresidentSignatureModal from '@/components/AdminSignatureModal'
import CertificateApprovalModal from '@/components/university/CertificateApprovalModal'
import CertificateViewModal from '@/components/university/CertificateViewModal'
import CertificateDisplayModal from '@/components/university/CertificateDisplayModal'
interface CertificateRequest {
    id: string
    status: string
    certificateId?: string
    userName: string
    userSignaturePath: string
    presidentSignaturePath: string | null
    certificateImagePath: string | null
    user: {
        _id: string
        email: string
    }
    course: {
        _id: string
        name: string
        description?: string
        level: string
        courseType: string
    }
    completionData: {
        completionDate: string
        finalGrade: number
        gradePercentage: number
        gradeLabel: string
        totalChapters: number
        completedChapters: number
        totalQuizzes: number
        passedQuizzes: number
    }
    reviewedBy: string | null
    reviewComments: string | null
    createdAt: string
    reviewedAt: string | null
}

interface ApiResponse {
    success: boolean
    message: string
    requests: CertificateRequest[]
    pagination: {
        current: number
        total: number
        count: number
        totalRequests: number
    }
}

const Certificates = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canApprove = isSuperUser || permissions.University?.Update


    // States
    const [loading, setLoading] = useState(false)
    const [certificatesData, setCertificatesData] = useState<CertificateRequest[]>([])
    const [pagination, setPagination] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [approvalModalOpen, setApprovalModalOpen] = useState(false)
    const [signatureModalOpen, setSignatureModalOpen] = useState(false)
    const [selectedCertificate, setSelectedCertificate] = useState<CertificateRequest | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [certificateDisplayModalOpen, setCertificateDisplayModalOpen] = useState(false)

    // Add this useEffect
    useEffect(() => {
        setCurrentPage(1)
    }, [itemsPerPage, searchTerm, statusFilter])
    // API basics
    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    // Handle functions
    const handleViewCertificate = (certificate: CertificateRequest) => {
        setSelectedCertificate(certificate)
        setViewModalOpen(true)
    }

    const handleApproveCertificate = (certificate: CertificateRequest) => {
        setSelectedCertificate(certificate)
        setApprovalModalOpen(true)
    }

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
        setCurrentPage(1)
    }

    const handleStatusFilter = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(event.target.value)
        setCurrentPage(1)
    }
    const handleViewCertificateDisplay = (certificate: CertificateRequest) => {
        setSelectedCertificate(certificate)
        setCertificateDisplayModalOpen(true)
    }
    const filteredRecords = certificatesData.filter((record) => {
        const matchesSearch =
            record?.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record?.course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'All' || record.status === statusFilter

        return matchesSearch && matchesStatus
    })
    // Add these functions with your existing functions
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    // Update the filteredRecords logic to include pagination
    const totalPages = Math.ceil(filteredRecords?.length / itemsPerPage)
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return <Badge bg="success">{status}</Badge>
            case 'pending':
                return <Badge bg="warning">{status}</Badge>
            case 'rejected':
                return <Badge bg="danger">{status}</Badge>
            default:
                return <Badge bg="secondary">{status}</Badge>
        }
    }

    // API Call
    const getCertificates = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/certificate/all`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            if (!response?.ok) {
                const errorMessage = await response?.json()
                throw new Error(errorMessage?.message || 'Failed to get certificates')
            }

            const data: ApiResponse = await response.json()
            console.log('Certificates Response:', data)

            if (data.success) {
                setCertificatesData(data?.requests)
                setPagination(data?.pagination)
            }
        } catch (error: any) {
            console.error('Error fetching certificates:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprovalSuccess = () => {
        setApprovalModalOpen(false)
        getCertificates() // Refresh data
    }

    const handleSignatureModalSuccess = () => {
        setSignatureModalOpen(false)
        // The approval modal will refresh its signature data
    }

    useEffect(() => {
        getCertificates()
    }, [])

    const certificateHeaders: any[] = [
        { width: '150px', type: 'text' },
        { width: '200px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '120px', type: 'actions' }
    ]

    return (
        <>
            <PageBreadcrumb title="Certificates" subName="University" allowNavigateBack={true} />
            {/* Summary Cards */}
            {pagination && (
                <div className="row mt-1">
                    <div className="col-md-3">
                        <div className="card bg-primary text-white">
                            <div className="card-body text-center">
                                <h4 className="mb-1">{pagination?.totalRequests}</h4>
                                <p className="mb-0">Total Requests</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card bg-warning text-white">
                            <div className="card-body text-center">
                                <h4 className="mb-1">
                                    {certificatesData.filter(c => c?.status === 'Pending').length}
                                </h4>
                                <p className="mb-0">Pending</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card bg-success text-white">
                            <div className="card-body text-center">
                                <h4 className="mb-1">
                                    {certificatesData.filter(c => c?.status === 'Approved').length}
                                </h4>
                                <p className="mb-0">Approved</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card bg-danger text-white">
                            <div className="card-body text-center">
                                <h4 className="mb-1">
                                    {certificatesData.filter(c => c?.status === 'Rejected').length}
                                </h4>
                                <p className="mb-0">Rejected</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Certificate Management</h4>
                            <p className="text-muted mb-0">
                                Review and approve certificate requests from students.
                            </p>
                        </div>

                    </div>

                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
                        <div className="app-search d-none d-lg-block">
                            <form>
                                <div className="input-group" style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(0, 0, 0, 0.1)'
                                }}>
                                    <input
                                        type="search"
                                        className="form-control"
                                        placeholder="Search certificates..."
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

                        <div className="d-flex gap-2">
                            <Form.Select
                                value={statusFilter}
                                onChange={handleStatusFilter}
                                className="w-auto"
                                style={{ minWidth: '120px' }}
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </Form.Select>

                            <Form.Select
                                value={itemsPerPage}
                                style={{ zIndex: 1 }}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="w-auto">
                                <option value={15}>15 items</option>
                                <option value={30}>30 items</option>
                                <option value={40}>40 items</option>
                            </Form.Select>
                        </div>
                    </div>
                </Card.Header>

                <Card.Body>
                    <div className="table-responsive-sm ">
                        <Table className="table-centered mb-0">
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Course</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Grade</th>
                                    <th>Completion Date</th>
                                    <th>Request Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={certificateHeaders} rowCount={5} />
                                ) : paginatedRecords.length > 0 ? (
                                    paginatedRecords.map((certificate, idx) => (
                                        <tr key={idx}
                                            style={certificate.status === 'Pending' ? { backgroundColor: '#fff3cd' } : {}}>
                                            <td>
                                                <div>
                                                    <strong className="d-block">{certificate?.userName || "-"}</strong>

                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <strong className="d-block text-truncate" style={{ maxWidth: '200px' }}>
                                                        {certificate?.course?.name}
                                                    </strong>
                                                    <small className="text-muted">
                                                        {certificate?.course?.level || "-"} • {certificate?.course?.courseType || "-"}
                                                    </small>
                                                </div>
                                            </td>
                                            <td className="text-truncate">{certificate?.user?.email || "-"}</td>
                                            <td>{getStatusBadge(certificate.status)}</td>
                                            <td>
                                                <div>
                                                    <strong className="d-block">{certificate?.completionData?.gradeLabel || "-"}</strong>
                                                    <small className="text-muted">
                                                        {certificate?.completionData?.gradePercentage || "-"}%
                                                    </small>
                                                </div>
                                            </td>
                                            <td>{formatDate(certificate?.completionData?.completionDate)}</td>
                                            <td>{formatDate(certificate?.createdAt)}</td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <Button
                                                        variant="info"
                                                        size="sm"
                                                        onClick={() => handleViewCertificate(certificate)}
                                                        title="View Details">
                                                        <i className="bi bi-eye"></i>
                                                    </Button>
                                                    {certificate.status === 'Approved' && (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleViewCertificateDisplay(certificate)}
                                                            title="View Certificate">
                                                            <i className="bi bi-award"></i>
                                                        </Button>
                                                    )}
                                                    {certificate.status === 'Pending' && (
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            disabled={!canApprove}
                                                            onClick={() => handleApproveCertificate(certificate)}
                                                            title="Approve Certificate">
                                                            <i className="bi bi-check-circle"></i>
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="text-center py-5">
                                            <div className="text-muted">
                                                <i className="bi bi-award fs-1 d-block mb-3"></i>
                                                <h5>No Certificate Requests Found</h5>
                                                <p>No certificate requests match your current filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
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
                        </Table>
                    </div>


                </Card.Body>
            </Card>

            {/* Certificate View Modal */}
            <CertificateViewModal
                show={viewModalOpen}
                onHide={() => setViewModalOpen(false)}
                selectedCertificate={selectedCertificate}
                baseApiUrl={BASE_API}
            />

            {/* Certificate Approval Modal */}
            <CertificateApprovalModal
                show={approvalModalOpen}
                onHide={() => setApprovalModalOpen(false)}
                selectedCertificate={selectedCertificate}
                onSuccess={handleApprovalSuccess}
                onOpenSignatureModal={() => setSignatureModalOpen(true)}
                baseApiUrl={BASE_API}
            />

            {/* President Signature Modal */}
            <PresidentSignatureModal
                show={signatureModalOpen}
                onHide={() => setSignatureModalOpen(false)}
                onSuccess={handleSignatureModalSuccess}
                baseApiUrl={BASE_API}
            />
            <CertificateDisplayModal
                show={certificateDisplayModalOpen}
                onHide={() => setCertificateDisplayModalOpen(false)}
                certificateData={selectedCertificate ? {
                    userName: selectedCertificate?.userName,
                    userSignaturePath: selectedCertificate?.userSignaturePath,
                    presidentSignaturePath: selectedCertificate?.presidentSignaturePath || '',
                    certificateId: selectedCertificate?.certificateId,
                    course: selectedCertificate?.course
                } : null}
                baseApiUrl={BASE_API}
            />
        </>
    )
}

export default Certificates
