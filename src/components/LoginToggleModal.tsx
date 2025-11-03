import { Modal, Button, Form, Alert, Spinner, Row, Col, InputGroup } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import { useAuthContext } from '@/common'
import { useForm } from 'react-hook-form'
import Swal from 'sweetalert2'

interface SecuritySettings {
    id: string
    type: string
    autoLogout: {
        enabled: boolean
        timeLimit: number
    }
    createdAt: string
    updatedAt: string
}

interface SecuritySettingsModalProps {
    show: boolean
    onHide: () => void
    isEditMode: boolean
    existingSettings?: SecuritySettings | null
    onSuccess: () => void
    baseApiUrl: string
}

interface FormData {
    autoLogoutEnabled: boolean
    timeLimit: number
}

const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
    show,
    onHide,
    isEditMode,
    existingSettings,
    onSuccess,
    baseApiUrl
}) => {
    const { user } = useAuthContext()
    const { token } = user

    // States
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form handling
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors }
    } = useForm<FormData>({
        defaultValues: {
            autoLogoutEnabled: false,
            timeLimit: 30
        }
    })

    const watchAutoLogoutEnabled = watch('autoLogoutEnabled')
    const convertSecondsToMinutes = (seconds: number): number => {
        return Math.round(seconds / 60)
    }

    // Handle form submission
    const onSubmit = async (data: FormData) => {
        try {
            setLoading(true)
            setError(null)

            const requestBody = {
                autoLogout: {
                    enabled: data.autoLogoutEnabled,
                    timeLimit: data.timeLimit * 60
                }
            }

            const endpoint = isEditMode
                ? `${baseApiUrl}/api/Security/update-global-settings`
                : `${baseApiUrl}/api/Security/settings`

            const method = isEditMode ? 'PUT' : 'POST'

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to save security settings')
            }

            const result = await response.json()
            console.log('Security settings saved successfully:', result)

            await Swal.fire({
                title: 'Success!',
                text: `Security settings have been ${isEditMode ? 'updated' : 'created'} successfully.`,
                icon: 'success',
                timer: 2000,
                timerProgressBar: true
            })

            // Reset form and close modal
            handleModalClose()
            onSuccess()

        } catch (error: any) {
            console.error('Error saving security settings:', error)
            setError(error.message || 'Failed to save security settings. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Handle modal close
    const handleModalClose = () => {
        reset()
        setError(null)
        setLoading(false)
        onHide()
    }

    // Update the useEffect that sets form values
    useEffect(() => {
        if (show && isEditMode && existingSettings) {
            setValue('autoLogoutEnabled', existingSettings.autoLogout.enabled)
            setValue('timeLimit', convertSecondsToMinutes(existingSettings.autoLogout.timeLimit)) // Convert seconds to minutes for form
        } else if (show && !isEditMode) {
            reset({
                autoLogoutEnabled: false,
                timeLimit: 30 // Default 30 minutes
            })
        }
    }, [show, isEditMode, existingSettings, setValue, reset])


    // Reset when modal opens
    useEffect(() => {
        if (show) {
            setError(null)
        }
    }, [show])

    return (
        <Modal show={show} onHide={handleModalClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-shield-gear me-2"></i>
                    {isEditMode ? 'Update Security Settings' : 'Create Security Settings'}
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    {error && (
                        <Alert variant="danger" className="mb-3">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {error}
                        </Alert>
                    )}

                    {/* Current Settings Preview (Edit Mode) */}
                    {isEditMode && existingSettings && (
                        <div className="mb-4">
                            <h6 className="mb-2">Current Settings:</h6>
                            <div className="p-3 border rounded bg-light">
                                <div className="row">
                                    <div className="col-md-6">
                                        <small className="text-muted d-block">Auto Logout Status:</small>
                                        <strong className={existingSettings.autoLogout.enabled ? 'text-success' : 'text-danger'}>
                                            {existingSettings.autoLogout.enabled ? 'Enabled' : 'Disabled'}
                                        </strong>
                                    </div>
                                    <div className="col-md-6">
                                        <small className="text-muted d-block">Current Time Limit:</small>
                                        <strong>{existingSettings.autoLogout.timeLimit} minutes</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Auto Logout Configuration */}
                    <div className="mb-4">
                        <h6 className="mb-3">
                            <i className="bi bi-clock-history me-2"></i>
                            Auto Logout Configuration
                        </h6>

                        {/* Enable/Disable Auto Logout */}
                        <div className="mb-4">
                            <div className="d-flex align-items-center justify-content-between p-3 border rounded bg-light">
                                <div>
                                    <Form.Label className="mb-1 fw-semibold">
                                        Enable Auto Logout
                                    </Form.Label>
                                    <p className="text-muted mb-0 small">
                                        Automatically log out inactive users to enhance security
                                    </p>
                                </div>
                                <Form.Check
                                    type="switch"
                                    id="autoLogoutEnabled"
                                    {...register('autoLogoutEnabled')}
                                    className="ms-3"
                                    style={{ transform: 'scale(1.2)' }}
                                />
                            </div>
                        </div>

                        {/* Time Limit Configuration */}
                        <div className={`transition-opacity ${watchAutoLogoutEnabled ? 'opacity-100' : 'opacity-50'}`}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Session Timeout Duration <span className="text-danger">*</span>
                                </Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type="number"
                                        max="480"
                                        // step="5"
                                        {...register('timeLimit', {
                                            required: watchAutoLogoutEnabled ? 'Time limit is required when auto logout is enabled' : false,
                                            min: {
                                                value: 1,
                                                message: 'Minimum timeout is 1 minutes'
                                            },
                                        })}
                                        disabled={!watchAutoLogoutEnabled}
                                        placeholder="Enter timeout in minutes"
                                    />
                                    <InputGroup.Text>minutes</InputGroup.Text>
                                </InputGroup>
                                {errors.timeLimit && (
                                    <Form.Text className="text-danger">
                                        <i className="bi bi-exclamation-circle me-1"></i>
                                        {errors.timeLimit.message}
                                    </Form.Text>
                                )}
                                <Form.Text className="text-muted">
                                    <i className="bi bi-info-circle me-1"></i>
                                    Recommended: 15-60 minutes. Users will be logged out after this period of inactivity.
                                </Form.Text>
                            </Form.Group>

                            {/* Quick Time Presets */}
                            <div className="mb-3">
                                <Form.Label className="fw-semibold mb-2">Quick Presets:</Form.Label>
                                <div className="d-flex flex-wrap gap-2">
                                    {[15, 30, 45, 60, 120].map((minutes) => (
                                        <Button
                                            key={minutes}
                                            variant="outline-secondary"
                                            size="sm"
                                            type="button"
                                            disabled={!watchAutoLogoutEnabled}
                                            onClick={() => setValue('timeLimit', minutes)}
                                        >
                                            {minutes} min
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Information */}
                    <Alert variant="info" className="mb-0">
                        <Alert.Heading className="h6 mb-2">
                            <i className="bi bi-shield-check me-2"></i>
                            Security Settings Information
                        </Alert.Heading>
                        <Row>
                            <Col md={6}>
                                <ul className="mb-0 ps-3 small">
                                    <li>Auto logout enhances security by preventing unauthorized access</li>
                                    <li>Settings apply globally to all users in the system</li>
                                    <li>Users will receive warnings before automatic logout</li>
                                </ul>
                            </Col>
                            <Col md={6}>
                                <ul className="mb-0 ps-3 small">
                                    <li>Minimum timeout: 5 minutes</li>
                                    <li>Maximum timeout: 8 hours (480 minutes)</li>
                                    <li>Changes take effect immediately after saving</li>
                                </ul>
                            </Col>
                        </Row>
                    </Alert>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                {isEditMode ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <i className={`bi ${isEditMode ? 'bi-pencil' : 'bi-plus'} me-1`}></i>
                                {isEditMode ? 'Update Settings' : 'Create Settings'}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}

export default SecuritySettingsModal

