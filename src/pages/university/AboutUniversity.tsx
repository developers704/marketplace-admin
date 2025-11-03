import { PageBreadcrumb } from '@/components'
import {
    Button,
    Card,
    Form,
} from 'react-bootstrap'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useEffect, useState } from 'react'
import { PolicyPageLoader } from '../other/SimpleLoader'
import ReactQuill from 'react-quill'
import DOMPurify from 'dompurify'
import 'react-quill/dist/quill.snow.css'
import 'react-quill/dist/quill.bubble.css'

const AboutUniversity = () => {
    const { user } = useAuthContext()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [existingAboutId, setExistingAboutId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [apiloading, setApiLoading] = useState(false)

    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean']
        ]
    }

    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value)
    }

    const handleDescriptionChange = (content: any) => {
        const sanitizedDescription = DOMPurify.sanitize(content)
        setDescription(sanitizedDescription)
    }

    const handleSubmit = async () => {
        try {
            setApiLoading(true)

            if (existingAboutId) {
                const response = await fetch(`${BASE_API}/api/aboutus/${existingAboutId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: title,
                        description: description
                    })
                })

                if (!response.ok) {
                    throw new Error('Failed to update about us')
                }

                Swal.fire({
                    title: 'Success!',
                    text: 'About Us updated successfully!',
                    icon: 'success',
                    timer: 1500,
                })
            } else {
                const response = await fetch(`${BASE_API}/api/aboutus`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: title,
                        description: description
                    })
                })

                if (!response.ok) {
                    throw new Error('Failed to create about us')
                }

                const data = await response.json()
                setExistingAboutId(data._id)

                Swal.fire({
                    title: 'Success!',
                    text: data.message,
                    icon: 'success',
                    timer: 1500,
                })
            }
        } catch (error: any) {
            Swal.fire({
                title: 'Error!',
                text: error.message,
                icon: 'error',
            })
        } finally {
            setApiLoading(false)
        }
    }

    const fetchAboutUs = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/aboutus`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch about us')
            }

            const data = await response.json()

            // Handle array response
            if (data && Array.isArray(data) && data.length > 0) {
                const aboutUs = data[0] // Get first item since there should only be one
                setTitle(aboutUs.title || '')
                setDescription(aboutUs.description || '')
                setExistingAboutId(aboutUs._id)
            } else {
                setTitle('')
                setDescription('')
                setExistingAboutId(null)
            }
        } catch (error) {
            console.error('Error fetching about us:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAboutUs()
    }, [])

    if (loading) {
        return <PolicyPageLoader />
    }

    return (
        <>
            <PageBreadcrumb title="About University" subName="University" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">About University</h4>
                            <p className="text-muted mb-0">
                                Add and Manage your University information here.
                            </p>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="table-responsive-sm">
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter title here..."
                                value={title}
                                onChange={handleTitleChange}
                                disabled={apiloading}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <div className="mb-2" style={{ height: '370px', overflowY: 'auto' }}>
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
                                        overflow: 'hidden'
                                    }}
                                    readOnly={apiloading}
                                />
                            </div>
                        </Form.Group>

                        <div className="text-end mt-3">
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={apiloading}
                            >
                                {apiloading ? (
                                    <span>
                                        {existingAboutId ? 'Updating...' : 'Saving...'}
                                    </span>
                                ) : (
                                    <span>
                                        {existingAboutId ? 'Update About University' : 'Save About University'}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </>
    )
}

export default AboutUniversity
