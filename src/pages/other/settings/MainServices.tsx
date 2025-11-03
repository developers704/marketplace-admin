import { FormInput, PageBreadcrumb } from '@/components'
import {
    Button,
    Card,
    Form,
    Table,
    Pagination as BootstrapPagination,
    Modal,
} from 'react-bootstrap'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { SimpleLoader } from '../SimpleLoader'

interface TableRecord {
    _id: number
    name: string
    link: string
    logo?: string
}
const MainService = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Products?.Update
    const canCreate = isSuperUser || permissions.Products?.Create

    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [showDeleteButton, setShowDeleteButton] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [apiLoading, setApiLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [brandsData, setBrandsData] = useState<any[]>([])
    const [editingBrand, setEditingBrand] = useState<TableRecord | null>(null)

    const [isOpen, toggleModal] = useToggle()



    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user
    const {
        handleSubmit,
        register,
        control,
        reset,
        setValue,
        formState: { errors },
    } = useForm()



    const filteredRecords = brandsData
        .filter((record) =>
            record.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name))


    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(brandsData.map((record) => record._id))
        } else {
            setSelectedRows([])
        }
    }
    const handleSelectRow = (id: number) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        )
    }
    const handleBulkDelete = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `All the ${selectedRows.length} selected services will be deleted!`,
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

    const deleteSelectedServices = async (serviceIds: (string | number)[]) => {
        try {
            const response = await fetch(
                `${BASE_API}/api/services/bulk-delete`,
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
                throw new Error('Failed to delete packages')
            }

            getAllServices()
            Swal.fire({
                title: 'Deleted!',
                text: `${serviceIds.length} package(s) deleted successfully.`,
                icon: 'success',
                timer: 1500,
            })
            setSelectedRows([])
        } catch (error: any) {
            Swal.fire('Oops!', 'Packages deletion failed.', 'error')
        }
    }

    const handleSingleDelete = (serviceId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This package will be deleted!',
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
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleToggleModal = () => {
        if (isOpen) {
            reset()
            setSelectedImage(null)
            setEditingBrand(null)
        }
        toggleModal()
    }

    const toggleEditModal = (brand: TableRecord) => {
        setEditingBrand(brand)
        setValue('name', brand.name)
        setValue('link', brand.link)
        toggleModal()
    }
    const getAllServices = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/services`, {
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
            setBrandsData(data) // You can rename this state to servicesData
        } catch (error: any) {
            console.error('Error getting services data:', error)
        } finally {
            setLoading(false)
        }
    }
    const handleAddService = async (serviceData: any) => {
        const formData = new FormData()
        formData.append('name', serviceData.name)
        formData.append('link', serviceData.link)
        if (selectedImage) {
            formData.append('image', selectedImage)
        }

        try {
            setApiLoading(true)
            const response = await fetch(`${BASE_API}/api/services`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to add new Service')
            }

            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: 'ADDED!',
                    text: 'Service added successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    timer: 1500,
                })
                getAllServices()
                handleToggleModal()
            }
        } catch (error: any) {
            console.error('Error adding service:', error)
            Swal.fire({
                title: 'Oops!',
                text: error.message,
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setApiLoading(false)
        }
    }
    const handleUpdateService = async (serviceData: any) => {
        const formData = new FormData()
        formData.append('name', serviceData.name)
        formData.append('link', serviceData.link)
        if (selectedImage) {
            formData.append('image', selectedImage)
        }

        try {
            setApiLoading(true)
            const response = await fetch(
                `${BASE_API}/api/services/${editingBrand?._id}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            )

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to Update Service')
            }

            const data_res = await response.json()
            if (data_res) {
                handleToggleModal()
                await getAllServices()
                Swal.fire({
                    title: 'Updated!',
                    text: 'Service updated successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    timer: 1500,
                })
                reset()
                setEditingBrand(null)
            }
        } catch (error: any) {
            console.error('Error Updating Service:', error)
            Swal.fire({
                title: 'Oops!',
                text: error.message,
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setApiLoading(false)
        }
    }


    useEffect(() => {
        if (!isOpen) {
            reset()
            setSelectedImage(null)
            setEditingBrand(null)
        }
    }, [isOpen, reset])

    useEffect(() => {
        if (editingBrand) {
            setValue('name', editingBrand.name)
        } else {
            reset({ name: '' })
        }
    }, [editingBrand, setValue, reset])

    useEffect(() => {
        getAllServices()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
        setShowDeleteButton(selectedRows.length > 0)
    }, [itemsPerPage, selectedRows])

    if (loading) {
        return <SimpleLoader />
    }

    return (
        <>
            <PageBreadcrumb title="Main Services" subName="Settings" allowNavigateBack={true} />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Main Service Management</h4>
                            <p className="text-muted mb-0">
                                Add and Manage your all Main Services here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">

                            <Button
                                style={{ border: 'none' }}
                                variant="success"
                                disabled={true}
                                onClick={toggleModal}
                                className="mb-2 mb-sm-0">
                                <i className="bi bi-plus"></i> Add New Service
                            </Button>
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
                                        placeholder="Search Services here..."
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
                                            checked={selectedRows?.length === brandsData.length}
                                        />{' '}
                                    </th>
                                    <th>Image</th>
                                    <th>
                                        Name
                                    </th>
                                    <th>Link</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRecords.length > 0 ? (
                                    (paginatedRecords || [])?.map((record, idx) => {
                                        const isSelected = selectedRows?.includes(record._id)

                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectRow(record._id)}
                                                    />
                                                </td>
                                                <td className="table-user">
                                                    {record?.image ? (
                                                        <img
                                                            src={`${BASE_API}/${record.image}`}
                                                            alt="brands"
                                                            className="me-2 rounded-circle"
                                                        />
                                                    ) : (
                                                        ''
                                                    )}
                                                </td>
                                                <td>{record.name}</td>
                                                <td>{record?.link}</td>
                                                <td>
                                                    <div className="d-flex">
                                                        <Button
                                                            variant="secondary"
                                                            disabled={!canUpdate}
                                                            onClick={() => toggleEditModal(record)}>
                                                            <MdEdit />
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            className="ms-2"
                                                            onClick={() => handleSingleDelete(record._id.toString())}
                                                            disabled={true}>
                                                            <MdDelete />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center">
                                            No records found
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
            </Card>
            <Modal
                show={isOpen}
                onHide={handleToggleModal}
                dialogClassName="modal-dialog-centered">
                <Modal.Header closeButton>
                    <h4 className="modal-title">
                        {editingBrand ? 'Update Service' : 'Add New Service'}
                    </h4>
                </Modal.Header>
                <Form
                    onSubmit={handleSubmit(
                        editingBrand ? handleUpdateService : handleAddService
                    )}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <FormInput
                                label="Name"
                                type="text"
                                name="name"
                                containerClass="mb-3"
                                register={register}
                                placeholder="Enter Service Name here.."
                                errors={errors}
                                control={control}
                            />
                            <FormInput
                                label="Link"
                                type="text"
                                name="link"
                                containerClass="mb-3"
                                register={register}
                                placeholder="Enter Link here.."
                                errors={errors}
                                control={control}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>
                                {editingBrand ? 'Upload New Image' : 'Upload Image'}
                            </Form.Label>
                            <div className="mb-2">
                                <p
                                    style={{ fontSize: '0.8rem' }}
                                    className="text-danger mb-0">
                                    {'File Size: Upload images up to 5 MB.'}
                                </p>
                                <p
                                    style={{ fontSize: '0.8rem' }}
                                    className="text-danger mb-0">
                                    {'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
                                </p>
                                <p
                                    style={{ fontSize: '0.8rem' }}
                                    className="text-danger mb-0">
                                    {'Upload Limit: Only 1 image can be uploaded.'}
                                </p>
                            </div>
                            <SingleFileUploader
                                icon="ri-upload-cloud-2-line"
                                text="Drop file here or click to upload a service image."
                                onFileUpload={(file: File) => setSelectedImage(file)}
                            />
                            {editingBrand?.logo && (
                                <div className="mt-3 d-flex flex-column">
                                    <Form.Label>Current Image</Form.Label>
                                    <img
                                        src={`${BASE_API}/${editingBrand.logo}`}
                                        alt="Brand"
                                        className="img-thumbnail mb-3"
                                        style={{ width: '100px', height: '100px' }}
                                    />
                                </div>
                            )}
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={handleToggleModal}>
                            Close
                        </Button>
                        <Button
                            variant="soft-success"
                            type="submit"
                            disabled={editingBrand ? !canUpdate : !canCreate}>
                            {apiLoading
                                ? editingBrand
                                    ? 'Updating...'
                                    : 'Adding...'
                                : editingBrand
                                    ? 'Update Service'
                                    : 'Save Service'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    )
}

export default MainService
