import { FileUploader } from '@/components/FileUploader'
import { Card } from 'react-bootstrap'

interface ProductGalleryProps {
    setGallery: (files: File[]) => void
}

const ProductGallery = ({ setGallery }: ProductGalleryProps) => {
    const handleFileUpload = (files: File[]) => {
        // Log the files before setting
        console.log('Files being set in gallery:', files.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
            lastModified: f.lastModified
        })));
        setGallery(files);
    };
    return (
        <Card>
            <Card.Header>
                <h4>Product Gallery</h4>
            </Card.Header>
            <Card.Body>
                <div className="mb-2">
                    <h5>Product Gallery</h5>
                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                        {'File Size: Upload images up to 5 MB.'}
                    </p>
                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                        {'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
                    </p>
                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                        {'Upload Limit: Upto 3 images can be uploaded.'}
                    </p>
                </div>
                <FileUploader
                    icon="ri-upload-cloud-2-line"
                    text="Drop files here or click to upload."
                    onFileUpload={handleFileUpload}
                />
            </Card.Body>
        </Card>
    )
}

export default ProductGallery
