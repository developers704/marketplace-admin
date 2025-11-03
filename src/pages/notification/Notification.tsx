// import { useEffect, useState } from 'react'
import { useAuthContext } from '@/common'
import { Card } from 'react-bootstrap'
import { useGetNotificationsQuery } from '@/redux/apiSlice'


// interface NotificationItem {
//     _id: string
//     content: string
//     createdAt: string
//     priority: 'high' | 'medium' | 'low'
//     read: boolean
//     resourceId: string
//     resourceModel: string
//     type: string
// }

const Notification = () => {
    const { user } = useAuthContext()
    const { data: notifications, isLoading,
        refetch: refetchNotifications,
        isError,
        error = [] } = useGetNotificationsQuery({
            token: user?.token,
        })
    const BASE_API = import.meta.env.VITE_BASE_API


    const markSingleNotificationRead = async (notificationId: string) => {
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

    const markAllNotificationsRead = async () => {
        try {
            const notificationIds = notifications.filter((n: any) => !n.read).map((n: any) => n._id)
            await fetch(`${BASE_API}/api/admin-notifications/bulk-mark-read`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notificationIds })

            })
            refetchNotifications()
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
        }
    }

    const unreadCount = notifications?.filter((notification: any) => !notification.read)?.length || 0

    if (isLoading) {
        return (
            <Card className='mt-3'>
                <Card.Body>
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        )
    }

    if (isError) {
        return (
            <Card className='mt-3'>
                <Card.Body>
                    <div className="text-center py-4 text-danger">
                        <i className="mdi mdi-alert-circle font-24"></i>
                        <p>Error loading notifications: {(error as any)?.data?.message || 'Something went wrong'}</p>
                    </div>
                </Card.Body>
            </Card>
        )
    }
    return (
        <Card className='mt-3'>
            <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="header-title mb-0">
                        Notifications {unreadCount > 0 && <span className="badge bg-danger ms-1">{unreadCount}</span>}
                    </h4>
                    <button
                        className="btn btn-success"
                        onClick={markAllNotificationsRead}
                        disabled={unreadCount === 0}
                    >
                        Mark All as Read
                    </button>
                </div>
            </Card.Header>
            <Card.Body>
                {false ? (
                    <div className="text-center py-4">
                        <i className="mdi mdi-bell-outline font-24 text-muted"></i>
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    <div className="notification-list">
                        {notifications?.map((notification: any) => (
                            <div
                                key={notification._id}
                                className="border-bottom py-3 position-relative"
                                style={{ marginBottom: '1.5rem' }}
                            >
                                <span className="badge bg-secondary text-uppercase position-absolute top-0 start-0">
                                    {notification.type}
                                </span>
                                <div className="d-flex justify-content-between mt-4">
                                    <div style={{ width: '85%' }}>
                                        <p className={`fs-5 mb-2 ${!notification?.read ? 'text-primary' : 'text-dark'}`}
                                            style={{ fontWeight: 500 }}>
                                            {notification.content}
                                        </p>
                                        <p className="fs-6 mb-0 text-muted">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        {!notification.read && (
                                            <button
                                                className="btn btn-outline-success btn-sm"
                                                onClick={() => markSingleNotificationRead(notification._id)}
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card.Body>
        </Card>

    )
}

export default Notification
