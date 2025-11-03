import { PageBreadcrumb } from '@/components'
import {
    Button,
    Card,
    Form,
    Table,
    Pagination as BootstrapPagination,
} from 'react-bootstrap'
import { MdDelete } from 'react-icons/md'
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


    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user
    const {
        reset,
        setValue,
    } = useForm()

    const filteredRecords = ScrollMsgData
        ?.filter((record) =>
            record?.customer?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                `${BASE_API}/api/reviews/admin/bulk-delete`,
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
                text: `${serviceIds.length} Reviews(s) deleted successfully.`,
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
            text: `All the ${selectedRows.length} selected Reviews will be deleted!`,
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
            text: 'This Review will be deleted!',
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
    const totalPages = Math.ceil(filteredRecords?.length / itemsPerPage)
    const paginatedRecords = filteredRecords?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )
    // *********************** apis functions ***************************
    const getAllServices = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/reviews/admin/all-reviews`, {
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
    }, [])

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
        { width: '120px', type: 'text' },  // Product
        { width: '80px', type: 'text' },   // Rating
        { width: '200px', type: 'text' },  // Review
        { width: '100px', type: 'text' },  // Verified Purchase
        { width: '100px', type: 'text' },  // Date
        { width: '100px', type: 'actions' } // Action
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
                                Add and Manage your all Product Reviews here.
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
                                    <th>Product</th>
                                    <th>Rating</th>
                                    <th>Review</th>
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
                                                <td>{record?.product?.name}</td>
                                                <td>{record?.rating} ⭐</td>
                                                <td title={record?.content} onClick={() => toggleMessage(record?._id)}
                                                    style={{ cursor: 'pointer' }}> {expandedMessages[record?._id]
                                                        ? record?.content
                                                        : truncateText(record?.content)}</td>
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
                                                    <div className="d-flex">
                                                        <Button
                                                            variant="info"
                                                            className="me-2"
                                                            onClick={() => {
                                                                setSelectedReviewId(record?._id?.toString());
                                                                setIsReplyModalOpen(true);
                                                            }}
                                                            title='Reply to Review'
                                                        >
                                                            <MdReply />
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            className="me-2"
                                                            onClick={() => {
                                                                setSelectedReview(record);
                                                                setUpdatedRating(record?.rating);
                                                                setUpdatedContent(record?.content);
                                                                setIsEditModalOpen(true);
                                                            }}>
                                                            <MdEdit />
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            className="me-2"
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
                                        <td colSpan={9} className="text-center">
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
        </>
    )
}

export default ProductReviews
