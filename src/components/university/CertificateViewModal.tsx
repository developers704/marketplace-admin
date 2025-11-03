import { Modal, Button, Row, Col, Badge, Alert } from 'react-bootstrap'
import { useState } from 'react'

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

interface CertificateViewModalProps {
    show: boolean
    onHide: () => void
    selectedCertificate: CertificateRequest | null
    baseApiUrl: string
}

const CertificateViewModal: React.FC<CertificateViewModalProps> = ({
    show,
    onHide,
    selectedCertificate,
    baseApiUrl
}) => {
    const [imageError, setImageError] = useState<{ [key: string]: boolean }>({})

    if (!selectedCertificate) return null

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return <Badge bg="success" className="fs-6">{status}</Badge>
            case 'pending':
                return <Badge bg="warning" className="fs-6">{status}</Badge>
            case 'rejected':
                return <Badge bg="danger" className="fs-6">{status}</Badge>
            default:
                return <Badge bg="secondary" className="fs-6">{status}</Badge>
        }
    }

    const handleImageError = (imageType: string) => {
        setImageError(prev => ({ ...prev, [imageType]: true }))
    }

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-award me-2"></i>
                    Certificate Request Details
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {/* Status Alert */}
                <Alert variant={selectedCertificate.status === 'Approved' ? 'success' : selectedCertificate.status === 'Pending' ? 'warning' : 'danger'}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Status: {getStatusBadge(selectedCertificate.status)}</strong>
                            
                        </div>
                        {selectedCertificate.reviewedAt && (
                            <small className="text-muted">
                                Reviewed on: {formatDate(selectedCertificate.reviewedAt)}
                            </small>
                        )}
                    </div>
                </Alert>

                <Row>
                    {/* Employee Information */}
                    <Col md={6}>
                        <div className="mb-4">
                            <h6 className="mb-3">
                                <i className="bi bi-person me-2"></i>
                                Employee Information
                            </h6>
                            <div className="p-3 border rounded bg-light">
                                <div className="mb-2">
                                    <strong>Name:</strong> {selectedCertificate.userName}
                                </div>
                                <div className="mb-2">
                                    <strong>Email:</strong> {selectedCertificate.user.email}
                                </div>
                                <div>
                                    <strong>Request Date:</strong> {formatDate(selectedCertificate.createdAt)}
                                </div>
                            </div>
                        </div>
                    </Col>

                    {/* Course Information */}
                    <Col md={6}>
                        <div className="mb-4">
                            <h6 className="mb-3">
                                <i className="bi bi-book me-2"></i>
                                Course Information
                            </h6>
                            <div className="p-3 border rounded bg-light">
                                <div className="mb-2">
                                    <strong>Course:</strong> {selectedCertificate.course.name}
                                </div>
                                <div className="mb-2">
                                    <strong>Level:</strong> {selectedCertificate.course.level}
                                </div>
                                <div className="mb-2">
                                    <strong>Type:</strong> {selectedCertificate.course.courseType}
                                </div>
                                {selectedCertificate.course.description && (
                                    <div>
                                        <strong>Description:</strong>
                                        <p className="mb-0 mt-1 text-muted small">
                                            {selectedCertificate.course.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* Completion Data */}
                <div className="mb-4">
                    <h6 className="mb-3">
                        <i className="bi bi-trophy me-2"></i>
                        Completion Details
                    </h6>
                    <Row>
                        <Col md={3}>
                            <div className="text-center p-3 border rounded bg-success text-white">
                                <h4 className="mb-1">{selectedCertificate.completionData.gradeLabel}</h4>
                                <small>Final Grade</small>
                            </div>
                        </Col>
                        <Col md={3}>
                            <div className="text-center p-3 border rounded bg-info text-white">
                                <h4 className="mb-1">{selectedCertificate.completionData.gradePercentage}%</h4>
                                <small>Percentage</small>
                            </div>
                        </Col>
                        <Col md={3}>
                            <div className="text-center p-3 border rounded bg-primary text-white">
                                <h4 className="mb-1">{selectedCertificate.completionData.completedChapters}/{selectedCertificate.completionData.totalChapters}</h4>
                                <small>Chapters</small>
                            </div>
                        </Col>
                        <Col md={3}>
                            <div className="text-center p-3 border rounded bg-warning text-white">
                                <h4 className="mb-1">{selectedCertificate.completionData.passedQuizzes}/{selectedCertificate.completionData.totalQuizzes}</h4>
                                <small>Quizzes</small>
                            </div>
                        </Col>
                    </Row>
                    <div className="mt-3 p-3 border rounded bg-light">
                        <strong>Completion Date:</strong> {formatDate(selectedCertificate.completionData.completionDate)}
                    </div>
                </div>

                {/* Signatures */}
                <div className="mb-4">
                    <h6 className="mb-3">
                        <i className="bi bi-pen me-2"></i>
                        Signatures
                    </h6>
                    <Row>
                        <Col md={6}>
                            <div className="text-center p-3 border rounded">
                                <h6>Employee Signature</h6>
                                {selectedCertificate.userSignaturePath && !imageError.userSignature ? (
                                    <img
                                        src={`${baseApiUrl}/${selectedCertificate.userSignaturePath}`}
                                        alt="Employee Signature"
                                        className="img-fluid border rounded"
                                        style={{ maxHeight: '100px', maxWidth: '200px' }}
                                        onError={() => handleImageError('userSignature')}
                                    />
                                ) : (
                                    <div className="text-muted">
                                        <i className="bi bi-image fs-1 d-block mb-2"></i>
                                        <small>Signature not available</small>
                                    </div>
                                )}
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="text-center p-3 border rounded">
                                <h6>Admin Signature</h6>
                                {selectedCertificate.presidentSignaturePath && !imageError.presidentSignature ? (
                                    <img
                                        src={`${baseApiUrl}/${selectedCertificate.presidentSignaturePath}`}
                                        alt="AdminSignature"
                                        className="img-fluid border rounded"
                                        style={{ maxHeight: '100px', maxWidth: '200px' }}
                                        onError={() => handleImageError('presidentSignature')}
                                    />
                                ) : (
                                    <div className="text-muted">
                                        <i className="bi bi-image fs-1 d-block mb-2"></i>
                                        <small>
                                            {selectedCertificate.status === 'Pending'
                                                ? 'Awaiting approval'
                                                : 'Signature not available'
                                            }
                                        </small>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Review Comments */}
                {selectedCertificate.reviewComments && (
                    <div className="mb-4">
                        <h6 className="mb-3">
                            <i className="bi bi-chat-text me-2"></i>
                            Review Comments
                        </h6>
                        <div className="p-3 border rounded bg-light">
                            <p className="mb-0">{selectedCertificate.reviewComments}</p>
                        </div>
                    </div>
                )}

                {/* Certificate Image */}
                {selectedCertificate.certificateImagePath && (
                    <div className="mb-4">
                        <h6 className="mb-3">
                            <i className="bi bi-file-earmark-image me-2"></i>
                            Certificate Preview
                        </h6>
                        <div className="text-center p-3 border rounded">
                            {!imageError.certificate ? (
                                <img
                                    src={`${baseApiUrl}/${selectedCertificate.certificateImagePath}`}
                                    alt="Certificate"
                                    className="img-fluid border rounded"
                                    style={{ maxHeight: '400px' }}
                                    onError={() => handleImageError('certificate')}
                                />
                            ) : (
                                <div className="text-muted">
                                    <i className="bi bi-file-earmark-image fs-1 d-block mb-2"></i>
                                    <small>Certificate image not available</small>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
                {selectedCertificate.certificateImagePath && (
                    <Button
                        variant="primary"
                        onClick={() => {
                            const link = document.createElement('a')
                            link.href = `${baseApiUrl}/${selectedCertificate.certificateImagePath}`
                            link.download = `certificate-${selectedCertificate.certificateId || selectedCertificate.id}.png`
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                        }}
                    >
                        <i className="bi bi-download me-1"></i>
                        Download Certificate
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    )
}

export default CertificateViewModal
