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


const ShippingPolicy = () => {
    const { user } = useAuthContext()
    // const canUpdate = isSuperUser || permissions.Products?.Update
    // const canDelete = isSuperUser || permissions.Products?.Delete
    // const canCreate = isSuperUser || permissions.Products?.Create

    const [description, setDescription] = useState('')
    const [existingTermsId, setExistingTermsId] = useState<string | null>(null)
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

    const handleDescriptionChange = (content: any) => {
        const sanitizedDescription = DOMPurify.sanitize(content)
        setDescription(sanitizedDescription)
    }


    const handleSubmit = async () => {
        try {
            setApiLoading(true)

            if (existingTermsId) {
                const response = await fetch(`${BASE_API}/api/policies/shipping/${existingTermsId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ content: description })
                })

                if (!response.ok) {
                    throw new Error('Failed to update privacy')
                }

                Swal.fire({
                    title: 'Success!',
                    text: 'Shipping Policy updated successfully!',
                    icon: 'success',
                    timer: 1500,
                })
            } else {
                const response = await fetch(`${BASE_API}/api/policies/shipping`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ content: description })
                })

                if (!response.ok) {
                    throw new Error('Failed to create Policy')
                }

                const data = await response.json()
                setExistingTermsId(data.shippingPolicy._id)

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


    const fetchTerms = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/policies/shipping`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch privacy')
            }

            const data = await response.json()

            // Handle array response
            if (data && Array.isArray(data) && data.length > 0) {
                const terms = data[0] // Get first item since there should only be one
                setDescription(terms.content)
                setExistingTermsId(terms._id)
            } else {
                setDescription('')
                setExistingTermsId(null)
            }
        } catch (error) {
            console.error('Error fetching terms:', error)
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        fetchTerms()
    }, [])

    if (loading) {
        return <PolicyPageLoader />
    }

    return (
        <>
            <PageBreadcrumb title="Shipping Policy" subName="Policies" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Shipping Policy</h4>
                            <p className="text-muted mb-0">
                                Add and Manage your Shipping Policy here.
                            </p>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="table-responsive-sm">
                        <Form.Group className="mb-3">
                            <Form.Label>Shipping Policy</Form.Label>
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
                                        {existingTermsId ? 'Updating...' : 'Saving...'}
                                    </span>
                                ) : (
                                    <span>
                                        {existingTermsId ? 'Update Shipping Policy' : 'Save Shipping Policy'}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card >
        </>
    )
}

export default ShippingPolicy
