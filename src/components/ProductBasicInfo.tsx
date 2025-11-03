import { FormInput } from '@/components'
import { Card, Col, Form, Row } from 'react-bootstrap'
import ReactQuill from 'react-quill'
import { Link } from 'react-router-dom'
import DOMPurify from 'dompurify'

interface ProductBasicInfoProps {
    register: any
    control: any
    errors: any
    description: string
    setDescription: any
    isEditing?: boolean
}


const ProductBasicInfo = (
    {
        register,
        control,
        errors,
        description,
        setDescription,
        isEditing
    }: ProductBasicInfoProps
) => {

    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean']
        ]
    }

    const handleDescriptionChange = (content: any) => {
        const sanitizedDescription = DOMPurify.sanitize(content)
        setDescription(sanitizedDescription)
    }
    return (
        <Card>
            <Card.Header>
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                    <div>
                        <h4 className="header-title">Product Basic Information</h4>
                    </div>
                    {!isEditing && (
                        <div className="mt-3 mt-lg-0">
                            <Link to="/products/all-product" className="btn btn-danger">
                                See All Products
                            </Link>
                        </div>
                    )}
                </div>
            </Card.Header>
            <Card.Body>
                <Row>
                    <Col xs={12}>
                        <Form.Group className="mb-4">
                            <Form.Label className="d-flex align-items-center">
                                Product Name <span className="text-danger ms-1">*</span>
                            </Form.Label>
                            <FormInput
                                type="text"
                                name="name"
                                containerClass="mb-0"
                                register={register}
                                placeholder="Enter Product name here..."
                                errors={errors}
                                control={control}
                                required
                            />
                        </Form.Group>
                    </Col>


                    <Col xs={12}>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <div className="mb-2" style={{ padding: '0px', overflowY: 'hidden' }}>
                                <ReactQuill
                                    modules={modules}
                                    theme="snow"
                                    value={description}
                                    onChange={handleDescriptionChange}
                                    className="pb-4"
                                    style={{
                                        height: 340,
                                        maxWidth: '100%',
                                        boxSizing: 'border-box',
                                        overflow: 'hidden',
                                    }}
                                />
                            </div>
                        </Form.Group>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    )
}
export default ProductBasicInfo
