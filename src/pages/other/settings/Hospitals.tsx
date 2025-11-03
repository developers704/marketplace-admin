import { PageBreadcrumb } from '@/components'
import {
    Button,
    Card,
    Form,
    Table,
    Modal,
    Row,
    Col,
} from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import { Pagination as BootstrapPagination } from 'react-bootstrap'
import { toastService } from '@/common/context/toast.service'
import { TableRowSkeleton } from '../SimpleLoader'

interface StoreRecord {
    _id: string
    name: string
    email: string
    description: string
    contactNumber: string
    landlineNumber: string
    location: {
        _id: string
        name: string
        createdAt: string
        updatedAt: string
        __v: number
    }
    createdAt: string
    updatedAt: string
    __v: number
}
interface ExpandedDescriptions {
    [key: string]: boolean;
}

const Hospitals = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Products?.Update
    const canDelete = isSuperUser || permissions.Products?.Delete
    const canCreate = isSuperUser || permissions.Products?.Create

    const [expandedDescriptions, setExpandedDescriptions] = useState<ExpandedDescriptions>({});
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [sortedAsc, setSortedAsc] = useState(true)
    const [showDeleteButton, setShowDeleteButton] = useState(false)
    const [apiLoading, setApiLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [storeData, setStoreData] = useState<StoreRecord[]>([])
    const [editingStore, setEditingStore] = useState<StoreRecord | null>(null)
    const [locationData, setLocationData] = useState<any[]>([])
    const [isOpen, toggleModal] = useToggle()

    // ************* basics *************


    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user
    const {
        handleSubmit,
        register,
        reset,
        setValue,
    } = useForm()

    // *************************** handle functions *************************

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
        console.log(setSortedAsc)
    }
    const handleDeleteConfirmation = (storeId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This Hospitals will be deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: "#9c5100",
            cancelButtonColor: '#d33',
            confirmButtonText: 'Remove!'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteStore([storeId]) // Pass as array for consistent API call
            }
        })
    }

    const handleBulkDelete = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `All the ${selectedRows.length} selected items will be deleted!`,
            icon: 'warning',
            showCancelButton: true,
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!',
            confirmButtonColor: "#9c5100",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteStore(selectedRows)
            }
        })
    }

    const handletoggleModal = () => {
        if (isOpen) {
            reset()
            setEditingStore(null)
        }
        toggleModal()
    }

    const filteredRecords = storeData
        ?.filter(record =>
            record?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        ?.sort((a, b) =>
            sortedAsc ? a?.name?.localeCompare(b?.name) : b?.name?.localeCompare(a?.name)
        )

    // const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const paginatedRecords = filteredRecords?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }
    const truncateText = (text: string, limit: number = 50) => {
        if (!text) return '';
        return text.length > limit ? `${text.substring(0, limit)}...` : text;
    }

    const toggleDescription = (id: string) => {
        setExpandedDescriptions(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRows(event.target.checked ? storeData.map(store => store._id) : [])
    }

    const handleSelectRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }
    const toggleEditModal = (store: StoreRecord) => {
        setEditingStore(store)
        setValue('name', store?.name)
        setValue('email', store?.email)
        setValue('description', store?.description)
        setValue('contactNumber', store?.contactNumber)
        setValue('landlineNumber', store?.landlineNumber)
        setValue('location', store?.location?._id)  // Set location ID for the dropdown
        toggleModal()
    }

    // ********************** API CALLS **********************
    const getStores = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/hospitals`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message)
            }

            const data = await response.json()
            setStoreData(data)
        } catch (error: any) {
            toastService.error(error.message || 'Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }

    const handleAddStore = async (formData: any) => {
        setApiLoading(true)
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                description: formData.description,
                contactNumber: formData.contactNumber,
                landlineNumber: formData.landlineNumber,
                ...(formData.location && { location: formData.location })
            }

            const response = await fetch(`${BASE_API}/api/hospitals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to Add Section')
            }

            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: 'ADDED!',
                    text: 'Hospitals added successfully!',
                    icon: 'success',
                    confirmButtonColor: "#9c5100",
                })
                getStores()
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

    const handleUpdateStore = async (formData: any) => {
        setApiLoading(true)
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                description: formData.description,
                contactNumber: formData.contactNumber,
                landlineNumber: formData.landlineNumber,
                ...(formData.location && { location: formData.location })
            }

            const response = await fetch(
                `${BASE_API}/api/hospitals/${editingStore?._id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload)
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message)
            }

            getStores()
            handletoggleModal()
            Swal.fire({
                title: 'Updated!',
                text: 'Hospitals updated successfully!',
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
        } catch (error: any) {
            Swal.fire({
                title: 'Error',
                text: error.message || 'Failed to update Hospitals',
                icon: 'error',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
        } finally {
            setApiLoading(false)
        }
    }


    const deleteStore = async (storeIds: string[]) => {
        try {
            const response = await fetch(
                `${BASE_API}/api/hospitals/bulk-delete`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ ids: storeIds })
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message)
            }

            getStores()
            setSelectedRows([])

            Swal.fire({
                title: 'Deleted!',
                text: storeIds.length > 1
                    ? `${storeIds.length} Hospitals deleted successfully`
                    : 'Hospitals deleted successfully',
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
        } catch (error: any) {
            Swal.fire({
                title: 'Oops',
                text: error.message,
                icon: 'error',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
        }
    }

    const getAllLocation = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/locations`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to fetch locations')
            }

            const data = await response.json()
            setLocationData(data)
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


    useEffect(() => {
        getStores()
        getAllLocation()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
        setShowDeleteButton(selectedRows.length > 0)
    }, [itemsPerPage, selectedRows])

    const storeHeaders: any[] = [
        { width: '20px', type: 'checkbox' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '80px', type: 'number' },
        { width: '100px', type: 'date' },
        { width: '100px', type: 'date' },
        { width: '100px', type: 'actions' },
        { width: '100px', type: 'actions' }
    ]


    return (
        <>
            <PageBreadcrumb title="Hospitals" subName="Settings" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Hospitals</h4>
                            <p className="text-muted mb-0">
                                Add and Manage all your Hospitals here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <Button
                                disabled={!canCreate}
                                variant="success"
                                onClick={toggleModal}
                                className="mb-2 mb-sm-0 ">
                                <i className="bi bi-plus"></i> Add New Hospitals
                            </Button>
                            {showDeleteButton && (
                                <Button
                                    variant="danger"
                                    className="ms-sm-2 mt-2 mt-sm-0"
                                    onClick={handleBulkDelete}>
                                    Delete All Selected
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
                        <div className="app-search d-none d-lg-block">
                            <form>
                                <div className="input-group" style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(0, 0, 0, 0.1)'
                                }}>
                                    <input
                                        type="search"
                                        className="form-control"
                                        placeholder="Search here..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        style={{
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            paddingLeft: '10px',
                                            color: '#333'
                                        }}
                                    />
                                    <span className="ri-search-line search-icon text-muted"
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
                    <Table responsive className="table-centered">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={storeData.length > 0 && selectedRows?.length === storeData?.length}
                                    />
                                </th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Email</th>
                                <th>Contact Number</th>
                                <th>Landline Number</th>
                                <th>Location</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableRowSkeleton headers={storeHeaders} rowCount={3} />
                            ) : paginatedRecords?.length > 0 ?
                                (
                                    paginatedRecords?.map((store) => (
                                        <tr key={store?._id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.includes(store?._id)}
                                                    onChange={() => handleSelectRow(store?._id)}
                                                />
                                            </td>
                                            <td>{store?.name}</td>
                                            <td
                                                onClick={() => toggleDescription(store._id)}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to expand/collapse"
                                            >
                                                {expandedDescriptions[store._id]
                                                    ? store.description
                                                    : truncateText(store.description)}
                                            </td>
                                            <td>{store?.email}</td>
                                            <td>{store?.contactNumber}</td>
                                            <td>{store?.landlineNumber}</td>
                                            <td>{store?.location?.name}</td>
                                            <td>
                                                <Button
                                                    variant="secondary"
                                                    disabled={!canUpdate}
                                                    onClick={() => toggleEditModal(store)}
                                                    className="me-2">
                                                    <MdEdit />
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    disabled={!canDelete}
                                                    onClick={() => handleDeleteConfirmation(store?._id)}>
                                                    <MdDelete />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4">
                                            <div className="d-flex flex-column align-items-center">
                                                <i className="ri-file-list-3-line fs-2 text-muted mb-2"></i>
                                                <h5 className="text-muted mb-1">No Records Found</h5>
                                                <p className="text-muted mb-0">Add some Data to see them listed here.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )

                            }
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
                </Card.Body>
            </Card>

            <Modal show={isOpen} onHide={handletoggleModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingStore ? 'Edit Hospitals' : 'Add New Hospitals'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit(editingStore ? handleUpdateStore : handleAddStore)}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter name"
                                        {...register('name')}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter email"
                                        {...register('email')}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Enter description"
                                {...register('description')}
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Contact Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter contact number"
                                        {...register('contactNumber')}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Landline Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter landline number"
                                        {...register('landlineNumber')}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Location</Form.Label>
                            <Form.Select {...register('location')}>
                                <option value="">Select Location</option>
                                {locationData.map((location) => (
                                    <option key={location._id} value={location._id}>
                                        {location.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
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
export default Hospitals
