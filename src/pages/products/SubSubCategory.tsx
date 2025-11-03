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
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useRef, useState } from 'react'
import { FaDownload, FaFileCsv } from 'react-icons/fa6'
import { TableRowSkeleton } from '../other/SimpleLoader'
import Select from 'react-select'
import { toastService } from '@/common/context/toast.service'
interface TableRecord {
    _id: number
    name: string
    description?: string
    isNotShowed?: string
    animal?: string
    productCount?: string
    image?: string
    cell?: string
    activeClass?: string
    parentSubCategory?: any
    parentCategory?: any
}

const SubCategory = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Products?.Update
    const canDelete = isSuperUser || permissions.Products?.Delete
    const canCreate = isSuperUser || permissions.Products?.Create
    // const canView = isSuperUser || permissions.Products?.View

    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [sortedAsc, setSortedAsc] = useState(true)
    const [showDeleteButton, setShowDeleteButton] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [parentCategories, setParentCategories] = useState<TableRecord[]>([])
    const [apiLoading, setApiLoading] = useState(false)
    const [subCategoryData, setSubCategoryData] = useState<TableRecord[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [editingSubCategory, setEditingSubCategory] =
        useState<TableRecord | null>(null)
    const [isOpen, toggleModal] = useToggle()
    const [categories, setCategories] = useState<TableRecord[]>([])
    const [filteredSubCategories, setFilteredSubCategories] = useState<TableRecord[]>([])

    const [isExportingSubcategories, setIsExportingSubcategories] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0)
    const [showUploadModal, setShowUploadModal] = useState(false)
    

    const BASE_API = import.meta.env.VITE_BASE_API
    const token = user.token
    const {
        handleSubmit,
        register,
        control,
        reset,
        setValue,
        formState: { errors },
    } = useForm()

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(subCategoryData?.map((record) => record?._id))
        } else {
            setSelectedRows([])
        }
    }

    const handleSelectRow = (_id: number) => {
        setSelectedRows((prev) =>
            prev.includes(_id)
                ? prev.filter((row_id) => row_id !== _id)
                : [...prev, _id]
        )
    }
    const truncateText = (text: any, limit: number = 50) => {
        if (!text) return '';
        return text.length > limit ? `${text.substring(0, limit)}...` : text;
    }

    const handleDeleteSelected = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `All the ${selectedRows.length} selected items will be deleted!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSelectedSubCategory(selectedRows.map(String))
            }
        })
    }

    // Add this function inside the SubCategory component

    const handleDeleteConfirmation = (id: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This item will be deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Remove!'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSelectedSubCategory(id) // Passing id directly without Number conversion
            }
        })
    }


    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }

    const handleSort = () => {
        setSortedAsc(!sortedAsc)
    }
    const filteredRecords = subCategoryData?.filter((record) =>
        record?.name?.toLowerCase().includes(searchTerm?.toLowerCase())
    )
        .sort((a, b) =>
            sortedAsc ? a?.name?.localeCompare(b?.name) : b?.name?.localeCompare(a?.name)
        )

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const toggleEditModal = (subCategory: TableRecord) => {
        setEditingSubCategory(subCategory)
        setValue('name', subCategory?.name)
        setValue('description', subCategory?.description)
        setValue('mainCategory', {
            value: subCategory?.parentSubCategory?.parentCategory?._id,
            label: subCategory?.parentSubCategory?.parentCategory?.name
        })
        setValue('parentSubCategory', {
            value: subCategory?.parentSubCategory?._id,
            label: subCategory?.parentSubCategory?.name
        })
        toggleModal()
    }

    // ****************** submit functions **********************
    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch(
                `${BASE_API}/api/categories/download-subsubcategories-template`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                throw { status: response.status }
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'sub-subcategories-template.csv'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            toastService.success('Template downloaded successfully')

        } catch (error: any) {
            toastService.error({
                status: error.status,
                message: 'Failed to download template'
            })
        }
    }

    const handleExportSubcategories = async () => {
        setIsExportingSubcategories(true);
        try {
            const response = await fetch(`${BASE_API}/api/categories/download-subsubcat`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw { status: response.status }
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sub-subcategories.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toastService.success('Sub-subcategories exported successfully');
        } catch (error: any) {
            console.error('Error exporting sub-subcategories:', error);
            toastService.error({
                status: error.status,
                message: 'Failed to export sub-subcategories'
            })
        } finally {
            setIsExportingSubcategories(false);
        }
    };

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.csv')) {
            toastService.error('Please upload a CSV file')
            return
        }

        const formData = new FormData()
        formData.append('file', file)

        try {
            setApiLoading(true)
            setShowUploadModal(true)

            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval)
                        return 90
                    }
                    return prev + 10
                })
            }, 1000)
            const response = await fetch(
                `${BASE_API}/api/categories/subsub/bulk-upload`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            )
            clearInterval(progressInterval)
            setUploadProgress(100)

            if (!response.ok) {
                throw { status: response.status }
            }

            const response_data = await response.json()

            // Success notification with details
            // toastService.success(`${response_data.created} sub-subcategories created successfully`)

            // Show detailed success modal if there are skipped items
            if (response_data.skipped > 0) {
                Swal.fire({
                    title: 'Upload Complete!',
                    html: `
                    <div class="text-left">
                        <p>✅ ${response_data.created} sub-subcategories created successfully</p>
                        <p>ℹ️ ${response_data.skipped} sub-subcategories skipped</p>
                    </div>
                    `,
                    icon: 'success',
                    confirmButtonText: 'Great!',
                })
            }

            await getAllSubCategories()

        } catch (error: any) {
            toastService.error({
                status: error.status,
                message: 'Failed to upload sub-subcategories'
            })
        } finally {
            setApiLoading(false)
            setShowUploadModal(false)
            setUploadProgress(0)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }
    const handleAddSubCategory = async (data: any) => {
        const formData = new FormData()
        formData.append('name', data.name)
        formData.append('description', data.description)
        formData.append('parentSubCategory', data.parentSubCategory.value)
        if (selectedImage) {
            formData.append('image', selectedImage)
        }

        try {
            setApiLoading(true)
            const response = await fetch(`${BASE_API}/api/categories/subsubcategory`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            if (response.ok) {
                Swal.fire({
                    title: 'Success',
                    text: 'Sub-sub category added successfully',
                    icon: 'success',
                    timer: 1500,
                })
                getAllSubCategories()
                toggleModal()
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to add sub-sub category',
                icon: 'error',
            })
        } finally {
            setApiLoading(false)
        }
    }
    const handleUpdateSubCategory = async (data: any) => {
        const formData = new FormData()
        formData.append('name', data.name)
        formData.append('description', data.description)
        formData.append('parentSubCategory', data.parentSubCategory.value)
        if (selectedImage) {
            formData.append('image', selectedImage)
        }

        try {
            setApiLoading(true)
            const response = await fetch(
                `${BASE_API}/api/categories/subsubcategory/${editingSubCategory?._id}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            )

            if (response.ok) {
                Swal.fire({
                    title: 'Updated!',
                    text: 'Sub-sub category updated successfully!',
                    icon: 'success',
                    timer: 1500,
                })
                getAllSubCategories()
                toggleModal()
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to update sub-sub category',
                icon: 'error',
            })
        } finally {
            setApiLoading(false)
        }
    }
    const deleteSelectedSubCategory = async (ids: string | string[]) => {
        // Convert single id to array if needed
        const idsToDelete = Array.isArray(ids) ? ids : [ids]

        try {
            const response = await fetch(
                `${BASE_API}/api/categories/subsubcategories`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ ids: idsToDelete })
                }
            )

            if (!response.ok) {
                throw new Error('Failed to delete categories')
            }

            getAllSubCategories()

            Swal.fire({
                title: 'Deleted!',
                text: idsToDelete.length > 1
                    ? `All ${idsToDelete.length} selected items deleted successfully.`
                    : 'Item deleted successfully.',
                icon: 'success',
                timer: 1500,
            })
        } catch (error: any) {
            Swal.fire({
                title: 'Oops!',
                text: 'Deletion failed.',
                icon: 'error',
                timer: 1500,
            })
        }
    }

    // ******************* get functions *********************
    const getCategories = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/categories/category`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get categories')
            }

            if (response.ok) {
                const data = await response.json()
                setCategories(data)
            }
        } catch (error: any) {
            console.error('Error updating user Password:', error)
        } finally {
            setLoading(false)
        }
    }
    const getParentCategory = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_API}/api/categories/subcategory`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to get sub categories');
            }
            const data = await response.json();
            setParentCategories(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }
    const getAllSubCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_API}/api/categories/subsubcategory`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to get sub-sub categories');
            }

            const data = await response.json();
            setSubCategoryData(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }
    // Add useEffect for form reset on modal close
    useEffect(() => {
        if (!isOpen) {
            reset({
                name: '',
                description: '',
                mainCategory: null,
                parentSubCategory: null
            })
            setSelectedImage(null)
            setEditingSubCategory(null)
            setFilteredSubCategories([])
        }
    }, [isOpen, reset])


    useEffect(() => {
        getAllSubCategories()
        getParentCategory()
        getCategories()
    }, [])
    useEffect(() => {
        setShowDeleteButton(selectedRows.length > 0)
    }, [selectedRows])

    useEffect(() => {
        setCurrentPage(1)
    }, [itemsPerPage])
    const categoryHeaders: any = [
        { width: '20px', type: 'checkbox' },
        { width: '80px', type: 'image' },
        { width: '100px', type: 'text' },
        { width: '120px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '100px', type: 'actions' }
    ]

    // ************ renders UI ******************************8
    return (
        <>
            <PageBreadcrumb title="Sub Sub-Category" subName="Products" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Sub Sub-Category Management</h4>
                            <p className="text-muted mb-0">
                                Add and Manage your all Product sub sub-categories here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
                            <Button
                                className="btn btn-success mt-3 mt-lg-0 me-2"
                                onClick={handleExportSubcategories}
                                disabled={isExportingSubcategories}
                            >
                                {isExportingSubcategories ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status" />
                                        Downloading...
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-download-2-line me-1"></i>
                                        Export Sub Sub-Categories
                                    </>
                                )}
                            </Button>

                            <Button
                                disabled={!canCreate || apiLoading}
                                variant="success"
                                className="d-flex align-items-center mb-2 mb-sm-0"
                                onClick={() => fileInputRef.current?.click()}>
                                <FaFileCsv className="me-2" />
                                {apiLoading ? 'Uploading...' : 'Bulk Import Sub SubCategory'}
                            </Button>
                            <input
                                type="file"
                                accept=".csv"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <Button
                                disabled={!canCreate}
                                style={{ border: 'none' }}
                                variant="success"
                                onClick={() => toggleModal()}
                                className="mb-2 mb-sm-0">
                                <i className="bi bi-plus"></i> Add New Sub Sub-Category
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
                        <div className='d-flex flex-column flex-lg-row justify-content-between align-items-lg-center'>
                            <Button
                                variant="info"
                                className="d-flex align-items-center mb-2 mb-sm-0 me-2"
                                onClick={handleDownloadTemplate}>
                                <FaDownload className="me-2" />
                                Download Template
                            </Button>
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
                                            checked={selectedRows?.length === subCategoryData?.length}
                                        />{' '}
                                    </th>

                                    <th>Image</th>
                                    <th>Main Category</th>
                                    <th>Sub Category</th>
                                    <th>
                                        <span onClick={handleSort} style={{ cursor: 'pointer' }}>
                                            Sub Sub-Category {sortedAsc ? '↑' : '↓'}
                                        </span>
                                    </th>
                                    <th>Description</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={categoryHeaders} rowCount={6} />
                                ) :

                                    paginatedRecords?.length > 0 ? (
                                        (paginatedRecords || [])?.map((record, _idx) => {
                                            const isSelected = selectedRows.includes(record?._id)
                                            return (
                                                <tr key={_idx}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectRow(record?._id)}
                                                        />
                                                    </td>

                                                    <td className="table-user">
                                                        {record?.image ? (
                                                            <img
                                                                src={`${BASE_API}/uploads/images/${record?.image}`}
                                                                alt="category"
                                                                className="me-2 rounded-circle"
                                                            />
                                                        ) : (
                                                            ''
                                                        )}
                                                    </td>
                                                    <td>{record?.parentSubCategory?.parentCategory?.name}</td>
                                                    <td>{record?.parentSubCategory?.name}</td>
                                                    <td>{record?.name}</td>
                                                    <td title={record?.description}>{truncateText(record?.description)}</td>
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
                                                                onClick={() =>
                                                                    handleDeleteConfirmation(record?._id?.toString())
                                                                }
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

                <Modal show={isOpen} onHide={toggleModal} dialogClassName="modal-dialog-centered">
                    <Modal.Header closeButton>
                        <h4 className="modal-title">
                            {editingSubCategory ? 'Update Sub-Sub Category' : 'Add New Sub-Sub Category'}
                        </h4>
                    </Modal.Header>
                    <Form onSubmit={handleSubmit(editingSubCategory ? handleUpdateSubCategory : handleAddSubCategory)}>
                        <Modal.Body>
                            {/* Main Category Dropdown */}
                            <Form.Group className="mb-3">
                                <Form.Label>Main Category</Form.Label>
                                <Controller
                                    name="mainCategory"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            options={categories?.map((cat) => ({
                                                value: cat?._id,
                                                label: cat?.name,
                                            }))}
                                            onChange={(option) => {
                                                field.onChange(option)
                                                const filtered = parentCategories?.filter(
                                                    (sub) => sub?.parentCategory?._id === option?.value
                                                )
                                                setFilteredSubCategories(filtered)
                                                setValue('parentSubCategory', null)
                                            }}
                                            placeholder="Select Main Category"
                                            isClearable
                                        />
                                    )}
                                />

                            </Form.Group>

                            {/* Sub Category Dropdown */}
                            <Form.Group className="mb-3">
                                <Form.Label>Sub Category</Form.Label>
                                <Controller
                                    name="parentSubCategory"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            options={filteredSubCategories?.map((sub) => ({
                                                value: sub?._id,
                                                label: sub?.name,
                                            }))}
                                            placeholder="Select Sub Category"
                                            isClearable
                                        />
                                    )}
                                />
                            </Form.Group>

                            {/* Sub-Sub Category Name */}
                            <FormInput
                                label="Sub-Sub Category Name"
                                type="text"
                                name="name"
                                containerClass="mb-3"
                                register={register}
                                placeholder="Enter Sub-Sub Category Name"
                                errors={errors}
                            />

                            {/* Description */}
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <FormInput
                                    type="textarea"
                                    name="description"
                                    register={register}
                                    placeholder="Enter Description"
                                    errors={errors}
                                />
                            </Form.Group>

                            {/* Image Upload */}
                            <Form.Group className="mb-3">
                                <Form.Label>Image</Form.Label>
                                <SingleFileUploader
                                    icon="ri-upload-cloud-2-line"
                                    text="Drop file here or click to upload"
                                    onFileUpload={(file: File) => setSelectedImage(file)}
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="light" onClick={toggleModal}>Close</Button>
                            <Button variant="success" type="submit" disabled={apiLoading}>
                                {apiLoading ? 'Processing...' : (editingSubCategory ? 'Update' : 'Save')}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
                <Modal show={showUploadModal} centered backdrop="static">
                    <Modal.Body className="text-center p-4">
                        <div className="mb-3">
                            <div className="spinner-border text-success" role="status" />
                        </div>
                        <h5>Uploading CSV File...</h5>
                        <div className="progress mt-3">
                            <div
                                className="progress-bar progress-bar-striped progress-bar-animated"
                                role="progressbar"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-muted mt-2">Please wait while we process your data</p>
                        <small className="text-muted">This may take a few minutes for large files</small>
                    </Modal.Body>
                </Modal>
            </Card>

        </>
    )
}
export default SubCategory





