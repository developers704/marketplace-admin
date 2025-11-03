import { useAuthContext } from '@/common'
import { useState } from 'react'
import { Dropdown } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import SimpleBar from 'simplebar-react'
interface NotificationDropdownProps {
    notifications: any[]
    refetchNotifications: () => void
}

const NotificationDropdown = ({ notifications, refetchNotifications }: NotificationDropdownProps) => {
    const [dropDownOpen, setDropDownOpen] = useState<boolean>(false)
    const navigate = useNavigate()
    const { user } = useAuthContext()
    const BASE_API = import.meta.env.VITE_BASE_API

    // Get only latest 3 notifications
    const latestNotifications = notifications?.slice(0, 3)
    const unreadCount = notifications?.filter((n:any) => !n.read).length

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await fetch(`${BASE_API}/api/admin-notifications/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${user.token}`,
                }
            })
            refetchNotifications()
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const handleViewAll = () => {
        setDropDownOpen(false)
        navigate('/notifications/all')
    }

    return (
        <Dropdown show={dropDownOpen} onToggle={setDropDownOpen}>
            <Dropdown.Toggle as="a" className="nav-link arrow-none">
                <i className="ri-notification-3-line fs-22" />
                {unreadCount > 0 && <span className="noti-icon-badge badge text-bg-danger">{unreadCount}</span>}
            </Dropdown.Toggle>
            <Dropdown.Menu className="dropdown-menu-animated dropdown-lg py-0">
                <div className="p-2 border-top-0 border-start-0 border-end-0 border-dashed border">
                    <div className="row align-items-center">
                        <div className="col">
                            <h6 className="m-0 fs-16 fw-semibold">Notifications</h6>
                        </div>
                    </div>
                </div>
                <SimpleBar style={{ maxHeight: 300 }}>
                    {latestNotifications?.map((notification:any, idx:any) => (
                        <Link 
                            key={idx} 
                            to="" 
                            className="dropdown-item notify-item"
                            onClick={() => handleMarkAsRead(notification._id)}
                        >
                            <div className={`notify-icon bg-info-subtle`}>
                                <i className={`mdi mdi-bell text-info`} />
                            </div>
                            <p className={`notify-details ${!notification.read ? 'text-primary' : ''}`}>
                                {notification.content}
                                <small className="text-muted">
                                    {new Date(notification.createdAt).toLocaleString()}
                                </small>
                            </p>
                        </Link>
                    ))}
                </SimpleBar>
                <Link
                    to="/notifications/all"
                    className="dropdown-item text-center text-primary fw-bold notify-item border-top border-light py-2"
                    onClick={handleViewAll}
                >
                    View All
                </Link>
            </Dropdown.Menu>
        </Dropdown>
    )
}

export default NotificationDropdown
