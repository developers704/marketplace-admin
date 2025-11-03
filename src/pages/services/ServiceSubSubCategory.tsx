import { PageBreadcrumb } from '@/components'
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
import { useForm, Controller } from 'react-hook-form'
import { useEffect, useState, useMemo } from 'react'
import { TableRowSkeleton } from '@/pages/other/SimpleLoader'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import Select from 'react-select'
import { toastService } from '@/common/context/toast.service'

interface TableRecord {
    _id: string
    name: string
    image: string
    serviceSubCategory: {
        _id: string
        name: string
        serviceCategory: {
            _id: string
            name: string
        }
    }
}

interface SelectOption {
    value: string
    label: string
}

const ServiceSubSubCategory = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Products?.Update
    const canDelete = isSuperUser || permissions.Products?.Delete
    const canCreate = isSuperUser || permissions.Products?.Create

    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [showDeleteButton, setShowDeleteButton] = useState(false)
    const [apiLoading, setApiLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [subCategoriesData, setSubCategoriesData] = useState<TableRecord[]>([])
    const [editingSubCategory, setEditingSubCategory] = useState<TableRecord | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [categories, setCategories] = useState<any[]>([])
    const [subCategories, setSubCategories] = useState<any[]>([])
    const [selectedCategory, setSelectedCategory] = useState<SelectOption | null>(null)
    const [selectedSubCategory, setSelectedSubCategory] = useState<SelectOption | any>(null)

    const [isOpen, toggleModal] = useToggle()

    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user
    const {
        handleSubmit,
        register,
        reset,
        control,
        setValue,
    } = useForm()

    const categoryOptions = useMemo(() =>
        categories.map(cat => ({
            value: cat._id,
            label: cat.name
        })), [categories])

    const filteredSubCategoryOptions = useMemo(() => {
        if (!selectedCategory) return []
        return subCategories
            .filter(subCat => subCat?.serviceCategory?._id === selectedCategory?.value)
            .map(subCat => ({
                value: subCat?._id,
                label: subCat?.name
            }))
    }, [selectedCategory, subCategories])

    const filteredRecords = subCategoriesData
        ?.filter((record) =>
            record?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a?.name?.localeCompare(b?.name))

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRows(event.target.checked ? subCategoriesData?.map(record => record?._id) : [])
    }

    const handleSelectRow = (id: string) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        )
    }

    const handleBulkDelete = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `All the ${selectedRows.length} selected items will be deleted!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: "#9c5100",
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSelectedSubCategories(selectedRows)
            }
        })
    }

    const handleSingleDelete = (id: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This Sub Category will be deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: "#9c5100",
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSelectedSubCategories([id])
            }
        })
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }

    const totalPages = Math.ceil(filteredRecords?.length / itemsPerPage)
    const paginatedRecords = filteredRecords?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleToggleModal = () => {
        if (isOpen) {
            reset()
            setEditingSubCategory(null)
            setSelectedFile(null)
            setSelectedCategory(null)
            setSelectedSubCategory(null)
        }
        toggleModal()
    }

    const toggleEditModal = (subCategory: TableRecord) => {
        setEditingSubCategory(subCategory)
        setValue('name', subCategory?.name)

        const category = {
            value: subCategory?.serviceSubCategory?.serviceCategory?._id,
            label: subCategory?.serviceSubCategory?.serviceCategory?.name
        }
        const subCat = {
            value: subCategory?.serviceSubCategory?._id,
            label: subCategory?.serviceSubCategory?.name
        }

        setSelectedCategory(category)
        setSelectedSubCategory(subCat)
        toggleModal()
    }

    const getAllData = async () => {
        try {
            setLoading(true)
            const [subSubCategoriesResponse, categoriesResponse, subCategoriesResponse] = await Promise.all([
                fetch(`${BASE_API}/api/service-sub-subcategories`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${BASE_API}/api/service-categories`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${BASE_API}/api/service-subcategories`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ])

            if (!subSubCategoriesResponse.ok || !categoriesResponse.ok || !subCategoriesResponse.ok) {
                throw new Error('Failed to fetch data')
            }

            const [subSubCategories, categories, subCategories] = await Promise.all([
                subSubCategoriesResponse.json(),
                categoriesResponse.json(),
                subCategoriesResponse.json()
            ])

            setSubCategoriesData(subSubCategories)
            setCategories(categories)
            setSubCategories(subCategories)
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleAddSubCategory = async (formData: any) => {
        try {
            setApiLoading(true)
            const payload = new FormData()
            payload.append('name', formData?.name)
            payload.append('serviceSubCategory', formData?.serviceSubCategory)
            if (selectedFile) {
                payload.append('image', selectedFile)
            }

            const response = await fetch(`${BASE_API}/api/service-sub-subcategories`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: payload
            })
            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message)
            }

            Swal.fire({
                title: 'Success',
                text: 'Sub Category added successfully!',
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
            getAllData()
            handleToggleModal()
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error')
        } finally {
            setApiLoading(false)
        }
    }

    const handleUpdateSubCategory = async (formData: any) => {
        try {
            setApiLoading(true)
            const payload = new FormData()
            payload.append('name', formData?.name)
            payload.append('serviceSubCategory', selectedSubCategory?.value)
            if (selectedFile) {
                payload.append('image', selectedFile)
            }

            const response = await fetch(
                `${BASE_API}/api/service-sub-subcategories/${editingSubCategory?._id}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: payload
                }
            )

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message)
            }

            Swal.fire({
                title: 'Updated!',
                text: 'Sub Category updated successfully!',
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
            getAllData()
            handleToggleModal()
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error')
        } finally {
            setApiLoading(false)
        }
    }

    const deleteSelectedSubCategories = async (ids: string[]) => {
        try {
            const response = await fetch(
                `${BASE_API}/api/service-sub-subcategories/bulk-delete`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ ids })
                }
            )

            if (!response.ok) {
                throw new Error('Failed to delete')
            }

            getAllData()
            setSelectedRows([])
            Swal.fire({
                title: 'Deleted!',
                text: `${ids.length} item(s) deleted successfully.`,
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            })
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error')
        }
    }

    useEffect(() => {
        getAllData()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
        setShowDeleteButton(selectedRows.length > 0)
    }, [itemsPerPage, selectedRows])

    const categoryHeaders: any = [
        { width: '20px', type: 'checkbox' },
        { width: '80px', type: 'image' },
        { width: '100px', type: 'text' },
        { width: '120px', type: 'text' },
        { width: '100px', type: 'actions' }
    ]
    return (
        <>
            <PageBreadcrumb title="Service Sub Categories" subName="Services" allowNavigateBack={true} />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Service Sub Sub-Categories</h4>
                            <p className="text-muted mb-0">Manage Service Sub Sub Categories</p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <Button
                                variant="success"
                                disabled={!canCreate}
                                onClick={handleToggleModal}
                                className="me-2">
                                <i className="bi bi-plus"></i> Add New
                            </Button>
                            {showDeleteButton && (
                                <Button
                                    variant="danger"
                                    onClick={handleBulkDelete}>
                                    Delete Selected ({selectedRows?.length})
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
                    <Table responsive className="table-centered">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={selectedRows?.length > 0 && selectedRows?.length === subCategoriesData?.length}
                                    />
                                </th>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Sub-Category</th>
                                <th>Main Category</th>
                                <th>Link</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableRowSkeleton headers={categoryHeaders} rowCount={3} />
                            ) : paginatedRecords?.length > 0 ? (
                                paginatedRecords?.map((record) => (
                                    <tr key={record?._id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedRows?.includes(record?._id)}
                                                onChange={() => handleSelectRow(record?._id)}
                                            />
                                        </td>
                                        <td>
                                            {record?.image ? (
                                                <img
                                                    src={`${BASE_API}/${record?.image}`}
                                                    alt={record?.name}
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
                                        <td>{record?.serviceSubCategory?.name}</td>
                                        <td>{record?.serviceSubCategory?.serviceCategory?.name}</td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <code className="text-primary">{`/services/${record._id}`}</code>
                                                <i
                                                    className="ri-file-copy-line ms-2"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`/services/${record._id}`);
                                                        toastService.success('Link copied to clipboard!');
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                    title="Click to copy link"
                                                />
                                                <i
                                                    className="ri-information-line ms-1"
                                                    title="Use this link to navigate to service specific page"
                                                    style={{ cursor: 'help' }}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <Button
                                                variant="secondary"
                                                disabled={!canUpdate}
                                                onClick={() => toggleEditModal(record)}
                                                className="me-2">
                                                <MdEdit />
                                            </Button>
                                            <Button
                                                variant="danger"
                                                disabled={!canDelete}
                                                onClick={() => handleSingleDelete(record?._id)}>
                                                <MdDelete />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
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

                            {currentPage > 2 && (
                                <>
                                    <BootstrapPagination.Item onClick={() => handlePageChange(1)}>
                                        1
                                    </BootstrapPagination.Item>
                                    {currentPage > 3 && <BootstrapPagination.Ellipsis />}
                                </>
                            )}

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

            <Modal show={isOpen} onHide={handleToggleModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingSubCategory ? 'Edit Sub Sub-Category' : 'Add New Sub Sub-Category'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit(editingSubCategory ? handleUpdateSubCategory : handleAddSubCategory)}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Category</Form.Label>
                            <Controller
                                name="category"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={categoryOptions}
                                        value={selectedCategory}
                                        onChange={(option) => {
                                            setSelectedCategory(option)
                                            setSelectedSubCategory(null)
                                            field.onChange(option?.value)
                                        }}
                                        isClearable
                                        placeholder="Select Category"
                                    />
                                )}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Sub Category</Form.Label>
                            <Controller
                                name="serviceSubCategory"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={filteredSubCategoryOptions}
                                        value={selectedSubCategory}
                                        onChange={(option) => {
                                            setSelectedSubCategory(option)
                                            field.onChange(option?.value)
                                        }}
                                        isClearable
                                        isDisabled={!selectedCategory}
                                        placeholder="Select Sub Category"
                                    />
                                )}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                required
                                type="text"
                                placeholder="Enter name"
                                {...register('name')}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Image</Form.Label>
                            <div className="mb-2">
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    File Size: Upload images up to 5 MB.
                                </p>
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).
                                </p>
                            </div>
                            <SingleFileUploader
                                icon="ri-upload-cloud-2-line"
                                text="Drop file here or click to upload an image."
                                onFileUpload={(file: File) => setSelectedFile(file)}
                            />
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="light" onClick={handleToggleModal}>
                            Close
                        </Button>
                        <Button
                            variant="success"
                            type="submit"
                            disabled={apiLoading}>
                            {apiLoading
                                ? 'Saving...'
                                : editingSubCategory
                                    ? 'Update Sub Sub-Category'
                                    : 'Save Sub Sub-Category'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    )
}

export default ServiceSubSubCategory
