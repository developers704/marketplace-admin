import { FormInput, PageBreadcrumb } from '@/components'
import { Button, Card, Form, Row, Col } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/common'
import { useForm, useFieldArray } from 'react-hook-form'
import Select from 'react-select'
import { useNavigate, useParams } from 'react-router-dom'

interface SelectOption {
    value: string
    label: string
}

interface Question {
    question: string
    options: string[]
    correctAnswer: number
    points: number
}

interface QuizFormData {
    title: string
    description: string
    timeLimit: number
    maxAttempts: number
    weightage: number
    passingScore: number
    questions: Question[]
}

interface CourseData {
    courseId: string
    courseName: string
    chapters: ChapterData[]
}

interface ChapterData {
    chapterId: string
    chapterName: string
    sections: SectionData[]
}

interface SectionData {
    sectionId: string
    sectionName: string
}

interface QuizResponse {
    quizId: string
    title: string
    description: string
    timeLimit: number
    maxAttempts: number
    weightage: number
    enableSuffling: boolean
    enableTimer: boolean
    passingScore: number
    totalQuestions: number
    isActive: boolean
    course: {
        courseId: string
        courseName: string
        courseDescription: string
    }
    chapter: {
        chapterId: string
        chapterTitle: string
        chapterDescription: string
        chapterSequence: number
    }
    section: {
        sectionId: string
        sectionTitle: string
        sectionSequence: number
        sectionIntroduction: string
        sectionObjective: string
    }
    questions: {
        questionNumber: number
        question: string
        options: string[]
        points: number
    }[]
    createdAt: string
    updatedAt: string
}

