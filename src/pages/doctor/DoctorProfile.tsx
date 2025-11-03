import { useState, useEffect } from 'react'
import { Card, Form, Row, Col, Button, ListGroup, Badge } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import Select from 'react-select'
import { PageBreadcrumb } from '@/components'
import { useAuthContext } from '@/common'
import { toastService } from '@/common/context/toast.service'
import { FileUploader } from '@/components/FileUploader'
import Swal from 'sweetalert2'

// Type Definitions
interface DoctorProfileResponse {
  _id: string
  title: string
  dob: string
  gender: string
  cnic: string
  landline_number: string
  clinic_landline: string
  cv: string | null
  qualification: string
  degree: string[]
  awards: string
  about: string
  youtube_link: string
  signature: string | null
  certificate: string[]
  specialties: Array<{ _id: string, name: string }>
  hospitals: Array<{ _id: string, name: string }>
}

type FileUploadState = {
  cv: File | null
  signature: File | null
  certificate: File[]
  degree: File[]
}

// Option type for react-select
interface SelectOption {
  value: string
  label: string
}

const DoctorProfile = () => {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [hospitals, setHospitals] = useState<SelectOption[]>([])
  const [specialties, setSpecialties] = useState<SelectOption[]>([])
  const [profileExists, setProfileExists] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [selectedSpecialties, setSelectedSpecialties] = useState<SelectOption[]>([])
  const [selectedHospitals, setSelectedHospitals] = useState<SelectOption[]>([])
  const [existingFiles, setExistingFiles] = useState<{
    cv: string | null
    signature: string | null
    certificate: string[]
    degree: string[]
  }>({
    cv: null,
    signature: null,
    certificate: [],
    degree: []
  })
  const [filesToDelete, setFilesToDelete] = useState<{
    certificate: string[]
    degree: string[]
  }>({
    certificate: [],
    degree: []
  })
  const BASE_API = import.meta.env.VITE_BASE_API

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm()

  // Helper function to get file name from path
  const getFileNameFromPath = (path: string): string => {
    if (!path) return ''
    const parts = path.split('\\')
    return parts[parts.length - 1]
  }

  // Helper to determine file type
  const getFileType = (fileName: string): 'image' | 'pdf' | 'unknown' => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'image'
    if (ext === 'pdf') return 'pdf'
    return 'unknown'
  }

  // API Service
  const doctorProfileService = {
    async fetch() {
      const response = await fetch(`${BASE_API}/api/doctor-profiles/me`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch profile')
      return response.json()
    },

    async createOrUpdate(formData: FormData, method: 'POST' | 'PUT') {
      const response = await fetch(`${BASE_API}/api/doctor-profiles`, {
        method,
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData
      })
      if (!response.ok) throw new Error(`Failed to ${method === 'POST' ? 'create' : 'update'} profile`)
      return response.json()
    },

    async fetchOptions(endpoint: string) {
      const response = await fetch(`${BASE_API}/api/${endpoint}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`)
      return response.json()
    },

    async deleteFile(fileField: string, filePath: string) {
      const response = await fetch(`${BASE_API}/api/doctor-profiles/delete-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          field: fileField,
          filePath: filePath
        })
      })
      if (!response.ok) throw new Error('Failed to delete file')
      return response.json()
    }
  }

  // File Upload Handlers
  const handleFileUpload = (fieldName: keyof FileUploadState, files: File[]) => {
    const maxFiles = {
      certificate: 5,
      degree: 4,
      cv: 1,
      signature: 1
    }

    // For multi-file fields, check combined total with existing files
    if (fieldName === 'certificate' || fieldName === 'degree') {
      const existingCount = existingFiles[fieldName].length - filesToDelete[fieldName].length
      const totalCount = existingCount + files.length

      if (totalCount > maxFiles[fieldName]) {
        toastService.error(`Maximum ${maxFiles[fieldName]} files allowed for ${fieldName}. You already have ${existingCount} files.`)
        return
      }
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    const maxSize = 5 * 1024 * 1024 // 5MB

    const validFiles = files.every(file =>
      allowedTypes.includes(file.type) && file.size <= maxSize
    )

    if (!validFiles) {
      toastService.error('Invalid file type or size exceeded')
      return
    }

    setValue(fieldName, files)
    setUploadProgress(prev => ({ ...prev, [fieldName]: 0 }))
  }

  // Handle file deletion request
  const handleDeleteFile = async (fieldName: 'certificate' | 'degree', filePath: string) => {
    try {
      // Add file to deletion list
      setFilesToDelete(prev => ({
        ...prev,
        [fieldName]: [...prev[fieldName], filePath]
      }))

      toastService.success(`File marked for deletion. Will be removed when you save the profile.`)
    } catch (error) {
      console.error('Error marking file for deletion:', error)
      toastService.error('Failed to mark file for deletion')
    }
  }

  // Cancel file deletion
  const handleCancelDelete = (fieldName: 'certificate' | 'degree', filePath: string) => {
    setFilesToDelete(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter(path => path !== filePath)
    }))
    toastService.success('File deletion canceled')
  }

  // Form Submit Handler
  const handleProfileUpdate = async (formData: any) => {
    setLoading(true)
    try {
      const form = new FormData()
      const allowedFields = [
        'title', 'dob', 'gender', 'cnic', 'landline_number',
        'clinic_landline', 'qualification', 'awards', 'about',
        'youtube_link'
      ]

      // Handle basic text fields
      allowedFields.forEach(key => {
        if (formData[key]) {
          form.append(key, formData[key])
        }
      })

      // Handle specialties and hospitals - extract just the IDs from the selected options
      if (selectedSpecialties && selectedSpecialties.length > 0) {
        selectedSpecialties.forEach(specialty => {
          form.append('specialties[]', specialty.value)
        })
      }

      if (selectedHospitals && selectedHospitals.length > 0) {
        selectedHospitals.forEach(hospital => {
          form.append('hospitals[]', hospital.value)
        })
      }

      // Handle files to delete
      if (filesToDelete.certificate.length > 0) {
        filesToDelete.certificate.forEach(filePath => {
          form.append('certificate_to_delete[]', filePath)
        })
      }

      if (filesToDelete.degree.length > 0) {
        filesToDelete.degree.forEach(filePath => {
          form.append('degree_to_delete[]', filePath)
        })
      }

      // Handle file uploads
      if (formData.cv && formData.cv[0] instanceof File) {
        form.append('cv', formData.cv[0])
      }

      if (formData.signature && formData.signature[0] instanceof File) {
        form.append('signature', formData.signature[0])
      }

      // For multi-file fields, we need to check if these are new files
      if (formData.certificate) {
        Array.from(formData.certificate).forEach((file: any) => {
          if (file instanceof File) {
            form.append('certificate', file)
          }
        })
      }

      if (formData.degree) {
        Array.from(formData.degree).forEach((file: any) => {
          if (file instanceof File) {
            form.append('degree', file)
          }
        })
      }


      await doctorProfileService.createOrUpdate(form, profileExists ? 'PUT' : 'POST')
      toastService.success(`Profile ${profileExists ? 'updated' : 'created'} successfully`)

      // Reset the files to delete
      setFilesToDelete({
        certificate: [],
        degree: []
      })

      // Refetch the profile to get updated data
      fetchDoctorProfile()
    } catch (error) {
      toastService.error('Operation failed')
      console.error('Profile update error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch Initial Data
  const fetchDoctorProfile = async () => {
    try {
      const data: DoctorProfileResponse = await doctorProfileService.fetch()
      setProfileExists(!!data)

      // Format date to YYYY-MM-DD for date input
      const formattedDob = data.dob ? new Date(data.dob).toISOString().split('T')[0] : ''

      // Transform specialties and hospitals data for react-select
      if (data.specialties && data.specialties.length > 0) {
        const specialtyOptions = data.specialties.map(specialty => ({
          value: specialty._id,
          label: specialty.name
        }))
        setSelectedSpecialties(specialtyOptions)
      }

      if (data.hospitals && data.hospitals.length > 0) {
        const hospitalOptions = data.hospitals.map(hospital => ({
          value: hospital._id,
          label: hospital.name
        }))
        setSelectedHospitals(hospitalOptions)
      }

      // Set existing files
      setExistingFiles({
        cv: data.cv,
        signature: data.signature,
        certificate: data.certificate || [],
        degree: data.degree || []
      })

      // Set all form values
      reset({
        ...data,
        dob: formattedDob
      })

    } catch (error) {
      console.error('Profile fetch failed:', error)
    }
  }
  const deleteConfirmation = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      confirmButtonColor: "#9c5100",
      cancelButtonText: 'No, keep it',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        deleteProfileData()
      }
    })
  }

  const deleteProfileData = async () => {
    try {
      setLoading(true)

      const response = await fetch(`${BASE_API}/api/doctor-profiles`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      })

      if (!response.ok) {
        const errorResponse = await response.json()
        throw new Error(errorResponse.message || errorResponse.error || 'Failed to delete profile')
      }

      toastService.success('Profile deleted successfully')
      setProfileExists(false)
      reset({
        title: '',
        dob: '',
        gender: '',
        cnic: '',
        landline_number: '',
      }) // Reset form to empty
      setSelectedSpecialties([])
      setSelectedHospitals([])
      setExistingFiles({
        cv: null,
        signature: null,
        certificate: [],
        degree: []
      })
      setFilesToDelete({
        certificate: [],
        degree: []
      })
    } catch (error: any) {
      toastService.error(error.message || 'Failed to delete profile')
    } finally {
      setLoading(false)
    }

  }
  useEffect(() => {
    const initializeData = async () => {
      try {
        const [specialtiesData, hospitalsData] = await Promise.all([
          doctorProfileService.fetchOptions('specialty'),
          doctorProfileService.fetchOptions('hospitals')
        ])

        setSpecialties(specialtiesData.map((s: any) => ({ value: s._id, label: s.name })))
        setHospitals(hospitalsData.map((h: any) => ({ value: h._id, label: h.name })))
      } catch (error) {
        toastService.error('Failed to load initial data')
      }
    }

    fetchDoctorProfile()
    initializeData()
  }, [])

  return (
    <>
      <PageBreadcrumb title="Doctor Profile" subName="Profile" />
      <Card>
        <Card.Header>
          <h4 className="header-title">Professional Profile Management</h4>
          <p className="text-muted mb-0">
            Update your medical credentials and professional information
          </p>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit(handleProfileUpdate)}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Professional Title</Form.Label>
                  <Form.Control
                    type="text"
                    {...register('title')}
                    isInvalid={!!errors.title}
                  />
                  {errors.title && (
                    <Form.Control.Feedback type="invalid">
                      {errors.title.message as string}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    {...register('dob')}
                    isInvalid={!!errors.dob}
                  />
                  {errors.dob && (
                    <Form.Control.Feedback type="invalid">
                      {errors.dob.message as string}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select {...register('gender')} isInvalid={!!errors.gender}>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Form.Select>
                  {errors.gender && (
                    <Form.Control.Feedback type="invalid">
                      {errors.gender.message as string}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CNIC</Form.Label>
                  <Form.Control
                    type="text"
                    {...register('cnic')}
                    placeholder="XXXXX-XXXXXXX-X"
                    isInvalid={!!errors.cnic}
                  />
                  {errors.cnic && (
                    <Form.Control.Feedback type="invalid">
                      {errors.cnic.message as string}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Number</Form.Label>
                  <Form.Control
                    type="text"
                    {...register('landline_number')}
                    isInvalid={!!errors.landline_number}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Professional Summary</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    {...register('about')}
                    placeholder="Describe your medical expertise and experience"
                    isInvalid={!!errors.about}
                  />
                  {errors.about && (
                    <Form.Control.Feedback type="invalid">
                      {errors.about.message as string}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Associated Hospitals</Form.Label>
                  <Select
                    isMulti
                    options={hospitals}
                    value={selectedHospitals}
                    onChange={(selected) => {
                      setSelectedHospitals(selected as SelectOption[])
                    }}
                    className={errors.hospitals ? 'is-invalid' : ''}
                  />
                  {errors.hospitals && (
                    <div className="invalid-feedback d-block">
                      {errors.hospitals.message as string}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Specialties</Form.Label>
                  <Select
                    isMulti
                    options={specialties}
                    value={selectedSpecialties}
                    onChange={(selected) => {
                      setSelectedSpecialties(selected as SelectOption[])
                    }}
                    className={errors.specialties ? 'is-invalid' : ''}
                  />
                  {errors.specialties && (
                    <div className="invalid-feedback d-block">
                      {errors.specialties.message as string}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            {/* CV Upload Section */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CV Upload</Form.Label>
                  <div className="mb-2">
                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                      {'File Size: Upload images up to 5 MB.'}
                    </p>
                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                      {'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png), PDF (.pdf)'}
                    </p>
                  </div>

                  <FileUploader
                    icon="ri-file-text-line"
                    text={existingFiles.cv ? "Replace CV (PDF or Image)" : "Upload CV (PDF or Image)"}
                    onFileUpload={(files: any) => handleFileUpload('cv', files)}
                  />
                  {uploadProgress.cv !== undefined && (
                    <div className="progress mt-2">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${uploadProgress.cv}%` }}
                      />
                    </div>
                  )}
                  {/* Show existing CV if available */}
                  {existingFiles.cv && (
                    <div className="mb-3 border rounded p-2">
                      <div className="d-flex align-items-center">
                        <div>
                          <i className={`ri-file-${getFileType(existingFiles.cv) === 'pdf' ? 'pdf' : 'image'}-line me-1`}></i>
                          <span>{getFileNameFromPath(existingFiles.cv)}</span>
                        </div>
                        <div className="ms-auto">
                          <Badge bg="success" className="me-2">Uploaded</Badge>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-muted p-0"
                            onClick={() => window.open(`${BASE_API}/${existingFiles.cv}`, '_blank')}
                          >
                            <i className="ri-eye-line"></i>
                          </Button>
                        </div>
                      </div>
                      <small className="text-muted d-block mt-1">
                        Uploading a new file will replace this one
                      </small>
                    </div>
                  )}
                </Form.Group>
              </Col>

              {/* Signature Upload Section */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Digital Signature</Form.Label>
                  <div className="mb-2">
                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                      {'File Size: Upload images up to 5 MB.'}
                    </p>
                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                      {'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png)'}
                    </p>
                  </div>

                  <FileUploader
                    icon="ri-image-line"
                    text={existingFiles.signature ? "Replace Signature (Image only)" : "Upload Signature (Image only)"}
                    onFileUpload={(files: any) => handleFileUpload('signature', files)}
                  />
                  {uploadProgress.signature !== undefined && (
                    <div className="progress mt-2">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${uploadProgress.signature}%` }}
                      />
                    </div>
                  )}
                  {existingFiles.signature && (
                    <div className="mb-3 border rounded p-2">
                      <div className="d-flex align-items-center">
                        <div>
                          <i className="ri-image-line me-1"></i>
                          <span>{getFileNameFromPath(existingFiles.signature)}</span>
                        </div>
                        <div className="ms-auto">
                          <Badge bg="success" className="me-2">Uploaded</Badge>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-muted p-0"
                            onClick={() => window.open(`${BASE_API}/${existingFiles.signature}`, '_blank')}
                          >
                            <i className="ri-eye-line"></i>
                          </Button>
                        </div>
                      </div>
                      <small className="text-muted d-block mt-1">
                        Uploading a new file will replace this one
                      </small>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            {/* Certificates Upload Section */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Certificates (Max 5)</Form.Label>
                  <div className="mb-2">
                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                      {'File Size: Upload images up to 5 MB.'}
                    </p>
                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                      {'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png), PDF (.pdf)'}
                    </p>
                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                      {'Upload Limit: Up to 5 files can be uploaded.'}
                    </p>
                  </div>
                  <FileUploader
                    icon="ri-file-list-line"
                    text="Upload Certificates"
                    onFileUpload={(files: any) => handleFileUpload('certificate', files)}

                  />
                  {uploadProgress.certificate !== undefined && (
                    <div className="progress mt-2">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${uploadProgress.certificate}%` }}
                      />
                    </div>
                  )}
                  {/* Show existing certificates if available */}
                  {existingFiles.certificate.length > 0 && (
                    <div className="mb-3 border rounded p-2">
                      <h6 className="mb-2">Uploaded Certificates</h6>
                      <ListGroup>
                        {existingFiles.certificate.map((filePath, index) => {
                          const isMarkedForDeletion = filesToDelete.certificate.includes(filePath);
                          return (
                            <ListGroup.Item
                              key={index}
                              className={`d-flex align-items-center ${isMarkedForDeletion ? 'text-muted bg-light' : ''}`}
                            >
                              <div className="flex-grow-1">
                                <i className={`ri-file-${getFileType(filePath) === 'pdf' ? 'pdf' : 'image'}-line me-1`}></i>
                                <span className={isMarkedForDeletion ? 'text-decoration-line-through' : ''}>
                                  {getFileNameFromPath(filePath)}
                                </span>
                              </div>
                              <div>
                                {isMarkedForDeletion ? (
                                  <>
                                    <Badge bg="danger" className="me-2">Will be deleted</Badge>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="p-0 text-primary"
                                      onClick={() => handleCancelDelete('certificate', filePath)}
                                    >
                                      <i className="ri-refresh-line me-1"></i> Undo
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="text-muted p-0 me-2"
                                      onClick={() => window.open(`${BASE_API}/${filePath}`, '_blank')}
                                    >
                                      <i className="ri-eye-line"></i>
                                    </Button>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="text-danger p-0"
                                      onClick={() => handleDeleteFile('certificate', filePath)}
                                    >
                                      <i className="ri-delete-bin-line"></i>
                                    </Button>
                                  </>
                                )}
                              </div>
                            </ListGroup.Item>
                          )
                        })}
                      </ListGroup>
                    </div>
                  )}
                </Form.Group>
              </Col>

              {/* Degrees Upload Section */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Degrees (Max 4)</Form.Label>
                  <div className="mb-2">
                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                      {'File Size: Upload images up to 5 MB.'}
                    </p>
                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                      {'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png), PDF (.pdf)'}
                    </p>
                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                      {'Upload Limit: Up to 4 files can be uploaded.'}
                    </p>
                  </div>


                  <FileUploader
                    icon="ri-file-list-line"
                    text="Upload Degrees"
                    onFileUpload={(files: any) => handleFileUpload('degree', files)}
                  />
                  {uploadProgress.degree !== undefined && (
                    <div className="progress mt-2">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${uploadProgress.degree}%` }}
                      />
                    </div>
                  )}

                  {/* Show existing degrees if available */}
                  {existingFiles.degree.length > 0 && (
                    <div className="mb-3 border rounded p-2">
                      <h6 className="mb-2">Uploaded Degrees</h6>
                      <ListGroup>
                        {existingFiles.degree.map((filePath, index) => {
                          const isMarkedForDeletion = filesToDelete.degree.includes(filePath);
                          return (
                            <ListGroup.Item
                              key={index}
                              className={`d-flex align-items-center ${isMarkedForDeletion ? 'text-muted bg-light' : ''}`}
                            >
                              <div className="flex-grow-1">
                                <i className={`ri-file-${getFileType(filePath) === 'pdf' ? 'pdf' : 'image'}-line me-1`}></i>
                                <span className={isMarkedForDeletion ? 'text-decoration-line-through' : ''}>
                                  {getFileNameFromPath(filePath)}
                                </span>
                              </div>
                              <div>
                                {isMarkedForDeletion ? (
                                  <>
                                    <Badge bg="danger" className="me-2">Will be deleted</Badge>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="p-0 text-primary"
                                      onClick={() => handleCancelDelete('degree', filePath)}
                                    >
                                      <i className="ri-refresh-line me-1"></i> Undo
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="text-muted p-0 me-2"
                                      onClick={() => window.open(`${BASE_API}/${filePath}`, '_blank')}
                                    >
                                      <i className="ri-eye-line"></i>
                                    </Button>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="text-danger p-0"
                                      onClick={() => handleDeleteFile('degree', filePath)}
                                    >
                                      <i className="ri-delete-bin-line"></i>
                                    </Button>
                                  </>
                                )}
                              </div>
                            </ListGroup.Item>
                          )
                        })}
                      </ListGroup>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <div className="text-end d-flex justify-content-between">
              <Button
                variant="danger"
                onClick={deleteConfirmation}
                disabled={loading}
                className="me-2"
              >
                <i className="ri-delete-bin-line me-1"></i> Delete Profile Data
              </Button>
              <Button
                variant="success"
                type="submit"
                disabled={loading}
                className="me-2"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" />
                    {profileExists ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  profileExists ? 'Update Profile' : 'Create Profile'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </>
  )
}

export default DoctorProfile