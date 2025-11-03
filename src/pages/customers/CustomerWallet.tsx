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
import { MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import { Pagination as BootstrapPagination } from 'react-bootstrap'
import { TableRowSkeleton } from '../other/SimpleLoader'


interface WalletRecord {
    _id: string
    balance: number
    createdAt: string
    updatedAt: string
    customer: {
        _id: string
        username: string
        email: string
        profile_image?: string
    }
}


const CustomerWallet = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Products?.Update

    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [sortedAsc, setSortedAsc] = useState(true)
    const [apiLoading, setApiLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isOpen, toggleModal] = useToggle()
    const [selectedWallet, setSelectedWallet] = useState<WalletRecord | null>(null)
    const [walletData, setWalletData] = useState<WalletRecord[]>([])
    // ************* basics *************


    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user
    const {
        handleSubmit,
        register,
        reset,
        setValue,
        formState: { errors },
    } = useForm()

    // *************************** handle functions *************************

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
        console.log(setSortedAsc)
    }

    const handletoggleModal = () => {
        if (isOpen) {
            reset()
        }
        toggleModal()
    }

    const filteredRecords = walletData
        .filter(record =>
            record?.customer?.username.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) =>
            sortedAsc ? a?.customer?.username.localeCompare(b?.customer?.username) : b.customer.username.localeCompare(a?.customer?.username)
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
        setSelectedRows(event.target.checked ? walletData.map(store => store._id) : [])
    }

    const handleSelectRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }
    const toggleEditModal = (store: WalletRecord) => {
        setSelectedWallet(store)
        setValue('amount', store.balance)
        toggleModal()
    }
    // ********************** API CALLS **********************
    const getWallets = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/checkout/admin/wallets`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (!response.ok) throw new Error('Failed to fetch wallets')
            const data = await response.json()
            console.log('Wallet data:', data) // Add this line
            setWalletData(data.wallets)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }


    const handleUpdateWallet = async (data: any) => {
        setApiLoading(true)
        try {
            const response = await fetch(`${BASE_API}/api/checkout/wallet/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    customerId: selectedWallet?.customer._id,
                    amount: Number(data.amount),
                    type: data.type
                })
            })
            if (!response.ok) throw new Error('Failed to update wallet')
            await getWallets()
            toggleModal()
            Swal.fire({
                title: 'Success!',
                text: 'Wallet updated successfully',
                icon: 'success',
                timer: 1500
            })
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to update wallet',
                icon: 'error',
                timer: 1500
            })
        } finally {
            setApiLoading(false)
        }
    }


    useEffect(() => {
        getWallets()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
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
            <PageBreadcrumb title="Customer Wallet" subName="Settings" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Customer Wallet</h4>
                            <p className="text-muted mb-0">
                                Add and Manage all your Customer Wallet here.
                            </p>
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
                                        placeholder="Search Customer here..."
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
                                        checked={selectedRows.length === walletData.length}
                                    />
                                </th>
                                <th>Image</th>
                                <th>Customer Name</th>
                                <th>Email</th>
                                <th>Balance</th>
                                <th>Last Updated Date</th>
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
                                            {store.customer.profile_image ? (
                                                <RealImage link={store.customer.profile_image} />
                                            ) : (
                                                <DummyImage />
                                            )}
                                        </td>

                                        <td>{store.customer.username}</td>
                                        <td>{store.customer.email}</td>
                                        <td>{store.balance}</td>
                                        <td>{new Date(store.updatedAt).toLocaleDateString()}</td>
                                        <td>
                                            <Button
                                                variant="secondary"
                                                disabled={!canUpdate}
                                                onClick={() => toggleEditModal(store)}
                                                className="me-2">
                                                <MdEdit />
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

            <Modal show={isOpen} onHide={handletoggleModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {'Update Customer Balance'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit(handleUpdateWallet)}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <div className="mb-3">
                                    <label className="form-label">Customer Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={selectedWallet?.customer.username || ''}
                                        disabled
                                    />
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={selectedWallet?.customer.email || ''}
                                        disabled
                                    />
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}><div className="mb-3">
                                <label className="form-label">Amount *</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    {...register('amount', { required: true })}
                                />
                                {errors.amount && (
                                    <span className="text-danger">Amount is required</span>
                                )}
                            </div>
                            </Col>
                            <Col md={6}> <div className="mb-3">
                                <label className="form-label">Type *</label>
                                <Form.Select {...register('type', { required: true })}>
                                    <option value="">Select Type</option>
                                    <option value="Credit">Credit</option>
                                    <option value="Debit">Debit</option>
                                </Form.Select>
                                {errors.type && (
                                    <span className="text-danger">Type is required</span>
                                )}
                            </div>
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
                            disabled={apiLoading}>
                            {apiLoading ? 'Updating...' : 'Update Balance'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    )
}
export default CustomerWallet

const DummyImage = () => (
    <div className="rounded-circle avatar-sm bg-light border-0 d-flex align-items-center justify-content-center">
        <i className="ri-user-3-fill" style={{ fontSize: '20px' }}></i>
    </div>
)

const RealImage = ({ link }: { link: string }) => {
    const BASE_API = import.meta.env.VITE_BASE_API
    const formattedLink = link.replace(/\\/g, '/')

    return (
        <div className="rounded-circle avatar-sm bg-light border-0 d-flex align-items-center justify-content-center">
            <img
                src={`${BASE_API}/${formattedLink}`}
                alt="user"
                className="rounded-circle avatar-sm"
            />
        </div>
    )
}
