import { FormInput, PageBreadcrumb } from '@/components'
import {
    Button,
    Card,
    Form,
    Table,
    Pagination as BootstrapPagination,
    Modal,
} from 'react-bootstrap'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { TableRowSkeleton } from '../other/SimpleLoader'

interface TableRecord {
    _id: number
    content: string
    isActive: boolean
}
const ScrollingMessage = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Products?.Update
    const canDelete = isSuperUser || permissions.Products?.Delete
    const canCreate = isSuperUser || permissions.Products?.Create

    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [showDeleteButton, setShowDeleteButton] = useState(false)
    const [apiLoading, setApiLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [ScrollMsgData, setScrollMsgData] = useState<any[]>([])
    const [EditingScrollMsg, setEditingScrollMsg] = useState<TableRecord | null>(null)
    const [isOpen, toggleModal] = useToggle()



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

    const filteredRecords = ScrollMsgData
        .filter((record) =>
            record.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.content.localeCompare(b.content))
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(ScrollMsgData.map((record) => record._id))
        } else {
            setSelectedRows([])
        }
    }
    const handleSelectRow = (id: number) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        )
    }
    const deleteSelectedServices = async (serviceIds: (string | number)[]) => {
        try {
            const response = await fetch(
                `${BASE_API}/api/scrollingMessages/bulk-delete`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ids: serviceIds.map(id => id.toString())
                    }),
                }
            )

            if (!response.ok) {
                throw new Error('Failed to delete Messages')
            }

            getAllServices()
            Swal.fire({
                title: 'Deleted!',
                text: `${serviceIds.length} Message(s) deleted successfully.`,
                icon: 'success',
                timer: 1500,
            })
            setSelectedRows([])
        } catch (error: any) {
            Swal.fire('Oops!', 'Messages deletion failed.', 'error')
        }
    }
    const handleBulkDelete = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `All the ${selectedRows.length} selected Messages will be deleted!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSelectedServices(selectedRows)
            }
        })
    }
    const handleSingleDelete = (serviceId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This Message will be deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSelectedServices([serviceId])
            }
        })
    }
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )
    const handleToggleModal = () => {
        if (isOpen) {
            reset({ name: '' })
            setEditingScrollMsg(null)
        }
        toggleModal()
    }
    const toggleEditModal = (brand: TableRecord) => {
        setEditingScrollMsg(brand)
        setValue('name', brand.content)
        toggleModal()
    }
    const getAllServices = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/scrollingMessages`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get services')
            }
            const data = await response.json()
            setScrollMsgData(data) // You can rename this state to servicesData
        } catch (error: any) {
            console.error('Error getting services data:', error)
        } finally {
            setLoading(false)
        }
    }
    const handleAddService = async (serviceData: any) => {
        try {
            setApiLoading(true)
            const response = await fetch(`${BASE_API}/api/scrollingMessages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    content: serviceData.content,
                }),
            })
            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to add new Message')
            }

            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: 'ADDED!',
                    text: 'Message added successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    timer: 1500,
                    confirmButtonColor: '#9c5100',
                })
                getAllServices()
                handleToggleModal()
            }
        } catch (error: any) {
            console.error('Error adding Message:', error)
            Swal.fire({
                title: 'Oops!',
                text: error.message,
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setApiLoading(false)
        }
    }
    const handleUpdateService = async (serviceData: any) => {
        try {
            setApiLoading(true)
            const response = await fetch(
                `${BASE_API}/api/scrollingMessages/${EditingScrollMsg?._id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        content: serviceData.content,
                    }),
                }
            )

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to Update Message')
            }

            const data_res = await response.json()
            if (data_res) {
                handleToggleModal()
                await getAllServices()
                Swal.fire({
                    title: 'Updated!',
                    text: 'Message updated successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    timer: 1500,
                    confirmButtonColor: '#9c5100',
                })
                reset()
                setEditingScrollMsg(null)
            }
        } catch (error: any) {
            console.error('Error Updating Message:', error)
            Swal.fire({
                title: 'Oops!',
                text: error.message,
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setApiLoading(false)
        }
    }

    useEffect(() => {
        if (!isOpen) {
            reset()
            setEditingScrollMsg(null)
        }
    }, [isOpen, reset])

    useEffect(() => {
        if (EditingScrollMsg) {
            setValue('content', EditingScrollMsg.content)
        } else {
            reset({ content: '' })
        }
    }, [EditingScrollMsg, setValue, reset])

    useEffect(() => {
        getAllServices()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
        setShowDeleteButton(selectedRows.length > 0)
    }, [itemsPerPage, selectedRows])

    const warehouseHeaders: any[] = [
        { width: '20px', type: 'checkbox' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'actions' }
    ]

    return (
        <>
            <PageBreadcrumb title="Top Scrolling Message" subName="Discounts" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Top Scrolling Message</h4>
                            <p className="text-muted mb-0">
                                Add and Manage your all Top Scrolling Message here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
                            <Button
                                style={{ border: 'none' }}
                                variant="success"
                                disabled={!canCreate}
                                onClick={toggleModal}
                                className="mb-2 mb-sm-0">
                                <i className="bi bi-plus"></i> Add New Message
                            </Button>
                            {showDeleteButton && (
                                <Button
                                    variant="danger"
                                    className="ms-sm-2 mt-2 mt-sm-0"
                                    onClick={handleBulkDelete}>
                                    Delete All Selected ({selectedRows.length})
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
                                        placeholder="Search Message here..."
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
                                            checked={selectedRows.length === ScrollMsgData.length}
                                        />{' '}
                                    </th>
                                    <th>Content</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={warehouseHeaders} rowCount={3} />
                                ) : paginatedRecords.length > 0 ? (
                                    (paginatedRecords || []).map((record, idx) => {
                                        const isSelected = selectedRows.includes(record._id)
                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectRow(record._id)}
                                                    />
                                                </td>
                                                <td>{record.content}</td>
                                                <td>
                                                    <div className="d-flex">
                                                        <Button
                                                            variant="secondary"
                                                            disabled={!canUpdate}
                                                            onClick={() => toggleEditModal(record)}>
                                                            <MdEdit />
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            className="ms-2"
                                                            onClick={() => handleSingleDelete(record._id.toString())}
                                                            disabled={!canDelete}>
                                                            <MdDelete />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="text-center">
                                            No records found
                                        </td>
                                    </tr>
                                )}
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
            </Card>
            <Modal
                show={isOpen}
                onHide={handleToggleModal}
                dialogClassName="modal-dialog-centered">
                <Modal.Header closeButton>
                    <h4 className="modal-title">
                        {EditingScrollMsg ? 'Update Message' : 'Add New Message'}
                    </h4>
                </Modal.Header>
                <Form
                    onSubmit={handleSubmit(
                        EditingScrollMsg ? handleUpdateService : handleAddService
                    )}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <FormInput
                                label="Content"
                                type="text"
                                name="content"
                                containerClass="mb-3"
                                register={register}
                                placeholder="Enter Message here.."
                                errors={errors}
                                control={control}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={handleToggleModal}>
                            Close
                        </Button>
                        <Button
                            variant="soft-success"
                            type="submit"
                            disabled={EditingScrollMsg ? !canUpdate : !canCreate}>
                            {apiLoading
                                ? EditingScrollMsg
                                    ? 'Updating...'
                                    : 'Adding...'
                                : EditingScrollMsg
                                    ? 'Update Message'
                                    : 'Save Message'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    )
}

export default ScrollingMessage
