import { PageBreadcrumb } from '@/components'
import {
    Button,
    Card,
    Form,
    Table,
    Pagination as BootstrapPagination,
    Modal,
} from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { MdDelete } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'

// basic tables
interface City {
    _id: string
    name: string
}
const PetNames = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    // const canUpdate = isSuperUser || permissions.Users?.Update
    const canDelete = isSuperUser || permissions.Users?.Delete
    const [selectedRows, setSelectedRows] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [sortedAsc, setSortedAsc] = useState(true)
    const [showDeleteButton, setShowDeleteButton] = useState(false)
    const [tags, setTags] = useState<City[]>([])
    const [loading, setLoading] = useState(false)
    const [inputValue, setInputValue] = useState<string>('')
    const [petNames, setPetNames] = useState<string[]>([])

    const [apiLoading, setApiLoading] = useState(false)
    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    const {
        handleSubmit,
        reset,
    } = useForm()

    useEffect(() => {
        setCurrentPage(1)
        setShowDeleteButton(selectedRows.length > 0)
    }, [itemsPerPage, selectedRows])

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(filteredRecords.map((record) => record._id))
        } else {
            setSelectedRows([])
        }
    }
    const handleToggleModal = () => {
        if (isOpen) {
            reset({ name: '' })
        }
        toggleModal()
    }

    const handleSelectRow = (id: any) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        )
    }
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }

    const handleSort = () => {
        setSortedAsc(!sortedAsc)
    }
    const handleAddPetName = () => {
        const trimmedValue = inputValue.trim()
        if (trimmedValue && !petNames.includes(trimmedValue)) {
            setPetNames([...petNames, trimmedValue])
            setInputValue('') // Clear the input field
        }
    }
    const handleRemovePetName = (value: string) => {
        setPetNames(petNames.filter((val) => val !== value))
    }

    const filteredRecords = tags
        .filter((tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
    const [isOpen, toggleModal] = useToggle() 


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
            setTags(data)
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

    const handleAddtags = async (formData: any) => {
        setApiLoading(true)
        try {
            if (petNames.length === 0) {
                throw new Error('Please add at least one location')
            }

            const response = await fetch(`${BASE_API}/api/locations`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    names: petNames
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to add locations')
            }

            Swal.fire({
                title: 'Success!',
                html: `
                <div class="text-left">
                    <p>✅ ${data.created.length} new location added</p>
                    ${data.skipped.length > 0 ?
                        `<p>ℹ️ ${data.skipped.length} location skipped: ${data.skipped.join(', ')}</p>`
                        : ''
                    }
                </div>
            `,
                icon: 'success',
                confirmButtonText: 'Great!'
            })

            toggleModal()
            getAllLocation()
            reset()
            setPetNames([])
        } catch (error: any) {
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error'
            })
        } finally {
            setApiLoading(false)
        }
    }
    const deleteCity = async (tagId: any) => {
        try {
            const id_select = typeof tagId === 'string' ? [tagId] : tagId
            const response = await fetch(`${BASE_API}/api/locations/bulk`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ids: id_select }),
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to delete location(s)')
            }

            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Location(s) deleted successfully',
                    icon: 'success',
                    confirmButtonText: 'OK',
                })
                await getAllLocation()
            }
        } catch (error: any) {
            console.error('Error deleting location(s):', error)
            Swal.fire({
                title: 'Oops!',
                text: error.message,
                icon: 'error',
            })
        }
    }

    const handleDeleteConfirmation = (tagId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This tag will be deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Remove!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteCity(tagId)
            }
        })
    }

    const handleDeleteSelected = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `All the ${selectedRows.length} selected tags will be deleted!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteCity(selectedRows)
            }
        })
    }

    useEffect(() => {
        getAllLocation()
    }, [])
    return (
        <>
            <PageBreadcrumb title="Location" subName="Settings" allowNavigateBack={true} />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Location Management</h4>
                            <p className="text-muted mb-0">
                                Add and Manage your all Location here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
                            <Button
                                style={{ border: 'none' }}
                                variant="success"
                                onClick={toggleModal}>
                                <i className="bi bi-plus"></i> Add New Location
                            </Button>
                            {showDeleteButton && (
                                <Button
                                    variant="danger"
                                    className="ms-sm-2 mt-2 mt-sm-0"
                                    onClick={handleDeleteSelected}>
                                    Delete All Selected
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
                                        placeholder="Search Location here..."
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
                        <Table className="table-striped table-centered mb-0">
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedRows.length === filteredRecords.length}
                                        />{' '}
                                    </th>

                                    <th>
                                        <span onClick={handleSort} style={{ cursor: 'pointer' }}>
                                            Name {sortedAsc ? '↑' : '↓'}
                                        </span>
                                    </th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="text-center">
                                            <div
                                                className="spinner-border text-primary"
                                                role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedRecords.length > 0 ? (
                                    paginatedRecords.map((tag) => {
                                        const isSelected = selectedRows.includes(tag._id)
                                        return (
                                            <tr key={tag._id}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectRow(tag._id)}
                                                    />
                                                </td>
                                                <td>{tag.name}</td>
                                                <td>
                                                    <div className="d-flex">
                                                        <Button
                                                            variant="danger"
                                                            className="ms-2"
                                                            onClick={() => handleDeleteConfirmation(tag._id)}
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
                                        <td colSpan={3} className="text-center">
                                            No Location found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                        <nav className="d-flex justify-content-end mt-3">
                            <BootstrapPagination className="pagination-rounded mb-0">
                                <BootstrapPagination.Prev
                                    onClick={() =>
                                        currentPage > 1 && handlePageChange(currentPage - 1)
                                    }
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
                                    onClick={() =>
                                        currentPage < totalPages &&
                                        handlePageChange(currentPage + 1)
                                    }
                                />
                            </BootstrapPagination>
                        </nav>
                    </div>
                </Card.Body>
                {/* Modal for adding a new category */}
                <Modal
                    show={isOpen}
                    onHide={toggleModal}
                    dialogClassName="modal-dialog-centered">
                    <Modal.Header closeButton>
                        <h4 className="modal-title">Add New Pet</h4>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleSubmit(handleAddtags)}>
                            <Form.Group className="mb-3">
                                <Form.Label>Pet Names</Form.Label>
                                <div className="d-flex">
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter pet name"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddPetName()
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="success"
                                        onClick={handleAddPetName}
                                        className="ms-2">
                                        +
                                    </Button>
                                </div>
                                <small className="text-muted mt-1 d-block">
                                    Enter name and press Enter or click '+' button to add multiple names
                                </small>
                                <div className="selected-values mt-2">
                                    {petNames.map((name, index) => (
                                        <span key={index} className="badge bg-primary me-1">
                                            {name}
                                            <button
                                                type="button"
                                                className="btn-close ms-1"
                                                onClick={() => handleRemovePetName(name)}>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </Form.Group>
                            <Modal.Footer>
                                <Button variant="light" onClick={handleToggleModal}>
                                    Close
                                </Button>
                                <Button variant="soft-success" type="submit">
                                    {apiLoading ? 'Adding...' : 'Save Pet Names'}
                                </Button>
                            </Modal.Footer>
                        </Form>
                    </Modal.Body>
                </Modal>
            </Card>
        </>
    )
}
export default PetNames
