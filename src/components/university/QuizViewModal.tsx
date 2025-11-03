import { formatDateForDisplay } from '@/utils/dateUtils'
import React from 'react'
import { Modal, Button, Card, Badge, Accordion, ListGroup } from 'react-bootstrap'

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

interface QuizViewModalProps {
    show: boolean
    onHide: () => void
    selectedQuiz: QuizRecord | null
    canUpdate?: boolean
    onEditQuiz?: (quizId: string) => void
    baseApiUrl?: string
}

const QuizViewModal: React.FC<QuizViewModalProps> = ({
    show,
    onHide,
    selectedQuiz,
    canUpdate = false,
    onEditQuiz,
    baseApiUrl = ''
}) => {
    console.log("checking quiz data ", selectedQuiz);

    return (
        <Modal show={show} onHide={onHide} size="xl" scrollable>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-question-circle me-2"></i>
                    Quiz Details: {selectedQuiz?.title || 'Unknown Quiz'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {selectedQuiz && (
                    <div className="quiz-details">
                        {/* Basic Information */}
                        <Card className="mb-3">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Basic Information
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="row">
                                    <div className="col-md-6">
                                        <p><strong>Course:</strong> {selectedQuiz?.courseId?.name || 'N/A'}</p>
                                        <p><strong>Time Limit:</strong> {selectedQuiz?.timeLimit || 0} minutes</p>
                                        <p><strong>Max Attempts:</strong> {selectedQuiz?.maxAttempts || 0}</p>
                                        <p><strong>Weightage:</strong> {selectedQuiz?.weightage || 0}%</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>Passing Score:</strong> {selectedQuiz?.passingScore || 0}%</p>
                                        <p><strong>Total Questions:</strong> {selectedQuiz?.questions?.length || 0}</p>
                                        <p><strong>Status:</strong>
                                            <Badge bg={selectedQuiz?.isActive ? 'success' : 'danger'} className="ms-2">
                                                {selectedQuiz?.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </p>
                                    </div>
                                </div>
                                {selectedQuiz?.description && (
                                    <div className="mt-3">
                                        <strong>Description:</strong>
                                        <p className="mt-1 text-muted">{selectedQuiz.description}</p>
                                    </div>
                                )}
                                <div className="row mt-3">
                                    <div className="col-md-6">
                                        <p><strong>Enable Shuffling:</strong>
                                            <Badge bg={selectedQuiz?.enableSuffling ? 'success' : 'secondary'} className="ms-2">
                                                {selectedQuiz?.enableSuffling ? 'Yes' : 'No'}
                                            </Badge>
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>Enable Timer:</strong>
                                            <Badge bg={selectedQuiz?.enableTimer ? 'success' : 'secondary'} className="ms-2">
                                                {selectedQuiz?.enableTimer ? 'Yes' : 'No'}
                                            </Badge>
                                        </p>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Questions */}
                        {selectedQuiz?.questions && selectedQuiz.questions.length > 0 && (
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <i className="bi bi-list-ol me-2"></i>
                                        Questions ({selectedQuiz.questions.length})
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Accordion>
                                        {selectedQuiz.questions.map((question: Question, questionIndex: number) => (
                                            <Accordion.Item eventKey={questionIndex.toString()} key={question._id || questionIndex}>
                                                <Accordion.Header>
                                                    <div className="d-flex justify-content-between w-100 me-3">
                                                        <span>
                                                            <strong>Question {questionIndex + 1}:</strong> {question?.question?.substring(0, 50) || 'No question text'}...
                                                        </span>
                                                        <Badge bg="primary">{question?.points || 0} pts</Badge>
                                                    </div>
                                                </Accordion.Header>
                                                <Accordion.Body>
                                                    <div className="mb-3">
                                                        <strong>Question:</strong>
                                                        <p className="mt-1">{question?.question || 'No question text'}</p>
                                                    </div>
                                                    <div className="mb-3">
                                                        <strong>Options:</strong>
                                                        <ListGroup className="mt-2">
                                                            {question?.options?.map((option: string, optionIndex: number) => (
                                                                <ListGroup.Item
                                                                    key={optionIndex}
                                                                    variant={question?.correctAnswer === optionIndex ? 'success' : 'light'}
                                                                    className="d-flex justify-content-between align-items-center"
                                                                >
                                                                    <span>{String.fromCharCode(65 + optionIndex)}. {option}</span>
                                                                    {question?.correctAnswer === optionIndex && (
                                                                        <Badge bg="success">
                                                                            <i className="bi bi-check-circle"></i> Correct
                                                                        </Badge>
                                                                    )}
                                                                </ListGroup.Item>
                                                            )) || []}
                                                        </ListGroup>
                                                    </div>
                                                    <div>
                                                        <strong>Points:</strong> {question?.points || 0}
                                                    </div>
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        ))}
                                    </Accordion>
                                </Card.Body>
                            </Card>
                        )}


                        {/* Quiz Statistics */}
                        <Card className="mb-3">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <i className="bi bi-bar-chart me-2"></i>
                                    Quiz Statistics
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="text-center">
                                            <h4 className="text-primary">{selectedQuiz?.attempts?.length || 0}</h4>
                                            <p className="text-muted mb-0">Total Attempts</p>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="text-center">
                                            <h4 className="text-success">
                                                {selectedQuiz?.attempts?.filter(attempt => attempt.passed).length || 0}
                                            </h4>
                                            <p className="text-muted mb-0">Passed</p>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="text-center">
                                            <h4 className="text-danger">
                                                {selectedQuiz?.attempts?.filter(attempt => !attempt.passed).length || 0}
                                            </h4>
                                            <p className="text-muted mb-0">Failed</p>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="text-center">
                                            <h4 className="text-info">
                                                {selectedQuiz?.attempts?.length > 0
                                                    ? Math.round(selectedQuiz.attempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / selectedQuiz.attempts.length)
                                                    : 0}%
                                            </h4>
                                            <p className="text-muted mb-0">Avg Score</p>
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Quiz Metadata */}
                        <Card className="mb-3">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <i className="bi bi-calendar me-2"></i>
                                    Quiz Metadata
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="row">
                                    <div className="col-md-6">
                                        <p><strong>Created:</strong> {formatDateForDisplay(selectedQuiz?.createdAt || '')}</p>
                                        <p><strong>Last Updated:</strong> {formatDateForDisplay(selectedQuiz?.updatedAt || '')}</p>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* No Questions Message */}
                        {(!selectedQuiz?.questions || selectedQuiz.questions.length === 0) && (
                            <Card className="mb-3">
                                <Card.Body className="text-center py-4">
                                    <i className="bi bi-question-circle text-muted" style={{ fontSize: '2rem' }}></i>
                                    <p className="text-muted mt-2 mb-0">No questions available for this quiz.</p>
                                </Card.Body>
                            </Card>
                        )}

                        {/* No Attempts Message */}
                        {(!selectedQuiz?.attempts || selectedQuiz.attempts.length === 0) && (
                            <Card className="mb-3">
                                <Card.Body className="text-center py-4">
                                    <i className="bi bi-clock-history text-muted" style={{ fontSize: '2rem' }}></i>
                                    <p className="text-muted mt-2 mb-0">No attempts have been made for this quiz yet.</p>
                                </Card.Body>
                            </Card>
                        )}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
                {selectedQuiz && canUpdate && onEditQuiz && (
                    <Button
                        variant="primary"
                        onClick={() => {
                            onHide()
                            onEditQuiz(selectedQuiz._id)
                        }}
                    >
                        <i className="bi bi-pencil me-1"></i>
                        Edit Quiz
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    )
}

export default QuizViewModal
