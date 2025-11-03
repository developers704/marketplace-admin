import { PageBreadcrumb } from '@/components'
import { Button, Card, Form, Table, Pagination as BootstrapPagination, Badge, Row, Col } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/common'
import { TableRowSkeleton } from '../other/SimpleLoader'
import EmployeeProgressModal from '@/components/university/ProgressViewModal'
import Select from 'react-select'

interface User {
    _id: string
    username: string
    email: string
    fullName: string
    role: {
        _id: string
    }
    department: {
        _id: string
        name: string
    }
    warehouse: {
        _id: string
        name: string
        location: string
    }
    createdAt: string
    courses: {
        mainCourses: MainCourse[]
        shortCourses: any[]
    }
    courseSummary: {
        totalEnrolled: number
        mainCoursesCount: number
        shortCoursesCount: number
        completedCourses: number
        inProgressCourses: number
        failedCourses: number
        certificatesEarned: number
        averageProgress: number
        certificateEligible: number
        certificateRequested: number
        certificateApproved: number
    }
}

interface MainCourse {
    courseId: string
    courseName: string
    courseThumbnail: string
    courseType: string
    level: string
    language: string
    approximateHours: number
    totalVideos: number
    passingGrade: number
    progress: number
    status: string
    gradePercentage: number
    gradeLabel: string
    enrollmentDate: string
    completionDate?: string
    lastAccessDate: string
    certificateInfo: {
        eligible: boolean
        requestStatus: string
        canRequest: boolean
    }
    contentStats: {
        totalSections: number
        completedSections: number
        totalContent: number
        completedContent: number
        sectionProgress: number
        contentProgress: number
    }
    quizStats: {
        total: number
        completed: number
        failed: number
        notAttempted: number
        percentage: number
        averageScore: number
        attempts: any[]
    }
    performance: {
        efficiency: string
        riskLevel: string
        needsAttention: boolean
    }
}

interface ProgressResponse {
    users: User[]
    overallStats: {
        totalUsers: number
        activeUsers: number
        totalEnrollments: number
        totalCompletedCourses: number
        totalInProgressCourses: number
        totalFailedCourses: number
        totalCertificatesEarned: number
        averageProgressAllUsers: number
    }
}
interface WarehouseRecord {
    _id: string
    name: string
    location: string
}

interface DepartmentRecord {
    _id: string
    name: string
    description: string
}

