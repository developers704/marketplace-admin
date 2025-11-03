import { PageBreadcrumb } from '@/components'
import { Button, Card, Table, Badge, Alert } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/common'
import { TableRowSkeleton } from '../SimpleLoader'
import PresidentSignatureModal from '@/components/AdminSignatureModal'

interface PresidentSignature {
    id: string
    presidentName: string
    presidentEmail: string
    signaturePath: string
    uploadedAt: string
    updatedAt: string
}

interface ApiResponse {
    success: boolean
    message: string
    signature: PresidentSignature | null
}

const PresidentSignature = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Admin?.Update
    const canCreate = isSuperUser || permissions.Admin?.Create

    // States
    const [loading, setLoading] = useState(false)
    const [signatureData, setSignatureData] = useState<PresidentSignature | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)

    // API basics
    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    // Handle functions
    const handleCreateSignature = () => {
        setIsEditMode(false)
        setModalOpen(true)
    }

    const handleUpdateSignature = () => {
        setIsEditMode(true)
        setModalOpen(true)
    }

    // API Call
    const getPresidentSignature = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/president`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get Admin Signature')
            }

            const data: ApiResponse = await response.json()
            console.log('Admin Signature Response:', data)

            if (data.success && data.signature) {
                setSignatureData(data.signature)
            } else {
                setSignatureData(null)
            }
        } catch (error: any) {
            console.error('Error fetching Admin Signature:', error)
            setSignatureData(null)
        } finally {
            setLoading(false)
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

    const handleModalSuccess = () => {
        setModalOpen(false)
        getPresidentSignature()
    }

    useEffect(() => {
        getPresidentSignature()
    }, [])

    const signatureHeaders: any[] = [
        { width: '100px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '200px', type: 'image' },
        { width: '150px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '120px', type: 'actions' }
    ]

    return (
        <>
            <PageBreadcrumb title="Admin Signature" subName="Admin" allowNavigateBack={true} />

            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Admin Signature Management</h4>
                            <p className="text-muted mb-0">
                                Manage the official Admin Signature for documents and certificates.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            {!signatureData ? (
                                <Button
                                    disabled={!canCreate}
                                    variant="success"
                                    onClick={handleCreateSignature}
                                    className="mb-2 mb-sm-0">
                                    <i className="bi bi-plus"></i> Add Admin Signature
                                </Button>
                            ) : (
                                <div className="d-flex gap-2">
                                    <Badge bg="success" className="fs-6 py-2 px-3">
                                        <i className="bi bi-check-circle me-1"></i>
                                        Signature Available
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                </Card.Header>

                <Card.Body>
                    {/* Status Alert */}
                    {signatureData ? (
                        <Alert variant="success" className="mb-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <Alert.Heading className="h6 mb-1">
                                        <i className="bi bi-check-circle me-2"></i>
                                        Admin Signature is Active
                                    </Alert.Heading>
                                    <p className="mb-0">
                                        The official Admin Signature for <strong>{signatureData.presidentName}</strong> is available and ready to be used in documents.
                                    </p>
                                </div>
                                <Badge bg="success" className="fs-6">
                                    Active
                                </Badge>
                            </div>
                        </Alert>
                    ) : (
                        <Alert variant="warning" className="mb-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <Alert.Heading className="h6 mb-1">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        No Admin Signature Found
                                    </Alert.Heading>
                                    <p className="mb-0">
                                        Please add the official Admin Signature to enable document signing features.
                                    </p>
                                </div>
                                <Button
                                    variant="warning"
                                    size="sm"
                                    disabled={!canCreate}
                                    onClick={handleCreateSignature}>
                                    <i className="bi bi-plus me-1"></i>
                                    Add Now
                                </Button>
                            </div>
                        </Alert>
                    )}

                    <div className="table-responsive-sm">
                        <Table className="table-striped table-centered mb-0">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>President Name</th>
                                    <th>Email</th>
                                    <th>Signature Preview</th>
                                    <th>Uploaded Date</th>
                                    <th>Last Updated</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={signatureHeaders} rowCount={1} />
                                ) : signatureData ? (
                                    <tr>
                                        <td>
                                            <Badge bg="success" className="badge-lg">
                                                <i className="bi bi-check-circle me-1"></i>
                                                Active
                                            </Badge>
                                        </td>
                                        <td>
                                            <div>
                                                <strong className="d-block">{signatureData.presidentName}</strong>
                                               
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <strong className="d-block text-truncate">{signatureData.presidentEmail}</strong>
                                                
                                            </div>
                                        </td>
                                        <td>
                                            <div className="signature-preview">
                                                <img
                                                    src={`${BASE_API}/${signatureData.signaturePath}`}
                                                    alt="Admin Signature"
                                                    style={{
                                                        maxHeight: '60px',
                                                        maxWidth: '150px',
                                                        objectFit: 'contain',
                                                        border: '1px solid #dee2e6',
                                                        borderRadius: '4px',
                                                        padding: '5px',
                                                        backgroundColor: '#f8f9fa'
                                                    }}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjhGOUZBIiBzdHJva2U9IiNERUUyRTYiLz4KPHRleHQgeD0iNTAiIHk9IjIyIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2Qzc1N0QiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <strong className="d-block">{formatDate(signatureData.uploadedAt)}</strong>
                                                <small className="text-muted">
                                                    <i className="bi bi-calendar-plus me-1"></i>
                                                    {new Date(signatureData.uploadedAt).toLocaleDateString()}
                                                </small>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <strong className="d-block">{formatDate(signatureData.updatedAt)}</strong>
                                                <small className="text-muted">
                                                    <i className="bi bi-calendar-check me-1"></i>
                                                    {new Date(signatureData.updatedAt).toLocaleDateString()}
                                                </small>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <Button
                                                    variant="info"
                                                    size="sm"
                                                    onClick={() => window.open(`${BASE_API}/${signatureData.signaturePath}`, '_blank')}
                                                    title="View Full Size">
                                                    <i className="bi bi-eye"></i>
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={!canUpdate}
                                                    onClick={handleUpdateSignature}
                                                    title="Update Signature">
                                                    <i className="bi bi-pencil"></i>
                                                </Button>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => {
                                                        const link = document.createElement('a')
                                                        link.href = `${BASE_API}/${signatureData.signaturePath}`
                                                        link.download = `president-signature-${signatureData.presidentName.replace(/\s+/g, '-').toLowerCase()}.png`
                                                        document.body.appendChild(link)
                                                        link.click()
                                                        document.body.removeChild(link)
                                                    }}
                                                    title="Download">
                                                    <i className="bi bi-download"></i>
                                                </Button>
                                               
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            <div className="text-muted">
                                                <i className="bi bi-signature fs-1 d-block mb-3"></i>
                                                <h5>No Admin Signature Found</h5>
                                                <p className="mb-3">Add the official Admin Signature to enable document signing features.</p>
                                                <Button
                                                    variant="primary"
                                                    disabled={!canCreate}
                                                    onClick={handleCreateSignature}>
                                                    <i className="bi bi-plus me-1"></i>
                                                    Add Admin Signature
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>

                </Card.Body>
            </Card>

            {/* Admin Signature Modal */}
            <PresidentSignatureModal
                show={modalOpen}
                onHide={() => setModalOpen(false)}
                isEditMode={isEditMode}
                existingSignature={signatureData}
                onSuccess={handleModalSuccess}
                baseApiUrl={BASE_API}
            />
        </>
    )
}

export default PresidentSignature
