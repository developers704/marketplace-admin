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

interface CouponRecord {
    _id: string
    code: string
    discountType: 'percentage' | 'fixed'
    value: number
    minPurchase: number
    expiryDate: string
    isActive: boolean
}

const Coupan = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Coupons?.Update
    const canDelete = isSuperUser || permissions.Coupons?.Delete
    const canCreate = isSuperUser || permissions.Coupons?.Create

    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [apiLoading, setApiLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [coupons, setCoupons] = useState<CouponRecord[]>([])
    const [editingCoupon, setEditingCoupon] = useState<CouponRecord | null>(null)
    const [isOpen, toggleModal] = useToggle()

    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    const {
        handleSubmit,
        register,
        reset,
        setValue,
        formState: { errors },
    } = useForm()

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }
    const handleSelectRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }
    const handletoggleModal = () => {
        if (isOpen) {
            reset() // Reset form data
            setEditingCoupon(null) // Clear editing state
        }
        toggleModal()
    }

    const handleDeleteConfirmation = (couponId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This coupon will be deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: "#9c5100",
            cancelButtonColor: '#d33',
            confirmButtonText: 'Remove!'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteCoupon([couponId])
            }
        })
    }


    const toggleEditModal = (coupon: CouponRecord) => {
        setEditingCoupon(coupon)
        setValue('code', coupon?.code)
        setValue('discountType', coupon?.discountType)
        setValue('value', coupon?.value)
        setValue('minPurchase', coupon?.minPurchase)
        setValue('expiryDate', coupon?.expiryDate?.split('T')[0])
        setValue('isActive', coupon?.isActive)
        handletoggleModal()
    }


    const handleAddCoupon = async (formData: any) => {
        setApiLoading(true)
        try {
            const response = await fetch(`${BASE_API}/api/coupons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData)
            })

            const responseData = await response.json()
            if (!response.ok) {
                throw new Error(responseData.message || responseData.error)
            }

            getCoupons()
            handletoggleModal()
            Swal.fire({
                title: 'Success!',
                text: 'Coupon added successfully!',
                icon: 'success',
                confirmButtonColor: "#9c5100",
            })
        } catch (error: any) {
            toastService.error(error.message || 'Failed to add coupon')
        } finally {
            setApiLoading(false)
        }
    }

    const handleUpdateCoupon = async (formData: any) => {
        setApiLoading(true)
        try {
            const response = await fetch(`${BASE_API}/api/coupons/${editingCoupon?._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData)
            })

            const responseData = await response.json()
            if (!response.ok) {
                throw new Error(responseData.message || responseData.error)
            }

            getCoupons()
            handletoggleModal()
            Swal.fire({
                title: 'Updated!',
                text: 'Coupon updated successfully!',
                icon: 'success',
                confirmButtonColor: "#9c5100",
            })
        } catch (error: any) {
            toastService.error(error.message || 'Failed to update coupon')
        } finally {
            setApiLoading(false)
        }
    }

    const deleteCoupon = async (couponIds: string[]) => {
        try {
            const response = await fetch(`${BASE_API}/api/coupons/${couponIds[0]}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || errorData.error)
            }

            getCoupons()
            setSelectedRows([])
            Swal.fire({
                title: 'Deleted!',
                text: 'Coupon deleted successfully!',
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
        } catch (error: any) {
            toastService.error(error.message || 'Failed to delete coupon')
        }
    }

    const getCoupons = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/coupons`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })
            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch coupons')
            }
            setCoupons(data)
        } catch (error: any) {
            toastService.error(error.message || 'Failed to fetch coupons')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getCoupons()
    }, [])

    // Pagination and filtering logic
    const filteredRecords = coupons?.filter(coupon =>
        coupon?.code?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const paginatedRecords = filteredRecords?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const totalPages = Math.ceil(filteredRecords?.length / itemsPerPage)
    const storeHeaders: any[] = [
        { width: '20px', type: 'checkbox' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'actions' }
    ]
    return (
        <>
            <PageBreadcrumb title="Coupons" subName="Discounts" />
            <Card>
                {/* Header section */}
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Coupons Management</h4>
                            <p className="text-muted mb-0">Manage all your discount coupons here.</p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <Button
                                disabled={!canCreate}
                                variant="success"
                                onClick={handletoggleModal}
                                className="mb-2 mb-sm-0">
                                <i className="bi bi-plus"></i> Add New Coupon
                            </Button>

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
                    {/* Table section */}
                    <Table responsive className="table-centered">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        onChange={(e) => setSelectedRows(e.target.checked ? coupons.map(c => c._id) : [])}
                                        checked={selectedRows.length > 0 && selectedRows.length === coupons?.length}
                                    />
                                </th>
                                <th>Code</th>
                                <th>Type</th>
                                <th>Value</th>
                                <th>Min Purchase</th>
                                <th>Expiry Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableRowSkeleton headers={storeHeaders} rowCount={3} />
                            ) : paginatedRecords?.length > 0 ? (
                                paginatedRecords?.map((coupon) => (
                                    <tr key={coupon?._id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(coupon?._id)}
                                                onChange={() => handleSelectRow(coupon?._id)}
                                            />
                                        </td>
                                        <td>{coupon?.code}</td>
                                        <td>{coupon?.discountType}</td>
                                        <td>{coupon?.value}{coupon?.discountType === 'percentage' ? '%' : ''}</td>
                                        <td>$ {coupon.minPurchase}</td>
                                        <td>{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge bg-${coupon?.isActive ? 'success' : 'danger'}`}>
                                                {coupon?.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <Button
                                                variant="secondary"
                                                disabled={!canUpdate}
                                                onClick={() => toggleEditModal(coupon)}
                                                className="me-2">
                                                <MdEdit />
                                            </Button>
                                            <Button
                                                variant="danger"
                                                disabled={!canDelete}
                                                onClick={() => handleDeleteConfirmation(coupon?._id)}>
                                                <MdDelete />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="text-center py-4">
                                        <div className="d-flex flex-column align-items-center">
                                            <i className="ri-file-list-3-line fs-2 text-muted mb-2"></i>
                                            <h5 className="text-muted mb-1">No Coupons Found</h5>
                                        </div>
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
                </Card.Body>

            </Card>

            {/* Add/Edit Modal */}
            <Modal show={isOpen} onHide={handletoggleModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit(editingCoupon ? handleUpdateCoupon : handleAddCoupon)}>
                    <Modal.Body>
                        <Row className="mb-3">
                            <Col>
                                <Form.Group>
                                    <Form.Label>Coupon Code <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter coupon code"
                                        {...register("code", { required: true })}
                                        isInvalid={!!errors.code}
                                    />
                                    {errors.code && (
                                        <Form.Control.Feedback type="invalid">
                                            Coupon code is required
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Discount Type <span className="text-danger">*</span></Form.Label>
                                    <Form.Select
                                        {...register("discountType", { required: true })}
                                        isInvalid={!!errors.discountType}
                                    >
                                        <option value="">Select type</option>
                                        <option value="percentage">Percentage</option>
                                        <option value="fixed">Fixed Amount</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Value <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="number"
                                        {...register("value", { required: true, min: 0 })}
                                        isInvalid={!!errors.value}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Minimum Purchase</Form.Label>
                                    <Form.Control
                                        type="number"
                                        {...register("minPurchase", { min: 0 })}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Expiry Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        {...register("expiryDate")}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        {editingCoupon && (
                            <Row className="mb-3">
                                <Col>
                                    <Form.Group>
                                        <Form.Check
                                            type="checkbox"
                                            label="Active"
                                            {...register("isActive")}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}
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

            {/* Pagination */}

        </>
    )
}

export default Coupan
