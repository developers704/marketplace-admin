import { PageBreadcrumb } from '@/components'
import {
    Button,
    Card,
    Form,
    Modal,
    Table,
    ButtonGroup,
    ToggleButton
} from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/common'
import { Pagination as BootstrapPagination } from 'react-bootstrap'
import { TableRowSkeleton } from '../other/SimpleLoader'
import { toastService } from '@/common/context/toast.service'
import { MdEdit } from 'react-icons/md'

interface WalletRequest {
    _id: string;
    amount: number;
    reason: string;
    status: string;
    targetWallet: string; // Added targetWallet field
    customer: {
        _id: string;
        username: string;
        email: string;
        phone_number: string;
        warehouse: any;
    };
    adminResponse?: {
        admin: string;
        responseDate: string;
        comment: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface ExpandedMessages {
    [key: string]: boolean;
}

const WalletRequest = () => {
    const { user } = useAuthContext()

    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(8)
    const [loading, setLoading] = useState(false)
    const [storeData, setStoreData] = useState<any[]>([])
    const [expandedMessages, setExpandedMessages] = useState<ExpandedMessages>({});
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string>('');
    const [approvalComment, setApprovalComment] = useState('');
    const [walletTypeFilter, setWalletTypeFilter] = useState('all'); // New state for wallet type filter
    const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
    const [apiLoading, setApiLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editAmount, setEditAmount] = useState<string>('');
    const [isBulkEdit, setIsBulkEdit] = useState(false);
    const [currentEditId, setCurrentEditId] = useState<string>('');
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<WalletRequest | null>(null);

    // ************* basics *************

    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    // *************************** handle functions *************************

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }

    const toggleMessage = (messageId: string) => {
        setExpandedMessages(prev => ({
            ...prev,
            [messageId]: !prev[messageId]
        }));
    };

    const truncateText = (text: any, limit: number = 50) => {
        if (!text) return '';
        return text.length > limit ? `${text.substring(0, limit)}...` : text;
    }

    // Updated filteredRecords to include wallet type filtering
    // Replace the existing filteredRecords with:
    const filteredRecords = storeData
        ?.filter(record =>
            (walletTypeFilter === 'all' ||
                (walletTypeFilter === 'inventory' && record?.targetWallet === 'inventory') ||
                (walletTypeFilter === 'supplies' && record?.targetWallet === 'supplies')) &&
            (record?.customer?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record?.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record?.reason?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())


    const paginatedRecords = filteredRecords?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleApproveClick = (requestId: string) => {
        setSelectedRequestId(requestId);
        setShowApproveModal(true);
    };

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    // Function to handle wallet type filter change
    const handleWalletTypeFilterChange = (value: string) => {
        setWalletTypeFilter(value);
        setCurrentPage(1); // Reset to first page when filter changes
    }

    // Function to get wallet type display text
    // Replace the existing getWalletTypeDisplay function with:
    const getWalletTypeDisplay = (targetWallet: string) => {
        return targetWallet === 'inventory' ? 'Inventory' : 'Supplies';
    }
    const handleViewClick = (request: WalletRequest) => {
        setSelectedRequest(request);
        setShowViewModal(true);
    };

    // ********************** API CALLS **********************
    const getStores = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/wallet-request`, {
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

    const handleApproveRequest = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${BASE_API}/api/wallet-request/${selectedRequestId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        status: "approved",
                        comment: approvalComment || "Request approved"
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to approve request');
            }

            toastService.success('Wallet request approved successfully');
            setShowApproveModal(false);
            setApprovalComment('');
            getStores();
        } catch (error: any) {
            toastService.error(error.message);
        } finally {
            setLoading(false);
        }
    }
    const handleEditSubmit = async () => {
        try {
            setApiLoading(true);
            if (!editAmount || Number(editAmount) <= 0) {
                toastService.error('Please enter a valid amount');
                return;
            }

            const amount = Number(editAmount);

            if (isBulkEdit) {
                const requests = selectedRequests.map(requestId => ({
                    requestId,
                    amount
                }));

                const response = await fetch(`${BASE_API}/api/wallet-request/bulk-update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ requests })
                });

                if (!response.ok) {
                    const errorMessage = await response.json();
                    throw new Error(errorMessage.message);
                }

                toastService.success('Amounts updated successfully');
                setSelectedRequests([]);
            } else {
                const requests = [{
                    requestId: currentEditId,
                    amount
                }];

                const response = await fetch(`${BASE_API}/api/wallet-request/bulk-update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ requests })
                });

                if (!response.ok) throw new Error('Failed to update amount');

                toastService.success('Amount updated successfully');
            }

            setShowEditModal(false);
            setEditAmount('');
            getStores(); // Refresh the data
        } catch (error: any) {
            toastService.error(error.message);
        } finally {
            setApiLoading(false);
        }
    };

    useEffect(() => {
        getStores()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
    }, [itemsPerPage])

    const storeHeaders: any[] = [
        { width: '20px', type: 'checkbox' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' }, // Added for wallet type
        { width: '100px', type: 'actions' }
    ]

    // Replace the existing walletTypeOptions with:
    const walletTypeOptions = [
        { name: 'All Requests', value: 'all' },
        { name: 'Inventory', value: 'inventory' },
        { name: 'Supplies', value: 'supplies' },
    ];


    return (
        <>
            <PageBreadcrumb title="Wallet Approvals" subName="Customers" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Wallet Approvals</h4>
                            <p className="text-muted mb-0">
                                Add and Manage all your Wallet Approvals here.
                            </p>
                        </div>
                        <div className="d-flex justify-content-end mb-3">
                            {selectedRequests.length > 0 && (
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setIsBulkEdit(true);
                                        setShowEditModal(true);
                                    }}
                                >
                                    Edit Selected ({selectedRequests.length})
                                </Button>
                            )}
                        </div>

                    </div>

                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
                        <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2">
                            <div className="app-search">
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

                            {/* New Wallet Type Filter */}
                            <ButtonGroup className="mt-2 mt-lg-0">
                                {walletTypeOptions.map((option, idx) => (
                                    <ToggleButton
                                        key={idx}
                                        id={`wallet-type-${idx}`}
                                        type="radio"
                                        variant={walletTypeFilter === option.value ? 'success' : 'outline-success'}
                                        name="wallet-type-filter"
                                        value={option.value}
                                        checked={walletTypeFilter === option.value}
                                        onChange={(e) => handleWalletTypeFilterChange(e.currentTarget.value)}
                                    >
                                        {option.name}
                                    </ToggleButton>
                                ))}
                            </ButtonGroup>
                        </div>
                        <div className="d-flex gap-3">
                            <div className="status-box" style={{
                                padding: '10px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                                <div className="d-flex align-items-center">
                                    <div className="color-indicator bg-warning me-2" style={{ width: '20px', height: '20px' }}></div>
                                    <span>({
                                        storeData?.filter(request => request?.status === 'pending').length || 0
                                    }) Pending Wallet Requests</span>
                                </div>
                            </div>
                        </div>
                        <Form.Select
                            value={itemsPerPage}
                            style={{ zIndex: 1 }}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="w-auto mt-3 mt-lg-0">
                            <option value={8}>8 items</option>
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
                                        onChange={(e) => {
                                            const pendingRequestIds = paginatedRecords
                                                ?.filter(req => req.status === 'pending')
                                                .map(req => req._id);
                                            setSelectedRequests(e.target.checked ? pendingRequestIds : []);
                                        }}
                                    />
                                </th>
                                <th>S. No</th>
                                <th>Customer</th>
                                <th>Store</th>
                                <th>Amount</th>
                                <th>Reason</th>
                                <th>Request Date</th>
                                <th>Status</th>
                                <th>Wallet Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableRowSkeleton headers={storeHeaders} rowCount={3} />
                            ) : paginatedRecords?.length > 0 ? (
                                paginatedRecords?.map((request: WalletRequest, i: number) => (
                                    <tr key={request?._id} style={{
                                        backgroundColor: request?.status === 'pending' ? '#fff3cd' : 'inherit'
                                    }}>
                                        <td>
                                            {request?.status === 'pending' && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRequests.includes(request?._id)}
                                                    onChange={(e) => {
                                                        setSelectedRequests(prev =>
                                                            e.target.checked
                                                                ? [...prev, request?._id]
                                                                : prev.filter(id => id !== request?._id)
                                                        );
                                                    }}
                                                />
                                            )}
                                        </td>
                                        <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                                        <td>
                                            <div>
                                                <strong>{request?.customer?.username}</strong>
                                                <br />
                                                <small>{request?.customer?.email}</small>
                                            </div>
                                        </td>
                                        <td>{request?.customer?.warehouse?.name}</td>
                                        <td>${request?.amount}</td>
                                        <td
                                            onClick={() => toggleMessage(request?._id)}
                                            style={{ cursor: 'pointer' }}
                                            title="Click to expand/collapse"
                                        >
                                            {expandedMessages[request?._id]
                                                ? request?.reason
                                                : truncateText(request?.reason)}
                                        </td>

                                        <td>{new Date(request?.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge bg-${request?.status === 'approved' ? 'success' : 'warning'}`}>
                                                {request?.status}
                                            </span>
                                        </td>
                                        {/* New Wallet Type column */}
                                        <td>
                                            <span className={`badge bg-${request?.targetWallet === 'warehouse' ? 'info' : 'primary'}`}>
                                                {getWalletTypeDisplay(request?.targetWallet)}
                                            </span>
                                        </td>
                                        <td>
                                            {request?.status === 'pending' && (
                                                <>
                                                    <Button
                                                        className="btn btn-sm btn-info me-2"
                                                        onClick={() => handleViewClick(request)}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        className="btn btn-sm btn-secondary me-2"
                                                        onClick={() => {
                                                            setCurrentEditId(request?._id);
                                                            setIsBulkEdit(false);
                                                            setShowEditModal(true);
                                                        }}
                                                    >
                                                        <MdEdit />
                                                    </Button>
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleApproveClick(request?._id)}
                                                    >
                                                        Approve
                                                    </button>
                                                </>
                                            )}
                                            {request?.status === 'approved' && (
                                                <>
                                                    <Button
                                                        className="btn btn-sm btn-info me-2"
                                                        onClick={() => handleViewClick(request)}
                                                    >
                                                        View
                                                    </Button>
                                                    <span className="text-muted">
                                                        Approved on {new Date(request?.adminResponse?.responseDate || '').toLocaleDateString()}
                                                        <i className="ri-information-line ms-1" title={request?.adminResponse?.comment} style={{ cursor: 'help' }} />
                                                    </span>
                                                </>
                                            )}
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="text-center py-4">
                                        <div className="d-flex flex-column align-items-center">
                                            <i className="ri-wallet-3-line fs-2 text-muted mb-2"></i>
                                            <h5 className="text-muted mb-1">No Wallet Requests Found</h5>
                                            <p className="text-muted mb-0">There are no pending wallet requests.</p>
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
            <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Approve Wallet Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Comment (Optional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={approvalComment}
                            onChange={(e) => setApprovalComment(e.target.value)}
                            placeholder="Enter approval comment..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleApproveRequest}>
                        {loading ? "Approving.." : "Approve Request"}
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showEditModal} onHide={() => {
                setShowEditModal(false);
                setEditAmount('');
                setIsBulkEdit(false);
                setCurrentEditId('');
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>{isBulkEdit ? 'Bulk Edit Amounts' : 'Edit Amount'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>New Amount</Form.Label>
                        <Form.Control
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            placeholder="Enter new amount"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleEditSubmit}>
                        {apiLoading ? "Updating.." : "Update"}
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* Add this modal at the end of the file, before the closing tag */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Request Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedRequest && (
                        <div>
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <h5 className="border-bottom pb-2 mb-3">Customer Information</h5>
                                    <div className="mb-2">
                                        <strong>Name:</strong> {selectedRequest?.customer?.username}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Email:</strong> {selectedRequest?.customer?.email}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Phone:</strong> {selectedRequest?.customer?.phone_number}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Store:</strong> {selectedRequest?.customer?.warehouse?.name}
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <h5 className="border-bottom pb-2 mb-3">Request Information</h5>
                                    <div className="mb-2">
                                        <strong>Amount:</strong> ${selectedRequest?.amount}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Wallet Type:</strong> {getWalletTypeDisplay(selectedRequest?.targetWallet)}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Status:</strong> <span className={`badge bg-${selectedRequest?.status === 'approved' ? 'success' : 'warning'}`}>
                                            {selectedRequest?.status}
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <strong>Request Date:</strong> {new Date(selectedRequest?.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h5 className="border-bottom pb-2 mb-3">Reason</h5>
                                <div className="p-3 bg-light rounded">
                                    {selectedRequest?.reason}
                                </div>
                            </div>

                            {selectedRequest?.status === 'approved' && selectedRequest?.adminResponse && (
                                <div className="mb-3">
                                    <h5 className="border-bottom pb-2 mb-3">Admin Response</h5>
                                    
                                    <div className="mb-2">
                                        <strong>Approval Date:</strong> {new Date(selectedRequest?.adminResponse?.responseDate).toLocaleString()}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Comment:</strong> {selectedRequest?.adminResponse?.comment || 'No comment provided'}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}
export default WalletRequest