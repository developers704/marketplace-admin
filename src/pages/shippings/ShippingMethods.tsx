import { FormInput, PageBreadcrumb } from '@/components'
import { Button, Card, Form, Table, Modal, Row, Col } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import { Pagination as BootstrapPagination } from 'react-bootstrap'
import { TableRowSkeleton } from '../other/SimpleLoader'

interface ShippingMethod {
    _id: string
    name: string
    description: string
    price: number
    estimatedDeliveryTime: string
    freeShippingThreshold: number
    createdAt: string
    updatedAt: string
}

const ShippingMethods = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Products?.Update
    const canDelete = isSuperUser || permissions.Products?.Delete
    const canCreate = isSuperUser || permissions.Products?.Create

    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [loading, setLoading] = useState(false)
    const [apiLoading, setApiLoading] = useState(false)
    const [shippingData, setShippingData] = useState<ShippingMethod[]>([])
    const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null)
    const [isOpen, toggleModal] = useToggle()

    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user
    const {
        handleSubmit,
        register,
        reset,
        control,
        setValue,
        formState: { errors },
    } = useForm()

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }

    const handleDeleteConfirmation = (methodId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This shipping method will be deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Delete!'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteShippingMethod(methodId)
            }
        })
    }

    const handletoggleModal = () => {
        if (isOpen) {
            reset()
            setEditingMethod(null)
        }
        toggleModal()
    }

    const toggleEditModal = (method: ShippingMethod) => {
        setEditingMethod(method)
        setValue('name', method.name)
        setValue('description', method.description)
        setValue('price', method.price)
        setValue('estimatedDeliveryTime', method.estimatedDeliveryTime)
        setValue('freeShippingThreshold', method.freeShippingThreshold)
        toggleModal()
    }

    const filteredRecords = shippingData
        .filter(record =>
            record.name.toLowerCase().includes(searchTerm.toLowerCase())
        )

    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    // API Calls
    const getShippingMethods = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/shipping-methods`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch shipping methods')
            }

            const data = await response.json()
            setShippingData(data)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateShipping = async (data: any) => {
        setApiLoading(true)
        try {
            const shippingData = {
                ...data,
                price: Number(data.price),
                freeShippingThreshold: Number(data.freeShippingThreshold)
            }
            const response = await fetch(
                `${BASE_API}/api/shipping-methods/${editingMethod?._id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(shippingData)
                }
            )

            if (!response.ok) {
                throw new Error('Failed to update shipping method')
            }

            getShippingMethods()
            handletoggleModal()
            Swal.fire({
                title: 'Updated!',
                text: 'Shipping method updated successfully!',
                icon: 'success',
                timer: 1500,
            })
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to update shipping method',
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setApiLoading(false)
        }
    }

    const deleteShippingMethod = async (methodId: string) => {
        try {
            const response = await fetch(
                `${BASE_API}/api/shipping-methods/${methodId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                throw new Error('Failed to delete shipping method')
            }

            getShippingMethods()
            Swal.fire({
                title: 'Deleted!',
                text: 'Shipping method deleted successfully',
                icon: 'success',
                timer: 1500,
            })
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to delete shipping method',
                icon: 'error',
                timer: 1500,
            })
        }
    }

    const handleAddShipping = async (data: any) => {
        setApiLoading(true)
        try {
            const shippingData = {
                ...data,
                price: Number(data.price),
                freeShippingThreshold: Number(data.freeShippingThreshold)
            }
            const response = await fetch(`${BASE_API}/api/shipping-methods`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(shippingData)
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to Add Shipping Method')
            }

            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: 'Added!',
                    text: 'Shipping method added successfully!',
                    icon: 'success',
                    timer: 1500,
                })
                getShippingMethods()
                reset()
                handletoggleModal()
            }
        } catch (error: any) {
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

    useEffect(() => {
        getShippingMethods()
    }, [])

    const tableHeaders: any[] = [
        { width: '150px', type: 'text' },
        { width: '100px', type: 'number' },
        { width: '150px', type: 'text' },
        { width: '100px', type: 'number' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'actions' }
    ]

    return (
        <>
            <PageBreadcrumb title="Shipping Methods" subName="Settings" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Shipping Methods</h4>
                            <p className="text-muted mb-0">
                                Manage all your shipping methods here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <Button
                                disabled={!canCreate}
                                variant="success"
                                onClick={toggleModal}
                                className="mb-2 mb-sm-0">
                                <i className="bi bi-plus"></i> Add New Method
                            </Button>
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
                        <div className="app-search d-none d-lg-block">
                            <form>
                                <div className="input-group">
                                    <input
                                        type="search"
                                        className="form-control"
                                        placeholder="Search shipping method..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                    />
                                    <span className="ri-search-line search-icon"></span>
                                </div>
                            </form>
                        </div>

                        <Form.Select
                            value={itemsPerPage}
                            style={{ zIndex: 1 }}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="w-auto mt-3 mt-lg-0">
                            <option value={15}>15 items</option>
                            <option value={30}>30 items</option>
                            <option value={40}>40 items</option>
                        </Form.Select>
                    </div>
                </Card.Header>

                <Card.Body>
                    <Table responsive className="table-centered">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Delivery Time</th>
                                <th>Free Shipping Above</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableRowSkeleton headers={tableHeaders} rowCount={3} />
                            ) : (
                                paginatedRecords.map((method) => (
                                    <tr key={method._id}>
                                        <td>{method.name}</td>
                                        <td>$ {method.price}</td>
                                        <td>{method.estimatedDeliveryTime}</td>
                                        <td>$ {method.freeShippingThreshold}</td>

                                        <td>
                                            <Button
                                                variant="secondary"
                                                disabled={!canUpdate}
                                                onClick={() => toggleEditModal(method)}
                                                className="me-2">
                                                <MdEdit />
                                            </Button>
                                            <Button
                                                variant="danger"
                                                disabled={!canDelete}
                                                onClick={() => handleDeleteConfirmation(method._id)}>
                                                <MdDelete />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                    <nav className="d-flex justify-content-end mt-3">
                        <BootstrapPagination className="pagination-rounded mb-0">
                            <BootstrapPagination.Prev
                                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                            />
                            {Array.from({ length: totalPages }, (_, index) => (
                                <BootstrapPagination.Item
                                    key={index + 1}
                                    active={index + 1 === currentPage}
                                    onClick={() => handlePageChange(index + 1)}>
                                    {index + 1}
                                </BootstrapPagination.Item>
                            ))}
                            <BootstrapPagination.Next
                                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                            />
                        </BootstrapPagination>
                    </nav>
                </Card.Body>
            </Card>

            <Modal show={isOpen} onHide={handletoggleModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingMethod ? 'Edit Shipping Method' : 'Add New Shipping Method'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit(editingMethod ? handleUpdateShipping : handleAddShipping)}>
                    <Modal.Body>
                        <Row className="mb-3">
                            <Col>
                                <FormInput
                                    label="Method Name *"
                                    type="text"
                                    name="name"
                                    placeholder="Enter shipping method name"
                                    register={register}
                                    errors={errors}
                                    control={control}
                                    required
                                />
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <FormInput
                                    label="Price *"
                                    type="number"
                                    name="price"
                                    placeholder="Enter price"
                                    register={register}
                                    errors={errors}
                                    control={control}
                                    required
                                />
                            </Col>
                            <Col md={6}>
                                <FormInput
                                    label="Free Shipping Threshold *"
                                    type="number"
                                    name="freeShippingThreshold"
                                    placeholder="Enter threshold amount"
                                    register={register}
                                    errors={errors}
                                    control={control}
                                    required
                                />
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col>
                                <FormInput
                                    label="Estimated Delivery Time *"
                                    type="text"
                                    name="estimatedDeliveryTime"
                                    placeholder="e.g., 5-7 business days"
                                    register={register}
                                    errors={errors}
                                    control={control}
                                    required
                                />
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col>
                                <FormInput
                                    label="Description"
                                    type="textarea"
                                    name="description"
                                    placeholder="Enter method description"
                                    register={register}
                                    errors={errors}
                                    control={control}
                                />
                            </Col>
                        </Row>

                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={handletoggleModal}>
                            Close
                        </Button>
                        <Button
                            variant="success"
                            type="submit"
                            disabled={apiLoading}>
                            {apiLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    )
}

export default ShippingMethods

