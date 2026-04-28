import { PageBreadcrumb } from '@/components'
import {
  Button,
  Card,
  Table,
  Form,
  Pagination as BootstrapPagination,
  Spinner,
} from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { MdEdit, MdDelete } from 'react-icons/md'
import { useForm } from 'react-hook-form'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useAuthContext } from '@/common'
import { SimpleLoader } from '../SimpleLoader'
import SpecialOrderModal from '@/components/modals/SpecialOrderModal'
import { toastService } from '@/common/context/toast.service'
import './spo-recipients.scss'

/** SPO receiver record from API (get list) */
export interface SpoReceiverRecord {
  _id: string
  userId: string
  name: string
  email: string
  isActive: boolean
}

const SpecialOrderEmailRecipients = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const BASE_API = import.meta.env.VITE_BASE_API

  const [usersData, setUsersData] = useState<SpoReceiverRecord[]>([])
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [loading, setLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // const [editingUser, setEditingUser] = useState<SpoReceiverRecord | null>(null)
  const [isOpen, toggleModal] = useToggle()

  // const fileInputRef = useRef<HTMLInputElement>(null)
  const { reset, setValue } = useForm()

  const getAllUsers = async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await fetch(`${BASE_API}/api/spo-users/get`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      const raw = (data?.data || []) as Array<{
        _id: string
        userId: { _id: string; username?: string; email?: string } | string
        isActive: boolean
      }>
      const mappedUsers: SpoReceiverRecord[] = raw.map((u) => ({
        _id: u._id,
        userId: typeof u?.userId === 'object' ? u?.userId?._id ?? '' : String(u.userId ?? ''),
        name: typeof u?.userId === 'object' ? u?.userId?.username ?? '-' : '-',
        email: typeof u?.userId === 'object' ? u?.userId?.email ?? '-' : '-',
        isActive: u.isActive,
      }))
      setUsersData(mappedUsers)
      const activeIds = mappedUsers.filter((u) => u?.isActive).map((u) => u._id)
      setSelectedRows(activeIds)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getAllUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggleReceiver = async (id: string) => {
    if (!token || togglingId) return
    setTogglingId(id)
    try {
      const res = await fetch(`${BASE_API}/api/spo-users/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message ?? 'Toggle failed')
      toastService.success('Receiver status updated successfully')
      setUsersData((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isActive: !u.isActive } : u))
      )
    } catch (err: any) {
      toastService.error(err?.message ?? 'Failed to update')
    } finally {
      setTogglingId(null)
    }
  }

  const filteredRecords = usersData
    .filter(
      (u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedRows(filteredRecords.map((u) => u._id))
    else setSelectedRows([])
  }

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const handlePageChange = (page: number) => setCurrentPage(page)
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value)

  const handleSaveReceivers = async () => {
    if (!token) return
    setSaving(true)
    try {
      const userIds = usersData
        .filter((u) => selectedRows.includes(u._id))
        .map((u) => u.userId)
        .filter(Boolean)
      const res = await fetch(`${BASE_API}/api/spo-users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds }),
      })
      const data = await res.json()
      if (data.success) {
        Swal.fire('Saved!', 'Special order email receivers updated.', 'success')
        getAllUsers()
      } else throw new Error(data.message || 'Failed to save receivers')
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleEditModal = (rec: SpoReceiverRecord | null = null) => {
    // setEditingUser(rec)
    if (rec) {
      setValue('name', rec?.name)
      setValue('email', rec?.email)
      setValue('isActive', rec?.isActive)
    } else reset({ name: '', email: '', isActive: true })
    toggleModal()
  }

  const handleDeleteConfirmation = (id: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This user will be removed!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Delete!',
    }).then((result) => {
      if (result.isConfirmed) deleteUser(id)
    })
  }

  const deleteUser = async (id: string) => {
    if (!token) return
    setDeletingId(id)
    try {
      const res = await fetch(`${BASE_API}/api/spo-users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message ?? 'Failed to delete receiver')
      toastService.success('Receiver removed successfully.')
      setUsersData((prev) => prev.filter((u) => u._id !== id))
      setSelectedRows((prev) => prev.filter((r) => r !== id))
    } catch (err: any) {
      toastService.error(err?.message ?? 'Failed to delete receiver')
    } finally {
      setDeletingId(null)
    }
  }

  const currentReceiverUserIds = usersData.map((u) => u.userId).filter(Boolean)

  if (loading) return <SimpleLoader />

  return (
    <div className="spo-recipients-page">
      <PageBreadcrumb
        title="Special Order Email Recipients"
        subName="Settings"
        allowNavigateBack={true}
      />
      <Card className="shadow-sm border-0 overflow-hidden">
        <Card.Header className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center border-0 bg-light py-4 px-4">
          <div>
            <h4 className="header-title mb-1">Special Order Email Recipients</h4>
            <p className="text-muted mb-0 small">
              Select users who should receive special order emails.
            </p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-lg-0">
            <Button
              variant="success"
              onClick={handleSaveReceivers}
              disabled={selectedRows.length === 0 || saving}
              className="shadow-sm px-4"
            >
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                `Save Selected (${selectedRows.length})`
              )}
            </Button>
            <Button
              variant="primary"
              onClick={() => handleToggleEditModal()}
              className="shadow-sm px-4"
            >
              Add / Select Users
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="px-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <Form.Control
              type="search"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="shadow-sm border rounded-3"
              style={{ maxWidth: '320px' }}
            />
            <Form.Select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={{ width: 'auto' }}
              className="shadow-sm border rounded-3"
            >
              <option value={15}>15 items</option>
              <option value={30}>30 items</option>
              <option value={50}>50 items</option>
            </Form.Select>
          </div>

          {/* <div>
          <iframe 
          src="https://docs.google.com/spreadsheets/d/1iFw4dkDSo5WN2EBTfrYBMp_aHlj20K1sKCT-d3YefyE/edit?usp=sharing&widget=true&headers=false"
          width="100%" 
          height="600">
          </iframe>
          </div> */}

          <div className="table-responsive rounded-3 overflow-hidden border shadow-sm">
            <Table striped bordered hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 44 }}>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        selectedRows.length === filteredRecords.length &&
                        filteredRecords.length > 0
                      }
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th className="text-center" style={{ minWidth: 120 }}>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((u) => {
                    const isSelected = selectedRows.includes(u._id)
                    const isToggling = togglingId === u._id
                    const isDeleting = deletingId === u._id
                    return (
                      <tr key={u._id} className="align-middle">
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(u._id)}
                          />
                        </td>
                        <td className="fw-medium">{u.name}</td>
                        <td className="text-muted">{u.email}</td>
                        <td>
                          <span
                            className={`badge ${
                              u?.isActive ? 'bg-success' : 'bg-secondary'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            {isToggling ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <Form.Check
                                type="switch"
                                id={`switch-${u._id}`}
                                checked={u.isActive}
                                onChange={() => handleToggleReceiver(u._id)}
                                disabled={!!togglingId}
                                className="spo-switch-luxury form-switch"
                              />
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleToggleEditModal(u)}
                              className="shadow-sm btn-action-edit"
                            >
                              <MdEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteConfirmation(u._id)}
                              disabled={!!deletingId}
                              className="shadow-sm btn-action-delete"
                            >
                              {isDeleting ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <MdDelete />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <BootstrapPagination className="pagination-rounded mb-0">
              <BootstrapPagination.Prev
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              />
              {Array.from({ length: totalPages }, (_, i) => (
                <BootstrapPagination.Item
                  key={i + 1}
                  active={i + 1 === currentPage}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </BootstrapPagination.Item>
              ))}
              <BootstrapPagination.Next
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              />
            </BootstrapPagination>
          </div>
        </Card.Body>
      </Card>

      <SpecialOrderModal
        show={isOpen}
        onHide={() => handleToggleEditModal(null)}
        onSuccess={getAllUsers}
        editingUsers={currentReceiverUserIds}
      />
    </div>
  )
}

export default SpecialOrderEmailRecipients
