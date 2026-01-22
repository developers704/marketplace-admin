import { PageBreadcrumb } from '@/components'
import {
    Button,
    Card,
    Form,
    Table,
    Pagination as BootstrapPagination,
} from 'react-bootstrap'
import { MdDelete, MdCheckCircle, MdCancel, MdVisibility } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { TableRowSkeleton } from '../other/SimpleLoader'
import { Modal } from 'react-bootstrap';
import { MdEdit } from 'react-icons/md';
import { FileUploader } from '@/components/FileUploader'
import { MdReply } from 'react-icons/md';
import { Badge } from 'react-bootstrap';
import { Tabs, Tab } from 'react-bootstrap';
import { PiStarThin } from "react-icons/pi";



interface TableRecord {
    _id: number
    content: string
    isActive: boolean
}
interface ExpandedMessages {
    [key: string]: boolean;
}
const ProductReviews = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canDelete = isSuperUser || permissions.Products?.Delete

    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [showDeleteButton, setShowDeleteButton] = useState(false)
    const [loading, setLoading] = useState(false)
    const [ScrollMsgData, setScrollMsgData] = useState<any[]>([])
    const [EditingScrollMsg, setEditingScrollMsg] = useState<TableRecord | null>(null)
    const [isOpen] = useToggle()
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState<any>(null);
    const [updatedRating, setUpdatedRating] = useState<number>(0);
    const [updatedContent, setUpdatedContent] = useState('');
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [apiLoading, setApiLoading] = useState(false);
    const [expandedMessages, setExpandedMessages] = useState<ExpandedMessages>({});
    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [selectedReviewId, setSelectedReviewId] = useState<string>('');
    const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending'>('pending');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedReviewForView, setSelectedReviewForView] = useState<any>(null);


    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user
    const {
        reset,
        setValue,
    } = useForm()

    // const filteredRecords = ScrollMsgData
    //     ?.filter((record) => {
    //         const matchesSearch = record?.customer?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //             record.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //             (record.sku?.sku && record.sku.sku.toLowerCase().includes(searchTerm.toLowerCase()));
            
    //         const matchesApproval = approvalFilter === 'all' 
    //             ? true 
    //             : approvalFilter === 'approved' 
    //                 ? record.isApproved === true 
    //                 : record.isApproved !== true;
            
    //         return matchesSearch && matchesApproval;
    //     })
    //     .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const filteredRecords = ScrollMsgData
  ?.filter((record) => {
    const search = searchTerm.toLowerCase();

    const customerName = record?.customer?.username?.toLowerCase() || '';
    const productName = record?.product?.name?.toLowerCase() || '';
    const skuCode = record?.sku?.sku?.toLowerCase() || '';

    const matchesSearch =
      customerName.includes(search) ||
      productName.includes(search) ||
      skuCode.includes(search);

    const matchesApproval =
      approvalFilter === 'all'
        ? true
        : approvalFilter === 'approved'
        ? record.isApproved === true
        : record.isApproved !== true;

    return matchesSearch && matchesApproval;
  })
  .sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

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
    // Single delete function (Admin delete)
    const deleteSingleReview = async (reviewId: string) => {
        try {
            const response = await fetch(
                `${BASE_API}/api/reviews/admin/${reviewId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to delete review')
            }

            await getAllServices()
            Swal.fire({
                title: 'Deleted!',
                text: 'Review deleted successfully.',
                icon: 'success',
                timer: 1500,
            })
        } catch (error: any) {
            Swal.fire({
                title: 'Error!',
                text: error.message || 'Failed to delete review',
                icon: 'error',
            })
        }
    }

    // Bulk delete function
    const deleteBulkReviews = async (reviewIds: (string | number)[]) => {
        try {
            const response = await fetch(
                `${BASE_API}/api/reviews/admin/bulk-delete`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        reviewIds: reviewIds.map(id => id.toString())
                    }),
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to delete reviews')
            }

            await getAllServices()
            Swal.fire({
                title: 'Deleted!',
                text: `${reviewIds.length} Review(s) deleted successfully.`,
                icon: 'success',
                timer: 1500,
            })
            setSelectedRows([])
        } catch (error: any) {
            Swal.fire({
                title: 'Error!',
                text: error.message || 'Failed to delete reviews',
                icon: 'error',
            })
        }
    }

    const handleBulkDelete = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `All the ${selectedRows.length} selected Reviews will be deleted!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteBulkReviews(selectedRows)
            }
        })
    }

    const handleSingleDelete = (reviewId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This Review will be deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSingleReview(reviewId)
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
    // *********************** apis functions ***************************
    const getAllServices = async () => {
        try {
            setLoading(true)
            const url = new URL(`${BASE_API}/api/reviews/admin/all-reviews`);
            // Include all reviews including unapproved
            if (approvalFilter === 'approved') {
                url.searchParams.set('isApproved', 'true');
            } else if (approvalFilter === 'pending') {
                url.searchParams.set('isApproved', 'false');
            }
            
            const response = await fetch(url.toString(), {
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
            console.log("here is the all reviews ", data);

            setScrollMsgData(data.reviews) // You can rename this state to servicesData
        } catch (error: any) {
            console.error('Error getting services data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApproveReview = async (reviewId: string, isApproved: boolean) => {
        try {
            setApiLoading(true);
            const response = await fetch(
                `${BASE_API}/api/reviews/admin/approve/${reviewId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ isApproved }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update review approval status');
            }

            await getAllServices();

            Swal.fire({
                title: 'Success!',
                text: `Review ${isApproved ? 'approved' : 'rejected'} successfully`,
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            });
        } catch (error: any) {
            Swal.fire({
                title: 'Error',
                text: error.message || 'Failed to update approval status',
                icon: 'error',
                confirmButtonColor: "#9c5100",
            });
        } finally {
            setApiLoading(false);
        }
    };
    const handleUpdateReview = async (id: string) => {
        try {
            setApiLoading(true);
            const formData = new FormData();
            formData.append('rating', updatedRating.toString());
            formData.append('content', updatedContent);

            selectedImages.forEach((image) => {
                formData.append('images', image);
            });

            const response = await fetch(
                `${BASE_API}/api/reviews/admin/update/${id}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update service');
            }

            await getAllServices(); // Refresh the list
            setIsEditModalOpen(false);
            setSelectedReview(null);

            Swal.fire({
                title: 'Success!',
                text: 'Review updated successfully',
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            });
        } catch (error: any) {
            Swal.fire(
                {
                    title: 'Error',
                    text: error.message || 'Failed to update service',
                    icon: 'error',
                    confirmButtonColor: "#9c5100",
                }
            )
        } finally {
            setApiLoading(false);
        }
    };
    const handleReplySubmit = async () => {
        try {
            setApiLoading(true);
            const response = await fetch(
                `${BASE_API}/api/reviews/${selectedReviewId}/respond`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ content: replyContent }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit reply');
            }

            await getAllServices(); // Refresh the list
            setIsReplyModalOpen(false);
            setReplyContent('');
            setSelectedReviewId('');

            Swal.fire({
                title: 'Success!',
                text: 'Reply submitted successfully',
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            });
        } catch (error: any) {
            Swal.fire(
                {
                    title: 'Error',
                    text: error.message || 'Failed to submit reply',
                    icon: 'error',
                    timer: 1500,
                    confirmButtonColor: "#9c5100",
                }
            )
        } finally {
            setApiLoading(false);
        }
    };


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
    }, [approvalFilter])

    useEffect(() => {
        setShowDeleteButton(selectedRows.length > 0)
    }, [selectedRows])

    useEffect(() => {
        setCurrentPage(1)
    }, [itemsPerPage])
    const truncateText = (text: any, limit: number = 50) => {
        if (!text) return '';
        return text.length > limit ? `${text.substring(0, limit)}...` : text;
    }
    const toggleMessage = (messageId: string) => {
        setExpandedMessages(prev => ({
            ...prev,
            [messageId]: !prev[messageId]
        }));
    };

    const warehouseHeaders: any[] = [
        { width: '20px', type: 'checkbox' },
        { width: '100px', type: 'text' },  // Customer
        { width: '120px', type: 'text' },  // Product/SKU
        { width: '80px', type: 'text' },   // Rating
        { width: '200px', type: 'text' },  // Review
        { width: '100px', type: 'text' },  // Status
        { width: '100px', type: 'text' },  // Seller Reply
        { width: '100px', type: 'text' },  // Review Images
        { width: '100px', type: 'text' },  // Date
        { width: '150px', type: 'actions' } // Action
    ]


    return (
        <>
            <PageBreadcrumb title="Product Reviews" subName="Products" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Product Reviews</h4>
                            <p className="text-muted mb-0">
                                Manage and approve product reviews here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">

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
                    {/* Approval Status Tabs */}
                    <div className="mt-3">
                        <Tabs
                            activeKey={approvalFilter}
                            onSelect={(k) => setApprovalFilter(k as 'all' | 'approved' | 'pending')}
                            className="mb-3"
                        >
                            <Tab eventKey="pending" title={
                                <span>
                                    Pending Approval 
                                    {ScrollMsgData.filter((r: any) => !r.isApproved).length > 0 && (
                                        <Badge bg="danger" className="ms-2">
                                            {ScrollMsgData.filter((r: any) => !r.isApproved).length}
                                        </Badge>
                                    )}
                                </span>
                            } />
                            <Tab eventKey="approved" title="Approved Reviews" />
                            <Tab eventKey="all" title="All Reviews" />
                        </Tabs>
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
                                        placeholder="Search Reviews here..."
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
                        <Table className="table-centered mb-0">
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedRows.length > 0 && selectedRows.length === ScrollMsgData.length}
                                        />{' '}
                                    </th>
                                    <th>Customer</th>
                                    <th>Product / SKU</th>
                                    <th>Rating</th>
                                    <th>Review</th>
                                    <th>Status</th>
                                    <th>Seller Reply</th>
                                    <th>Review Images</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={warehouseHeaders} rowCount={5} />
                                ) : paginatedRecords?.length > 0 ? (
                                    (paginatedRecords || [])?.map((record, idx) => {
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
                                                <td>{record?.customer?.username}</td>
                                                <td>
                                                    <div>
                                                        <div className="fw-bold ">{truncateText(record?.sku?.attributes?.descriptionname || record?.product?.title || 'N/A')}</div>
                                                        {record?.sku && (
                                                            <div className="text-muted small">
                                                                SKU: {record?.sku?.sku}
                                                                {record.sku.metalColor && ` (${record.sku.metalColor})`}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1">
                                                        {record?.rating} 
                                                        <span style={{ color: '#ffc107' }}>⭐</span>
                                                    </div>
                                                </td>
                                                <td title={record?.content} onClick={() => toggleMessage(record?._id)}
                                                    style={{ cursor: 'pointer' }}> {expandedMessages[record?._id]
                                                        ? record?.content
                                                        : truncateText(record?.content)}</td>
                                                <td>
                                                    {record?.isApproved ? (
                                                        <Badge bg="success">Approved</Badge>
                                                    ) : (
                                                        <Badge bg="warning">Pending</Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    {record?.sellerResponse ? (
                                                        <span
                                                            onClick={() => setExpandedMessages(prev => ({
                                                                ...prev,
                                                                [`response-${record?._id}`]: !prev[`response-${record?._id}`]
                                                            }))}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            {expandedMessages[`response-${record?._id}`]
                                                                ? record?.sellerResponse?.content
                                                                : truncateText(record?.sellerResponse?.content, 30)}
                                                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                                {new Date(record?.sellerResponse?.respondedAt).toLocaleDateString()}
                                                            </div>
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">No reply yet</span>
                                                    )}
                                                </td>

                                                <td>
                                                    {record?.images && record?.images?.length > 0 ? (
                                                        <div className="d-flex gap-2">
                                                            {record.images.map((image: any, index: any) => (
                                                                <img
                                                                    key={index}
                                                                    src={`${BASE_API}/uploads/images/reviews/${image}`}
                                                                    alt={`Review image ${index + 1}`}
                                                                    style={{
                                                                        width: '50px',
                                                                        height: '50px',
                                                                        objectFit: 'cover',
                                                                        borderRadius: '4px'
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">No images</span>
                                                    )}
                                                </td>
                                                <td>{new Date(record?.createdAt).toLocaleDateString()}</td>

                                                <td>
                                                    <div className="d-flex flex-wrap gap-2 align-items-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedReviewForView(record);
                                                                setIsViewModalOpen(true);
                                                            }}
                                                            title="View Product Details"
                                                            className="btn btn-link p-0 text-primary d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '50%',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = 'rgba(13, 110, 253, 0.1)';
                                                                e.currentTarget.style.transform = 'scale(1.1)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'transparent';
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                            }}
                                                        >
                                                            <MdVisibility size={20} />
                                                        </button>
                                                        {!record?.isApproved && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleApproveReview(record?._id?.toString(), true)}
                                                                disabled={apiLoading}
                                                                title="Approve Review"
                                                                className="btn btn-link p-0 text-success d-flex align-items-center justify-content-center"
                                                                style={{
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    borderRadius: '50%',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    transition: 'all 0.2s ease',
                                                                    opacity: apiLoading ? 0.5 : 1
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (!apiLoading) {
                                                                        e.currentTarget.style.background = 'rgba(25, 135, 84, 0.1)';
                                                                        e.currentTarget.style.transform = 'scale(1.1)';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.background = 'transparent';
                                                                    e.currentTarget.style.transform = 'scale(1)';
                                                                }}
                                                            >
                                                                <MdCheckCircle size={20} />
                                                            </button>
                                                        )}
                                                        {record?.isApproved && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleApproveReview(record?._id?.toString(), false)}
                                                                disabled={apiLoading}
                                                                title="Reject Review"
                                                                className="btn btn-link p-0 text-warning d-flex align-items-center justify-content-center"
                                                                style={{
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    borderRadius: '50%',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    transition: 'all 0.2s ease',
                                                                    opacity: apiLoading ? 0.5 : 1
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (!apiLoading) {
                                                                        e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)';
                                                                        e.currentTarget.style.transform = 'scale(1.1)';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.background = 'transparent';
                                                                    e.currentTarget.style.transform = 'scale(1)';
                                                                }}
                                                            >
                                                                <MdCancel size={20} />
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedReviewId(record?._id?.toString());
                                                                setIsReplyModalOpen(true);
                                                            }}
                                                            title="Reply to Review"
                                                            className="btn btn-link p-0 text-info d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '50%',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = 'rgba(13, 202, 240, 0.1)';
                                                                e.currentTarget.style.transform = 'scale(1.1)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'transparent';
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                            }}
                                                        >
                                                            <MdReply size={20} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedReview(record);
                                                                setUpdatedRating(record?.rating);
                                                                setUpdatedContent(record?.content);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            title="Edit Review"
                                                            className="btn btn-link p-0 text-secondary d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '50%',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = 'rgba(108, 117, 125, 0.1)';
                                                                e.currentTarget.style.transform = 'scale(1.1)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'transparent';
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                            }}
                                                        >
                                                            <MdEdit size={20} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSingleDelete(record?._id?.toString())}
                                                            disabled={!canDelete}
                                                            title="Delete Review"
                                                            className="btn btn-link p-0 text-danger d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '50%',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                transition: 'all 0.2s ease',
                                                                opacity: !canDelete ? 0.3 : 1,
                                                                cursor: !canDelete ? 'not-allowed' : 'pointer'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (canDelete) {
                                                                    e.currentTarget.style.background = 'rgba(220, 53, 69, 0.1)';
                                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'transparent';
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                            }}
                                                        >
                                                            <MdDelete size={20} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="text-center">
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
            <Modal show={isEditModalOpen} onHide={() => setIsEditModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Update Review</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Rating</Form.Label>
                            <Form.Select
                                value={updatedRating}
                                onChange={(e) => setUpdatedRating(Number(e.target.value))}
                            >
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <option key={num} value={num}>{num} ⭐</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Review Content</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={updatedContent}
                                onChange={(e) => setUpdatedContent(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Upload New Images</Form.Label>
                            <div className="mb-2">
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    File Size: Upload images up to 5 MB.
                                </p>
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).
                                </p>
                            </div>
                            <FileUploader
                                icon="ri-upload-cloud-2-line"
                                text="Drop file here or click to upload review images."
                                onFileUpload={(files: File[]) => setSelectedImages(files)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                        Close
                    </Button>
                    <Button
                        variant="success"
                        onClick={() => handleUpdateReview(selectedReview._id)}
                    >
                        {apiLoading ? "Updating..." : 'Update Review'}
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal show={isReplyModalOpen} onHide={() => setIsReplyModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Reply to Review</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Your Reply</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Type your response here..."
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setIsReplyModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleReplySubmit}
                        disabled={!replyContent.trim()}
                    >
                        {apiLoading ? "Submitting.." : "Submit Reply"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* View Product Details Modal */}
            <Modal show={isViewModalOpen} onHide={() => setIsViewModalOpen(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Product Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedReviewForView && (
                        <div>
                            {/* Product Information */}
                            <div className="mb-4">
                                <h5 className="mb-3 border-bottom pb-2">Product Information</h5>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <strong>Product Name:</strong>
                                        <div className="text-muted">
                                            {selectedReviewForView?.sku?.attributes?.descriptionname || 
                                             selectedReviewForView?.product?.name || 
                                             selectedReviewForView?.product?.title || 
                                             'N/A'}
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <strong>Vender Model:</strong>
                                        <div className="text-muted">
                                            <Badge bg="info">{selectedReviewForView?.product.vendorModel || 'N/A'}</Badge>
                                        </div>
                                    </div>
                                    {selectedReviewForView?.product?._id && (
                                        <div className="col-md-6 mb-3">
                                            <strong>Product ID:</strong>
                                            <div className="text-muted">{selectedReviewForView.product._id}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SKU Information */}
                            {selectedReviewForView?.sku && (
                                <div className="mb-4">
                                    <h5 className="mb-3 border-bottom pb-2">SKU Information</h5>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <strong>SKU Code:</strong>
                                            <div className="text-muted">{selectedReviewForView.sku.sku || 'N/A'}</div>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <strong>SKU ID:</strong>
                                            <div className="text-muted">{selectedReviewForView.sku._id || 'N/A'}</div>
                                        </div>
                                        {selectedReviewForView.sku.metalColor && (
                                            <div className="col-md-6 mb-3">
                                                <strong>Metal Color:</strong>
                                                <div className="text-muted">{selectedReviewForView.sku.metalColor}</div>
                                            </div>
                                        )}
                                        {selectedReviewForView.sku.metalType && (
                                            <div className="col-md-6 mb-3">
                                                <strong>Metal Type:</strong>
                                                <div className="text-muted">{selectedReviewForView.sku.metalType}</div>
                                            </div>
                                        )}
                                        {selectedReviewForView.sku.size && (
                                            <div className="col-md-6 mb-3">
                                                <strong>Size:</strong>
                                                <div className="text-muted">{selectedReviewForView.sku.size}</div>
                                            </div>
                                        )}
                                        {selectedReviewForView.sku.price && (
                                            <div className="col-md-6 mb-3">
                                                <strong>Price:</strong>
                                                <div className="text-muted">
                                                    {selectedReviewForView.sku.currency || 'USD'} {selectedReviewForView.sku.price}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Product Attributes */}
                            {selectedReviewForView?.sku?.attributes && (
                                <div className="mb-4">
                                    <h5 className="mb-3 border-bottom pb-2">Product Attributes</h5>
                                    <div className="row">
                                        {Object.entries(selectedReviewForView.sku.attributes).filter(([key]) => !['featureimageslink', 'galleryimagelink'].includes(key.toLowerCase())).map(([key, value]: [string, any]) => (
                                            <div key={key} className="col-md-6 mb-3">
                                                <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong>
                                                <div className="text-muted">
                                                    {value || 'N/A'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Review Information */}
                            <div className="mb-4">
                                <h5 className="mb-3 border-bottom pb-2">Review Information</h5>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <strong>Customer:</strong>
                                        <div className="text-muted">{selectedReviewForView?.customer?.username || 'N/A'}</div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <strong>Rating:</strong>
                                        <div className="text-muted">
                                            {selectedReviewForView?.rating} <PiStarThin size={24} color='#f2c80c' />
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <strong>Status:</strong>
                                        <div>
                                            {selectedReviewForView?.isApproved ? (
                                                <Badge bg="success">Approved</Badge>
                                            ) : (
                                                <Badge bg="warning">Pending</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <strong>Verified Purchase:</strong>
                                        <div>
                                            {selectedReviewForView?.isVerifiedPurchase ? (
                                                <Badge bg="success">Yes</Badge>
                                            ) : (
                                                <Badge bg="secondary">No</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-12 mb-3">
                                        <strong>Review Content:</strong>
                                        <div className="text-muted mt-1 p-2 bg-light rounded">
                                            {selectedReviewForView?.content || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <strong>Created At:</strong>
                                        <div className="text-muted">
                                            {new Date(selectedReviewForView?.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <strong>Updated At:</strong>
                                        <div className="text-muted">
                                            {new Date(selectedReviewForView?.updatedAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Review Images */}
                            {selectedReviewForView?.images && selectedReviewForView.images.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="mb-3 border-bottom pb-2">Review Images</h5>
                                    <div className="d-flex flex-wrap gap-2">
                                        {selectedReviewForView.images.map((image: any, index: number) => (
                                            <img
                                                key={index}
                                                src={`${BASE_API}/uploads/images/reviews/${image}`}
                                                alt={`Review image ${index + 1}`}
                                                style={{
                                                    width: '150px',
                                                    height: '150px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    border: '1px solid #ddd'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Seller Response */}
                            {selectedReviewForView?.sellerResponse && (
                                <div className="mb-4">
                                    <h5 className="mb-3 border-bottom pb-2">Seller Response</h5>
                                    <div className="p-3 bg-light rounded">
                                        <div className="mb-2">{selectedReviewForView.sellerResponse.content}</div>
                                        <div className="text-muted small">
                                            Responded: {new Date(selectedReviewForView.sellerResponse.respondedAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default ProductReviews
