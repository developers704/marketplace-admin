import { PageBreadcrumb } from '@/components'
import { Button, Card, Form, Table, Pagination as BootstrapPagination, Spinner } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/common'
import { useNavigate } from 'react-router-dom'
import { TableRowSkeleton } from '../other/SimpleLoader'
import Swal from 'sweetalert2'
import CourseViewModal from '@/components/university/CourseViewModal'

interface CourseRecord {
    _id: string
    name: string
    description?: string
    approximateHours: number
    level: string
    language: string
    passingGrade: number
    courseType: string
    sequence: number
    createdAt: string
    updatedAt: string
    isActive: boolean
    totalVideos: number
    thumbnail?: string
    enrolledUsers?: any[]
    chapters?: any[]
    status?: string
}

const Courses = () => {
    const navigate = useNavigate()
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.University?.Update
    const canDelete = isSuperUser || permissions.University?.Delete
    const canCreate = isSuperUser || permissions.University?.Create

    // States
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [showDeleteButton, setShowDeleteButton] = useState(false)
    const [loading, setLoading] = useState(false)
    const [courseData, setCourseData] = useState<CourseRecord[]>([])
    const [apiLoading, setApiLoading] = useState(false)
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [selectedCourse, setSelectedCourse] = useState<CourseRecord | null>(null)

    // Add view handler function
    const handleViewCourse = (course: CourseRecord) => {
        setSelectedCourse(course)
        setViewModalOpen(true)
    }

    // API basics
    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    // Handle functions
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(courseData.map((record) => record._id))
        } else {
            setSelectedRows([])
        }
    }

    const handleSelectRow = (id: string) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        )
    }

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }

    const handleCreateCourse = () => {
        navigate('/university/create-course')
    }

    const filteredRecords = courseData
        ?.filter((record) =>
            record?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
        )

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // API Calls
    const getCourses = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/courses`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get courses')
            }

            const data = await response.json()
            if (data) {
                setCourseData(data)
            }
        } catch (error: any) {
            console.error('Error fetching courses:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getCourses()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
        setShowDeleteButton(selectedRows.length > 0)
    }, [itemsPerPage, selectedRows])
    const handleUpdateCourse = (id: string) => {
        navigate(`/university/update-course/${id}`)
    }
    const handleDeleteSingle = async (courseId: string) => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: 'You want to delete this!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!'
            })

            if (result.isConfirmed) {
                setApiLoading(true)
                const response = await fetch(`${BASE_API}/api/courses/bulk-delete`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ courseIds: [courseId] })
                })

                if (!response.ok) {
                    const errorMessage = await response.json()
                    throw new Error(errorMessage.message || 'Failed to delete course')
                }

                await Swal.fire({
                    title: 'Deleted!',
                    text: 'Course has been deleted successfully.',
                    icon: 'success',
                    timer: 2000,
                    timerProgressBar: true
                })

                // Refresh the courses list
                getCourses()
            }
        } catch (error: any) {
            console.error('Error deleting course:', error)
            Swal.fire({
                title: 'Error!',
                text: error.message || 'Failed to delete course. Please try again.',
                icon: 'error',
                confirmButtonColor: '#dc3545'
            })
        } finally {
            setApiLoading(false)
        }
    }

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) {
            Swal.fire({
                title: 'No Selection',
                text: 'Please select courses to delete.',
                icon: 'warning',
                confirmButtonColor: '#3085d6'
            })
            return
        }

        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: `You are about to delete ${selectedRows.length} course(s).`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: `Yes, delete ${selectedRows.length} course(s)!`
            })

            if (result.isConfirmed) {
                setApiLoading(true)
                const response = await fetch(`${BASE_API}/api/courses/bulk-delete`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ courseIds: selectedRows })
                })

                if (!response.ok) {
                    const errorMessage = await response.json()
                    throw new Error(errorMessage.message || 'Failed to delete courses')
                }

                await Swal.fire({
                    title: 'Deleted!',
                    text: `${selectedRows.length} course(s) have been deleted successfully.`,
                    icon: 'success',
                    timer: 2000,
                    timerProgressBar: true
                })

                // Clear selection and refresh
                setSelectedRows([])
                getCourses()
            }
        } catch (error: any) {
            console.error('Error deleting courses:', error)
            Swal.fire({
                title: 'Error!',
                text: error.message || 'Failed to delete courses. Please try again.',
                icon: 'error',
                confirmButtonColor: '#dc3545'
            })
        } finally {
            setApiLoading(false)
        }
    }

    const courseHeaders: any[] = [
        { width: '20px', type: 'checkbox' },
        { width: '200px', type: 'text' },
        { width: '120px', type: 'number' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '120px', type: 'number' },
        { width: '120px', type: 'image' },
        { width: '120px', type: 'actions' }
    ]

    return (
        <>
            <PageBreadcrumb title="Courses" subName="University" allowNavigateBack={true} />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Course Management</h4>
                            <p className="text-muted mb-0">
                                Add and Manage all your Courses here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
                            <Button
                                disabled={!canCreate}
                                variant="success"
                                onClick={handleCreateCourse}
                                className="mb-2 mb-sm-0">
                                <i className="bi bi-plus"></i> Create Course
                            </Button>
                            {showDeleteButton && (
                                <Button
                                    variant="danger"
                                    className="ms-sm-2 mt-2 mt-sm-0"
                                    onClick={handleBulkDelete}
                                    disabled={apiLoading}>
                                    {apiLoading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-trash"></i> Delete All Selected
                                        </>
                                    )}
                                </Button>
                            )}
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
                                        placeholder="Search Course here..."
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
                    <div className="table-responsive-sm">
                        <Table className="table-striped table-centered mb-0">
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedRows.length > 0 && selectedRows.length === courseData.length}
                                        />
                                    </th>
                                    <th>Thumbnail</th>
                                    <th>Course Type</th>
                                    <th>Title</th>
                                    <th>Sequence</th>
                                    <th>Hours</th>
                                    <th>Status</th>
                                    <th>Total Videos</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={courseHeaders} rowCount={5} />
                                ) : paginatedRecords.length > 0 ? (
                                    paginatedRecords.map((course, idx) => {
                                        const isSelected = selectedRows.includes(course._id)
                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectRow(course._id)}
                                                    />
                                                </td>
                                                <td>
                                                    {course?.thumbnail && (
                                                        <img
                                                            src={`${import.meta.env.VITE_BASE_API}/${course.thumbnail}`}
                                                            alt="Course Thumbnail"
                                                            style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                                        />
                                                    )}
                                                </td>
                                                <td>{course.courseType}</td>
                                                <td className='text-truncate'>{course.name}</td>
                                                <td>{course.sequence}</td>
                                                <td>{course.approximateHours}</td>
                                                <td>
                                                    <span className={`badge ${course.isActive ? 'bg-success' : 'bg-danger'}`}>
                                                        {course.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>{course.totalVideos}</td>

                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            variant="info"
                                                            size="sm"
                                                            onClick={() => handleViewCourse(course)}
                                                            title="View Details">
                                                            <i className="bi bi-eye"></i>
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            disabled={!canUpdate}
                                                            onClick={() => { handleUpdateCourse(course?._id) }}>
                                                            <i className="bi bi-pencil"></i>
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteSingle(course._id)}
                                                            disabled={!canDelete || apiLoading}>
                                                            <i className="bi bi-trash"></i>
                                                        </Button>

                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="text-center">
                                            No Courses found
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
                    </div>
                </Card.Body>
            </Card>
            <CourseViewModal
                show={viewModalOpen}
                onHide={() => setViewModalOpen(false)}
                selectedCourse={selectedCourse}
                canUpdate={canUpdate}
                onEditCourse={handleUpdateCourse}
                baseApiUrl={BASE_API}
            />

        </>
    )
}

export default Courses
