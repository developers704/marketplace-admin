import { PageBreadcrumb } from '@/components'
import {
    Button,
    Card,
    Form,
    Table,
    Pagination as BootstrapPagination,
} from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import { SkeletonHeader, TableRowSkeleton } from '../SimpleLoader'
import { toastService } from '@/common/context/toast.service'
import DepartmentModal from '@/components/modals/DepartmentModal'

interface WarehouseRecord {
    _id: number
    name: string
    description: string
}

const Departments = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Products?.Update
    const canDelete = isSuperUser || permissions.Products?.Delete
    const canCreate = isSuperUser || permissions.Products?.Create

    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [sortedAsc, setSortedAsc] = useState(true)
    const [showDeleteButton, setShowDeleteButton] = useState(false)
    const [loading, setLoading] = useState(false)
    const [WarehouseData, setWarehouseData] = useState<WarehouseRecord[]>([])
    const [editingWarehouse, seteditingWarehouse] = useState<WarehouseRecord | null>(
        null
    )
    const [expandedMessages, setExpandedMessages] = useState<any>({});



    // ************* basics *************
    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user
    const {
        reset,
        setValue,
    } = useForm()

    // *************************** handle functions *************************
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(WarehouseData.map((record) => record._id))
        } else {
            setSelectedRows([])
        }
    }

    const handleSelectRow = (id: number) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        )
    }
    const truncateText = (text: any, limit: number = 50) => {
        if (!text) return '';
        return text.length > limit ? `${text.substring(0, limit)}...` : text;
    }

    const toggleMessage = (messageId: string) => {
        setExpandedMessages((prev: any) => ({
            ...prev,
            [messageId]: !prev[messageId]
        }));
    };
    const handleDeleteConfirmation = (userId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This Items will be deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Remove!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSelectedWarehouses(userId)
                console.log('delete user success')
            }
        })
    }
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
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
                deleteSelectedWarehouses()
            }
        })
    }
    const toggleEditModal = (warehouse: WarehouseRecord) => {
        seteditingWarehouse(warehouse)
        setValue('name', warehouse.name)
        setValue('description', warehouse.description || '')
        toggleModal()
    }
    const handleSort = () => {
        setSortedAsc(!sortedAsc)
    }

    const filteredRecords = WarehouseData
        .filter((record) =>
            record.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) =>
            sortedAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        )

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )
    const [isOpen, toggleModal] = useToggle() // Using toggle for modal state
    const handletoggleModal = () => {
        if (isOpen) {
            reset({ name: '', description: '' })
            seteditingWarehouse(null)
        }
        toggleModal()
    }


    // ********************** API CALLS **********************
  
    const getWarehouses = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/departments`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get warehouses')
            }

            const data_res: WarehouseRecord[] = await response.json()
            if (data_res) {
                setWarehouseData(data_res)
            }
        } catch (error: any) {
            console.error('Error fetching warehouses:', error)
        } finally {
            setLoading(false)
        }
    }



    const deleteSelectedWarehouses = async (id?: any) => {
        try {
            const idss = id ? [id] : selectedRows
            const response = await fetch(
                `${BASE_API}/api/departments/bulk-delete`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ ids: idss }),
                }
            )

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to delete warehouses')
            }

            getWarehouses()
            setSelectedRows([])
            Swal.fire({
                title: 'Deleted!',
                text: `Departments has been deleted successfully.`,
                icon: 'success',
                timer: 1500,
            })
        } catch (error: any) {
            toastService.error(error.message || 'Failed to delete Departments')
        }
    }



    useEffect(() => {
        if (!isOpen) {
            reset()
            seteditingWarehouse(null)
        }
    }, [isOpen, reset])

    useEffect(() => {
        if (editingWarehouse) {
            setValue('name', editingWarehouse.name)
            setValue('description', editingWarehouse.description || '')
        } else {
            reset({ name: '', description: '' })
        }
    }, [editingWarehouse, setValue, reset])
    useEffect(() => {
        getWarehouses()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
        setShowDeleteButton(selectedRows.length > 0)
    }, [itemsPerPage, selectedRows])

    const warehouseHeaders: SkeletonHeader[] = [
        { width: '20px', type: 'checkbox' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'actions' }
    ]


    return (
        <>
            <PageBreadcrumb title="Department" subName="Settings" allowNavigateBack={true} />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Manage Departments</h4>
                            <p className="text-muted mb-0">
                                Add and Manage all your Departments here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <Button
                                disabled={!canCreate}
                                variant="success"
                                onClick={toggleModal}
                                className="mb-2 mb-sm-0">
                                <i className="bi bi-plus"></i> Add New Department
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
                                        placeholder="Search Department here..."
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
                    <div className="table-responsive-sm">
                        <Table className="table-striped table-centered mb-0">
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedRows.length > 0 && selectedRows.length === WarehouseData.length}
                                        />
                                    </th>
                                    <th>
                                        <span onClick={handleSort} style={{ cursor: 'pointer' }}>
                                            Name {sortedAsc ? '↑' : '↓'}
                                        </span>
                                    </th>
                                    <th>Description</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={warehouseHeaders} rowCount={5} />
                                ) : paginatedRecords.length > 0 ? (
                                    paginatedRecords.map((warehouse, idx) => {
                                        const isSelected = selectedRows.includes(warehouse._id)
                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectRow(warehouse._id)}
                                                    />
                                                </td>
                                                <td>{warehouse?.name}</td>
                                                <td
                                                    onClick={() => toggleMessage(warehouse._id.toString())}
                                                    style={{ cursor: 'pointer' }}
                                                    title="Click to expand/collapse"
                                                >
                                                    {expandedMessages[warehouse._id]
                                                        ? warehouse.description
                                                        : truncateText(warehouse.description)}
                                                </td>
                                                <td>
                                                    <div className="d-flex">
                                                        <Button
                                                            variant="secondary"
                                                            disabled={!canUpdate}
                                                            onClick={() => toggleEditModal(warehouse)}>
                                                            <MdEdit />
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            className="ms-2"
                                                            onClick={() => handleDeleteConfirmation(warehouse._id.toString())}
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
                                        <td colSpan={8} className="text-center">
                                            No Departments found
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

            <DepartmentModal
                show={isOpen}
                onHide={handletoggleModal}
                onSuccess={getWarehouses}
                editingDepartment={editingWarehouse}
            />
        </>
    )
}
export default Departments
