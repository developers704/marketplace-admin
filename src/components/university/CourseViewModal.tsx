import React from 'react'
import { Modal, Button, Card, Badge, Accordion } from 'react-bootstrap'

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
    chapters?: Chapter[]
    status?: string
}

interface Chapter {
    _id?: string
    title: string
    sequence: number
    deadline: string
    sections?: Section[]
}

interface Section {
    _id?: string
    title: string
    sequence: number
    introduction: string
    objective: string
    content?: Content[]
}

interface Content {
    _id?: string
    contentType: string
    title: string
    sequence: number
    duration: number
    minimumWatchTime: number
    videoUrl?: string
    likes?: number
    dislikes?: number
    likedBy?: any[]
    dislikedBy?: any[]
}

interface CourseViewModalProps {
    show: boolean
    onHide: () => void
    selectedCourse: CourseRecord | null
    canUpdate?: boolean
    onEditCourse?: (courseId: string) => void
    baseApiUrl?: string
}

const CourseViewModal: React.FC<CourseViewModalProps> = ({
    show,
    onHide,
    selectedCourse,
    canUpdate = false,
    onEditCourse,
    baseApiUrl = ''
}) => {
    return (
        <Modal show={show} onHide={onHide} size="lg" scrollable>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-book me-2"></i>
                    Course Details: {selectedCourse?.name || 'Unknown Course'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {selectedCourse && (
                    <div className="course-details">
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
                                        <p><strong>Course Type:</strong> {selectedCourse?.courseType || 'N/A'}</p>
                                        <p><strong>Level:</strong> {selectedCourse?.level || 'N/A'}</p>
                                        <p><strong>Language:</strong> {selectedCourse?.language || 'N/A'}</p>
                                        <p><strong>Sequence:</strong> {selectedCourse?.sequence || 0}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>Approximate Hours:</strong> {selectedCourse?.approximateHours || 0} hours</p>
                                        <p><strong>Passing Grade:</strong> {selectedCourse?.passingGrade || 0}%</p>
                                        <p><strong>Total Videos:</strong> {selectedCourse?.totalVideos || 0}</p>
                                        <p><strong>Status:</strong>
                                            <Badge bg={selectedCourse?.isActive ? 'success' : 'danger'} className="ms-2">
                                                {selectedCourse?.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </p>
                                    </div>
                                </div>
                                {selectedCourse?.description && (
                                    <div className="mt-3">
                                        <strong>Description:</strong>
                                        <p className="mt-1 text-muted">{selectedCourse.description}</p>
                                    </div>
                                )}
                                {selectedCourse?.thumbnail && (
                                    <div className="mt-3">
                                        <strong>Thumbnail:</strong>
                                        <div className="mt-2">
                                            <img
                                                src={`${baseApiUrl}/${selectedCourse.thumbnail}`}
                                                alt="Course Thumbnail"
                                                style={{ maxWidth: '200px', height: 'auto', borderRadius: '8px' }}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Enrollment Information */}
                        <Card className="mb-3">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <i className="bi bi-people me-2"></i>
                                    Enrollment Information
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <p><strong>Enrolled Users:</strong> {selectedCourse?.enrolledUsers?.length || 0} students</p>
                                <p><strong>Created:</strong> {selectedCourse?.createdAt ? new Date(selectedCourse.createdAt).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>Last Updated:</strong> {selectedCourse?.updatedAt ? new Date(selectedCourse.updatedAt).toLocaleDateString() : 'N/A'}</p>
                                {selectedCourse?.status && (
                                    <p><strong>Course Status:</strong> 
                                        <Badge bg="info" className="ms-2">{selectedCourse.status}</Badge>
                                    </p>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Chapters Information */}
                        {selectedCourse?.chapters && selectedCourse.chapters.length > 0 && (
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <i className="bi bi-journal-bookmark me-2"></i>
                                        Chapters ({selectedCourse.chapters.length})
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Accordion>
                                        {selectedCourse.chapters.map((chapter: Chapter, chapterIndex: number) => (
                                            <Accordion.Item eventKey={chapterIndex.toString()} key={chapter._id || chapterIndex}>
                                                <Accordion.Header>
                                                    <div className="d-flex justify-content-between w-100 me-3">
                                                        <span>
                                                            <strong>Chapter {chapter?.sequence || chapterIndex + 1}:</strong> {chapter?.title || 'Untitled'}
                                                        </span>
                                                        <Badge bg="primary">{chapter?.sections?.length || 0} sections</Badge>
                                                    </div>
                                                </Accordion.Header>
                                                <Accordion.Body>
                                                    <div className="mb-3">
                                                        <p><strong>Deadline:</strong> {chapter?.deadline ? new Date(chapter.deadline).toLocaleDateString() : 'No deadline set'}</p>
                                                    </div>

                                                    {/* Sections */}
                                                    {chapter?.sections && chapter.sections.length > 0 && (
                                                        <div>
                                                            <h6 className="mb-3">
                                                                <i className="bi bi-list-ul me-2"></i>
                                                                Sections:
                                                            </h6>
                                                            {chapter.sections.map((section: Section, sectionIndex: number) => (
                                                                <Card key={section._id || sectionIndex} className="mb-2" style={{ backgroundColor: '#f8f9fa' }}>
                                                                    <Card.Body className="py-2">
                                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                                            <h6 className="mb-0">
                                                                                Section {section?.sequence || sectionIndex + 1}: {section?.title || 'Untitled'}
                                                                            </h6>
                                                                            <Badge bg="info">{section?.content?.length || 0} videos</Badge>
                                                                        </div>

                                                                        {section?.introduction && (
                                                                            <div className="mb-2">
                                                                                <small><strong>Introduction:</strong></small>
                                                                                <div
                                                                                    className="small text-muted"
                                                                                    dangerouslySetInnerHTML={{ __html: section.introduction }}
                                                                                    style={{ maxHeight: '60px', overflow: 'hidden' }}
                                                                                />
                                                                            </div>
                                                                        )}

                                                                        {section?.objective && (
                                                                            <div className="mb-2">
                                                                                <small><strong>Objective:</strong></small>
                                                                                <div
                                                                                    className="small text-muted"
                                                                                    dangerouslySetInnerHTML={{ __html: section.objective }}
                                                                                    style={{ maxHeight: '60px', overflow: 'hidden' }}
                                                                                />
                                                                            </div>
                                                                        )}

                                                                        {/* Content/Videos */}
                                                                        {section?.content && section.content.length > 0 && (
                                                                            <div>
                                                                                <small><strong>Videos:</strong></small>
                                                                                <div className="mt-1">
                                                                                    {section.content.map((content: Content, contentIndex: number) => (
                                                                                        <div
                                                                                            key={content._id || contentIndex}
                                                                                            className="d-flex justify-content-between align-items-center py-1 px-2 mb-1"
                                                                                            style={{ backgroundColor: '#ffffff', borderRadius: '4px', fontSize: '0.85rem' }}
                                                                                        >
                                                                                            <span>
                                                                                                <i className="bi bi-play-circle me-1"></i>
                                                                                                {content?.title || `Video ${contentIndex + 1}`}
                                                                                            </span>
                                                                                            <div className="d-flex gap-2">
                                                                                                <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>
                                                                                                    {content?.duration || 0}s
                                                                                                </Badge>
                                                                                                <Badge bg="warning" style={{ fontSize: '0.7rem' }}>
                                                                                                    Min: {content?.minimumWatchTime || 0}s
                                                                                                </Badge>
                                                                                                {(content?.likes || 0) > 0 && (
                                                                                                    <Badge bg="success" style={{ fontSize: '0.7rem' }}>
                                                                                                        <i className="bi bi-heart-fill"></i> {content.likes}
                                                                                                    </Badge>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Card.Body>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    )}
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        ))}
                                    </Accordion>
                                </Card.Body>
                            </Card>
                        )}

                        {/* No Chapters Message */}
                        {(!selectedCourse?.chapters || selectedCourse.chapters.length === 0) && (
                            <Card className="mb-3">
                                <Card.Body className="text-center py-4">
                                    <i className="bi bi-journal-x text-muted" style={{ fontSize: '2rem' }}></i>
                                    <p className="text-muted mt-2 mb-0">No chapters available for this course.</p>
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
                {selectedCourse && canUpdate && onEditCourse && (
                    <Button
                        variant="primary"
                        onClick={() => {
                            onHide()
                            onEditCourse(selectedCourse._id)
                        }}
                    >
                        <i className="bi bi-pencil me-1"></i>
                        Edit Course
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    )
}

export default CourseViewModal