interface SelectOption {
    value: string
    label: string
}
const EmployeProgress = () => {
    const { user } = useAuthContext()

    // States
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [loading, setLoading] = useState(false)
    const [progressData, setProgressData] = useState<ProgressResponse | null>(null)
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null)
    const [warehousesData, setWarehousesData] = useState<WarehouseRecord[]>([])
    const [departmentsData, setDepartmentsData] = useState<DepartmentRecord[]>([])
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
    const [selectedDepartment, setSelectedDepartment] = useState<string>('')
    // API basics
    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    // Handle functions
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked && progressData?.users) {
            setSelectedRows(progressData.users.map((user) => user._id))
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
        setCurrentPage(1)
    }

    const handleViewEmployee = (employee: User) => {
        setSelectedEmployee(employee)
        setViewModalOpen(true)
    }

    // const filteredUsers = progressData?.users?.filter((user) =>
    //     user?.username?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    //     user?.email?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    //     user?.warehouse?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
    // ) || []
    const filteredUsers = progressData?.users?.filter((user) => {
        const matchesSearch = user?.username?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            user?.email?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            user?.fullName?.toLowerCase()?.includes(searchTerm.toLowerCase())

        const matchesWarehouse = !selectedWarehouse || user?.warehouse?._id === selectedWarehouse
        const matchesDepartment = !selectedDepartment || user?.department?._id === selectedDepartment

        return matchesSearch && matchesWarehouse && matchesDepartment
    }) || []
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )
    const warehouseOptions: SelectOption[] = [
        { value: '', label: 'All Stores' },
        ...warehousesData.map(warehouse => ({
            value: warehouse._id,
            label: `${warehouse.name} - ${warehouse.location}`
        }))
    ]

    const departmentOptions: SelectOption[] = [
        { value: '', label: 'All Departments' },
        ...departmentsData.map(department => ({
            value: department._id,
            label: department.name
        }))
    ]
    // API Call
    const getEmployeeProgress = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/adminProgress/progress`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get employee progress')
            }

            const data = await response.json()
            console.log('Employee Progress Response:', data)
            setProgressData(data?.data)
        } catch (error: any) {
            console.error('Error fetching employee progress:', error)
        } finally {
            setLoading(false)
        }
    }
    const getWarehouses = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/warehouses`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to get warehouses')
            }

            const data_res: WarehouseRecord[] = await response.json()
            if (data_res) {
                setWarehousesData(data_res)
            }
        } catch (error: any) {
            console.error('Error fetching warehouses:', error)
        }
    }

    const getDepartments = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/departments`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to get departments')
            }

            const data_res: DepartmentRecord[] = await response.json()
            if (data_res) {
                setDepartmentsData(data_res)
            }
        } catch (error: any) {
            console.error('Error fetching departments:', error)
        }
    }
    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'done':
                return <Badge bg="success">Completed</Badge>
            case 'in progress':
            case 'inprogress':
                return <Badge bg="warning">In Progress</Badge>
            case 'failed':
                return <Badge bg="danger">Failed</Badge>
            default:
                return <Badge bg="secondary">{status}</Badge>
        }
    }

    const getRiskBadge = (riskLevel: string) => {
        switch (riskLevel.toLowerCase()) {
            case 'low':
                return <Badge bg="success">Low Risk</Badge>
            case 'medium':
                return <Badge bg="warning">Medium Risk</Badge>
            case 'high':
                return <Badge bg="danger">High Risk</Badge>
            default:
                return <Badge bg="secondary">{riskLevel}</Badge>
        }
    }

    useEffect(() => {
        getEmployeeProgress()
        getWarehouses()
        getDepartments()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
    }, [itemsPerPage])
    useEffect(() => {
        setCurrentPage(1)
    }, [selectedWarehouse, selectedDepartment, searchTerm])
    const userHeaders: any[] = [
        { width: '20px', type: 'checkbox' },
        { width: '150px', type: 'text' },
        { width: '200px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '100px', type: 'number' },
        { width: '100px', type: 'number' },
        { width: '100px', type: 'number' },
        { width: '100px', type: 'text' },
        { width: '120px', type: 'actions' }
    ]

    return (
        <>
            <PageBreadcrumb title="Employee Progress" subName="University" allowNavigateBack={true} />

            {/* Overall Stats Cards */}
            {progressData?.overallStats && (
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="bg-primary text-white">
                            <Card.Body>
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h3 className="mb-0">{progressData.overallStats.totalUsers}</h3>
                                        <p className="mb-0">Total Employees</p>
                                    </div>
                                    <div className="align-self-center">
                                        <i className="bi bi-people fs-1"></i>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="bg-success text-white">
                            <Card.Body>
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h3 className="mb-0">{progressData.overallStats.totalCompletedCourses}</h3>
                                        <p className="mb-0">Completed Courses</p>
                                    </div>
                                    <div className="align-self-center">
                                        <i className="bi bi-check-circle fs-1"></i>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="bg-warning text-white">
                            <Card.Body>
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h3 className="mb-0">{progressData.overallStats.totalInProgressCourses}</h3>
                                        <p className="mb-0">In Progress</p>
                                    </div>
                                    <div className="align-self-center">
                                        <i className="bi bi-clock fs-1"></i>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="bg-info text-white">
                            <Card.Body>
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h3 className="mb-0">{progressData.overallStats.totalCertificatesEarned}</h3>
                                        <p className="mb-0">Certificates Earned</p>
                                    </div>
                                    <div className="align-self-center">
                                        <i className="bi bi-award fs-1"></i>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Employee Progress Management</h4>
                            <p className="text-muted mb-0">
                                Monitor and track all employee learning progress and performance.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <Badge bg="info" className="fs-6">
                                Average Progress: {progressData?.overallStats?.averageProgressAllUsers || 0}%
                            </Badge>
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
                        <div className="d-flex flex-column flex-lg-row gap-3 align-items-lg-center">
                            <div className="app-search">
                                <form>
                                    <div className="input-group" style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0, 0, 0, 0.1)',
                                        minWidth: '250px'
                                    }}>
                                        <input
                                            type="search"
                                            className="form-control"
                                            placeholder="Search users..."
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

                            {/* Store Filter Dropdown */}
                            <div style={{ minWidth: '200px' }}>
                                <Select
                                    options={warehouseOptions}
                                    value={warehouseOptions.find(option => option.value === selectedWarehouse) || warehouseOptions[0]}
                                    onChange={(selectedOption) => {
                                        setSelectedWarehouse(selectedOption?.value || '')
                                        setCurrentPage(1)
                                    }}
                                    placeholder="Select Store..."
                                    isClearable={false}
                                    isSearchable={true}
                                    className="react-select-container"
                                    classNamePrefix="react-select"

                                />
                            </div>

                            {/* Department Filter Dropdown */}
                            <div style={{ minWidth: '180px' }}>
                                <Select
                                    options={departmentOptions}
                                    value={departmentOptions.find(option => option.value === selectedDepartment) || departmentOptions[0]}
                                    onChange={(selectedOption) => {
                                        setSelectedDepartment(selectedOption?.value || '')
                                        setCurrentPage(1)
                                    }}
                                    placeholder="Select Department..."
                                    isClearable={false}
                                    isSearchable={true}
                                    className="react-select-container"
                                    classNamePrefix="react-select"

                                />
                            </div>
                        </div>

                        {/* Items per page selector */}
                        <Form.Select
                            value={itemsPerPage}
                            style={{ zIndex: 1, minWidth: '120px' }}
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
                                            checked={selectedRows.length > 0 && selectedRows.length === filteredUsers.length}
                                        />
                                    </th>
                                    <th>Employee</th>
                                    <th>Email & Warehouse</th>
                                    <th>Courses</th>
                                    <th>Progress</th>
                                    <th>Certificates</th>
                                    <th>Status</th>
                                    <th>Risk Level</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={userHeaders} rowCount={5} />
                                ) : paginatedUsers.length > 0 ? (
                                    paginatedUsers.map((employee, idx) => {
                                        const isSelected = selectedRows.includes(employee._id)
                                        const mainCourse = employee.courses.mainCourses[0]
                                        const riskLevel = mainCourse?.performance?.riskLevel || 'Unknown'
                                        const status = mainCourse?.status || 'Not Started'

                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectRow(employee._id)}
                                                    />
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong className="text-truncate d-block">{employee.username}</strong>
                                                        <small className="text-muted">
                                                            Joined: {new Date(employee.createdAt).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="text-truncate">{employee.email}</div>
                                                        <small className="text-muted">
                                                            {employee.warehouse?.name} - {employee.warehouse?.location}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong>{employee.courseSummary.totalEnrolled}</strong> enrolled
                                                        <br />
                                                        <small className="text-success">
                                                            {employee.courseSummary.completedCourses} completed
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="d-flex align-items-center">
                                                            <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                                                <div
                                                                    className="progress-bar bg-success"
                                                                    style={{ width: `${employee.courseSummary.averageProgress}%` }}
                                                                ></div>
                                                            </div>
                                                            <small className="fw-bold">{employee.courseSummary.averageProgress}%</small>
                                                        </div>
                                                        {mainCourse && (
                                                            <small className="text-muted">
                                                                Grade: {mainCourse.gradeLabel} ({mainCourse.gradePercentage}%)
                                                            </small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <Badge bg="success" className="me-1">
                                                            {employee.courseSummary.certificatesEarned}
                                                        </Badge>
                                                        <small className="d-block text-muted">
                                                            {employee.courseSummary.certificateRequested} requested
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    {getStatusBadge(status)}
                                                </td>
                                                <td>
                                                    {getRiskBadge(riskLevel)}
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            variant="info"
                                                            size="sm"
                                                            onClick={() => handleViewEmployee(employee)}
                                                            title="View Details">
                                                            <i className="bi bi-eye"></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="text-center">
                                            No employees found
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

            {/* Employee Progress View Modal */}
            <EmployeeProgressModal
                show={viewModalOpen}
                onHide={() => setViewModalOpen(false)}
                selectedEmployee={selectedEmployee}
            />
        </>
    )
}

export default EmployeProgress
