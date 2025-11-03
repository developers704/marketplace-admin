import { useAuthContext } from '@/common'
import { PageBreadcrumb } from '@/components'
import { useEffect, useState } from 'react'
import { Card, Table, Button } from 'react-bootstrap'
import { MdDelete } from 'react-icons/md'
import Swal from 'sweetalert2'
import { SkeletonHeader, TableRowSkeleton } from '../other/SimpleLoader'
interface ContactData {
    _id: string
    firstName: string
    lastName: string
    email: string
    subject: string
    message: string
    createdAt: string
}
interface ExpandedMessages {
    [key: string]: boolean;
}

const CustomerContact = () => {
    const { user } = useAuthContext()
    const BASE_API = import.meta.env.VITE_BASE_API
    const [contacts, setContacts] = useState<ContactData[]>([])
    const [loading, setLoading] = useState(false)
    const [expandedMessages, setExpandedMessages] = useState<ExpandedMessages>({});


    const truncateText = (text: any, limit: number = 50) => {
        if (!text) return '';
        return text.length > limit ? `${text.substring(0, limit)}...` : text;
    }

    const toggleMessage = (messageId: string) => {
        setExpandedMessages(prev => ({
            ...prev,
            [messageId]: !prev[messageId]
        }));
    };
    const getContactData = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/contact`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch contact data')
            }

            const data = await response.json()
            setContacts(data)
        } catch (error) {
            console.error('Error fetching contact data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "This Data will be deleted!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: "#9c5100",
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            })

            if (result.isConfirmed) {
                const response = await fetch(`${BASE_API}/api/contact/${id}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                })

                if (response.ok) {
                    Swal.fire('Deleted!', 'Contact has been deleted.', 'success')
                    getContactData()
                }
            }
        } catch (error) {
            Swal.fire('Error!', 'Failed to delete contact.', 'error')
        }
    }

    useEffect(() => {
        getContactData()
    }, [])

    const warehouseHeaders: SkeletonHeader[] = [
        { width: '20px', type: 'checkbox' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '80px', type: 'number' },
        { width: '100px', type: 'date' },
        { width: '100px', type: 'actions' }
    ]

    return (
        <>
            <PageBreadcrumb title="Customer Contacts" subName="Customers" />
            <Card>
                <Card.Header>
                    <h4 className="header-title">Customer Contact Messages</h4>
                    <p className="text-muted mb-0">
                        View and manage customer contact inquiries
                    </p>
                </Card.Header>
                <Card.Body>
                    <div className="table-responsive">
                        <Table className="table-centered mb-0">
                            <thead>
                                <tr>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Subject</th>
                                    <th>Message</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <TableRowSkeleton headers={warehouseHeaders} rowCount={5} />
                                ) : contacts.length > 0 ? (
                                    contacts?.map((contact) => (
                                        <tr key={contact?._id}>
                                            <td>{contact?.firstName} {contact?.lastName}</td>
                                            <td>{contact?.email}</td>
                                            <td>{contact?.subject}</td>
                                            <td
                                                onClick={() => toggleMessage(contact._id)}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to expand/collapse"
                                            >
                                                {expandedMessages[contact._id]
                                                    ? contact.message
                                                    : truncateText(contact.message)}
                                            </td>
                                            <td>{new Date(contact?.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(contact?._id)}
                                                >
                                                    <MdDelete />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center">
                                            No contact messages found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </>
    )
}

export default CustomerContact
