import { FormInput, PageBreadcrumb } from '@/components'
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
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import { Pagination as BootstrapPagination } from 'react-bootstrap'
import { TableRowSkeleton } from '../other/SimpleLoader'


interface StoreRecord {
    _id: string
    title: string
    description: string
    image: string
    sortOrder: string
}

const Categories = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Products?.Update
    const canDelete = isSuperUser || permissions.Products?.Delete
    const canCreate = isSuperUser || permissions.Products?.Create

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
    const [isOpen, toggleModal] = useToggle()
    const [selectedImage, setSelectedImage] = useState<File | null>(null)

    // ************* basics *************


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

    // *************************** handle functions *************************

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
        console.log(setSortedAsc)
    }
    const handleDeleteConfirmation = (storeId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This Feature will be deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
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
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!'
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
            record?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        ?.sort((a, b) =>
            sortedAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
        )

    // const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

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
        setValue('title', store.title)
        setValue('description', store.description)
        setValue('sortOrder', store.sortOrder)
        toggleModal()
    }
    // ********************** API CALLS **********************
    const getStores = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/features`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch stores')
            }

            const data = await response.json()
            setStoreData(data)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStore = async (storeData: any) => {
        setApiLoading(true)
        try {
            const formData = new FormData()
            formData.append('title', storeData.title)
            formData.append('description', storeData.description)
            formData.append('sortOrder', storeData.sortOrder)
            if (selectedImage) {
                formData.append('image', selectedImage)
            }

            const response = await fetch(
                `${BASE_API}/api/features/${editingStore?._id}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData
                }
            )

            if (!response.ok) {
                throw new Error('Failed to update store')
            }

            getStores()
            handletoggleModal()
            Swal.fire({
                title: 'Updated!',
                text: 'Feature updated successfully!',
                icon: 'success',
                timer: 1500,
            })
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to update store',
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setApiLoading(false)
        }
    }

    const deleteStore = async (storeIds: string[]) => {
        try {
            const response = await fetch(
                `${BASE_API}/api/features/bulk-delete`,
                {
                    method: 'POST',
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
                    ? `${storeIds.length} Features deleted successfully`
                    : 'Store deleted successfully',
                icon: 'success',
                timer: 1500,
            })
        } catch (error: any) {
            Swal.fire({
                title: 'Oops',
                text: error.message,
                icon: 'error',
                timer: 1500,
            })
        }
    }

    const handleAddStore = async (storeData: any) => {
        setApiLoading(true)
        try {
            const formData = new FormData()
            formData.append('title', storeData.title)
            formData.append('description', storeData.description)
            formData.append('sortOrder', storeData.sortOrder)

            if (selectedImage) {
                formData.append('image', selectedImage)
            }
            const response = await fetch(`${BASE_API}/api/features`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to Add Store')
            }

            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: 'ADDED!',
                    text: 'Features added successfully!',
                    icon: 'success',
                    timer: 1500,
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


    useEffect(() => {
        getStores()

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
        { width: '100px', type: 'actions' },
        { width: '100px', type: 'actions' }
    ]


    return (
        <>
            <PageBreadcrumb title="Feature Bar Content" subName="Settings" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Feature Bar Content</h4>
                            <p className="text-muted mb-0">
                                Add and Manage all your Feature Bar Content here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <Button
                                disabled={!canCreate}
                                variant="success"
                                onClick={toggleModal}
                                className="mb-2 mb-sm-0">
                                <i className="bi bi-plus"></i> Add New Feature
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
                                        placeholder="Search Feature here..."
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
                                        checked={selectedRows.length === storeData.length}
                                    />
                                </th>
                                <th>Image</th>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Sort Order</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableRowSkeleton headers={storeHeaders} rowCount={3} />
                            ) : (
                                paginatedRecords.map((store) => (
                                    <tr key={store._id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(store._id)}
                                                onChange={() => handleSelectRow(store._id)}
                                            />
                                        </td>
                                        <td>
                                            {store?.image ? (
                                                <img
                                                    src={`${BASE_API}/${store?.image}`}
                                                    alt={store?.title}
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                                    <i className="ri-image-line me-1"></i>
                                                    No Image
                                                </div>
                                            )}
                                        </td>
                                        <td>{store.title}</td>
                                        <td>{store.description}</td>
                                        <th>{store?.sortOrder}</th>
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
                                                onClick={() => handleDeleteConfirmation(store._id)}>
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

            <Modal show={isOpen} onHide={handletoggleModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingStore ? 'Edit Feature Bar Content' : 'Add New Feature Bar Content'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit(editingStore ? handleUpdateStore : handleAddStore)}>
                    <Modal.Body>
                        <Row className="mb-3">
                            <Col md={6}>
                                <FormInput
                                    label="Title *"
                                    type="text"
                                    name="title"
                                    placeholder="Enter Title here..."
                                    register={register}
                                    errors={errors}
                                    control={control}
                                    required
                                />
                            </Col>
                            <Col md={6}>
                                <FormInput
                                    label="Sort Order"
                                    type="number"
                                    name="sortOrder"
                                    placeholder="Enter sort Order here..."
                                    register={register}
                                    errors={errors}
                                    control={control}
                                />
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col>
                                <FormInput
                                    label="Description"
                                    type="textarea"
                                    name="description"
                                    placeholder="Enter description..."
                                    register={register}
                                    errors={errors}
                                    control={control}
                                />
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Feature Image</Form.Label>
                            <div className="mb-2">
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    File Size: Upload images up to 5 MB.
                                </p>
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).
                                </p>
                            </div>
                            <SingleFileUploader
                                icon="ri-upload-cloud-2-line"
                                text="Drop file here or click to upload store image."
                                onFileUpload={(file: File) => setSelectedImage(file)}
                            />
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
export default Categories
