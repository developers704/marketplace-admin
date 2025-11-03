import { useState, useEffect } from 'react'
import { Card, Button, Modal, Image, Form } from 'react-bootstrap'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import { useAuthContext } from '@/common'

interface ProductFeatureImageProps {
    selectedImage?: string
    onImageSelect: (imageUrl: string) => void
    onImageUpload: (file: File) => void
    isExistingImage: boolean
    setIsExistingImage: (value: boolean) => void
    initialImage?: string  // Add this prop
    imageAltText: string
    setImageAltText: (value: string) => void
}



const ProductFeatureImage = ({ selectedImage, onImageSelect, onImageUpload, setIsExistingImage, initialImage, imageAltText, setImageAltText }: ProductFeatureImageProps) => {
    const [showModal, setShowModal] = useState(false)

    const [newImage, setNewImage] = useState<File | null>(null)

    const BASE_API = import.meta.env.VITE_BASE_API
    const { user } = useAuthContext()
    const { token } = user

    const getAllImages = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/product-images`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (!response.ok) {
                throw new Error('Failed to fetch images')
            }
        } catch (error) {
            console.error('Error fetching images:', error)
        } finally {
        }
    }

    const handleUploadConfirm = () => {
        if (newImage) {
            onImageUpload(newImage)
            setShowModal(false)
        }
    }
    useEffect(() => {
        if (initialImage) {
            onImageSelect(initialImage)
        }
    }, [initialImage])

    const renderExistingImage = () => {
        const imageToShow = selectedImage || initialImage
        if (imageToShow) {
            return (
                <div className="text-center mt-3">
                    <h6 className="text-muted mb-2">Current Feature Image</h6>
                    <Image
                        src={`${BASE_API}${imageToShow}`}
                        alt="Current Feature Image"
                        style={{
                            width: '120px',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid #eee'
                        }}
                    />
                    <Form.Group className="mt-3">
                        <Form.Label>Image Alt Text</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter image alt text for SEO"
                            value={imageAltText}
                            onChange={(e) => setImageAltText(e.target.value)}
                        />
                    </Form.Group>
                </div>
            )
        }
        return null
    }

    useEffect(() => {
        getAllImages()
    }, [])

    return (
        <Card>
            <Card.Header>Feature Image</Card.Header>
            <Card.Body>
                <div className="d-flex flex-column align-items-center gap-3">

                    {/* Upload Section */}

                    <div className="w-100">
                        <Form.Group className="mb-3">
                            <Form.Label>Image Alt Text</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter image alt text for SEO"
                                value={imageAltText}
                                onChange={(e) => setImageAltText(e.target.value)}
                                disabled={!newImage}
                            />
                            {!newImage && (
                                <small className="text-muted">
                                    Upload an image to enable alt text editing
                                </small>
                            )}
                        </Form.Group>
                        <Button
                            variant="success"
                            onClick={() => setShowModal(true)}
                            className="w-100"
                        >
                            <i className="ri-upload-cloud-2-line me-1"></i>
                            Upload New Feature Image
                        </Button>


                        {newImage && (
                            <div className="text-center mt-3">
                                <h6 className="text-muted mb-2">Uploaded Image</h6>
                                <Image
                                    src={URL.createObjectURL(newImage)}
                                    alt="Upload Preview"
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        border: '2px solid #eee'
                                    }}
                                />
                                <div className="mt-2">
                                    <span className="badge bg-light text-dark">
                                        {newImage.name}
                                    </span>
                                </div>
                            </div>
                        )}
                        {renderExistingImage()}
                    </div>
                </div>

                {/* Upload Modal */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Upload Feature Image</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="mb-2">
                            <p className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>
                                File Size: Upload image up to 5 MB
                            </p>
                            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                                Supported Formats: JPEG (.jpg, .jpeg), PNG (.png)
                            </p>
                        </div>
                        <SingleFileUploader
                            icon="ri-upload-cloud-2-line"
                            text="Drop file here or click to upload"
                            onFileUpload={(file: File) => setNewImage(file)}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            disabled={!newImage}
                            onClick={handleUploadConfirm}
                        >
                            Upload & Select
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Card.Body>
        </Card>
    )
}

export default ProductFeatureImage
