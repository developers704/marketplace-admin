import React, { useEffect, useState } from 'react'
import {
    Button,
    Card,
    Form,
    Accordion,
    Modal,
    Spinner,
    Alert
} from 'react-bootstrap'
import { MdDelete, MdEdit, MdHelpOutline, MdAdd } from 'react-icons/md'
import { FormInput, PageBreadcrumb } from '@/components'
import { useAuthContext } from '@/common'
import { useForm } from 'react-hook-form'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'

interface FaqRecord {
    _id: string
    question: string
    answer: string
}

const FaqSection: React.FC = () => {
    const { user } = useAuthContext()
    const [faqs, setFaqs] = useState<FaqRecord[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [editingFaq, setEditingFaq] = useState<FaqRecord | null>(null)
    const [apiLoading, setApiLoading] = useState(false)
    const [isModalOpen, toggleModal] = useToggle()

    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    const {
        handleSubmit,
        register,
        reset,
        setValue,
        formState: { errors },
    } = useForm<FaqRecord>()

    // Load FAQs from API
    const loadFaqs = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${BASE_API}/api/faqs/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch FAQs')
            }

            const data = await response.json()
            setFaqs(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    // Handle FAQ Save or Update
    const handleSaveUpdate = async (formData: Omit<FaqRecord, '_id'>) => {
        setApiLoading(true)
        try {
            const method = editingFaq?._id ? 'PATCH' : 'POST'
            const url = editingFaq?._id
                ? `${BASE_API}/api/faqs/${editingFaq._id}`
                : `${BASE_API}/api/faqs/`

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                throw new Error('Failed to save FAQ')
            }

            Swal.fire({
                title: editingFaq?._id ? 'Updated!' : 'Added!',
                text: `FAQ ${editingFaq?._id ? 'updated' : 'added'} successfully!`,
                icon: 'success',
                timer: 1500,
                confirmButtonColor: '#9c5100',
            })

            // Close modal and refresh FAQs
            handleModalClose()
            loadFaqs()
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to save FAQ',
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setApiLoading(false)
        }
    }

    // Handle FAQ Deletion
    const handleDelete = async (faqId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This FAQ will be permanently deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#9c5100',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`${BASE_API}/api/faqs/bulk`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ ids: [faqId] })
                    })

                    if (!response.ok) {
                        throw new Error('Failed to delete FAQ')
                    }

                    Swal.fire({
                        title: 'Deleted!',
                        text: 'FAQ has been deleted.',
                        icon: 'success',
                        timer: 1500,
                        confirmButtonColor: '#9c5100',
                    })
                    loadFaqs()
                } catch (error) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to delete FAQ',
                        icon: 'error',
                        timer: 1500,
                    })
                }
            }
        })
    }

    // Prepare FAQ for editing
    const handleEdit = (faq: FaqRecord) => {
        setEditingFaq(faq)
        setValue('question', faq.question)
        setValue('answer', faq.answer)
        toggleModal()
    }

    // Close modal and reset form
    const handleModalClose = () => {
        setEditingFaq(null)
        reset()
        toggleModal()
    }

    // Initial data load
    useEffect(() => {
        loadFaqs()
    }, [])

    // Render FAQ content based on state
    const renderFaqContent = () => {
        if (loading) {
            return (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="success" />
                    <p className="mt-2 text-muted">Loading FAQs...</p>
                </div>
            )
        }

        if (error) {
            return (
                <Alert variant="danger" className="text-center">
                    <MdHelpOutline className="me-2" size={24} />
                    {error}
                    <Button
                        variant="outline-danger"
                        size="sm"
                        className="ms-3"
                        onClick={loadFaqs}
                    >
                        Retry
                    </Button>
                </Alert>
            )
        }

        if (faqs.length === 0) {
            return (
                <div className="text-center py-5">
                    <MdHelpOutline size={64} className="text-muted mb-3" />
                    <h5 className="text-muted">No FAQs Found</h5>
                    <p className="text-muted">
                        Click "Add New FAQ" to get started
                    </p>
                </div>
            )
        }

        return (
            <Accordion>
                {faqs.map((faq, index) => (
                    <Accordion.Item key={faq._id} eventKey={index.toString()}>
                        <Accordion.Header>
                            <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                <span>{faq.question}</span>
                                <div
                                    className="d-flex gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Button
                                        size="sm"
                                        variant="outline-success"
                                        onClick={() => handleEdit(faq)}
                                    >
                                        <MdEdit />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline-danger"
                                        onClick={() => handleDelete(faq._id)}
                                    >
                                        <MdDelete />
                                    </Button>
                                </div>
                            </div>
                        </Accordion.Header>
                        <Accordion.Body>
                            {faq.answer}
                        </Accordion.Body>
                    </Accordion.Item>
                ))}
            </Accordion>
        )
    }

    return (
        <>
            <PageBreadcrumb title="FAQ Management" subName="Content" />

            <Card>
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="header-title">Frequently Asked Questions</h4>
                            <p className="text-muted mb-0">
                                Manage and organize your frequently asked questions
                            </p>
                        </div>
                        <Button
                            variant="success"
                            onClick={toggleModal}
                            disabled={loading}
                        >
                            <MdAdd className="me-1" /> Add New FAQ
                        </Button>
                    </div>
                </Card.Header>

                <Card.Body>
                    {renderFaqContent()}
                </Card.Body>
            </Card>

            <Modal show={isModalOpen} onHide={handleModalClose} >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit(handleSaveUpdate)}>
                    <Modal.Body>
                        <FormInput
                            label="Question *"
                            type="text"
                            name="question"
                            placeholder="Enter your FAQ question"
                            register={register}
                            errors={errors}
                            required
                        />

                        <FormInput
                            label="Answer *"
                            type="textarea"
                            name="answer"
                            placeholder="Provide a detailed answer"
                            register={register}
                            errors={errors}
                            required
                        />
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={handleModalClose}
                            disabled={apiLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="success"
                            type="submit"
                            disabled={apiLoading}
                        >
                            {apiLoading
                                ? 'Saving...'
                                : (editingFaq ? 'Update FAQ' : 'Save FAQ')
                            }
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    )
}

export default FaqSection
