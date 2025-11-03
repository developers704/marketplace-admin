import { Modal, Button, Row, Col, Card, Badge, Table, Tab, Tabs } from 'react-bootstrap'
import { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'

interface User {
    _id: string
    username: string
    email: string
    fullName: string
    role: {
        _id: string
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
        attempts: QuizAttempt[]
    }
    performance: {
        efficiency: string
        riskLevel: string
        needsAttention: boolean
    }
}

interface QuizAttempt {
    quizId: string
    quizTitle: string
    sectionTitle: string
    chapterTitle: string
    totalAttempts: number
    maxAttempts: number
    bestScore: number
    bestGrade: string
    passed: boolean
    lastAttemptDate: string
    timeLimit: number
    passingScore: number
}

interface EmployeeProgressModalProps {
    show: boolean
    onHide: () => void
    selectedEmployee: User | null
}

const EmployeeProgressModal: React.FC<EmployeeProgressModalProps> = ({
    show,
    onHide,
    selectedEmployee
}) => {
    if (!selectedEmployee) return null

    const mainCourse = selectedEmployee.courses.mainCourses[0]

    // Progress Chart Options
    const progressChartOptions: ApexOptions = {
        series: [selectedEmployee.courseSummary.averageProgress],
        chart: {
            height: 200,
            type: 'radialBar',
        },
        plotOptions: {
            radialBar: {
                hollow: {
                    size: '60%',
                },
                dataLabels: {
                    name: {
                        fontSize: '16px',
                    },
                    value: {
                        fontSize: '24px',
                        formatter: function (val) {
                            return val + '%'
                        }
                    }
                }
            },
        },
        colors: ['#3bc0c3'],
        labels: ['Progress'],
    }

    // Course Stats Chart
    const courseStatsOptions: ApexOptions = {
        series: [
            selectedEmployee.courseSummary.completedCourses,
            selectedEmployee.courseSummary.inProgressCourses,
            selectedEmployee.courseSummary.failedCourses
        ],
        chart: {
            width: 300,
            type: 'pie',
        },
        labels: ['Completed', 'In Progress', 'Failed'],
        colors: ['#28a745', '#ffc107', '#dc3545'],
        dataLabels: {
            enabled: true,
        },
        legend: {
            position: 'bottom'
        }
    }

    // Quiz Performance Chart
    const quizPerformanceOptions: ApexOptions = {
        series: mainCourse ? [
            mainCourse.quizStats.completed,
            mainCourse.quizStats.failed,
            mainCourse.quizStats.notAttempted
        ] : [0, 0, 0],
        chart: {
            width: 300,
            type: 'donut',
        },
        labels: ['Completed', 'Failed', 'Not Attempted'],
        colors: ['#28a745', '#dc3545', '#6c757d'],
        dataLabels: {
            enabled: true,
        },
        legend: {
            position: 'bottom'
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

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <div className="d-flex align-items-center">
                        <i className="bi bi-person-circle me-2 fs-4"></i>
                        Employee Progress Details - {selectedEmployee.username}
                    </div>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                {/* Employee Basic Info */}
                <Card className="mb-4">
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <h5 className="mb-3">Employee Information</h5>
                                <div className="mb-2">
                                    <strong>Username:</strong> {selectedEmployee.username}
                                </div>
                                <div className="mb-2">
                                    <strong>Email:</strong> {selectedEmployee.email}
                                </div>
                                <div className="mb-2">
                                    <strong>Warehouse:</strong> {selectedEmployee.warehouse.name} - {selectedEmployee.warehouse.location}
                                </div>
                                <div className="mb-2">
                                    <strong>Joined:</strong> {new Date(selectedEmployee.createdAt).toLocaleDateString()}
                                </div>
                            </Col>
                            <Col md={6}>
                                <h5 className="mb-3">Overall Progress</h5>
                                <div className="text-center">
                                    <ReactApexChart
                                        options={progressChartOptions}
                                        series={progressChartOptions.series}
                                        type="radialBar"
                                        height={200}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Summary Stats */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="bg-primary text-white">
                            <Card.Body className="text-center">
                                <h4>{selectedEmployee.courseSummary.totalEnrolled}</h4>
                                <p className="mb-0">Total Enrolled</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="bg-success text-white">
                            <Card.Body className="text-center">
                                <h4>{selectedEmployee.courseSummary.completedCourses}</h4>
                                <p className="mb-0">Completed</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="bg-info text-white">
                            <Card.Body className="text-center">
                                <h4>{selectedEmployee.courseSummary.certificatesEarned}</h4>
                                <p className="mb-0">Certificates</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="bg-warning text-white">
                            <Card.Body className="text-center">
                                <h4>{selectedEmployee.courseSummary.averageProgress}%</h4>
                                <p className="mb-0">Avg Progress</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Detailed Tabs */}
                <Tabs defaultActiveKey="courses" className="mb-3">
                    <Tab eventKey="courses" title="Course Details">
                        {selectedEmployee.courses.mainCourses.map((course, index) => (
                            <Card key={index} className="mb-3">
                                <Card.Header>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">{course.courseName}</h5>
                                        <div>
                                            {getStatusBadge(course.status)}
                                            <Badge bg="info" className="ms-2">
                                                {course.level}
                                            </Badge>
                                        </div>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <strong>Course Information:</strong>
                                                <ul className="list-unstyled mt-2">
                                                    <li><strong>Type:</strong> {course.courseType}</li>
                                                    <li><strong>Language:</strong> {course.language}</li>
                                                    <li><strong>Duration:</strong> {course.approximateHours} hours</li>
                                                    <li><strong>Total Videos:</strong> {course.totalVideos}</li>
                                                    <li><strong>Passing Grade:</strong> {course.passingGrade}%</li>
                                                </ul>
                                            </div>

                                            <div className="mb-3">
                                                <strong>Progress Details:</strong>
                                                <div className="mt-2">
                                                    <div className="d-flex justify-content-between">
                                                        <span>Overall Progress:</span>
                                                        <span className="fw-bold">{course.progress}%</span>
                                                    </div>
                                                    <div className="progress mb-2" style={{ height: '8px' }}>
                                                        <div
                                                            className="progress-bar bg-success"
                                                            style={{ width: `${course.progress}%` }}
                                                        ></div>
                                                    </div>

                                                    <div className="d-flex justify-content-between">
                                                        <span>Grade:</span>
                                                        <span className="fw-bold">{course.gradeLabel} ({course.gradePercentage}%)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <strong>Timeline:</strong>
                                                <ul className="list-unstyled mt-2">
                                                    <li><strong>Enrolled:</strong> {new Date(course.enrollmentDate).toLocaleDateString()}</li>
                                                    {course.completionDate && (
                                                        <li><strong>Completed:</strong> {new Date(course.completionDate).toLocaleDateString()}</li>
                                                    )}
                                                    <li><strong>Last Access:</strong> {new Date(course.lastAccessDate).toLocaleDateString()}</li>
                                                </ul>
                                            </div>
                                        </Col>

                                        <Col md={6}>
                                            <div className="mb-3">
                                                <strong>Content Statistics:</strong>
                                                <div className="mt-2">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Sections:</span>
                                                        <span>{course.contentStats.completedSections}/{course.contentStats.totalSections}</span>
                                                    </div>
                                                    <div className="progress mb-2" style={{ height: '6px' }}>
                                                        <div
                                                            className="progress-bar bg-info"
                                                            style={{ width: `${course.contentStats.sectionProgress}%` }}
                                                        ></div>
                                                    </div>

                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Content:</span>
                                                        <span>{course.contentStats.completedContent}/{course.contentStats.totalContent}</span>
                                                    </div>
                                                    <div className="progress mb-2" style={{ height: '6px' }}>
                                                        <div
                                                            className="progress-bar bg-warning"
                                                            style={{ width: `${course.contentStats.contentProgress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <strong>Performance Analysis:</strong>
                                                <div className="mt-2">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>Efficiency:</span>
                                                        <Badge bg="secondary">{course.performance.efficiency}</Badge>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>Risk Level:</span>
                                                        {getRiskBadge(course.performance.riskLevel)}
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                        <span>Needs Attention:</span>
                                                        <Badge bg={course.performance.needsAttention ? "danger" : "success"}>
                                                            {course.performance.needsAttention ? "Yes" : "No"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <strong>Certificate Status:</strong>
                                                <div className="mt-2">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Eligible:</span>
                                                        <Badge bg={course.certificateInfo.eligible ? "success" : "secondary"}>
                                                            {course.certificateInfo.eligible ? "Yes" : "No"}
                                                        </Badge>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Request Status:</span>
                                                        <Badge bg={
                                                            course.certificateInfo.requestStatus === 'Approved' ? 'success' :
                                                                course.certificateInfo.requestStatus === 'Pending' ? 'warning' :
                                                                    course.certificateInfo.requestStatus === 'Requested' ? 'info' : 'secondary'
                                                        }>
                                                            {course.certificateInfo.requestStatus}
                                                        </Badge>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                        <span>Can Request:</span>
                                                        <Badge bg={course.certificateInfo.canRequest ? "success" : "secondary"}>
                                                            {course.certificateInfo.canRequest ? "Yes" : "No"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        ))}
                    </Tab>

                    <Tab eventKey="quizzes" title="Quiz Performance">
                        {mainCourse && (
                            <Row>
                                <Col md={6}>
                                    <Card>
                                        <Card.Header>
                                            <h5 className="mb-0">Quiz Statistics</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="text-center mb-3">
                                                <ReactApexChart
                                                    options={quizPerformanceOptions}
                                                    series={quizPerformanceOptions.series}
                                                    type="donut"
                                                    height={250}
                                                />
                                            </div>
                                            <div className="text-center">
                                                <div className="row">
                                                    <div className="col-4">
                                                        <h4 className="text-success">{mainCourse.quizStats.completed}</h4>
                                                        <p className="mb-0">Completed</p>
                                                    </div>
                                                    <div className="col-4">
                                                        <h4 className="text-danger">{mainCourse.quizStats.failed}</h4>
                                                        <p className="mb-0">Failed</p>
                                                    </div>
                                                    <div className="col-4">
                                                        <h4 className="text-muted">{mainCourse.quizStats.notAttempted}</h4>
                                                        <p className="mb-0">Not Attempted</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3">
                                                    <h5 className="text-primary">Average Score: {mainCourse.quizStats.averageScore}%</h5>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>

                                <Col md={6}>
                                    <Card>
                                        <Card.Header>
                                            <h5 className="mb-0">Quiz Attempts Details</h5>
                                        </Card.Header>
                                        <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            {mainCourse.quizStats.attempts.length > 0 ? (
                                                <div className="table-responsive">
                                                    <Table size="sm" striped>
                                                        <thead>
                                                            <tr>
                                                                <th>Quiz</th>
                                                                <th>Score</th>
                                                                <th>Grade</th>
                                                                <th>Status</th>
                                                                <th>Attempts</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {mainCourse.quizStats.attempts.map((attempt, idx) => (
                                                                <tr key={idx}>
                                                                    <td>
                                                                        <div>
                                                                            <strong className="d-block">{attempt.quizTitle}</strong>
                                                                            <small className="text-muted">
                                                                                {attempt.sectionTitle}
                                                                            </small>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <strong>{attempt.bestScore}%</strong>
                                                                    </td>
                                                                    <td>
                                                                        <Badge bg="info">{attempt.bestGrade}</Badge>
                                                                    </td>
                                                                    <td>
                                                                        <Badge bg={attempt.passed ? "success" : "danger"}>
                                                                            {attempt.passed ? "Passed" : "Failed"}
                                                                        </Badge>
                                                                    </td>
                                                                    <td>
                                                                        {attempt.totalAttempts}/{attempt.maxAttempts}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <div className="text-center text-muted">
                                                    <i className="bi bi-clipboard-x fs-1"></i>
                                                    <p>No quiz attempts found</p>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        )}
                    </Tab>

                    <Tab eventKey="analytics" title="Analytics">
                        <Row>
                            <Col md={6}>
                                <Card>
                                    <Card.Header>
                                        <h5 className="mb-0">Course Distribution</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="text-center">
                                            <ReactApexChart
                                                options={courseStatsOptions}
                                                series={courseStatsOptions.series}
                                                type="pie"
                                                height={300}
                                            />
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col md={6}>
                                <Card>
                                    <Card.Header>
                                        <h5 className="mb-0">Performance Metrics</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="mb-4">
                                            <h6>Learning Efficiency</h6>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span>Content Completion Rate</span>
                                                <strong>{mainCourse?.contentStats.contentProgress || 0}%</strong>
                                            </div>
                                            <div className="progress mb-3" style={{ height: '10px' }}>
                                                <div
                                                    className="progress-bar bg-success"
                                                    style={{ width: `${mainCourse?.contentStats.contentProgress || 0}%` }}
                                                ></div>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span>Quiz Success Rate</span>
                                                <strong>{mainCourse?.quizStats.percentage || 0}%</strong>
                                            </div>
                                            <div className="progress mb-3" style={{ height: '10px' }}>
                                                <div
                                                    className="progress-bar bg-info"
                                                    style={{ width: `${mainCourse?.quizStats.percentage || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <h6>Certificate Progress</h6>
                                            <Row className="text-center">
                                                <Col>
                                                    <div className="border rounded p-2">
                                                        <h4 className="text-success mb-0">{selectedEmployee.courseSummary.certificatesEarned}</h4>
                                                        <small>Earned</small>
                                                    </div>
                                                </Col>
                                                <Col>
                                                    <div className="border rounded p-2">
                                                        <h4 className="text-warning mb-0">{selectedEmployee.courseSummary.certificateRequested}</h4>
                                                        <small>Requested</small>
                                                    </div>
                                                </Col>
                                                <Col>
                                                    <div className="border rounded p-2">
                                                        <h4 className="text-info mb-0">{selectedEmployee.courseSummary.certificateApproved}</h4>
                                                        <small>Approved</small>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        <div>
                                            <h6>Risk Assessment</h6>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span>Current Risk Level:</span>
                                                {getRiskBadge(mainCourse?.performance.riskLevel || 'Unknown')}
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span>Needs Attention:</span>
                                                <Badge bg={mainCourse?.performance.needsAttention ? "danger" : "success"}>
                                                    {mainCourse?.performance.needsAttention ? "Yes" : "No"}
                                                </Badge>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span>Learning Efficiency:</span>
                                                <Badge bg="secondary">{mainCourse?.performance.efficiency || 'Unknown'}</Badge>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Tab>

                    <Tab eventKey="timeline" title="Learning Timeline">
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">Learning Journey Timeline</h5>
                            </Card.Header>
                            <Card.Body>
                                {selectedEmployee.courses.mainCourses.map((course, index) => (
                                    <div key={index} className="timeline-item mb-4">
                                        <div className="d-flex">
                                            <div className="flex-shrink-0">
                                                <div className="timeline-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                                                    style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-book"></i>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <div className="timeline-content">
                                                    <h6 className="mb-1">{course.courseName}</h6>
                                                    <div className="timeline-details">
                                                        <div className="row">
                                                            <div className="col-md-6">
                                                                <small className="text-muted d-block">
                                                                    <i className="bi bi-calendar-event me-1"></i>
                                                                    Enrolled: {new Date(course.enrollmentDate).toLocaleDateString()}
                                                                </small>
                                                                {course.completionDate && (
                                                                    <small className="text-success d-block">
                                                                        <i className="bi bi-check-circle me-1"></i>
                                                                        Completed: {new Date(course.completionDate).toLocaleDateString()}
                                                                    </small>
                                                                )}
                                                                <small className="text-info d-block">
                                                                    <i className="bi bi-clock me-1"></i>
                                                                    Last Access: {new Date(course.lastAccessDate).toLocaleDateString()}
                                                                </small>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                    <span className="small">Progress:</span>
                                                                    <span className="small fw-bold">{course.progress}%</span>
                                                                </div>
                                                                <div className="progress mb-2" style={{ height: '6px' }}>
                                                                    <div
                                                                        className="progress-bar bg-success"
                                                                        style={{ width: `${course.progress}%` }}
                                                                    ></div>
                                                                </div>
                                                                <div className="d-flex gap-1">
                                                                    {getStatusBadge(course.status)}
                                                                    <Badge bg="outline-secondary" text="dark">
                                                                        {course.gradeLabel}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {index < selectedEmployee.courses.mainCourses.length - 1 && (
                                            <div className="timeline-connector ms-3"
                                                style={{
                                                    width: '2px',
                                                    height: '30px',
                                                    backgroundColor: '#dee2e6',
                                                    marginLeft: '19px'
                                                }}>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {selectedEmployee.courses.mainCourses.length === 0 && (
                                    <div className="text-center text-muted py-4">
                                        <i className="bi bi-clock-history fs-1"></i>
                                        <p className="mt-2">No learning timeline available</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab>
                </Tabs>
            </Modal.Body>
            <Modal.Footer>
                <div className="d-flex justify-content-between w-100">
                    <div className="d-flex align-items-center">
                        <small className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            Last updated: {new Date().toLocaleDateString()}
                        </small>
                    </div>
                    <div>
                        <Button variant="secondary" onClick={onHide}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal.Footer>
        </Modal>
    )
}

export default EmployeeProgressModal