const UpdateQuiz = () => {
    const { user } = useAuthContext()
    const navigate = useNavigate()
    const { id } = useParams()
    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    // States
    const [loading, setLoading] = useState(false)
    const [apiLoading, setApiLoading] = useState(false)
    const [coursesData, setCoursesData] = useState<CourseData[]>([])
    const [selectedCourse, setSelectedCourse] = useState<SelectOption | null>(null)
    const [selectedChapter, setSelectedChapter] = useState<SelectOption | null>(null)
    const [selectedSection, setSelectedSection] = useState<SelectOption | null>(null)
    const [enableSuffling, setEnableSuffling] = useState(true)
    const [enableTimer, setEnableTimer] = useState(true)
    const [formErrors, setFormErrors] = useState<any>({})
    const [isInitialized, setIsInitialized] = useState(false)

    const {
        handleSubmit,
        register,
        control,
        formState: { errors },
        reset,
    } = useForm<QuizFormData>({
        defaultValues: {
            questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }]
        }
    })

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: 'questions'
    })

    // Get available chapters based on selected course
    const getChapterOptions = (): SelectOption[] => {
        if (!selectedCourse) return []
        const course = coursesData.find(c => c.courseId === selectedCourse.value)
        return course?.chapters.map(chapter => ({
            value: chapter.chapterId,
            label: chapter.chapterName
        })) || []
    }

    // Get available sections based on selected chapter
    const getSectionOptions = (): SelectOption[] => {
        if (!selectedCourse || !selectedChapter) return []
        const course = coursesData.find(c => c.courseId === selectedCourse.value)
        const chapter = course?.chapters.find(ch => ch.chapterId === selectedChapter.value)
        return chapter?.sections.map(section => ({
            value: section.sectionId,
            label: section.sectionName
        })) || []
    }

    // Course options
    const courseOptions = coursesData.map(course => ({
        value: course.courseId,
        label: course.courseName
    }))

    // Handle course selection
    const handleCourseChange = (option: SelectOption | null) => {
        setSelectedCourse(option)
        setSelectedChapter(null)
        setSelectedSection(null)
    }

    // Handle chapter selection
    const handleChapterChange = (option: SelectOption | null) => {
        setSelectedChapter(option)
        setSelectedSection(null)
    }

    // Handle section selection
    const handleSectionChange = (option: SelectOption | null) => {
        setSelectedSection(option)
    }

    // Add new question
    const addQuestion = () => {
        append({ question: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 })
    }

    // Remove question
    const removeQuestion = (index: number) => {
        if (fields.length > 1) {
            remove(index)
        }
    }

    // Number input handlers
    const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value
        value = value.replace(/-/g, '')
        const numValue = parseFloat(value)
        if (numValue < 0 || isNaN(numValue)) {
            e.target.value = '0'
        } else {
            e.target.value = value
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const invalidKeys = ['-', '+', 'e', 'E']
        if (invalidKeys.includes(e.key)) {
            e.preventDefault()
        }
    }

    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
        e.currentTarget.blur()
    }

    // API Calls
    const getSimplifiedCourses = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/courses/simplified`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch courses')
            }

            const result = await response.json()
            if (result.success && result.data) {
                setCoursesData(result.data)
            }
        } catch (error: any) {
            console.error('Error fetching courses:', error)
        }
    }

    const getQuizById = async (quizId: string) => {
        if (isInitialized) return

        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/quiz/by-quizID/${quizId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get quiz')
            }

            const result = await response.json()
            if (result.success && result.data) {
                const quizData: QuizResponse = result.data

                // Set form values
                reset({
                    title: quizData.title,
                    description: quizData.description,
                    timeLimit: quizData.timeLimit,
                    maxAttempts: quizData.maxAttempts,
                    weightage: quizData.weightage,
                    passingScore: quizData.passingScore,
                    questions: quizData.questions.map(q => ({
                        question: q.question,
                        options: q.options,
                        correctAnswer: 0, // We'll need to determine this from the original data
                        points: q.points
                    }))
                })

                // Set quiz settings
                setEnableSuffling(quizData.enableSuffling)
                setEnableTimer(quizData.enableTimer)

                // Set dropdown selections
                setSelectedCourse({
                    value: quizData.course.courseId,
                    label: quizData.course.courseName
                })

                setSelectedChapter({
                    value: quizData.chapter.chapterId,
                    label: quizData.chapter.chapterTitle
                })

                setSelectedSection({
                    value: quizData.section.sectionId,
                    label: quizData.section.sectionTitle
                })

                // Replace questions array
                const formattedQuestions = quizData.questions.map(q => ({
                    question: q.question,
                    options: q.options,
                    correctAnswer: 0, // Default to first option, user can change
                    points: q.points
                }))
                replace(formattedQuestions)

                setIsInitialized(true)
            }
        } catch (error: any) {
            console.error('Error fetching quiz:', error)
            setFormErrors({ fetch: error.message })
        } finally {
            setLoading(false)
        }
    }

    // Validation
    const validateForm = (data: QuizFormData): boolean => {
        const errors: any = {}

        if (!selectedCourse) errors.course = 'Course is required'
        if (!selectedChapter) errors.chapter = 'Chapter is required'
        if (!selectedSection) errors.section = 'Section is required'
        if (!data.title?.trim()) errors.title = 'Title is required'
        if (!data.description?.trim()) errors.description = 'Description is required'
        if (!data.timeLimit || data.timeLimit <= 0) errors.timeLimit = 'Time limit must be greater than 0'
        if (!data.maxAttempts || data.maxAttempts <= 0) errors.maxAttempts = 'Max attempts must be greater than 0'
        if (!data.weightage || data.weightage <= 0) errors.weightage = 'Weightage must be greater than 0'
        if (!data.passingScore || data.passingScore <= 0 || data.passingScore > 100) {
            errors.passingScore = 'Passing score must be between 1 and 100'
        }

        // Validate questions
        data.questions.forEach((question, index) => {
            if (!question.question?.trim()) {
                errors[`question_${index}`] = `Question ${index + 1} text is required`
            }
            if (question.options.some(option => !option?.trim())) {
                errors[`options_${index}`] = `All options for question ${index + 1} are required`
            }
            if (!question.points || question.points <= 0) {
                errors[`points_${index}`] = `Points for question ${index + 1} must be greater than 0`
            }
        })

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    // Handle form submission
    const handleUpdateQuiz = async (formData: QuizFormData) => {
        if (!validateForm(formData)) return

        setApiLoading(true)
        try {
            const quizData = {
                courseId: selectedCourse?.value,
                chapterId: selectedChapter?.value,
                sectionId: selectedSection?.value,
                title: formData.title,
                description: formData.description,
                timeLimit: formData.timeLimit,
                maxAttempts: formData.maxAttempts,
                weightage: formData.weightage,
                enableSuffling,
                enableTimer,
                questions: formData.questions,
                passingScore: formData.passingScore
            }

            const response = await fetch(`${BASE_API}/api/quiz/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(quizData)
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to update quiz')
            }

            // Success - navigate back
            navigate('/university/quizes')
        } catch (error: any) {
            console.error('Error updating quiz:', error)
            setFormErrors({ submit: error.message })
        } finally {
            setApiLoading(false)
        }
    }

    // Effects
    useEffect(() => {
        if (!token || !id) return

        const initializeData = async () => {
            try {
                await getSimplifiedCourses()
                if (!isInitialized) {
                    await getQuizById(id)
                }
            } catch (error) {
                console.error('Error initializing data:', error)
            }
        }

        initializeData()
    }, [token, id])

    if (loading) {
        return (
            <>
                <PageBreadcrumb title="Update Quiz" subName="University" allowNavigateBack={true} />
                <Card>
                    <Card.Body className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">Loading quiz data...</p>
                    </Card.Body>
                </Card>
            </>
        )
    }

    return (
        <>
            <PageBreadcrumb title="Update Quiz" subName="University" allowNavigateBack={true} />

            <Form onSubmit={handleSubmit(handleUpdateQuiz)}>
                {/* Basic Information */}
                <Card className="mb-4">
                    <Card.Header>
                        <h4 className="header-title">Quiz Information</h4>
                    </Card.Header>
                    <Card.Body>
                        {formErrors.fetch && (
                            <div className="alert alert-danger" role="alert">
                                {formErrors.fetch}
                            </div>
                        )}

                        {/* Course, Chapter, Section Selection */}
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Course <span className="text-danger">*</span></Form.Label>
                                    <Select
                                        options={courseOptions}
                                        value={selectedCourse}
                                        onChange={handleCourseChange}
                                        placeholder="Select course..."
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                    />
                                    {formErrors.course && <div className="text-danger small">{formErrors.course}</div>}
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Chapter <span className="text-danger">*</span></Form.Label>
                                    <Select
                                        options={getChapterOptions()}
                                        value={selectedChapter}
                                        onChange={handleChapterChange}
                                        placeholder="Select chapter..."
                                        isDisabled={!selectedCourse}
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                    />
                                    {formErrors.chapter && <div className="text-danger small">{formErrors.chapter}</div>}
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Section <span className="text-danger">*</span></Form.Label>
                                    <Select
                                        options={getSectionOptions()}
                                        value={selectedSection}
                                        onChange={handleSectionChange}
                                        placeholder="Select section..."
                                        isDisabled={!selectedChapter}
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                    />
                                    {formErrors.section && <div className="text-danger small">{formErrors.section}</div>}
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Title and Description */}
                        <Row>
                            <Col md={12}>
                                <FormInput
                                    label="Quiz Title"
                                    type="text"
                                    name="title"
                                    placeholder="Enter quiz title"
                                    containerClass="mb-3"
                                    register={register}
                                    errors={errors}
                                    control={control}
                                    required
                                />
                                {formErrors.title && <div className="text-danger small">{formErrors.title}</div>}
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Enter quiz description"
                                        {...register('description')}
                                    />
                                    {formErrors.description && <div className="text-danger small">{formErrors.description}</div>}
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Quiz Settings */}
                        <Row>
                            <Col md={4}>
                                <FormInput
                                    label="Time Limit (minutes)"
                                    type="number"
                                    name="timeLimit"
                                    placeholder="Enter time limit"
                                    containerClass="mb-3"
                                    register={register}
                                    errors={errors}
                                    control={control}
                                    min="1"
                                    onInput={handleNumberInput}
                                    onKeyDown={handleKeyDown}
                                    onWheel={handleWheel}
                                    required
                                />
                                {formErrors.timeLimit && <div className="text-danger small">{formErrors.timeLimit}</div>}
                            </Col>
                            <Col md={4}>
                                <FormInput
                                    label="Max Attempts"
                                    type="number"
                                    name="maxAttempts"
                                    placeholder="Enter max attempts"
                                    containerClass="mb-3"
                                    register={register}
                                    errors={errors}
                                    control={control}
                                    min="1"
                                    onInput={handleNumberInput}
                                    onKeyDown={handleKeyDown}
                                    onWheel={handleWheel}
                                    required
                                />
                                {formErrors.maxAttempts && <div className="text-danger small">{formErrors.maxAttempts}</div>}
                            </Col>
                            <Col md={4}>
                                <FormInput
                                    label="Weightage (%)"
                                    type="number"
                                    name="weightage"
                                    placeholder="Enter weightage"
                                    containerClass="mb-3"
                                    register={register}
                                    errors={errors}
                                    control={control}
                                    min="1"
                                    max="100"
                                    onInput={handleNumberInput}
                                    onKeyDown={handleKeyDown}
                                    onWheel={handleWheel}
                                    required
                                />
                                {formErrors.weightage && <div className="text-danger small">{formErrors.weightage}</div>}
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <FormInput
                                    label="Passing Score (%)"
                                    type="number"
                                    name="passingScore"
                                    placeholder="Enter passing score"
                                    containerClass="mb-3"
                                    register={register}
                                    errors={errors}
                                    control={control}
                                    min="1"
                                    max="100"
                                    onInput={handleNumberInput}
                                    onKeyDown={handleKeyDown}
                                    onWheel={handleWheel}
                                    required
                                />
                                {formErrors.passingScore && <div className="text-danger small">{formErrors.passingScore}</div>}
                            </Col>
                          <Col md={4}>
                                <Form.Group className="mt-4">
                                    <Form.Check
                                        type="checkbox"
                                        id="enableSuffling"
                                        label="Enable Question Shuffling"
                                        checked={enableSuffling}
                                        onChange={(e) => setEnableSuffling(e.target.checked)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mt-4">
                                    <Form.Check
                                        type="checkbox"
                                        id="enableTimer"
                                        label="Enable Timer"
                                        checked={enableTimer}
                                        onChange={(e) => setEnableTimer(e.target.checked)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                    </Card.Body>
                </Card>

                {/* Questions Section */}
                <Card className="mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h4 className="header-title">Questions</h4>
                        <Button variant="primary" size="sm" onClick={addQuestion}>
                            <i className="bi bi-plus"></i> Add Question
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        {fields.map((field, index) => (
                            <Card key={field.id} className="mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h6 className="mb-0">Question {index + 1}</h6>
                                    {fields.length > 1 && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => removeQuestion(index)}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    )}
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Question Text <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={2}
                                                    placeholder="Enter question text"
                                                    {...register(`questions.${index}.question`)}
                                                />
                                                {formErrors[`question_${index}`] && (
                                                    <div className="text-danger small">{formErrors[`question_${index}`]}</div>
                                                )}
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Option A <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter option A"
                                                    {...register(`questions.${index}.options.0`)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Option B <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter option B"
                                                    {...register(`questions.${index}.options.1`)}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Option C <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter option C"
                                                    {...register(`questions.${index}.options.2`)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Option D <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter option D"
                                                    {...register(`questions.${index}.options.3`)}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {formErrors[`options_${index}`] && (
                                        <div className="text-danger small mb-3">{formErrors[`options_${index}`]}</div>
                                    )}

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Correct Answer <span className="text-danger">*</span></Form.Label>
                                                <Form.Select {...register(`questions.${index}.correctAnswer`)}>
                                                    <option value={0}>Option A</option>
                                                    <option value={1}>Option B</option>
                                                    <option value={2}>Option C</option>
                                                    <option value={3}>Option D</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Points <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    placeholder="Enter points"
                                                    min="1"
                                                    {...register(`questions.${index}.points`)}
                                                    onInput={handleNumberInput}
                                                    onKeyDown={handleKeyDown}
                                                    onWheel={handleWheel}
                                                />
                                                {formErrors[`points_${index}`] && (
                                                    <div className="text-danger small">{formErrors[`points_${index}`]}</div>
                                                )}
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        ))}

                        {fields.length === 0 && (
                            <div className="text-center py-4">
                                <p className="text-muted">No questions added yet. Click "Add Question" to get started.</p>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                {/* Submit Section */}
                <Card>
                    <Card.Body>
                        {formErrors.submit && (
                            <div className="alert alert-danger" role="alert">
                                {formErrors.submit}
                            </div>
                        )}

                        <div className="d-flex justify-content-end gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => navigate('/university/quizes')}
                                disabled={apiLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={apiLoading}
                            >
                                {apiLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Updating Quiz...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-circle me-1"></i>
                                        Update Quiz
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </Form>
        </>
    )
}

export default UpdateQuiz
