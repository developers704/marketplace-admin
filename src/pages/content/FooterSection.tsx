import { FormInput, PageBreadcrumb } from '@/components'
import { Button, Card, Form, Row, Col } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { MdDelete } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useForm } from 'react-hook-form'

interface StoreRecord {
    _id: string
    phoneNumber: string
    email: string
    address: string
    facebookLink: string
    youtubeLink: string
    tiktokLink: string
    linkedinLink: string
}

const FooterSection = () => {
    const { user } = useAuthContext()
    const [apiLoading, setApiLoading] = useState(false)
    const [footerData, setFooterData] = useState<StoreRecord | null>(null)
    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    const {
        handleSubmit,
        register,
        reset,
        setValue,
        formState: { errors },
    } = useForm()

    const loadFooterData = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/footer/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                if (data && data.length > 0) {
                    setFooterData(data[0])
                    // Populate form with existing data
                    Object.keys(data[0]).forEach((key) => {
                        if (key !== '_id') {
                            setValue(key, data[0][key])
                        }
                    })
                }
            }
        } catch (error) {
            console.error('Error loading footer data:', error)
        }
    }

    const handleSaveUpdate = async (formData: any) => {
        setApiLoading(true)
        try {
            const method = footerData?._id ? 'PUT' : 'POST'
            const url = footerData?._id
                ? `${BASE_API}/api/footer/${footerData._id}`
                : `${BASE_API}/api/footer/`

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                Swal.fire({
                    title: footerData?._id ? 'Updated!' : 'Saved!',
                    text: `Footer section ${footerData?._id ? 'updated' : 'saved'} successfully!`,
                    icon: 'success',
                    timer: 1500,
                    confirmButtonColor: '#9c5100'
                })
                loadFooterData()
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to save footer data',
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setApiLoading(false)
        }
    }

    const handleReset = async () => {
        if (!footerData?._id) return

        Swal.fire({
            title: 'Are you sure?',
            text: 'This will delete all footer section data!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#9c5100',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'

        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`${BASE_API}/api/footer/bulk-delete`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ ids: [footerData._id] })
                    })

                    if (response.ok) {
                        setFooterData(null)
                        reset()
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Footer section data has been deleted.',
                            icon: 'success',
                            timer: 1500,
                            confirmButtonColor: '#9c5100',
                        })
                    }
                } catch (error) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to delete footer data',
                        icon: 'error',
                        timer: 1500,
                    })
                }
            }
        })
    }

    useEffect(() => {
        loadFooterData()
    }, [])

    return (
        <>
            <PageBreadcrumb title="Footer Section" subName="Content Management" />
            <Card>
                <Card.Header>
                    <h4 className="header-title">Footer Section Settings</h4>
                    <p className="text-muted mb-0">
                        Manage your website's footer contact information and social media links
                    </p>
                </Card.Header>

                <Card.Body>
                    <Form onSubmit={handleSubmit(handleSaveUpdate)}>
                        <Row className="mb-3">
                            <Col md={6}>
                                <FormInput
                                    label="Phone Number"
                                    type="text"
                                    name="phoneNumber"
                                    placeholder="Enter phone number"
                                    register={register}
                                    errors={errors}
                                    required
                                />
                            </Col>
                            <Col md={6}>
                                <FormInput
                                    label="Email"
                                    type="email"
                                    name="email"
                                    placeholder="Enter email address"
                                    register={register}
                                    errors={errors}
                                    required
                                />
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={12}>
                                <FormInput
                                    label="Address"
                                    type="textarea"
                                    name="address"
                                    placeholder="Enter address"
                                    register={register}
                                    errors={errors}
                                    required
                                />
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <FormInput
                                    label="Facebook Link"
                                    type="url"
                                    name="facebookLink"
                                    placeholder="Enter Facebook URL"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                            <Col md={6}>
                                <FormInput
                                    label="YouTube Link"
                                    type="url"
                                    name="youtubeLink"
                                    placeholder="Enter YouTube URL"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <FormInput
                                    label="TikTok Link"
                                    type="url"
                                    name="tiktokLink"
                                    placeholder="Enter TikTok URL"
                                    register={register}
                                    errors={errors}
                                />
                            </Col>
                            <Col md={6}>
                                <FormInput
                                    label="LinkedIn Link"
                                    type="url"
                                    name="linkedinLink"
                                    placeholder="Enter LinkedIn URL"
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
                                disabled={!footerData?._id || apiLoading}
                            >
                                <MdDelete className="me-1" /> Reset Data
                            </Button>

                            <Button
                                variant="success"
                                type="submit"
                                disabled={apiLoading}
                            >
                                {apiLoading ? 'Saving...' : footerData?._id ? 'Update' : 'Save'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </>
    )
}

export default FooterSection
