import { useAuthContext } from "@/common"
import { FormInput, PageBreadcrumb } from '@/components'
import { Button, Card, Form, Row, Col } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Swal from 'sweetalert2'
import Select from "react-select"

interface RoleRecord {
    _id: string
    role_name: string
}

interface UserRecord {
    _id: string
    username: string
    email: string
    phone_number: string
}

const NotificationCenter = () => {
    const { user, userId } = useAuthContext()

    const { token } = user
    const BASE_API = import.meta.env.VITE_BASE_API

    // States
    const [roles, setRoles] = useState<RoleRecord[]>([])
    const [users, setUsers] = useState<UserRecord[]>([])
    const [selectedRole, setSelectedRole] = useState<string>("")
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [sendToAllUsers, setSendToAllUsers] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingRoles, setLoadingRoles] = useState(false)
    const [loadingUsers, setLoadingUsers] = useState(false)

    const {
        handleSubmit,
        register,
        reset,
        formState: { errors },
    } = useForm()

    // Fetch all roles
    const fetchRolesData = async () => {
        try {
            setLoadingRoles(true)
            const response = await fetch(`${BASE_API}/api/users/role`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch user roles data.')
            }

            const fetchedData = await response.json()
            setRoles(fetchedData)
        } catch (error: any) {
            console.error('Error fetching roles:', error)
            Swal.fire({
                title: 'Error!',
                text: error.message,
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setLoadingRoles(false)
        }
    }

    // Fetch users by role ID
    const getUsersByRole = async (roleId: string) => {
        if (!roleId) return

        try {
            setLoadingUsers(true)
            const response = await fetch(`${BASE_API}/api/NotificationCenter/${roleId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch users')
            }

            const data = await response.json()
            setUsers(data.data)
        } catch (error: any) {
            console.error('Error fetching users:', error)
            Swal.fire({
                title: 'Error',
                text: error.message || 'Failed to load users for the selected role',
                icon: 'error',
                timer: 1500
            })
            setUsers([])
        } finally {
            setLoadingUsers(false)
        }
    }

    // Send notification
    const sendNotification = async (data: any) => {
        if (!selectedRole) {
            Swal.fire({
                title: 'Error',
                text: 'Please select a role',
                icon: 'error',
                timer: 1500
            })
            return
        }

        if (!sendToAllUsers && selectedUsers.length === 0) {
            Swal.fire({
                title: 'Error',
                text: 'Please select at least one user',
                icon: 'error',
                timer: 1500
            })
            return
        }

        setLoading(true)
        try {
            const payload = {
                roles: [selectedRole],
                subject: data.subject,
                message: data.message,
                sendToAllUsersInRoles: sendToAllUsers,
                adminId: userId,
            }

            // Add customers only if not sending to all users
            if (!sendToAllUsers) {
                Object.assign(payload, { customers: selectedUsers })
            }

            const response = await fetch(`${BASE_API}/api/NotificationCenter/send-notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to send notification')
            }

            Swal.fire({
                title: 'Success!',
                text: 'Notification sent successfully',
                icon: 'success',
                timer: 1500
            })

            // Reset form after successful submission
            reset()
            setSelectedRole("")
            setSelectedUsers([])
            setSendToAllUsers(false)
        } catch (error: any) {
            console.error('Error sending notification:', error)
            Swal.fire({
                title: 'Error',
                text: error.message || 'Failed to send notification',
                icon: 'error',
                timer: 1500
            })
        } finally {
            setLoading(false)
        }
    }

    // Initialize data on component mount
    useEffect(() => {
        fetchRolesData()
    }, [])

    return (
        <>
            <PageBreadcrumb title="Notification Center" subName="Notifications" />
            <Card>
                <Card.Header>
                    <div>
                        <h4 className="header-title">Send Notifications</h4>
                        <p className="text-muted mb-0">
                            Send notifications to users based on roles
                        </p>
                    </div>
                </Card.Header>

                <Card.Body>
                    <Form onSubmit={handleSubmit(sendNotification)}>
                        <Row>
                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Select Role <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Select
                                        isDisabled={loadingRoles}
                                        placeholder="Select a role"
                                        options={roles.map(role => ({
                                            value: role._id,
                                            label: role.role_name
                                        }))}
                                        value={roles
                                            .filter(role => role._id === selectedRole)
                                            .map(role => ({
                                                value: role._id,
                                                label: role.role_name
                                            }))[0] || null}
                                        onChange={(selectedOption) => {
                                            const roleId = selectedOption ? selectedOption.value : ""
                                            setSelectedRole(roleId)
                                            setSelectedUsers([])

                                            if (roleId) {
                                                getUsersByRole(roleId)
                                            } else {
                                                setUsers([])
                                            }
                                        }}
                                        className="basic-select"
                                        classNamePrefix="select"
                                    />
                                    {loadingRoles && (
                                        <Form.Text className="text-muted">
                                            Loading roles...
                                        </Form.Text>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Check
                                        type="checkbox"
                                        id="sendToAllUsers"
                                        label="Send to all users of selected role"
                                        checked={sendToAllUsers}
                                        onChange={(e) => setSendToAllUsers(e.target.checked)}
                                    />
                                </Form.Group>
                            </Col>

                            {!sendToAllUsers && selectedRole && (
                                <Col md={12} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>
                                            Select Users <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Select
                                            isMulti
                                            isDisabled={loadingUsers}
                                            placeholder="Select users..."
                                            options={users.map(user => ({
                                                value: user._id,
                                                label: `${user.username} (${user.email || user.phone_number || 'No contact'})`
                                            }))}
                                            value={users
                                                .filter(user => selectedUsers.includes(user._id))
                                                .map(user => ({
                                                    value: user._id,
                                                    label: `${user.username} (${user.email || user.phone_number || 'No contact'})`
                                                }))}
                                            onChange={(selectedOptions) => {
                                                const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : []
                                                setSelectedUsers(selectedIds)
                                            }}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                        {users.length === 0 && !loadingUsers && (
                                            <Form.Text className="text-muted">
                                                No users found for this role
                                            </Form.Text>
                                        )}
                                        {loadingUsers && (
                                            <Form.Text className="text-muted">
                                                Loading users...
                                            </Form.Text>
                                        )}
                                    </Form.Group>
                                </Col>
                            )}

                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Subject <span className="text-danger">*</span>
                                    </Form.Label>
                                    <FormInput
                                        type="text"
                                        name="subject"
                                        containerClass="mb-3"
                                        register={register}
                                        key="subject"
                                        errors={errors}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Message <span className="text-danger">*</span>
                                    </Form.Label>
                                    <FormInput
                                        type="textarea"
                                        name="message"
                                        containerClass="mb-3"
                                        register={register}
                                        key="message"
                                        errors={errors}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={12} className="text-end">
                                <Button
                                    variant="success"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Notification'}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
        </>
    )
}

export default NotificationCenter
