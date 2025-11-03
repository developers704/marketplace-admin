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
import { TableRowSkeleton } from '@/pages/other/SimpleLoader'

interface TableRecord {
    _id: number
    name: string
}

const ServiceCategory = () => {
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
    const [specialitiesData, setSpecialitiesData] = useState<any[]>([])
    const [editingSpeciality, setEditingSpeciality] = useState<TableRecord | null>(null)
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

    const filteredRecords = specialitiesData
        ?.filter((record) =>
            record?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a?.name?.localeCompare(b?.name))

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(specialitiesData?.map((record) => record?._id))
        } else {
            setSelectedRows([])
        }
    }

    const handleSelectRow = (id: number) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        )
    }


    const handleBulkDelete = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `All the ${selectedRows.length} selected specialities will be deleted!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: "#9c5100",
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSelectedSpecialities(selectedRows)
            }
        })
    }

    const handleSingleDelete = (specialityId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This speciality will be deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: "#9c5100",
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSelectedSpecialities([specialityId])
            }
        })
    }

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const totalPages = Math.ceil(filteredRecords?.length / itemsPerPage)
    const paginatedRecords = filteredRecords?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleToggleModal = () => {
        if (isOpen) {
            reset({ name: '' })
            setEditingSpeciality(null)
        }
        toggleModal()
    }

    const toggleEditModal = (speciality: TableRecord) => {
        setEditingSpeciality(speciality)
        setValue('name', speciality.name)
        toggleModal()
    }

    // ************************ apis call ***********************
    const getAllSpecialities = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/specialty`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get specialities')
            }
            const data = await response.json()
            setSpecialitiesData(data)
        } catch (error: any) {
            console.error('Error getting specialities data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddSpeciality = async (specialityData: any) => {
        try {
            setApiLoading(true)
            const response = await fetch(`${BASE_API}/api/specialty`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: specialityData.name }),
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to add new Speciality')
            }

            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: 'ADDED!',
                    text: 'Speciality added successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    timer: 1500,
                    confirmButtonColor: "#9c5100",
                })
                getAllSpecialities()
                handleToggleModal()
            }
        } catch (error: any) {
            console.error('Error adding speciality:', error)
            Swal.fire({
                title: 'Oops!',
                text: error.message,
                icon: 'error',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
        } finally {
            setApiLoading(false)
        }
    }

    const handleUpdateSpeciality = async (specialityData: any) => {
        try {
            setApiLoading(true)
            const response = await fetch(
                `${BASE_API}/api/specialty/${editingSpeciality?._id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name: specialityData.name }),
                }
            )

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to Update Speciality')
            }

            const data_res = await response.json()
            if (data_res) {
                handleToggleModal()
                await getAllSpecialities()
                Swal.fire({
                    title: 'Updated!',
                    text: 'Speciality updated successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    timer: 1500,
                    confirmButtonColor: "#9c5100",
                })
                reset()
                setEditingSpeciality(null)
            }
        } catch (error: any) {
            console.error('Error Updating Speciality:', error)
            Swal.fire({
                title: 'Oops!',
                text: error.message,
                icon: 'error',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
        } finally {
            setApiLoading(false)
        }
    }
    const deleteSelectedSpecialities = async (specialityIds: (string | number)[]) => {
        try {
            const response = await fetch(
                `${BASE_API}/api/specialty/bulk-delete`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ids: specialityIds.map(id => id.toString())
                    }),
                }
            )

            if (!response.ok) {
                throw new Error('Failed to delete specialities')
            }

            getAllSpecialities()
            Swal.fire({
                title: 'Deleted!',
                text: `${specialityIds.length} speciality(s) deleted successfully.`,
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
            setSelectedRows([])
        } catch (error: any) {
            Swal.fire('Oops!', 'Specialities deletion failed.', 'error')
        }
    }


    // ************************ renders*******************************
    useEffect(() => {
        if (!isOpen) {
            reset()
            setEditingSpeciality(null)
        }
    }, [isOpen, reset])

    useEffect(() => {
        if (editingSpeciality) {
            setValue('name', editingSpeciality.name)
        } else {
            reset({ name: '' })
        }
    }, [editingSpeciality, setValue, reset])

    useEffect(() => {
        getAllSpecialities()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
        setShowDeleteButton(selectedRows.length > 0)
    }, [itemsPerPage, selectedRows])

    const storeHeaders: any[] = [
        { width: '20px', type: 'checkbox' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'actions' }
    ]

    return (
        <>
            <PageBreadcrumb title="Doctor Specialities" subName="Settings" allowNavigateBack={true} />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Doctor Specialities</h4>
                            <p className="text-muted mb-0">
                                Add and Manage Doctor Specialities here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
                            <Button
                                style={{ border: 'none' }}
                                variant="success"
                                disabled={!canCreate}
                                onClick={toggleModal}
                                className="mb-2 mb-sm-0">
                                <i className="bi bi-plus"></i> Add New Speciality
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
                                        placeholder="Search Speciality here..."
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
                                            checked={selectedRows.length > 0 && selectedRows.length === specialitiesData.length}
                                        />
                                    </th>
                                    <th>
                                        <span style={{ cursor: 'pointer' }}>
                                            Name
                                        </span>
                                    </th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={storeHeaders} rowCount={3} />
                                ) :
                                    paginatedRecords?.length > 0 ? (
                                        paginatedRecords?.map((record, idx) => {
                                            const isSelected = selectedRows.includes(record?._id)
                                            return (
                                                <tr key={idx}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectRow(record?._id)}
                                                        />
                                                    </td>
                                                    <td>{record?.name}</td>
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
                                                                onClick={() => handleSingleDelete(record?._id?.toString())}
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
                                            <td colSpan={4} className="text-center">
                                                No records found
                                            </td>
                                        </tr>
                                    )}
                            </tbody>
                        </Table>
                        <nav className="d-flex justify-content-end mt-3">
                            <BootstrapPagination className="pagination-rounded mb-0">
                                <BootstrapPagination.Prev
                                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                />

                                {/* Show first page if not in first set */}
                                {currentPage > 2 && (
                                    <>
                                        <BootstrapPagination.Item onClick={() => handlePageChange(1)}>
                                            1
                                        </BootstrapPagination.Item>
                                        {currentPage > 3 && <BootstrapPagination.Ellipsis />}
                                    </>
                                )}

                                {/* Show 3 pages around current page */}
                                {Array.from({ length: totalPages }, (_, index) => {
                                    const pageNumber = index + 1;
                                    if (
                                        pageNumber === currentPage ||
                                        pageNumber === currentPage - 1 ||
                                        pageNumber === currentPage + 1
                                    ) {
                                        return (
                                            <BootstrapPagination.Item
                                                key={pageNumber}
                                                active={pageNumber === currentPage}
                                                onClick={() => handlePageChange(pageNumber)}
                                            >
                                                {pageNumber}
                                            </BootstrapPagination.Item>
                                        );
                                    }
                                    return null;
                                })}

                                {/* Show last page if not in last set */}
                                {currentPage < totalPages - 1 && (
                                    <>
                                        {currentPage < totalPages - 2 && <BootstrapPagination.Ellipsis />}
                                        <BootstrapPagination.Item onClick={() => handlePageChange(totalPages)}>
                                            {totalPages}
                                        </BootstrapPagination.Item>
                                    </>
                                )}

                                <BootstrapPagination.Next
                                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
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
                        {editingSpeciality ? 'Update Speciality' : 'Add New Speciality'}
                    </h4>
                </Modal.Header>
                <Form
                    onSubmit={handleSubmit(
                        editingSpeciality ? handleUpdateSpeciality : handleAddSpeciality
                    )}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <FormInput
                                label="Name"
                                type="text"
                                name="name"
                                containerClass="mb-3"
                                register={register}
                                placeholder="Enter Speciality Name here.."
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
                            disabled={editingSpeciality ? !canUpdate : !canCreate}>
                            {apiLoading
                                ? editingSpeciality
                                    ? 'Updating...'
                                    : 'Adding...'
                                : editingSpeciality
                                    ? 'Update Speciality'
                                    : 'Save Speciality'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    )
}

export default ServiceCategory

