import { PageBreadcrumb } from '@/components'
import { Button, Card, Table, Badge, Alert, Form } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import SecuritySettingsModal from '@/components/LoginToggleModal'
import { TableRowSkeleton } from '../SimpleLoader'

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

interface ApiResponse {
    success: boolean
    message: string
    settings: SecuritySettings | null
}

const SecuritySettings = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Admin?.Update
    const canCreate = isSuperUser || permissions.Admin?.Create

    // States
    const [loading, setLoading] = useState(false)
    const [settingsData, setSettingsData] = useState<SecuritySettings | null>(null)
    const [apiLoading, setApiLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)

    // API basics
    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    // Handle functions
    const handleCreateSettings = () => {
        setIsEditMode(false)
        setModalOpen(true)
    }

    const handleUpdateSettings = () => {
        setIsEditMode(true)
        setModalOpen(true)
    }

    const handleToggleAutoLogout = async (enabled: boolean) => {
        if (!settingsData) return

        try {
            setApiLoading(true)
            const response = await fetch(`${BASE_API}/api/Security/update-global-settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    autoLogout: {
                        enabled: enabled,
                        timeLimit: settingsData.autoLogout.timeLimit * 60
                    }
                })
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to update settings')
            }

            await Swal.fire({
                title: 'Updated!',
                text: `Auto logout has been ${enabled ? 'enabled' : 'disabled'} successfully.`,
                icon: 'success',
                timer: 2000,
                timerProgressBar: true
            })

            // Refresh the settings data
            getSecuritySettings()
        } catch (error: any) {
            console.error('Error updating settings:', error)
            Swal.fire({
                title: 'Error!',
                text: error.message || 'Failed to update settings. Please try again.',
                icon: 'error',
                confirmButtonColor: '#dc3545'
            })
        } finally {
            setApiLoading(false)
        }
    }

    // API Call
    const getSecuritySettings = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/Security/settings`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get security settings')
            }

            const data: ApiResponse = await response.json()
            console.log('Security Settings Response:', data)

            if (data.success && data.settings) {
                setSettingsData(data.settings)
            } else {
                setSettingsData(null)
            }
        } catch (error: any) {
            console.error('Error fetching security settings:', error)
            setSettingsData(null)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }
    const convertSecondsToMinutes = (seconds: number): number => {
        return Math.round(seconds / 60)
    }


    const handleModalSuccess = () => {
        setModalOpen(false)
        getSecuritySettings()
    }

    useEffect(() => {
        getSecuritySettings()
    }, [])

    const settingsHeaders: any[] = [
        { width: '100px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '120px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '150px', type: 'text' },
        { width: '120px', type: 'actions' }
    ]

    return (
        <>
            <PageBreadcrumb title="Security Settings" subName="Admin" allowNavigateBack={true} />

            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Global Security Settings</h4>
                            <p className="text-muted mb-0">
                                Manage global security configurations including auto-logout and session management.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            {!settingsData ? (
                                <Button
                                    disabled={!canCreate}
                                    variant="success"
                                    onClick={handleCreateSettings}
                                    className="mb-2 mb-sm-0">
                                    <i className="bi bi-plus"></i> Create Security Settings
                                </Button>
                            ) : (
                                <div className="d-flex gap-2">
                                    <Badge bg="success" className="fs-6 py-2 px-3">
                                        <i className="bi bi-shield-check me-1"></i>
                                        Settings Configured
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                </Card.Header>

                <Card.Body>
                    {/* Status Alert */}
                    {settingsData ? (
                        <Alert variant="success" className="mb-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <Alert.Heading className="h6 mb-1">
                                        <i className="bi bi-shield-check me-2"></i>
                                        Security Settings are Active
                                    </Alert.Heading>
                                    <p className="mb-0">
                                        Global security settings are configured and active. Auto-logout is currently{' '}
                                        <strong className={settingsData.autoLogout.enabled ? 'text-success' : 'text-danger'}>
                                            {settingsData.autoLogout.enabled ? 'enabled' : 'disabled'}
                                        </strong>
                                        {settingsData.autoLogout.enabled && (
                                            <span> with {convertSecondsToMinutes(settingsData.autoLogout.timeLimit)} minutes timeout</span>
                                        )}.
                                    </p>
                                </div>
                                <Badge bg={settingsData.autoLogout.enabled ? 'success' : 'warning'} className="fs-6">
                                    {settingsData.autoLogout.enabled ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </Alert>
                    ) : (
                        <Alert variant="warning" className="mb-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <Alert.Heading className="h6 mb-1">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        No Security Settings Found
                                    </Alert.Heading>
                                    <p className="mb-0">
                                        Please configure the global security settings to enable security features.
                                    </p>
                                </div>
                                <Button
                                    variant="warning"
                                    size="sm"
                                    disabled={!canCreate}
                                    onClick={handleCreateSettings}>
                                    <i className="bi bi-plus me-1"></i>
                                    Configure Now
                                </Button>
                            </div>
                        </Alert>
                    )}

                    <div className="table-responsive-sm">
                        <Table className="table-striped table-centered mb-0">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Type</th>
                                    <th>Auto Logout</th>
                                    <th>Time Limit</th>
                                    <th>Created Date</th>
                                    <th>Last Updated</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={settingsHeaders} rowCount={1} />
                                ) : settingsData ? (
                                    <tr>
                                        <td>
                                            <Badge bg={settingsData.autoLogout.enabled ? 'success' : 'warning'} className="badge-lg">
                                                <i className={`bi ${settingsData.autoLogout.enabled ? 'bi-shield-check' : 'bi-shield-exclamation'} me-1`}></i>
                                                {settingsData.autoLogout.enabled ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div>
                                                <strong className="d-block text-capitalize">{settingsData.type}</strong>
                                                <small className="text-muted">
                                                    <i className="bi bi-gear me-1"></i>
                                                    Security Config
                                                </small>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <Form.Check
                                                    type="switch"
                                                    id="auto-logout-switch"
                                                    checked={settingsData.autoLogout.enabled}
                                                    onChange={(e) => handleToggleAutoLogout(e.target.checked)}
                                                    disabled={!canUpdate || apiLoading}
                                                    className="me-2"
                                                />
                                                <span className={settingsData.autoLogout.enabled ? 'text-success' : 'text-muted'}>
                                                    {settingsData.autoLogout.enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <strong className="d-block">{convertSecondsToMinutes(settingsData.autoLogout.timeLimit)} min</strong>
                                                <small className="text-muted">
                                                    <i className="bi bi-clock me-1"></i>
                                                    Timeout Duration
                                                </small>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <strong className="d-block">{formatDate(settingsData.createdAt)}</strong>
                                                <small className="text-muted">
                                                    <i className="bi bi-calendar-plus me-1"></i>
                                                    {new Date(settingsData.createdAt).toLocaleDateString()}
                                                </small>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <strong className="d-block">{formatDate(settingsData.updatedAt)}</strong>
                                                <small className="text-muted">
                                                    <i className="bi bi-calendar-check me-1"></i>
                                                    {new Date(settingsData.updatedAt).toLocaleDateString()}
                                                </small>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <Button
                                                    variant="info"
                                                    size="sm"
                                                    onClick={() => {
                                                        Swal.fire({
                                                            title: 'Security Settings Details',
                                                            html: `
                                                                <div class="text-start">
                                                                    <p><strong>Type:</strong> ${settingsData.type}</p>
                                                                    <p><strong>Auto Logout:</strong> ${settingsData.autoLogout.enabled ? 'Enabled' : 'Disabled'}</p>
                                                                    <p><strong>Time Limit:</strong> ${convertSecondsToMinutes(settingsData.autoLogout.timeLimit)} minutes</p>
                                                                    <p><strong>Created:</strong> ${formatDate(settingsData.createdAt)}</p>
                                                                    <p><strong>Updated:</strong> ${formatDate(settingsData.updatedAt)}</p>
                                                                </div>
                                                            `,
                                                            icon: 'info',
                                                            confirmButtonText: 'Close'
                                                        })
                                                    }}
                                                    title="View Details">
                                                    <i className="bi bi-eye"></i>
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={!canUpdate}
                                                    onClick={handleUpdateSettings}
                                                    title="Update Settings">
                                                    <i className="bi bi-pencil"></i>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            <div className="text-muted">
                                                <i className="bi bi-shield-exclamation fs-1 d-block mb-3"></i>
                                                <h5>No Security Settings Found</h5>
                                                <p className="mb-3">Configure global security settings to enable security features like auto-logout.</p>
                                                <Button
                                                    variant="primary"
                                                    disabled={!canCreate}
                                                    onClick={handleCreateSettings}>
                                                    <i className="bi bi-plus me-1"></i>
                                                    Create Security Settings
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Security Settings Modal */}
            <SecuritySettingsModal
                show={modalOpen}
                onHide={() => setModalOpen(false)}
                isEditMode={isEditMode}
                existingSettings={settingsData}
                onSuccess={handleModalSuccess}
                baseApiUrl={BASE_API}
            />
        </>
    )
}

export default SecuritySettings
