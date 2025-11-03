import { FormInput, PageBreadcrumb } from '@/components'
import { Button, Card, Form, Row, Col } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/common'
import { useForm } from 'react-hook-form'
import Select from 'react-select'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'

interface SelectOption {
	value: string
	label: string
}

interface RoleRecord {
	_id: string
	role_name: string
}

interface WarehouseRecord {
	_id: string
	name: string
	location: string
}

interface ChapterContent {
	contentType: string
	title: string
	sequence: number
	duration: number
	minimumWatchTime: number
	videoFile?: File | null
}

interface ChapterSection {
	title: string
	sequence: number
	introduction: string
	objective: string
	content: ChapterContent[]
}

interface Chapter {
	title: string
	// deadline: string
	sequence: number
	sections: ChapterSection[]
}

interface CourseFormData {
	name: string
	// keep hours separate from duration-in-minutes
	approximateHours?: number
	courseDuration?: number
	level: string
	language: string
	sequence: number
	courseType: string
	chapters: Chapter[]
}

const CreateCourse = () => {
	const { user } = useAuthContext()
	const BASE_API = import.meta.env.VITE_BASE_API
	const { token } = user

	// States
	const [currentStep, setCurrentStep] = useState(1)
	const [selectedImage, setSelectedImage] = useState<File | null>(null)
	const [rolesData, setRolesData] = useState<RoleRecord[]>([])
	const [warehousesData, setWarehousesData] = useState<WarehouseRecord[]>([])
	const [selectedRoles, setSelectedRoles] = useState<SelectOption[]>([])
	const [selectedWarehouses, setSelectedWarehouses] = useState<SelectOption[]>(
		[]
	)
	const [chapters, setChapters] = useState<Chapter[]>([])
	const [apiLoading, setApiLoading] = useState(false)

	// Add new states for managing active items
	const [activeChapterIndex, setActiveChapterIndex] = useState<number | null>(
		null
	)
	const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(
		null
	)
	const navigate = useNavigate()
	const {
		handleSubmit,
		register,
		reset,
		control,
		formState: { errors },
	} = useForm<CourseFormData>()

	const courseTypes = [
		{ value: 'Short Course', label: 'Short Course' },
		{ value: 'Course', label: 'Main Course' },
	]

	const warehouseOptions = warehousesData.map((warehouse) => ({
		value: warehouse._id,
		label: `${warehouse.name} - ${warehouse.location}`,
	}))

	const roleOptions = rolesData.map((role) => ({
		value: role._id,
		label: role.role_name,
	}))

	const [courseErrors, setCourseErrors] = useState<any>({})

	const [courseTypeValue, setCourseTypeValue] = useState('')
	const [courseTitleValue, setCourseTitleValue] = useState('')

	// Add new state for content collapse
	const [contentCollapse, setContentCollapse] = useState<{
		[key: string]: boolean
	}>({})

	// API Calls
	const getRoles = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/users/role`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				throw new Error('Failed to fetch roles')
			}

			const fetchedData = await response.json()
			setRolesData(fetchedData)
		} catch (error: any) {
			console.error('Error fetching roles:', error)
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

	const handleCreateCourse = async (formData: CourseFormData) => {
		setApiLoading(true)
		try {
			const courseData = new FormData()
			// Use local state for name and courseType
			courseData.append('name', courseTitleValue)
			if (typeof formData.approximateHours !== 'undefined') {
				courseData.append('approximateHours', String(formData.approximateHours ?? 0))
			}
			if (typeof formData.courseDuration !== 'undefined') {
				courseData.append('courseDuration', String(formData.courseDuration ?? 0))
			}
			courseData.append('level', formData.level)
			courseData.append('language', formData.language)
			courseData.append('sequence', (formData.sequence ?? 0).toString())
			courseData.append('passingGrade', '70')
			courseData.append('courseType', courseTypeValue)

			// Prepare chapters with video file references
			const chaptersWithVideoRefs = chapters.map((chapter, chapterIdx) => ({
				...chapter,
				sections: chapter.sections.map((section, sectionIdx) => ({
					...section,
					content: section.content.map((content, contentIdx) => {
						let videoKey = ''
						if (content.videoFile) {
							videoKey = `chapter_video_${chapterIdx}_section_${sectionIdx}_content_${contentIdx}`
							courseData.append(videoKey, content.videoFile)
						}
						// Remove videoFile from JSON, add videoKey
						const { videoFile, ...rest } = content
						return { ...rest, videoKey }
					}),
				})),
			}))
			courseData.append('chapters', JSON.stringify(chaptersWithVideoRefs))

			// Access control
			const accessControl = {
				roles: selectedRoles.map((role) => role.value),
				stores: selectedWarehouses.map((store) => store.value),
			}
			courseData.append('accessControl', JSON.stringify(accessControl))

			if (selectedImage) {
				courseData.append('courseThumbnail', selectedImage)
			}

			const response = await fetch(`${BASE_API}/api/courses`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: courseData,
			})

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(
					errorMessage.message ||
						errorMessage.error ||
						'Failed to create course'
				)
			}

			// Handle success
			reset()
			setSelectedImage(null)
			setChapters([])
			setCurrentStep(1)
			Swal.fire({
				title: 'Success!',
				text: 'Course created successfully!',
				icon: 'success',
				timer: 1500,
			}).then(() => {
				navigate(-1)
			})
		} catch (error: any) {
			Swal.fire({
				title: 'Error!',
				text: error.message || 'Failed to create course. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK',
			})
		} finally {
			setApiLoading(false)
		}
	}

	// Effects
	useEffect(() => {
		getRoles()
		getWarehouses()
	}, [])

	// Add handlers for chapters, sections, and content
	const handleAddChapter = () => {
		const newChapter: Chapter = {
			title: '',
			// deadline: '',
			sequence: chapters.length + 1,
			sections: [],
		}
		setChapters([...chapters, newChapter])
		setActiveChapterIndex(chapters.length)
	}

	const handleUpdateChapter = (
		index: number,
		field: keyof Chapter,
		value: any
	) => {
		const updatedChapters = [...chapters]
		updatedChapters[index] = {
			...updatedChapters[index],
			[field]: value,
		}
		setChapters(updatedChapters)
	}

	const handleDeleteChapter = (index: number) => {
		const updatedChapters = chapters.filter((_, i) => i !== index)
		// Update sequences
		updatedChapters.forEach((chapter, i) => {
			chapter.sequence = i + 1
		})
		setChapters(updatedChapters)
		setActiveChapterIndex(null)
	}

	const handleAddSection = (chapterIndex: number) => {
		const updatedChapters = [...chapters]
		const newSection: ChapterSection = {
			title: '',
			sequence: updatedChapters[chapterIndex].sections.length + 1,
			introduction: '',
			objective: '',
			content: [],
		}
		updatedChapters[chapterIndex].sections.push(newSection)
		setChapters(updatedChapters)
		setActiveSectionIndex(updatedChapters[chapterIndex].sections.length - 1)
	}

	const handleUpdateSection = (
		chapterIndex: number,
		sectionIndex: number,
		field: keyof ChapterSection,
		value: any
	) => {
		const updatedChapters = [...chapters]
		updatedChapters[chapterIndex].sections[sectionIndex] = {
			...updatedChapters[chapterIndex].sections[sectionIndex],
			[field]: value,
		}
		setChapters(updatedChapters)
	}

	const handleDeleteSection = (chapterIndex: number, sectionIndex: number) => {
		const updatedChapters = [...chapters]
		updatedChapters[chapterIndex].sections = updatedChapters[
			chapterIndex
		].sections.filter((_, i) => i !== sectionIndex)
		// Update sequences
		updatedChapters[chapterIndex].sections.forEach((section, i) => {
			section.sequence = i + 1
		})
		setChapters(updatedChapters)
		setActiveSectionIndex(null)
	}

	const handleAddContent = (chapterIndex: number, sectionIndex: number) => {
		const updatedChapters = [...chapters]
		const newContent: ChapterContent = {
			contentType: 'video',
			title: '',
			sequence:
				updatedChapters[chapterIndex].sections[sectionIndex].content.length + 1,
			duration: 0,
			minimumWatchTime: 0,
		}
		updatedChapters[chapterIndex].sections[sectionIndex].content.push(
			newContent
		)
		setChapters(updatedChapters)
	}

	const handleUpdateContent = (
		chapterIndex: number,
		sectionIndex: number,
		contentIndex: number,
		field: keyof ChapterContent,
		value: any
	) => {
		const updatedChapters = [...chapters]
		updatedChapters[chapterIndex].sections[sectionIndex].content[contentIndex] =
			{
				...updatedChapters[chapterIndex].sections[sectionIndex].content[
					contentIndex
				],
				[field]: value,
			}
		setChapters(updatedChapters)
	}

	const handleDeleteContent = (
		chapterIndex: number,
		sectionIndex: number,
		contentIndex: number
	) => {
		const updatedChapters = [...chapters]
		updatedChapters[chapterIndex].sections[sectionIndex].content =
			updatedChapters[chapterIndex].sections[sectionIndex].content.filter(
				(_, i) => i !== contentIndex
			)
		// Update sequences
		updatedChapters[chapterIndex].sections[sectionIndex].content.forEach(
			(content, i) => {
				content.sequence = i + 1
			}
		)
		setChapters(updatedChapters)
	}

	// Validation helpers
	const validateCourseStep = () => {
		const errors: any = {}
		if (!courseTypeValue) errors.courseType = 'Course type is required.'
		if (!selectedRoles.length) errors.roles = 'At least one role is required.'
		if (!selectedWarehouses.length)
			errors.stores = 'At least one store is required.'
		if (!courseTitleValue) errors.title = 'Course title is required.'
		if (!selectedImage) errors.image = 'Course image is required.'
		setCourseErrors(errors)
		return Object.keys(errors).length === 0
	}

	const allOption: SelectOption = { value: '*', label: 'Select All' }

	const handleSelectAllStores = (selected: SelectOption[] | null) => {
		if (!selected) {
			setSelectedWarehouses([])
			return
		}

		// Check if "Select All" option was chosen
		if (selected.some((option) => option.value === allOption.value)) {
			// Select all except "Select All" option itself
			setSelectedWarehouses(warehouseOptions)
		} else {
			setSelectedWarehouses(selected)
		}
	}

	const handleSelectAllRoles = (selected: SelectOption[] | null) => {
		if (!selected) {
			setSelectedRoles([])
			return
		}

		// Check if "Select All" option was chosen
		if (selected.some((option) => option.value === allOption.value)) {
			// Select all except "Select All" option itself
			setSelectedRoles(roleOptions)
		} else {
			setSelectedRoles(selected)
		}
	}

	// Update renderStep1
	const renderStep1 = () => (
		<Form>
			<Card>
				<Card.Header>
					<h4 className="header-title">Course Details</h4>
				</Card.Header>
				<Card.Body>
					<Row>
						<Col md={12}>
							<Form.Group className="mb-3">
								<Form.Label>
									Course Type <span className="text-danger">*</span>
								</Form.Label>
								<Select
									options={courseTypes}
									value={
										courseTypes.find((opt) => opt.value === courseTypeValue) ||
										null
									}
									onChange={(opt) => setCourseTypeValue(opt?.value || '')}
									placeholder="Select course type..."
									className="react-select-container"
									classNamePrefix="react-select"
								/>
								{courseErrors.courseType && (
									<div className="text-danger small">
										{courseErrors.courseType}
									</div>
								)}
							</Form.Group>
						</Col>
					</Row>
					<Row>
						<Col md={6}>
							<Form.Group className="mb-3">
								<Form.Label>
									Applicable Stores <span className="text-danger">*</span>
								</Form.Label>
								<Select
									isMulti
									options={[allOption, ...warehouseOptions]} // Add "Select All" at the top
									value={selectedWarehouses}
									onChange={(selected) =>
										handleSelectAllStores(selected as SelectOption[])
									}
									placeholder="Select stores..."
									className="react-select-container"
									classNamePrefix="react-select"
								/>
								{courseErrors.stores && (
									<div className="text-danger small">{courseErrors.stores}</div>
								)}
							</Form.Group>
						</Col>
						<Col md={6}>
							<Form.Group className="mb-3">
								<Form.Label>
									Applicable Roles <span className="text-danger">*</span>
								</Form.Label>
								<Select
									isMulti
									options={[allOption, ...roleOptions]} // Add "Select All" at the top
									value={selectedRoles}
									onChange={(selected) =>
										handleSelectAllRoles(selected as SelectOption[])
									}
									placeholder="Select roles..."
									className="react-select-container"
									classNamePrefix="react-select"
								/>

								{courseErrors.roles && (
									<div className="text-danger small">{courseErrors.roles}</div>
								)}
							</Form.Group>
						</Col>
					</Row>
					<Row>
						<Col md={12}>
							<Form.Group className="mb-3">
								<Form.Label>
									Course Image <span className="text-danger">*</span>
								</Form.Label>
								<div className="mb-2">
									<p
										style={{ fontSize: '0.8rem' }}
										className="text-danger mb-0">
										{'File Size: Upload images up to 5 MB.'}
									</p>
									<p
										style={{ fontSize: '0.8rem' }}
										className="text-danger mb-0">
										{'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
									</p>
									<p
										style={{ fontSize: '0.8rem' }}
										className="text-danger mb-0">
										{'Upload Limit: Only 1 image can be uploaded.'}
									</p>
								</div>
								<SingleFileUploader
									icon="ri-upload-cloud-2-line"
									text="Drop file here or click to upload a course image."
									onFileUpload={(file: File) => setSelectedImage(file)}
								/>
								{courseErrors?.image && (
									<div className="text-danger small">{courseErrors?.image}</div>
								)}
							</Form.Group>
						</Col>
					</Row>
					<Row>
						<Col md={12}>
							<Form.Group className="mb-3">
								<Form.Label>
									Title <span className="text-danger">*</span>
								</Form.Label>
								<Form.Control
									type="text"
									value={courseTitleValue}
									onChange={(e) => setCourseTitleValue(e.target.value)}
									placeholder="Enter course title"
								/>
								{courseErrors.title && (
									<div className="text-danger small">{courseErrors.title}</div>
								)}
							</Form.Group>
						</Col>
					</Row>
					<Row>
					<Col md={3}>
							<FormInput
							label="Approximate Hours"
								type="number"
							name="approximateHours"
								containerClass="mb-3"
								register={register}
								errors={errors}
								control={control}
								min="0"
								step="1"
							/>
						</Col>
					<Col md={3}>
							<FormInput
							label="Course Duration (Minutes)"
								type="number"
							name="courseDuration"
								containerClass="mb-3"
								register={register}
								errors={errors}
								control={control}
								min="0"
								step="1"
							/>
						</Col>
						<Col md={6}>
							<Form.Group className="mb-3">
								<Form.Label>Level</Form.Label>
								<Form.Control
									type="text"
									{...register('level')}
									placeholder="Enter level (e.g., Beginner)"
								/>
							</Form.Group>
						</Col>
					</Row>
					<Row>
						<Col md={6}>
							<Form.Group className="mb-3">
								<Form.Label>Language</Form.Label>
								<Form.Control
									type="text"
									{...register('language')}
									placeholder="Enter language (e.g., English)"
								/>
							</Form.Group>
						</Col>
						<Col md={6}>
							<FormInput
								label="Sequence"
								type="number"
								name="sequence"
								containerClass="mb-3"
								register={register}
								errors={errors}
								control={control}
								min="0"
								step="1"
							/>
						</Col>
					</Row>
				</Card.Body>
				<Card.Footer>
					<div className="d-flex justify-content-end">
						<Button
							variant="primary"
							onClick={() => {
								if (validateCourseStep()) setCurrentStep(2)
							}}>
							Next: Add Chapters
						</Button>
					</div>
				</Card.Footer>
			</Card>
		</Form>
	)

	// Update renderStep2 for all chapter/section/content changes
	const renderStep2 = () => (
		<Form onSubmit={handleSubmit(handleCreateCourse)}>
			<Card>
				<Card.Header
					className="d-flex justify-content-between align-items-center"
					style={{ background: '#e3f2fd' }}>
					<h4 className="header-title">Chapters</h4>
					<Button variant="primary" size="sm" onClick={handleAddChapter}>
						<i className="bi bi-plus"></i> Add Chapter
					</Button>
				</Card.Header>
				<Card.Body>
					{chapters.map((chapter, chapterIndex) => (
						<Card key={chapterIndex} className="mb-3">
							<Card.Header
								className="d-flex justify-content-between align-items-center"
								style={{ cursor: 'pointer', background: '#bbdefb' }}
								onClick={() =>
									setActiveChapterIndex(
										activeChapterIndex === chapterIndex ? null : chapterIndex
									)
								}>
								<div className="d-flex align-items-center">
									<span className="me-2">Chapter {chapter.sequence}:</span>
									{chapter.title || 'Untitled Chapter'}
								</div>
								<div className="d-flex gap-2 align-items-center">
									<Button
										variant="danger"
										size="sm"
										onClick={(e) => {
											e.stopPropagation()
											handleDeleteChapter(chapterIndex)
										}}>
										<i className="bi bi-trash"></i>
									</Button>
									<Button
										variant="light"
										size="sm"
										onClick={(e) => {
											e.stopPropagation()
											setActiveChapterIndex(
												activeChapterIndex === chapterIndex
													? null
													: chapterIndex
											)
										}}>
										<i
											className={`bi ${activeChapterIndex === chapterIndex ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
									</Button>
								</div>
							</Card.Header>
							{activeChapterIndex === chapterIndex && (
								<Card.Body>
									<Row>
										<Col md={12}>
											<Form.Group className="mb-3">
												<Form.Label>
													Chapter Title <span className="text-danger">*</span>
												</Form.Label>
												<Form.Control
													type="text"
													value={chapter.title}
													onChange={(e) =>
														handleUpdateChapter(
															chapterIndex,
															'title',
															e.target.value
														)
													}
													placeholder="Enter chapter title"
												/>
											</Form.Group>
										</Col>
										{/* <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Deadline <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={chapter.deadline || ''}
                                                    onChange={e => handleUpdateChapter(chapterIndex, 'deadline', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col> */}
										<Col md={12}>
											<Form.Group className="mb-3">
												<Form.Label>Sequence</Form.Label>
												<Form.Control
													type="number"
													value={chapter.sequence}
													onChange={(e) =>
														handleUpdateChapter(
															chapterIndex,
															'sequence',
															parseInt(e.target.value)
														)
													}
													min={1}
												/>
											</Form.Group>
										</Col>
									</Row>
									<div className="mt-4">
										<div className="d-flex justify-content-between align-items-center mb-3">
											<h5>Sections</h5>
											<Button
												variant="info"
												size="sm"
												onClick={() => handleAddSection(chapterIndex)}>
												<i className="bi bi-plus"></i> Add Section
											</Button>
										</div>
										{chapter.sections.map((section, sectionIndex) => (
											<Card key={sectionIndex} className="mb-3">
												<Card.Header
													className="d-flex justify-content-between align-items-center"
													style={{ cursor: 'pointer', background: '#c8e6c9' }}
													onClick={() =>
														setActiveSectionIndex(
															activeSectionIndex === sectionIndex
																? null
																: sectionIndex
														)
													}>
													<div className="d-flex align-items-center">
														<span className="me-2">
															Section {section.sequence}:
														</span>
														{section.title || 'Untitled Section'}
													</div>
													<div className="d-flex gap-2 align-items-center">
														<Button
															variant="danger"
															size="sm"
															onClick={(e) => {
																e.stopPropagation()
																handleDeleteSection(chapterIndex, sectionIndex)
															}}>
															<i className="bi bi-trash"></i>
														</Button>
														<Button
															variant="light"
															size="sm"
															onClick={(e) => {
																e.stopPropagation()
																setActiveSectionIndex(
																	activeSectionIndex === sectionIndex
																		? null
																		: sectionIndex
																)
															}}>
															<i
																className={`bi ${activeSectionIndex === sectionIndex ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
														</Button>
													</div>
												</Card.Header>
												{activeSectionIndex === sectionIndex && (
													<Card.Body>
														<Row>
															<Col md={12}>
																<Form.Group className="mb-3">
																	<Form.Label>
																		Section Title{' '}
																		<span className="text-danger">*</span>
																	</Form.Label>
																	<Form.Control
																		type="text"
																		value={section.title}
																		onChange={(e) =>
																			handleUpdateSection(
																				chapterIndex,
																				sectionIndex,
																				'title',
																				e.target.value
																			)
																		}
																		placeholder="Enter section title"
																	/>
																</Form.Group>
															</Col>
															<Col md={12}>
																<Form.Group className="mb-3">
																	<Form.Label>Introduction</Form.Label>
																	<ReactQuill
																		theme="snow"
																		value={section.introduction}
																		onChange={(val) =>
																			handleUpdateSection(
																				chapterIndex,
																				sectionIndex,
																				'introduction',
																				val
																			)
																		}
																		placeholder="Enter section introduction"
																		style={{
																			height: '120px',
																			marginBottom: '50px',
																		}}
																	/>
																</Form.Group>
															</Col>
															<Col md={12}>
																<Form.Group className="mb-3">
																	<Form.Label>Objective</Form.Label>
																	<ReactQuill
																		theme="snow"
																		value={section.objective}
																		onChange={(val) =>
																			handleUpdateSection(
																				chapterIndex,
																				sectionIndex,
																				'objective',
																				val
																			)
																		}
																		placeholder="Enter section objective"
																		style={{
																			height: '120px',
																			marginBottom: '50px',
																		}}
																	/>
																</Form.Group>
															</Col>
															<Col md={12}>
																<Form.Group className="mb-3">
																	<Form.Label>Sequence</Form.Label>
																	<Form.Control
																		type="number"
																		value={section.sequence}
																		onChange={(e) =>
																			handleUpdateSection(
																				chapterIndex,
																				sectionIndex,
																				'sequence',
																				parseInt(e.target.value)
																			)
																		}
																		min={1}
																	/>
																</Form.Group>
															</Col>
														</Row>
														<div className="mt-4">
															<div className="d-flex justify-content-between align-items-center mb-3">
																<h6>Content (Video)</h6>
																<Button
																	variant="secondary"
																	size="sm"
																	onClick={() =>
																		handleAddContent(chapterIndex, sectionIndex)
																	}>
																	<i className="bi bi-plus"></i> Add Content
																</Button>
															</div>
															{section.content.map((content, contentIndex) => (
																<Card key={contentIndex} className="mb-3">
																	<Card.Header
																		className="d-flex justify-content-between align-items-center"
																		style={{
																			cursor: 'pointer',
																			background: '#ffe082',
																		}}
																		onClick={() => {
																			const key = `${chapterIndex}_${sectionIndex}_${contentIndex}`
																			setContentCollapse((prev) => ({
																				...prev,
																				[key]: !prev[key],
																			}))
																		}}>
																		<div className="d-flex align-items-center">
																			<span className="me-2">
																				Content {content.sequence}:
																			</span>
																			{content.title || 'Untitled Content'}
																		</div>
																		<div className="d-flex gap-2 align-items-center">
																			<Button
																				variant="danger"
																				size="sm"
																				onClick={(e) => {
																					e.stopPropagation()
																					handleDeleteContent(
																						chapterIndex,
																						sectionIndex,
																						contentIndex
																					)
																				}}>
																				<i className="bi bi-trash"></i>
																			</Button>
																			<Button
																				variant="light"
																				size="sm"
																				onClick={(e) => {
																					e.stopPropagation()
																					const key = `${chapterIndex}_${sectionIndex}_${contentIndex}`
																					setContentCollapse((prev) => ({
																						...prev,
																						[key]: !prev[key],
																					}))
																				}}>
																				<i
																					className={`bi ${contentCollapse[`${chapterIndex}_${sectionIndex}_${contentIndex}`] ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
																			</Button>
																		</div>
																	</Card.Header>
																	{contentCollapse[
																		`${chapterIndex}_${sectionIndex}_${contentIndex}`
																	] && (
																		<Card.Body>
																			<Row>
																				<Col md={12}>
																					<Form.Group className="mb-3">
																						<Form.Label>
																							Content Title{' '}
																							<span className="text-danger">
																								*
																							</span>
																						</Form.Label>
																						<Form.Control
																							type="text"
																							value={content.title}
																							onChange={(e) =>
																								handleUpdateContent(
																									chapterIndex,
																									sectionIndex,
																									contentIndex,
																									'title',
																									e.target.value
																								)
																							}
																							placeholder="Enter content title"
																						/>
																					</Form.Group>
																				</Col>
																				<Col md={4}>
																					<Form.Group className="mb-3">
																						<Form.Label>Sequence</Form.Label>
																						<Form.Control
																							type="number"
																							value={content.sequence}
																							onChange={(e) =>
																								handleUpdateContent(
																									chapterIndex,
																									sectionIndex,
																									contentIndex,
																									'sequence',
																									parseInt(e.target.value)
																								)
																							}
																							min={1}
																						/>
																					</Form.Group>
																				</Col>
																				<Col md={4}>
																					<Form.Group className="mb-3">
																						<Form.Label>
																							Duration (seconds)
																						</Form.Label>
																						<Form.Control
																							type="number"
																							value={content.duration}
																							onChange={(e) =>
																								handleUpdateContent(
																									chapterIndex,
																									sectionIndex,
																									contentIndex,
																									'duration',
																									parseInt(e.target.value)
																								)
																							}
																							min={0}
																						/>
																					</Form.Group>
																				</Col>
																				<Col md={4}>
																					<Form.Group className="mb-3">
																						<Form.Label>
																							Minimum Watch Time (seconds){' '}
																							<span className="text-danger">
																								*
																							</span>
																						</Form.Label>
																						<Form.Control
																							type="number"
																							value={content.minimumWatchTime}
																							onChange={(e) =>
																								handleUpdateContent(
																									chapterIndex,
																									sectionIndex,
																									contentIndex,
																									'minimumWatchTime',
																									parseInt(e.target.value)
																								)
																							}
																							min={0}
																						/>
																					</Form.Group>
																				</Col>
																				<Col md={12}>
																					<Form.Group className="mb-3">
																						<Form.Label>
																							Video Upload{' '}
																							<span className="text-danger">
																								*
																							</span>
																						</Form.Label>
																						<div className="mb-2">
																							<p
																								style={{ fontSize: '0.8rem' }}
																								className="text-danger mb-0">
																								{
																									'File Size: Upload video up to 500 MB.'
																								}
																							</p>
																							<p
																								style={{ fontSize: '0.8rem' }}
																								className="text-danger mb-0">
																								{
																									'Recommended Video Dimensions: 1920 x 1080 (Full HD) or minimum 1280 x 720 (HD).'
																								}
																							</p>
																						</div>
																						<input
																							type="file"
																							accept="video/*"
																							className="form-control"
																							onChange={(e) =>
																								handleUpdateContent(
																									chapterIndex,
																									sectionIndex,
																									contentIndex,
																									'videoFile',
																									e.target.files?.[0] || null
																								)
																							}
																						/>
																					</Form.Group>
																				</Col>
																			</Row>
																		</Card.Body>
																	)}
																</Card>
															))}
														</div>
													</Card.Body>
												)}
											</Card>
										))}
									</div>
								</Card.Body>
							)}
						</Card>
					))}
				</Card.Body>
				<Card.Footer>
					<div className="d-flex justify-content-between">
						<Button variant="secondary" onClick={() => setCurrentStep(1)}>
							Back to Course Details
						</Button>
						<Button variant="success" type="submit" disabled={apiLoading}>
							{apiLoading ? 'Creating Course...' : 'Create Course'}
						</Button>
					</div>
				</Card.Footer>
			</Card>
		</Form>
	)

	return (
		<>
			<PageBreadcrumb
				title="Create Course"
				subName="University"
				allowNavigateBack={true}
			/>
			{currentStep === 1 && renderStep1()}
			{currentStep === 2 && renderStep2()}
		</>
	)
}

export default CreateCourse
