import { FormInput, PageBreadcrumb } from '@/components'
import { Button, Card, Form, Row, Col } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { MdDelete } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useForm } from 'react-hook-form'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import ReactQuill from 'react-quill'
import DOMPurify from 'dompurify'
import 'react-quill/dist/quill.snow.css'
import 'react-quill/dist/quill.bubble.css'
import { toastService } from '@/common/context/toast.service'
interface AboutUsRecord {
    _id: string
    titleOne: string
    titleTwo: string
    titleThree: string
    descriptionOne: string
    descriptionTwo: string
    descriptionThree: string
    descriptionFour: string
    headingOne: string
    headingTwo: string
    headingThree: string
    subHeadingOne: string
    subHeadingTwo: string
    linkOne: string
    linkTwo: string
    bannerImage: string
    bannerImageMobile: string
    lastBanner: string
    lastBannerTwo: string
    leftsideImage: string
    rightsideImage: string
    lastBannerMobile: string;
}

const AboutUsSection = () => {
    const { user } = useAuthContext()
    const [apiLoading, setApiLoading] = useState(false)
    const [aboutData, setAboutData] = useState<AboutUsRecord | null>(null)
    const [descriptionOne, setDescriptionOne] = useState('')
    const [descriptionTwo, setDescriptionTwo] = useState('')


    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    const [selectedImages, setSelectedImages] = useState<any>({
        bannerImage: null,
        bannerImageMobile: null,
        lastBanner: null,
        lastBannerTwo: null,
        leftsideImage: null,
        rightsideImage: null,
        lastBannerMobile: null,
    })

    const {
        handleSubmit,
        register,
        reset,
        setValue,
        formState: { errors },
    } = useForm()

    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean']
        ]
    }

    const handleDescriptionOneChange = (content: any) => {
        const sanitizedDescription = DOMPurify.sanitize(content)
        setDescriptionOne(sanitizedDescription)
    }

    const handleDescriptionTwoChange = (content: any) => {
        const sanitizedDescription = DOMPurify.sanitize(content)
        setDescriptionTwo(sanitizedDescription)
    }

    const loadAboutData = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/aboutUs/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                if (data && data.length > 0) {
                    setAboutData(data[0])
                    Object.keys(data[0]).forEach((key) => {
                        if (key !== '_id') {
                            setValue(key, data[0][key])
                        }
                    })
                }
            }
        } catch (error) {
            console.error('Error loading about us data:', error)
        }
    }

    const handleSaveUpdate = async (formData: any) => {
        setApiLoading(true)
        try {
            const method = aboutData?._id ? 'PUT' : 'POST'
            const url = aboutData?._id
                ? `${BASE_API}/api/aboutUs/${aboutData._id}`
                : `${BASE_API}/api/aboutUs/`

            const submitFormData = new FormData()

            // We'll track keys we've already added to prevent duplicates
            const addedKeys = new Set()

            // Handle text fields from form data, avoiding duplicates
            for (const key in formData) {
                if (typeof formData[key] === 'string' &&
                    key !== 'descriptionOne' &&
                    key !== 'descriptionTwo' &&
                    !addedKeys.has(key)) {
                    submitFormData.append(key, formData[key])
                    addedKeys.add(key)
                }
            }

            // Add rich text editor content
            if (descriptionOne && !addedKeys.has('descriptionOne')) {
                submitFormData.append('descriptionOne', descriptionOne)
                addedKeys.add('descriptionOne')
            }

            if (descriptionTwo && !addedKeys.has('descriptionTwo')) {
                submitFormData.append('descriptionTwo', descriptionTwo)
                addedKeys.add('descriptionTwo')
            }

            // Add images, checking for duplicates
            for (const key in selectedImages) {
                if (selectedImages[key] && !addedKeys.has(key)) {
                    submitFormData.append(key, selectedImages[key])
                    addedKeys.add(key)
                }
            }


            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: submitFormData
            })

            const responseData = await response.json()

            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || "failed to Save")
            }

            if (response.ok) {
                Swal.fire({
                    title: aboutData?._id ? 'Updated!' : 'Saved!',
                    text: `About Us section ${aboutData?._id ? 'updated' : 'saved'} successfully!`,
                    icon: 'success',
                    timer: 1500,
                    confirmButtonColor: '#9c5100'
                })
                loadAboutData()
            }
        } catch (error: any) {
            toastService.error(error.message)
        } finally {
            setApiLoading(false)
        }
    }

    const handleReset = async () => {
        if (!aboutData?._id) return

        Swal.fire({
            title: 'Are you sure?',
            text: 'This will delete all about us section data!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#9c5100',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`${BASE_API}/api/aboutUs/bulk-delete`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ ids: [aboutData._id] })
                    })
                    const responseData = await response.json()
                    if (!response.ok) {
                        throw new Error(responseData.message || responseData.error || "failed to delete")
                    }

                    if (response.ok) {
                        setAboutData(null)
                        reset()
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'About Us section data has been deleted.',
                            icon: 'success',
                            timer: 1500,
                            confirmButtonColor: '#9c5100',
                        })
                    }
                } catch (error: any) {
                    toastService.error(error.message)
                }
            }
        })
    }

    useEffect(() => {
        loadAboutData()
    }, [])
    useEffect(() => {
        if (aboutData) {
            setDescriptionOne(aboutData.descriptionOne || '')
            setDescriptionTwo(aboutData.descriptionTwo || '')
        }
    }, [aboutData])
    const ImageUploadWithPreview = ({
        currentImage,
        label,
    }: {
        currentImage: any;
        label: string;
    }) => {
        const [showPreview, setShowPreview] = useState(false);

        return (
            <div className="position-relative">
                <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center">
                        {label}
                        {currentImage && (
                            <span
                                className="ms-2 text-primary cursor-pointer"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={() => setShowPreview(true)}
                                onMouseLeave={() => setShowPreview(false)}
                            >
                                <i className="ri-eye-line"></i> View current
                            </span>
                        )}
                    </Form.Label>

                    {showPreview && currentImage && (
                        <div
                            className="position-absolute"
                            style={{
                                zIndex: 1000,
                                top: '100%',
                                left: '0',
                                boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}
                        >
                            <img
                                src={`${BASE_API}/${currentImage}`}
                                alt={label}
                                style={{
                                    maxWidth: '300px',
                                    maxHeight: '200px',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>
                    )}
                </Form.Group>
            </div>
        );
    };


    return (
        <>
            <PageBreadcrumb title="About Us Section" subName="Content Management" />
            <Card>
                <Card.Header>
                    <h4 className="header-title">About Us Section Settings</h4>
                    <p className="text-muted mb-0">
                        Manage your website's about us page content and images
                    </p>
                </Card.Header>

                <Card.Body>
                    <Form onSubmit={handleSubmit(handleSaveUpdate)}>
                        <h5 className="mb-3">Banner Section</h5>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <ImageUploadWithPreview
                                        currentImage={aboutData?.bannerImage}
                                        label="Banner Image"
                                    />
                                    <SingleFileUploader
                                        icon="ri-upload-cloud-2-line"
                                        text="Drop banner image here or click to upload"
                                        onFileUpload={(file) => setSelectedImages((prev: any) => ({ ...prev, bannerImage: file }))}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <ImageUploadWithPreview
                                        currentImage={aboutData?.bannerImageMobile}
                                        label="Mobile Banner Image"
                                    />
                                    <SingleFileUploader
                                        icon="ri-upload-cloud-2-line"
                                        text="Drop mobile banner here or click to upload"
                                        onFileUpload={(file) => setSelectedImages((prev: any) => ({ ...prev, bannerImageMobile: file }))}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <h5 className="mb-3">Main Content</h5>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Description One</Form.Label>
                                    <div className="mb-2" style={{ padding: '0px', overflowY: 'auto' }}>
                                        <ReactQuill
                                            modules={modules}
                                            theme="snow"
                                            value={descriptionOne}
                                            onChange={handleDescriptionOneChange}
                                            className="pb-4"
                                            style={{
                                                height: 340,
                                                maxWidth: '100%',
                                                boxSizing: 'border-box',
                                                overflow: 'hidden'
                                            }}
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Description Two</Form.Label>
                                    <div className="mb-2" style={{ padding: '0px', overflowY: 'auto' }}>
                                        <ReactQuill
                                            modules={modules}
                                            theme="snow"
                                            value={descriptionTwo}
                                            onChange={handleDescriptionTwoChange}
                                            className="pb-4"
                                            style={{
                                                height: 340,
                                                maxWidth: '100%',
                                                boxSizing: 'border-box',
                                                overflow: 'hidden'
                                            }}
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <FormInput
                                    label="Description Three"
                                    type="textarea"
                                    name="descriptionThree"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                            <Col md={6}>
                                <FormInput
                                    label="Description Four"
                                    type="textarea"
                                    name="descriptionFour"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                        </Row>

                        <h5 className="mb-3">Headings Section</h5>
                        <Row className="mb-3">
                            <Col md={4}>
                                <FormInput
                                    label="Heading One"
                                    type="text"
                                    name="headingOne"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                            <Col md={4}>
                                <FormInput
                                    label="Heading Two"
                                    type="text"
                                    name="headingTwo"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                            <Col md={4}>
                                <FormInput
                                    label="Heading Three"
                                    type="text"
                                    name="headingThree"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <FormInput
                                    label="Sub Heading One "
                                    type="text"
                                    name="subHeadingOne"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                            <Col md={6}>
                                <FormInput
                                    label="Sub Heading Two "
                                    type="text"
                                    name="subHeadingTwo"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={4}>
                                <FormInput
                                    label="Title One (Info: Red Color Text on About Us Page)"
                                    type="text"
                                    name="titleOne"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                            <Col md={4}>
                                <FormInput
                                    label="Title Two (Info: Red Color Text on About Us Page)"
                                    type="text"
                                    name="titleTwo"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                            <Col md={4}>
                                <FormInput
                                    label="Title Three (Info: Red Color Text on About Us Page)"
                                    type="text"
                                    name="titleThree"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                        </Row>

                        <h5 className="mb-3">Additional Images</h5>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <ImageUploadWithPreview
                                        currentImage={aboutData?.leftsideImage}
                                        label="Left Side Image"
                                    />
                                    <SingleFileUploader
                                        icon="ri-upload-cloud-2-line"
                                        text="Drop left side image here or click to upload"
                                        onFileUpload={(file) => setSelectedImages((prev: any) => ({ ...prev, leftsideImage: file }))}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <ImageUploadWithPreview
                                        currentImage={aboutData?.rightsideImage}
                                        label="Right Side Image"
                                    />
                                    <SingleFileUploader
                                        icon="ri-upload-cloud-2-line"
                                        text="Drop right side image here or click to upload"
                                        onFileUpload={(file) => setSelectedImages((prev: any) => ({ ...prev, rightsideImage: file }))}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <ImageUploadWithPreview
                                        currentImage={aboutData?.lastBanner}
                                        label="Last Banner"
                                    />
                                    <SingleFileUploader
                                        icon="ri-upload-cloud-2-line"
                                        text="Drop last banner here or click to upload"
                                        onFileUpload={(file) => setSelectedImages((prev: any) => ({ ...prev, lastBanner: file }))}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <ImageUploadWithPreview
                                        currentImage={aboutData?.lastBannerMobile}
                                        label="Last Banner Mobile"
                                    />
                                    <SingleFileUploader
                                        icon="ri-upload-cloud-2-line"
                                        text="Drop last banner mobile here or click to upload"
                                        onFileUpload={(file) => setSelectedImages((prev: any) => ({ ...prev, lastBannerMobile: file }))}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <ImageUploadWithPreview
                                        currentImage={aboutData?.lastBannerTwo}
                                        label="Last Banner Two"
                                    />
                                    <SingleFileUploader
                                        icon="ri-upload-cloud-2-line"
                                        text="Drop last banner two here or click to upload"
                                        onFileUpload={(file) => setSelectedImages((prev: any) => ({ ...prev, lastBannerTwo: file }))}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <h5 className="mb-3">Links</h5>
                        <Row className="mb-3">
                            <Col md={6}>
                                <FormInput
                                    label="Link One"
                                    type="text"
                                    name="linkOne"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                            <Col md={6}>
                                <FormInput
                                    label="Link Two"
                                    type="text"
                                    name="linkTwo"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-between">
                            <Button
                                variant="danger"
                                type="button"
                                onClick={handleReset}
                                disabled={!aboutData?._id || apiLoading}
                            >
                                <MdDelete className="me-1" /> Delete Data
                            </Button>

                            <Button
                                variant="success"
                                type="submit"
                                disabled={apiLoading}
                            >
                                {apiLoading ? 'Saving...' : aboutData?._id ? 'Update' : 'Save'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </>
    )
}

export default AboutUsSection
