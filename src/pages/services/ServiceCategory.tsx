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
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { TableRowSkeleton } from '@/pages/other/SimpleLoader'
import Select from 'react-select'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import { toastService } from '@/common/context/toast.service'



interface TableRecord {
    _id: number
    name: string
    type: string
    description: string
    image: string
}

const TYPE_OPTIONS = [
    { value: 'inventory', label: 'Inventory' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'packages-gws', label: 'Packages-GWS' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'tool finding', label: 'Tool Finding' }
]

const ServiceCategory = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Products?.Update
    const canDelete = isSuperUser || permissions.Products?.Delete
    const canCreate = isSuperUser || permissions.Products?.Create

    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [showDeleteButton, setShowDeleteButton] = useState(false)
    const [apiLoading, setApiLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [specialitiesData, setSpecialitiesData] = useState<any[]>([])
    const [editingSpeciality, setEditingSpeciality] = useState<TableRecord | null>(null)
    const [isOpen, toggleModal] = useToggle()
    const [selectedImage, setSelectedImage] = useState<File | null>(null)


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

    const filteredRecords = specialitiesData
        ?.filter((record) =>
            record?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a?.name?.localeCompare(b?.name))

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(specialitiesData?.map((record) => record?._id))
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
            text: `All the ${selectedRows.length} selected specialities will be deleted!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: "#9c5100",
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSelectedSpecialities(selectedRows)
            }
        })
    }

    const handleSingleDelete = (specialityId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This Service Category will be deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: "#9c5100",
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSelectedSpecialities([specialityId])
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

    const handleToggleModal = () => {
        if (isOpen) {
            reset({ name: '' })
            setEditingSpeciality(null)
        }
        toggleModal()
    }

    const toggleEditModal = (speciality: TableRecord) => {
        setEditingSpeciality(speciality)
        setValue('name', speciality.name)
        setValue('type', {
            value: speciality.type,
            label: TYPE_OPTIONS.find(opt => opt.value === speciality.type)?.label
        })
        setValue('description', speciality.description)
        toggleModal()
    }

    // ************************ apis call ***********************
    const getAllSpecialities = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/special-categories`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get specialities')
            }
            const data = await response.json()
            setSpecialitiesData(data)
        } catch (error: any) {
            console.error('Error getting specialities data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddSpeciality = async (specialityData: any) => {
        const formData = new FormData();
        formData.append('name', specialityData.name);
        formData.append('type', specialityData.type.value);
        formData.append('description', specialityData.description);
        if (selectedImage) {
            formData.append('image', selectedImage);
        }
        console.log("formData", formData);

        try {
            setApiLoading(true);
            const response = await fetch(`${BASE_API}/api/special-categories`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to add new Service Category')
            }

            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: 'ADDED!',
                    text: 'Service Category added successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    timer: 1500,
                    confirmButtonColor: "#9c5100",
                })
                getAllSpecialities()
                handleToggleModal()
            }
        } catch (error: any) {
            console.error('Error adding Service Category:', error)
            Swal.fire({
                title: 'Oops!',
                text: error.message,
                icon: 'error',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
        } finally {
            setApiLoading(false)
        }
    }

    const handleUpdateSpeciality = async (specialityData: any) => {
        const formData = new FormData();
        formData.append('name', specialityData.name);
        formData.append('type', specialityData.type.value);
        formData.append('description', specialityData.description);
        if (selectedImage) {
            formData.append('image', selectedImage);
        }
        try {
            setApiLoading(true);
            const response = await fetch(
                `${BASE_API}/api/special-categories/${editingSpeciality?._id}`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to Update Service Category')
            }

            const data_res = await response.json()
            if (data_res) {
                handleToggleModal()
                await getAllSpecialities()
                Swal.fire({
                    title: 'Updated!',
                    text: 'Service Category updated successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    timer: 1500,
                    confirmButtonColor: "#9c5100",
                })
                reset()
                setEditingSpeciality(null)
            }
        } catch (error: any) {
            console.error('Error Updating Service Category:', error)
            Swal.fire({
                title: 'Oops!',
                text: error.message,
                icon: 'error',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
        } finally {
            setApiLoading(false)
        }
    }
    const deleteSelectedSpecialities = async (specialityIds: (string | number)[]) => {
        try {
            const response = await fetch(
                `${BASE_API}/api/special-categories/bulk-delete`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ids: specialityIds.map(id => id.toString())
                    }),
                }
            )

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || errorMessage.error || 'Failed to delete Service Category')
            }

            getAllSpecialities()
            Swal.fire({
                title: 'Deleted!',
                text: `${specialityIds.length} Service Category(s) deleted successfully.`,
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
            setSelectedRows([])
        } catch (error: any) {
            toastService.error(error.message)
        }
    }


    // ************************ renders*******************************
    useEffect(() => {
        if (!isOpen) {
            reset()
            setEditingSpeciality(null)
        }
    }, [isOpen, reset])

    useEffect(() => {
        if (editingSpeciality) {
            setValue('name', editingSpeciality.name)
        } else {
            reset({ name: '' })
        }
    }, [editingSpeciality, setValue, reset])

    useEffect(() => {
        getAllSpecialities()
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
        { width: '100px', type: 'text' },
        { width: '100px', type: 'actions' }
    ]

    return (
        <>
            <PageBreadcrumb title="Special Category" subName="Specials" allowNavigateBack={true} />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Special Category</h4>
                            <p className="text-muted mb-0">
                                Add and Manage Special Category here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
                            <Button
                                style={{ border: 'none' }}
                                variant="success"
                                disabled={!canCreate}
                                onClick={toggleModal}
                                className="mb-2 mb-sm-0">
                                <i className="bi bi-plus"></i> Add New Special Category
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
                                        placeholder="Search here..."
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
                                            checked={selectedRows.length > 0 && selectedRows.length === specialitiesData.length}
                                        />
                                    </th>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={storeHeaders} rowCount={3} />
                                ) :
                                    paginatedRecords?.length > 0 ? (
                                        paginatedRecords?.map((record, idx) => {
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
                                                    <td>

                                                        {record.image ? (
                                                            <img
                                                                src={`${BASE_API}${record.image}`}
                                                                alt={record.name}
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
                                                    <td>{record?.name}</td>
                                                    <td>{record?.type}</td>
                                                    <td>{record?.description}</td>
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
                                            <td colSpan={6} className="text-center">
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
            <Modal
                show={isOpen}
                onHide={handleToggleModal}
                dialogClassName="modal-dialog-centered">
                <Modal.Header closeButton>
                    <h4 className="modal-title">
                        {editingSpeciality ? 'Update Special Category' : 'Add New Special Category'}
                    </h4>
                </Modal.Header>
                <Form
                    onSubmit={handleSubmit(
                        editingSpeciality ? handleUpdateSpeciality : handleAddSpeciality
                    )}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <FormInput
                                label="Name"
                                type="text"
                                name="name"
                                required
                                containerClass="mb-3"
                                register={register}
                                placeholder="Enter Name here.."
                                errors={errors}
                                control={control}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Type</Form.Label>
                            <Controller
                                name="type"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={TYPE_OPTIONS}
                                        className="react-select"
                                        classNamePrefix="react-select"
                                    />
                                )}
                            />
                        </Form.Group>
                        <FormInput
                            label="Description"
                            type="textarea"
                            name="description"
                            required
                            containerClass="mb-3"
                            register={register}
                            placeholder="Enter Description here.."
                            errors={errors}
                            control={control}
                        />
                        <Form.Group className="mb-2">
                            <Form.Label>
                                {editingSpeciality ? 'Upload New Image' : 'Upload Image'}
                            </Form.Label>
                            <div className="mb-2">
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    {'File Size: Upload images up to 5 MB.'}
                                </p>
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    {'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
                                </p>
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    {'Upload Limit: Only 1 image can be uploaded.'}
                                </p>
                            </div>
                            <SingleFileUploader
                                icon="ri-upload-cloud-2-line"
                                text="Drop file here or click to upload a category image."
                                onFileUpload={(file: File) => setSelectedImage(file)}
                            />
                            {editingSpeciality?.image && (
                                <div className="mt-3 d-flex flex-column">
                                    <Form.Label>Current Image</Form.Label>
                                    <img
                                        src={`${BASE_API}/${editingSpeciality.image}`}
                                        alt="Category"
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
                            disabled={editingSpeciality ? !canUpdate : !canCreate}>
                            {apiLoading
                                ? editingSpeciality
                                    ? 'Updating...'
                                    : 'Adding...'
                                : editingSpeciality
                                    ? 'Update Special Category'
                                    : 'Save Special Category'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal >
        </>
    )
}

export default ServiceCategory

