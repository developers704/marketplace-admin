import { Modal, Button, Form, Alert, Spinner, Row, Col } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import { useAuthContext } from '@/common'
import { useForm } from 'react-hook-form'
import Swal from 'sweetalert2'

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

interface CertificateApprovalModalProps {
    show: boolean
    onHide: () => void
    selectedCertificate: CertificateRequest | null
    onSuccess: () => void
    onOpenSignatureModal: () => void
    baseApiUrl: string
}

interface FormData {
    comments: string
}

interface PresidentSignature {
    _id: string
    signaturePath: string
    createdAt: string
    updatedAt: string
}

const CertificateApprovalModal: React.FC<CertificateApprovalModalProps> = ({
    show,
    onHide,
    selectedCertificate,
    onSuccess,
    onOpenSignatureModal,
    baseApiUrl
}) => {
    const { user } = useAuthContext()
    const { token } = user

    // States
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [presidentSignature, setPresidentSignature] = useState<PresidentSignature | null>(null)
    const [signatureLoading, setSignatureLoading] = useState(false)
    const [imageError, setImageError] = useState(false)
    const [signatureModalOpen, setSignatureModalOpen] = useState(false)
    // Form handling
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<FormData>({
        defaultValues: {
            comments: ''
        }
    })

    // Get current president signature
    const getPresidentSignature = async () => {
        try {
            setSignatureLoading(true)
            const response = await fetch(`${baseApiUrl}/api/president`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                console.log("signature data ", data);

                if (data?.signature) {
                    setPresidentSignature(data?.signature)
                }
            }
        } catch (error: any) {
            console.error('Error fetching president signature:', error)
        } finally {
            setSignatureLoading(false)
        }
    }

    // Handle certificate approval
    const onSubmit = async (data: FormData) => {
        if (!selectedCertificate) return

        if (!presidentSignature) {
            setError('President signature is required for approval. Please set up the signature first.')
            return
        }

        try {
            setLoading(true)
            setError(null)

            // Create FormData for the approval request
            const formData = new FormData()
            formData.append('action', 'approve')
            formData.append('comments', data.comments)

            // Convert signature path to File object
            const signatureResponse = await fetch(`${baseApiUrl}/${presidentSignature.signaturePath}`)
            const signatureBlob = await signatureResponse.blob()
            const signatureFile = new File([signatureBlob], 'president-signature.png', { type: 'image/png' })
            formData.append('presidentSignature', signatureFile)

            const response = await fetch(`${baseApiUrl}/api/certificate/approve/${selectedCertificate.id}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to approve certificate')
            }

            const result = await response.json()
            console.log('Certificate approved successfully:', result)

            await Swal.fire({
                title: 'Success!',
                text: 'Certificate has been approved successfully.',
                icon: 'success',
                timer: 2000,
                timerProgressBar: true
            })

            // Reset form and close modal
            handleModalClose()
            onSuccess()

        } catch (error: any) {
            console.error('Error approving certificate:', error)
            setError(error.message || 'Failed to approve certificate. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Handle modal close
    const handleModalClose = () => {
        reset()
        setError(null)
        setLoading(false)
        setImageError(false)
        setSignatureModalOpen(false) // Add this line
        onHide()
    }

    // Handle signature modal open
    const handleOpenSignatureModal = () => {
        setSignatureModalOpen(true)
        onOpenSignatureModal()
    }
    // Load president signature when modal opens
    useEffect(() => {
        if (show && !signatureModalOpen) {
            getPresidentSignature()
            setError(null)
        }
    }, [show, signatureModalOpen])
    useEffect(() => {
        // Refresh signature when signature modal is closed and approval modal is still open
        if (show && !signatureModalOpen) {
            const timeoutId = setTimeout(() => {
                getPresidentSignature()
            }, 500) // Small delay to ensure signature modal operations are complete

            return () => clearTimeout(timeoutId)
        }
    }, [signatureModalOpen, show])
    // Reset form when modal opens
    useEffect(() => {
        if (show) {
            reset({ comments: '' })
        }
    }, [show, reset])

    if (!selectedCertificate) return null

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <Modal show={show} onHide={handleModalClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-check-circle me-2"></i>
                    Approve Certificate Request
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    {error && (
                        <Alert variant="danger" className="mb-3">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {error}
                        </Alert>
                    )}

                    {/* Certificate Summary */}
                    <div className="mb-4">
                        <h6 className="mb-3">Certificate Request Summary</h6>
                        <div className="p-3 border rounded bg-light">
                            <Row>
                                <Col md={6}>
                                    <div className="mb-2">
                                        <strong>Student:</strong> {selectedCertificate.userName}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Email:</strong> {selectedCertificate.user.email}
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-2">
                                        <strong>Course:</strong> {selectedCertificate.course.name}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Grade:</strong> {selectedCertificate.completionData.gradeLabel} ({selectedCertificate.completionData.gradePercentage}%)
                                    </div>
                                </Col>
                            </Row>
                            <div className="mt-2">
                                <strong>Completion Date:</strong> {formatDate(selectedCertificate.completionData.completionDate)}
                            </div>
                        </div>
                    </div>

                    {/* President Signature Section */}
                    <div className="mb-4">
                        <h6 className="mb-3">
                            <i className="bi bi-pen me-2"></i>
                            President Signature
                        </h6>

                        {signatureLoading ? (
                            <div className="text-center p-4 border rounded">
                                <Spinner animation="border" className="me-2" />
                                <span>Loading signature...</span>
                            </div>
                        ) : presidentSignature ? (
                            <div className="p-3 border rounded bg-light">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <strong className="text-success">
                                            <i className="bi bi-check-circle me-1"></i>
                                            Signature Available
                                        </strong>
                                        <div className="text-muted small mt-1">
                                            Last updated: {formatDate(presidentSignature.updatedAt)}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={handleOpenSignatureModal}
                                    >
                                        <i className="bi bi-pencil me-1"></i>
                                        Change Signature
                                    </Button>
                                </div>

                                <div className="text-center">
                                    {!imageError ? (
                                        <img
                                            src={`${baseApiUrl}/${presidentSignature.signaturePath}`}
                                            alt="President Signature"
                                            className="img-fluid border rounded"
                                            style={{ maxHeight: '120px', maxWidth: '300px' }}
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className="text-muted p-3">
                                            <i className="bi bi-image fs-2 d-block mb-2"></i>
                                            <small>Signature preview not available</small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Alert variant="warning">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>No President Signature Found</strong>
                                        <div className="mt-1">
                                            <small>A president signature is required to approve certificates.</small>
                                        </div>
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleOpenSignatureModal}
                                    >
                                        <i className="bi bi-plus me-1"></i>
                                        Add Signature
                                    </Button>
                                </div>
                            </Alert>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div className="mb-4">
                        <Form.Group>
                            <Form.Label className="fw-semibold">
                                <i className="bi bi-chat-text me-2"></i>
                                Approval Comments
                            </Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                {...register('comments', {
                                    required: 'Comments are required for approval',
                                    minLength: {
                                        value: 10,
                                        message: 'Comments must be at least 10 characters long'
                                    }
                                })}
                                placeholder="Enter your approval comments here..."
                                className={errors.comments ? 'is-invalid' : ''}
                            />
                            {errors.comments && (
                                <Form.Control.Feedback type="invalid">
                                    <i className="bi bi-exclamation-circle me-1"></i>
                                    {errors.comments.message}
                                </Form.Control.Feedback>
                            )}
                            <Form.Text className="text-muted">
                                <i className="bi bi-info-circle me-1"></i>
                                These comments will be visible to the student and stored with the certificate record.
                            </Form.Text>
                        </Form.Group>
                    </div>

                    {/* Student Signature Preview */}
                    <div className="mb-4">
                        <h6 className="mb-3">
                            <i className="bi bi-person-check me-2"></i>
                            Student Signature
                        </h6>
                        <div className="text-center p-3 border rounded bg-light">
                            {selectedCertificate.userSignaturePath ? (
                                <img
                                    src={`${baseApiUrl}/${selectedCertificate.userSignaturePath}`}
                                    alt="Student Signature"
                                    className="img-fluid border rounded"
                                    style={{ maxHeight: '100px', maxWidth: '250px' }}
                                />
                            ) : (
                                <div className="text-muted">
                                    <i className="bi bi-image fs-2 d-block mb-2"></i>
                                    <small>Student signature not available</small>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Approval Information */}
                    <Alert variant="info" className="mb-0">
                        <Alert.Heading className="h6 mb-2">
                            <i className="bi bi-info-circle me-2"></i>
                            Approval Information
                        </Alert.Heading>
                        <ul className="mb-0 ps-3 small">
                            <li>Once approved, the certificate will be generated with both signatures</li>
                            <li>The student will be notified via email about the approval</li>
                            <li>A unique certificate ID will be assigned</li>
                            <li>This action cannot be undone</li>
                        </ul>
                    </Alert>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="success"
                        type="submit"
                        disabled={loading || !presidentSignature}
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Approving...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-circle me-1"></i>
                                Approve Certificate
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}

export default CertificateApprovalModal
