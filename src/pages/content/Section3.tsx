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
import { TableRowSkeleton } from '../other/SimpleLoader'
import { toastService } from '@/common/context/toast.service'
import Select from 'react-select'
import { Controller } from 'react-hook-form'


interface BrandRecord {
    _id: number
    name: string
    logo?: string
}


const Section3 = () => {
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
    const [storeData, setStoreData] = useState<any[]>([])
    const [editingStore, setEditingStore] = useState<any | null>(null)
    const [isOpen, toggleModal] = useToggle()
    const [brands, setBrands] = useState<BrandRecord[]>([])
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
            text: 'This Section 3 will be deleted!',
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
            record?.brand.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        ?.sort((a, b) =>
            sortedAsc ? a?.brand.name?.localeCompare(b?.brand.name) : b?.brand.name?.localeCompare(a?.brand.name)
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

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRows(event.target.checked ? storeData.map(store => store._id) : [])
    }

    const handleSelectRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }
    const toggleEditModal = (store: any) => {
        setEditingStore(store)
        setValue('text', store.text)
        setValue('brand', {
            value: store.brand._id,
            label: store.brand.name
        })
        toggleModal()
    }

    // ********************** API CALLS **********************
    const getStores = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/exclusive-offers`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
            const responseData = await response.json()
            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || 'Failed to fetch data')
            }

            setStoreData(responseData)
        } catch (error: any) {
            toastService.error(error.message || 'Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }
    const getBrands = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/brands`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch brands')
            }
            setBrands(data)
        } catch (error: any) {
            toastService.error('Failed to fetch brands')
        }
    }
    const handleUpdateStore = async (storeData: any) => {
        setApiLoading(true)
        try {
            const response = await fetch(
                `${BASE_API}/api/exclusive-offers/${editingStore?._id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        brand: storeData.brand.value,
                        text: storeData.text
                    })
                }
            )

            const responseData = await response.json()
            if (!response.ok) {
                throw new Error(responseData.message || responseData.error)
            }

            getStores()
            handletoggleModal()
            Swal.fire({
                title: 'Updated!',
                text: 'Section 3 updated successfully!',
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
        } catch (error: any) {
            toastService.error(error.message || 'Failed to update store')
        } finally {
            setApiLoading(false)
        }
    }

    const deleteStore = async (storeIds: string[]) => {
        try {
            const response = await fetch(
                `${BASE_API}/api/exclusive-offers/bulk-delete`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ ids: storeIds })
                }
            )

            const errorData = await response.json()
            if (!response.ok) {
                throw new Error(errorData.message || errorData.error)
            }

            getStores()
            setSelectedRows([])

            Swal.fire({
                title: 'Deleted!',
                text: storeIds.length > 1
                    ? `${storeIds.length} Section 3 deleted successfully`
                    : 'Section 3 deleted successfully',
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
        } catch (error: any) {
            toastService.error(error.message || 'Failed to delete store')
        }
    }
    const handleAddStore = async (formData: any) => {
        setApiLoading(true)
        try {
            const response = await fetch(`${BASE_API}/api/exclusive-offers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    brand: formData.brand.value,
                    text: formData.text
                })
            })
            const responseData = await response.json()

            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || 'Failed to add store')
            }

            getStores()
            handletoggleModal()
            Swal.fire({
                title: 'Success!',
                text: 'Section 3 added successfully!',
                icon: 'success',
                confirmButtonColor: "#9c5100",
            })
        } catch (error: any) {
            toastService.error(error.message || 'Failed to add store')
        } finally {
            setApiLoading(false)
        }
    }

    useEffect(() => {
        getStores()
        getBrands()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
        setShowDeleteButton(selectedRows.length > 0)
    }, [itemsPerPage, selectedRows])

    const storeHeaders: any[] = [
        { width: '20px', type: 'checkbox' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'actions' }
    ]
    return (
        <>
            <PageBreadcrumb title="Section 3" subName="Settings" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Section 3 (Landing Page)</h4>
                            <p className="text-muted mb-0">
                                Add and Manage all your Section 3 here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <Button
                                disabled={!canCreate}
                                variant="success"
                                onClick={toggleModal}
                                className="mb-2 mb-sm-0 ">
                                <i className="bi bi-plus"></i> Add New Section 3
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
                                <th>Brand Name</th>
                                <th>Image</th>
                                <th>Text</th>
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
                                            <td>{store.brand.name}</td>
                                            <td>

                                                {store.brand.logo ? (
                                                    <img
                                                        src={`${BASE_API}/${store.brand.logo}`}
                                                        alt={store.text}
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
                                            <td>{store?.text}</td>
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
                        {editingStore ? 'Edit Section 3' : 'Add New Section 3'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit(editingStore ? handleUpdateStore : handleAddStore)}>
                    <Modal.Body>
                        <Row className="mb-3">
                            <Col>
                                <Form.Group>
                                    <Form.Label>Select Brand <span className="text-danger">*</span></Form.Label>
                                    <Controller
                                        name="brand"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Select
                                                {...field}
                                                options={brands.map(brand => ({
                                                    value: brand._id,
                                                    label: brand.name
                                                }))}
                                                placeholder="Choose a brand..."
                                                className={errors.brand ? 'is-invalid' : ''}
                                                styles={{
                                                    // @ts-ignore
                                                    control: (base) => ({
                                                        ...base,
                                                        borderColor: errors.brand ? '#dc3545' : base.borderColor
                                                    })
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.brand && (
                                        <div className="invalid-feedback d-block">
                                            Please select a brand
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col>
                                <Form.Group>
                                    <Form.Label>Offer Text <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Enter offer text..."
                                        {...register("text", { required: true })}
                                        isInvalid={!!errors.text}
                                    />
                                    {errors.text && (
                                        <Form.Control.Feedback type="invalid">
                                            Offer text is required
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
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
                            disabled={apiLoading}
                        >
                            {apiLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    )
}
export default Section3
