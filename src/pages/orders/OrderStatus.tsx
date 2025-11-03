import { PageBreadcrumb } from '@/components'
import {
    Button,
    Card,
    Form,
    Table,
    Pagination as BootstrapPagination,
    Modal,
} from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { MdDelete } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form'

interface OrderStatus {
    _id: string
    name: string
    color: string
    isDefault: boolean
    sortOrder: number
    createdAt: string
    updatedAt: string
}

const OrderStatus = () => {
    const { user } = useAuthContext()
    // const canUpdate = isSuperUser || permissions.Users?.Update
    // const canDelete = isSuperUser || permissions.Users?.Delete
    const [selectedRows, setSelectedRows] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [sortedAsc, setSortedAsc] = useState(true)
    const [showDeleteButton, setShowDeleteButton] = useState(false)
    const [tags, setTags] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    // const [inputValue, setInputValue] = useState<string>('')
    // const [orderStatus, setOrderStatus] = useState<string[]>([])
    const [isEditMode, setIsEditMode] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null)

    const [apiLoading, setApiLoading] = useState(false)
    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user
    const [formData, setFormData] = useState({
        name: '',
        color: '#000000',
        isDefault: false,
        sortOrder: 0
    });

    const {
        handleSubmit,
    } = useForm()

    useEffect(() => {
        setCurrentPage(1)
        setShowDeleteButton(selectedRows.length > 0)
    }, [itemsPerPage, selectedRows])

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(filteredRecords.map((record) => record._id))
        } else {
            setSelectedRows([])
        }
    }
    const handleToggleModal = () => {
        if (isOpen) {
            resetForm()
        }
        toggleModal()
    }

    const handleSelectRow = (id: any) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        )
    }
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }

    const filteredRecords = tags
        .filter((tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) =>
            sortedAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        )
    const handleEdit = (status: OrderStatus) => {
        console.log("", setSortedAsc(true));

        setSelectedStatus(status)
        setFormData({
            name: status.name,
            color: status.color,
            isDefault: status.isDefault,
            sortOrder: status.sortOrder
        })
        setIsEditMode(true)
        toggleModal()
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )
    const [isOpen, toggleModal] = useToggle() // Using toggle for modal state
    const resetForm = () => {
        setFormData({
            name: '',
            color: '#000000',
            isDefault: false,
            sortOrder: 0
        })
        setSelectedStatus(null)
        setIsEditMode(false)
    }

    const getOrderStatuses = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/order-statuses`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message)
            }

            const data = await response.json()
            setTags(data)
        } catch (error: any) {
            Swal.fire({
                title: 'Error!',
                text: error.message,
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setLoading(false)
        }
    }

    const onSubmit: SubmitHandler<FieldValues> = async (data) => {
        setApiLoading(true)
        try {
            const url = isEditMode
                ? `${BASE_API}/api/order-statuses/${selectedStatus?._id}`
                : `${BASE_API}/api/order-statuses`

            const response = await fetch(url, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message)
            }

            const responseData = await response.json()
            Swal.fire({
                title: 'Success!',
                text: responseData.message,
                icon: 'success',
                timer: 1500,
            })

            toggleModal()
            getOrderStatuses()
            resetForm()
        } catch (error: any) {
            Swal.fire({
                title: 'Error!',
                text: error.message,
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setApiLoading(false)
        }
    }

    const deleteOrderStatus = async (statusId: string) => {
        try {
            const response = await fetch(`${BASE_API}/api/order-statuses/${statusId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message)
            }

            const data = await response.json()

            Swal.fire({
                title: 'Success!',
                text: data.message,
                icon: 'success',
                timer: 1500,
            })

            // Refresh the order statuses list
            getOrderStatuses()
        } catch (error: any) {
            Swal.fire({
                title: 'Error!',
                text: error.message,
                icon: 'error',
                timer: 1500,
            })
        }
    }

    const handleDeleteConfirmation = (statusId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This order status will be permanently deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteOrderStatus(statusId)
            }
        })
    }

    const deleteCity = async (tagId: any) => {
        try {
            const id_select = typeof tagId === 'string' ? [tagId] : tagId
            const response = await fetch(`${BASE_API}/api/petname/bulk`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ids: id_select }),
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to delete pet name(s)')
            }
            console.log("", loading);


            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Pet name(s) deleted successfully',
                    icon: 'success',
                    confirmButtonText: 'OK',
                })
                // await getOrderStatus()
            }
        } catch (error: any) {
            console.error('Error deleting pet name(s):', error)
            Swal.fire({
                title: 'Oops!',
                text: error.message,
                icon: 'error',
            })
        }
    }


    const handleDeleteSelected = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `All the ${selectedRows.length} selected tags will be deleted!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteCity(selectedRows)
            }
        })
    }

    useEffect(() => {
        getOrderStatuses()
    }, [])
    return (
        <>
            <PageBreadcrumb title="Order Status" subName="Settings" allowNavigateBack={true}/>
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Order Status Management</h4>
                            <p className="text-muted mb-0">
                                Add and Manage your all Order Status here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
                            <Button
                                style={{ border: 'none' }}
                                variant="success"
                                onClick={toggleModal}>
                                <i className="bi bi-plus"></i> Add New Order Status
                            </Button>
                            {showDeleteButton && (
                                <Button
                                    variant="danger"
                                    className="ms-sm-2 mt-2 mt-sm-0"
                                    onClick={handleDeleteSelected}>
                                    Delete All Selected
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
                        <div className="app-search d-none d-lg-block">
                            <form>
                                <div
                                    className="input-group"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0, 0, 0, 0.1)',
                                    }}>
                                    <input
                                        type="search"
                                        className="form-control"
                                        placeholder="Search Status here..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        style={{
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            paddingLeft: '10px',
                                            color: '#333',
                                        }}
                                    />
                                    <span
                                        className="ri-search-line search-icon text-muted"
                                        style={{ marginRight: '10px', color: '#666' }}
                                    />
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
                    <div className="table-responsive-sm">
                        <Table className="table-striped table-centered mb-0">
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedRows.length === filteredRecords.length}
                                        />
                                    </th>
                                    <th>Name</th>
                                    <th>Color</th>
                                    <th>Default Status</th>
                                    <th>Sort Order</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRecords.map((status) => (
                                    <tr key={status._id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(status._id)}
                                                onChange={() => handleSelectRow(status._id)}
                                            />
                                        </td>
                                        <td>{status.name}</td>
                                        <td>
                                            <div
                                                style={{
                                                    backgroundColor: status.color,
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </td>
                                        <td>{status.isDefault ? 'Yes' : 'No'}</td>
                                        <td>{status.sortOrder}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="primary"
                                                    onClick={() => handleEdit(status)}
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    onClick={() => handleDeleteConfirmation(status._id)}
                                                >
                                                    <MdDelete />
                                                </Button>
                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        <nav className="d-flex justify-content-end mt-3">
                            <BootstrapPagination className="pagination-rounded mb-0">
                                <BootstrapPagination.Prev
                                    onClick={() =>
                                        currentPage > 1 && handlePageChange(currentPage - 1)
                                    }
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
                                    onClick={() =>
                                        currentPage < totalPages &&
                                        handlePageChange(currentPage + 1)
                                    }
                                />
                            </BootstrapPagination>
                        </nav>
                    </div>
                </Card.Body>
                {/* Modal for adding a new category */}
                <Modal
                    show={isOpen}
                    onHide={toggleModal}
                    dialogClassName="modal-dialog-centered">
                    <Modal.Header closeButton>
                        <h4 className="modal-title">
                            {isEditMode ? 'Edit Order Status' : 'Add New Order Status'}
                        </h4>
                    </Modal.Header>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Status Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter status name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Color</Form.Label>
                                <Form.Control
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    label="Set as Default Status"
                                    checked={formData.isDefault}
                                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Sort Order</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="light" onClick={handleToggleModal}>
                                Close
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={apiLoading}
                            >
                                {apiLoading
                                    ? (isEditMode ? 'Updating...' : 'Adding...')
                                    : (isEditMode ? 'Update Status' : 'Add Status')}
                            </Button>
                        </Modal.Footer>


                    </Form>
                </Modal>
            </Card>
        </>
    )
}
export default OrderStatus
