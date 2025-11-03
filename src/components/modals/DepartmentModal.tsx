import { Modal, Button, Form } from 'react-bootstrap'
import { FormInput } from '@/components'
import { useForm } from 'react-hook-form'
import { useAuthContext } from '@/common'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

interface DepartmentModalProps {
    show: boolean
    onHide: () => void
    onSuccess?: () => void
    editingDepartment?: {
        _id: number
        name: string
        description?: string
    } | null
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({
    show,
    onHide,
    onSuccess,
    editingDepartment = null
}) => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Products?.Update
    const canCreate = isSuperUser || permissions.Products?.Create
    const [apiLoading, setApiLoading] = useState(false)

    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    const {
        handleSubmit,
        register,
        control,
        reset,
        setValue,
        formState: { errors },
    } = useForm()

    // Handle form submission
    const handleFormSubmit = async (departmentData: any) => {
        setApiLoading(true)
        try {
            const url = editingDepartment
                ? `${BASE_API}/api/departments/${editingDepartment._id}`
                : `${BASE_API}/api/departments`

            const method = editingDepartment ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: departmentData.name,
                    description: departmentData.description,
                }),
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || `Failed to ${editingDepartment ? 'Update' : 'Add'} Department`)
            }

            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: editingDepartment ? 'UPDATED!' : 'ADDED!',
                    text: `Department ${editingDepartment ? 'updated' : 'added'} successfully!`,
                    icon: 'success',
                    confirmButtonText: 'OK',
                    timer: 1500,
                })

                handleModalClose()
                if (onSuccess) {
                    onSuccess()
                }
            }
        } catch (error: any) {
            console.error(`Error ${editingDepartment ? 'Updating' : 'Adding'} Department`, error)
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setApiLoading(false)
        }
    }

    const handleModalClose = () => {
        reset({
            name: '',
            description: ''
        })
        onHide()
    }

    // Set form values when editing
    useEffect(() => {
        if (show && editingDepartment) {
            setValue('name', editingDepartment.name)
            setValue('description', editingDepartment.description || '')
        } else if (show && !editingDepartment) {
            reset({
                name: '',
                description: ''
            })
        }
    }, [show, editingDepartment, setValue, reset])

    return (
        <Modal show={show} onHide={handleModalClose} dialogClassName="modal-dialog-centered">
            <Modal.Header closeButton>
                <h4 className="modal-title">
                    {editingDepartment ? 'Update Department' : 'Add New Department'}
                </h4>
            </Modal.Header>
            <Form onSubmit={handleSubmit(handleFormSubmit)}>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center">
                            Name <span className="text-danger ms-1">*</span>
                        </Form.Label>
                        <FormInput
                            type="text"
                            name="name"
                            containerClass="mb-3"
                            register={register}
                            placeholder="Enter Department Name"
                            errors={errors}
                            control={control}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <FormInput
                            type="textarea"
                            name="description"
                            containerClass="mb-3"
                            register={register}
                            placeholder="Enter Department Description"
                            errors={errors}
                            control={control}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={handleModalClose}>
                        Close
                    </Button>
                    <Button
                        variant="soft-success"
                        type="submit"
                        disabled={editingDepartment ? !canUpdate : !canCreate}>
                        {apiLoading
                            ? editingDepartment
                                ? 'Updating...'
                                : 'Adding...'
                            : editingDepartment
                                ? 'Update Department'
                                : 'Save Department'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}

export default DepartmentModal