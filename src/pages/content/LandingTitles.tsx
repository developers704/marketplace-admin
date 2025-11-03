import { FormInput, PageBreadcrumb } from '@/components'
import {
    Button,
    Card,
    Form,
    Table,
    Modal,
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



interface StoreRecord {
    _id: string
    name: string
    sortOrder: string
    isHide: boolean
    text: string
}


const LandingTitles = () => {
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
            text: 'This Title will be deleted!',
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
            confirmButtonColor: "#9c5100",
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
            reset({
                name: '',
                sortOrder: '',
                isHide: false,
                text: '',
            })
            setEditingStore(null)
        }
        toggleModal()
    }

    const filteredRecords = storeData
        ?.filter(record =>
            record?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record?.sortOrder?.toString().includes(searchTerm)
        )
        ?.sort((a, b) =>
            sortedAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
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
        setValue('name', store.name)
        setValue('sortOrder', store.sortOrder)
        setValue('isHide', Boolean(store.isHide))
        setValue('text', store.text)
        toggleModal()
    }
    // ********************** API CALLS **********************
    const getStores = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/website-titles`, {
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

            const response = await fetch(
                `${BASE_API}/api/website-titles/${editingStore?._id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: storeData.name,
                        sortOrder: Number(storeData.sortOrder),
                        isHide: Boolean(storeData.isHide),
                        text: storeData.text,
                    })
                }
            )
            const updatedData = await response.json()
            if (!response.ok) {
                throw new Error('Failed to update store')
            }


            handletoggleModal()
            if (updatedData) {

                Swal.fire({
                    title: 'Updated!',
                    text: 'Title updated successfully!',
                    icon: 'success',
                    confirmButtonColor: "#9c5100",
                    timer: 1500,
                })
                await getStores()
            }

        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to update store',
                icon: 'error',
                confirmButtonColor: "#9c5100",
                timer: 1500,
            })
        } finally {
            setApiLoading(false)
        }
    }

    const deleteStore = async (storeIds: string[]) => {
        try {
            const response = await fetch(
                `${BASE_API}/api/website-titles/bulk-delete`,
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
                    ? `${storeIds.length} Title deleted successfully`
                    : 'Store deleted successfully',
                icon: 'success',
                confirmButtonColor: "#9c5100",
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

            const response = await fetch(`${BASE_API}/api/website-titles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: storeData.name,
                    sortOrder: storeData?.sortOrder,
                    isHide: Boolean(storeData.isHide),
                    text: storeData.text,
                })
            })
            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to Add Store')
            }

            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: 'ADDED!',
                    text: 'New Title added successfully!',
                    icon: 'success',
                    confirmButtonColor: "#9c5100",
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
        { width: '100px', type: 'text' },
        { width: '100px', type: 'actions' }
    ]


    return (
        <>
            <PageBreadcrumb title="Feature Title Content" subName="Settings" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Feature Titles Content</h4>
                            <p className="text-muted mb-0">
                                Add and Manage all your Feature title Content here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <Button
                                disabled={!canCreate}
                                variant="success"
                                onClick={toggleModal}
                                className="mb-2 mb-sm-0">
                                <i className="bi bi-plus"></i> Add New Title
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
                                        checked={selectedRows?.length === storeData?.length}
                                    />
                                </th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Sort Order</th>
                                <th>Hide Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableRowSkeleton headers={storeHeaders} rowCount={3} />
                            ) : (
                                paginatedRecords?.map((store) => (
                                    <tr key={store._id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(store?._id)}
                                                onChange={() => handleSelectRow(store?._id)}
                                            />
                                        </td>

                                        <td>{store?.name}</td>
                                        <td>{store?.text}</td>
                                        <td>{store?.sortOrder}</td>
                                        <td>{store?.isHide ? 'Hidden' : 'Visible'}</td>
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

            <Modal show={isOpen} onHide={handletoggleModal} >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingStore ? 'Edit Feature Title Content' : 'Add New Feature Title Content'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit(editingStore ? handleUpdateStore : handleAddStore)}>
                    <Modal.Body>
                        <Col >
                            <Form.Group className="mb-3">
                                <Form.Label>Name <span style={{ color: 'red' }}>*</span></Form.Label>
                                <FormInput
                                    type="text"
                                    name="name"
                                    placeholder="Enter Name here..."
                                    register={register}
                                    errors={errors}
                                    control={control}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col className='mt-3'>
                            <FormInput
                                label="Description"
                                type="text"
                                name="text"
                                placeholder="Enter description here..."
                                register={register}
                                errors={errors}
                                control={control}
                            />
                        </Col>
                        <Col className='mt-3'>

                            <Form.Group className="mb-3">
                                <Form.Label>SortOrder <span style={{ color: 'red' }}>*</span></Form.Label>
                                <FormInput
                                    type="number"
                                    name="sortOrder"
                                    placeholder="Enter sort Order here..."
                                    register={register}
                                    errors={errors}
                                    control={control}
                                />
                            </Form.Group>
                        </Col>
                        <Col className='mt-3'>
                            <Form.Check
                                type="checkbox"
                                id="isHide"
                                label="Hide Status"
                                {...register('isHide')}
                                defaultChecked={editingStore?.isHide}
                            />
                        </Col>

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
export default LandingTitles
