import { Modal, Button, Form, Alert, Spinner, Nav, Tab } from 'react-bootstrap'
import { useState, useRef, useEffect } from 'react'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import SignatureCanvas from 'react-signature-canvas'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'

interface PresidentSignature {
    id: string
    presidentName: string
    presidentEmail: string
    signaturePath: string
    uploadedAt: string
    updatedAt: string
}

interface PresidentSignatureModalProps {
    show: boolean
    onHide: () => void
    isEditMode?: boolean
    existingSignature?: PresidentSignature | null
    onSuccess: () => void
    baseApiUrl: string
}

const PresidentSignatureModal: React.FC<PresidentSignatureModalProps> = ({
    show,
    onHide,
    isEditMode,
    existingSignature,
    onSuccess,
    baseApiUrl
}) => {
    const { user } = useAuthContext()
    const { token } = user
    const signatureCanvasRef = useRef<SignatureCanvas>(null)

    // States
    const [activeTab, setActiveTab] = useState<'upload' | 'draw'>('upload')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [signatureDrawn, setSignatureDrawn] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Handle file upload from SingleFileUploader
    const handleFileUpload = (file: File) => {
        setError(null)

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
            return
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB in bytes
        if (file.size > maxSize) {
            setError('File size must be less than 5MB')
            return
        }

        setSelectedFile(file)
        // Clear signature canvas if file is selected
        if (signatureCanvasRef.current) {
            signatureCanvasRef.current.clear()
            setSignatureDrawn(false)
        }
    }

    // Handle signature drawing
    const handleSignatureEnd = () => {
        if (signatureCanvasRef.current && !signatureCanvasRef.current.isEmpty()) {
            setSignatureDrawn(true)
            setSelectedFile(null) // Clear file upload if signature is drawn
            setError(null)
        }
    }

    // Clear signature canvas
    const clearSignature = () => {
        if (signatureCanvasRef.current) {
            signatureCanvasRef.current.clear()
            setSignatureDrawn(false)
        }
    }

    // Convert signature canvas to blob
    const getSignatureBlob = (): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (signatureCanvasRef.current && !signatureCanvasRef.current.isEmpty()) {
                signatureCanvasRef.current.getCanvas().toBlob((blob) => {
                    resolve(blob)
                }, 'image/png', 1.0)
            } else {
                resolve(null)
            }
        })
    }

    // Handle tab change
    const handleTabChange = (tab: 'upload' | 'draw') => {
        setActiveTab(tab)
        setError(null)
    }

    // Reset all form data
    const handleReset = () => {
        setSelectedFile(null)
        setSignatureDrawn(false)
        setError(null)
        if (signatureCanvasRef.current) {
            signatureCanvasRef.current.clear()
        }
    }

    // Handle form submission
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        // Validation
        if (activeTab === 'upload' && !selectedFile) {
            setError('Please select a signature image')
            return
        }

        if (activeTab === 'draw' && !signatureDrawn) {
            setError('Please draw your signature')
            return
        }

        try {
            setLoading(true)
            setError(null)

            const formData = new FormData()

            if (activeTab === 'upload' && selectedFile) {
                formData.append('presidentSignature', selectedFile)
            } else if (activeTab === 'draw' && signatureDrawn) {
                const signatureBlob = await getSignatureBlob()
                if (signatureBlob) {
                    const signatureFile = new File([signatureBlob], 'signature.png', { type: 'image/png' })
                    formData.append('presidentSignature', signatureFile)
                } else {
                    throw new Error('Failed to process signature')
                }
            }

            const response = await fetch(`${baseApiUrl}/api/president/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to save signature')
            }

            const result = await response.json()
            console.log('Signature saved successfully:', result)

            await Swal.fire({
                title: 'Success!',
                text: `President signature has been ${isEditMode ? 'updated' : 'created'} successfully.`,
                icon: 'success',
                timer: 2000,
                timerProgressBar: true
            })

            // Reset form and close modal
            handleModalClose()
            onSuccess()

        } catch (error: any) {
            console.error('Error saving signature:', error)
            setError(error.message || 'Failed to save signature. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Handle modal close
    const handleModalClose = () => {
        handleReset()
        setActiveTab('upload')
        setLoading(false)
        onHide()
    }

    // Reset when modal opens
    useEffect(() => {
        if (show) {
            handleReset()
            setActiveTab('upload')
        }
    }, [show])

    return (
        <Modal show={show} onHide={handleModalClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-signature me-2"></i>
                    {isEditMode ? 'Update President Signature' : 'Add President Signature'}
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && (
                        <Alert variant="danger" className="mb-3">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {error}
                        </Alert>
                    )}

                    {/* Current Signature Preview (Edit Mode) */}
                    {isEditMode && existingSignature && (
                        <div className="mb-4">
                            <h6 className="mb-2">Current Signature:</h6>
                            <div className="p-3 border rounded bg-light">
                                <div className="row align-items-center">
                                    <div className="col-md-8">
                                        <img
                                            src={`${baseApiUrl}/${existingSignature.signaturePath}`}
                                            alt="Current President Signature"
                                            style={{
                                                maxHeight: '100px',
                                                maxWidth: '100%',
                                                objectFit: 'contain'
                                            }}
                                            className="d-block"
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <div className="text-muted">
                                            <small className="d-block"><strong>Name:</strong> {existingSignature.presidentName}</small>
                                            <small className="d-block"><strong>Email:</strong> {existingSignature.presidentEmail}</small>
                                            <small className="d-block"><strong>Updated:</strong> {new Date(existingSignature.updatedAt).toLocaleDateString()}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Navigation */}
                    <Tab.Container activeKey={activeTab} onSelect={(k) => handleTabChange(k as 'upload' | 'draw')}>
                        <Nav variant="pills" className="mb-4 justify-content-center">
                            <Nav.Item>
                                <Nav.Link
                                    eventKey="upload"
                                    disabled={signatureDrawn}
                                    className="d-flex align-items-center"
                                >
                                    <i className="bi bi-cloud-upload me-2"></i>
                                    Upload Image
                                    {selectedFile && <i className="bi bi-check-circle text-success ms-2"></i>}
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link
                                    eventKey="draw"
                                    disabled={selectedFile !== null}
                                    className="d-flex align-items-center"
                                >
                                    <i className="bi bi-pencil me-2"></i>
                                    Draw Signature
                                    {signatureDrawn && <i className="bi bi-check-circle text-success ms-2"></i>}
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>

                        <Tab.Content>
                            {/* Upload Tab */}
                            <Tab.Pane eventKey="upload">
                                <div className="mb-4">
                                    <Form.Label className="fw-semibold mb-3">
                                        Upload Signature Image <span className="text-danger">*</span>
                                    </Form.Label>

                                    <div className="mb-3">
                                        <p style={{ fontSize: '0.9rem' }} className="text-info mb-1">
                                            <i className="bi bi-info-circle me-1"></i>
                                            Upload Guidelines:
                                        </p>
                                        <ul style={{ fontSize: '0.8rem' }} className="text-muted mb-3 ps-3">
                                            <li>File Size: Upload images up to 5 MB</li>
                                            <li>Supported Formats: JPEG (.jpg, .jpeg), PNG (.png), GIF (.gif), WebP (.webp)</li>
                                            <li>Recommended: Use transparent or white background</li>
                                            <li>Optimal dimensions: 300x100 pixels or similar aspect ratio</li>
                                        </ul>
                                    </div>

                                    <SingleFileUploader
                                        icon="ri-upload-cloud-2-line"
                                        text="Drop signature image here or click to upload."
                                        onFileUpload={handleFileUpload}
                                    />

                                    {selectedFile && (
                                        <div className="mt-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <small className="text-success">
                                                    <i className="bi bi-check-circle me-1"></i>
                                                    File selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                                </small>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => setSelectedFile(null)}
                                                >
                                                    <i className="bi bi-trash me-1"></i>
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Tab.Pane>

                            {/* Draw Tab */}
                            <Tab.Pane eventKey="draw">
                                <div className="mb-4">
                                    <Form.Label className="fw-semibold mb-3">
                                        Draw Your Signature <span className="text-danger">*</span>
                                    </Form.Label>

                                    <div className="mb-3">
                                        <p style={{ fontSize: '0.9rem' }} className="text-info mb-1">
                                            <i className="bi bi-info-circle me-1"></i>
                                            Drawing Instructions:
                                        </p>
                                        <ul style={{ fontSize: '0.8rem' }} className="text-muted mb-3 ps-3">
                                            <li>Use your mouse or touch screen to draw your signature</li>
                                            <li>Draw clearly and legibly for best results</li>
                                            <li>The signature will be saved as a PNG image</li>
                                            <li>You can clear and redraw if needed</li>
                                        </ul>
                                    </div>

                                    <div className="signature-canvas-container border rounded p-3 bg-light">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <small className="text-muted">
                                                <i className="bi bi-pencil me-1"></i>
                                                Draw your signature in the area below:
                                            </small>
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    type="button"
                                                    onClick={clearSignature}
                                                    disabled={selectedFile !== null}
                                                >
                                                    <i className="bi bi-arrow-clockwise me-1"></i>
                                                    Clear
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="border rounded bg-white" style={{ display: 'inline-block' }}>
                                            <SignatureCanvas
                                                ref={signatureCanvasRef}
                                                canvasProps={{
                                                    width: 500,
                                                    height: 200,
                                                    className: 'signature-canvas',
                                                    style: { border: '2px dashed #dee2e6', borderRadius: '4px' }
                                                }}
                                                onEnd={handleSignatureEnd}
                                                backgroundColor="rgba(255, 255, 255, 1)"
                                                penColor="black"
                                            />
                                        </div>

                                        {signatureDrawn && (
                                            <div className="mt-2">
                                                <small className="text-success">
                                                    <i className="bi bi-check-circle me-1"></i>
                                                    Signature drawn successfully!
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>

                    {/* Reset Option */}
                    {(selectedFile || signatureDrawn) && (
                        <div className="text-center mb-3">
                            <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={handleReset}
                                disabled={loading}
                            >
                                <i className="bi bi-arrow-repeat me-1"></i>
                                Reset & Choose Different Option
                            </Button>
                        </div>
                    )}

                    {/* Usage Information */}
                    <Alert variant="info" className="mb-0">
                        <Alert.Heading className="h6 mb-2">
                            <i className="bi bi-lightbulb me-2"></i>
                            Signature Usage Information
                        </Alert.Heading>
                        <ul className="mb-0 ps-3">
                            <li>This signature will be used in official documents and certificates</li>
                            <li>Choose either upload an image or draw directly - only one option can be used at a time</li>
                            <li>Uploaded images should have transparent or white backgrounds for best results</li>
                            <li>Drawn signatures are automatically saved with transparent backgrounds</li>
                            <li>You can reset and switch between options before saving</li>
                        </ul>
                    </Alert>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={loading || (!selectedFile && !signatureDrawn)}
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                {isEditMode ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <i className={`bi ${isEditMode ? 'bi-pencil' : 'bi-plus'} me-1`}></i>
                                {isEditMode ? 'Update Signature' : 'Add Signature'}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}

export default PresidentSignatureModal
