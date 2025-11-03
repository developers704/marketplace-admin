import { PageBreadcrumb } from '@/components'
import { Button, Card, Form, Table, Pagination as BootstrapPagination, Spinner, Badge } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/common'
import { useNavigate } from 'react-router-dom'
import { TableRowSkeleton } from '../other/SimpleLoader'
import Swal from 'sweetalert2'
import QuizViewModal from '@/components/university/QuizViewModal'

interface QuizRecord {
    _id: string
    courseId: {
        _id: string
        name: string
    }
    chapterId: string
    sectionId: string
    title: string
    description: string
    timeLimit: number
    maxAttempts: number
    weightage: number
    questions: Question[]
    passingScore: number
    isActive: boolean
    attempts: Attempt[]
    createdAt: string
    updatedAt: string
    enableSuffling?: boolean
    enableTimer?: boolean
}

interface Question {
    _id: string
    question: string
    options: string[]
    correctAnswer: number
    points: number
}

interface Attempt {
    _id: string
    userId: string
    startTime: string
    endTime: string
    score: number
    percentage: number
    grade: string
    passed: boolean
    attemptDate: string
    answers: Answer[]
}

interface Answer {
    _id: string
    questionIndex: number
    selectedAnswer: number
    isCorrect: boolean
    pointsEarned: number
}

const Quizes = () => {
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
    const [quizData, setQuizData] = useState<QuizRecord[]>([])
    const [apiLoading, setApiLoading] = useState(false)
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [selectedQuiz, setSelectedQuiz] = useState<QuizRecord | null>(null)

    // API basics
    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    // Handle functions
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(quizData.map((record) => record._id))
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

    const handleCreateQuiz = () => {
        navigate('/university/create-quiz')
    }

    const handleUpdateQuiz = (id: string) => {
        navigate(`/university/update-quiz/${id}`)
    }

    const handleViewQuiz = (quiz: QuizRecord) => {
        setSelectedQuiz(quiz)
        setViewModalOpen(true)
    }

    const filteredRecords = quizData
        ?.filter((record) =>
            record?.title?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            record?.courseId?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
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
    const getQuizes = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/quiz`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get quizes')
            }

            const data = await response.json()
            if (data) {
                setQuizData(data)
            }
        } catch (error: any) {
            console.error('Error fetching quizes:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteSingle = async (quizId: string) => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: 'You want to delete this quiz!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!'
            })

            if (result.isConfirmed) {
                setApiLoading(true)
                const response = await fetch(`${BASE_API}/api/quiz/bulk`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ quizIds: [quizId] })
                })

                if (!response.ok) {
                    const errorMessage = await response.json()
                    throw new Error(errorMessage.message || 'Failed to delete quiz')
                }

                await Swal.fire({
                    title: 'Deleted!',
                    text: 'Quiz has been deleted successfully.',
                    icon: 'success',
                    timer: 2000,
                    timerProgressBar: true
                })

                // Refresh the quizes list
                getQuizes()
            }
        } catch (error: any) {
            console.error('Error deleting quiz:', error)
            Swal.fire({
                title: 'Error!',
                text: error.message || 'Failed to delete quiz. Please try again.',
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
                text: 'Please select quizes to delete.',
                icon: 'warning',
                confirmButtonColor: '#3085d6'
            })
            return
        }

        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: `You are about to delete ${selectedRows.length} quiz(es).`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: `Yes, delete ${selectedRows.length} quiz(es)!`
            })

            if (result.isConfirmed) {
                setApiLoading(true)
                const response = await fetch(`${BASE_API}/api/quiz/bulk`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ quizIds: selectedRows })
                })

                if (!response.ok) {
                    const errorMessage = await response.json()
                    throw new Error(errorMessage.message || 'Failed to delete quizes')
                }

                await Swal.fire({
                    title: 'Deleted!',
                    text: `${selectedRows.length} quiz(es) have been deleted successfully.`,
                    icon: 'success',
                    timer: 2000,
                    timerProgressBar: true
                })

                // Clear selection and refresh
                setSelectedRows([])
                getQuizes()
            }
        } catch (error: any) {
            console.error('Error deleting quizes:', error)
            Swal.fire({
                title: 'Error!',
                text: error.message || 'Failed to delete quizes. Please try again.',
                icon: 'error',
                confirmButtonColor: '#dc3545'
            })
        } finally {
            setApiLoading(false)
        }
    }

    useEffect(() => {
        getQuizes()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
        setShowDeleteButton(selectedRows.length > 0)
    }, [itemsPerPage, selectedRows])

    const quizHeaders: any[] = [
        { width: '20px', type: 'checkbox' },
        { width: '200px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '100px', type: 'number' },
        { width: '100px', type: 'number' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'number' },
        { width: '120px', type: 'actions' }
    ]

    return (
        <>
            <PageBreadcrumb title="Quizes" subName="University" allowNavigateBack={true} />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Quiz Management</h4>
                            <p className="text-muted mb-0">
                                Add and Manage all your Quizes here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
                            <Button
                                disabled={!canCreate}
                                variant="success"
                                onClick={handleCreateQuiz}
                                className="mb-2 mb-sm-0">
                                <i className="bi bi-plus"></i> Create Quiz
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
                                        placeholder="Search Quiz here..."
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
                                            checked={selectedRows.length > 0 && selectedRows.length === quizData.length}
                                        />
                                    </th>
                                    <th>Quiz Title</th>
                                    <th>Course</th>
                                    <th>Questions</th>
                                    <th>Time Limit</th>
                                    <th>Status</th>
                                    <th>Attempts</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={quizHeaders} rowCount={5} />
                                ) : paginatedRecords.length > 0 ? (
                                    paginatedRecords.map((quiz, idx) => {
                                        const isSelected = selectedRows.includes(quiz._id)
                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectRow(quiz._id)}
                                                    />
                                                </td>
                                                <td className='text-truncate'>{quiz?.title || 'N/A'}</td>
                                                <td className='text-truncate'>{quiz?.courseId?.name || 'N/A'}</td>
                                                <td>{quiz?.questions?.length || 0}</td>
                                                <td>{quiz?.timeLimit || 0} min</td>
                                                <td>
                                                    <Badge bg={quiz?.isActive ? 'success' : 'danger'}>
                                                        {quiz?.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td>{quiz?.attempts?.length || 0}</td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            variant="info"
                                                            size="sm"
                                                            onClick={() => handleViewQuiz(quiz)}
                                                            title="View Details">
                                                            <i className="bi bi-eye"></i>
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            disabled={!canUpdate}
                                                            onClick={() => { handleUpdateQuiz(quiz?._id) }}>
                                                            <i className="bi bi-pencil"></i>
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteSingle(quiz._id)}
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
                                        <td colSpan={8} className="text-center">
                                            No Quizes found
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

            {/* Quiz View Modal */}
            <QuizViewModal
                show={viewModalOpen}
                onHide={() => setViewModalOpen(false)}
                selectedQuiz={selectedQuiz}
                canUpdate={canUpdate}
                onEditQuiz={handleUpdateQuiz}
                baseApiUrl={BASE_API}
            />
        </>
    )
}

export default Quizes
