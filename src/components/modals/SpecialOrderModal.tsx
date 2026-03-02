import { Modal, Button, Form, Table, Spinner } from 'react-bootstrap'
import { useForm, Controller } from 'react-hook-form'
import { useState, useEffect, useMemo } from 'react'
import Select, { MultiValue } from 'react-select'
import Swal from 'sweetalert2'
import { useAuthContext } from '@/common'

export interface RoleType {
  _id?: string
  role_name: string
}

export interface UserType {
  _id: string
  username: string
  email: string
  role?: RoleType
  isActive?: boolean
}

export interface SpecialOrderModalProps {
  show: boolean
  onHide: () => void
  onSuccess: () => void
  /** Pre-selected user IDs (e.g. current SPO receiver user IDs) */
  editingUsers?: string[]
}

interface FormData {
  selectedUsers: string[]
}

type SelectOption = { value: string; label: string; user: UserType }

const SpecialOrderModal = ({
  show,
  onHide,
  onSuccess,
  editingUsers = [],
}: SpecialOrderModalProps) => {
  const { user } = useAuthContext()
  const token = user?.token
  const BASE_API = import.meta.env.VITE_BASE_API

  const { control, handleSubmit, reset, watch } = useForm<FormData>({
    defaultValues: { selectedUsers: editingUsers },
  })

  const [allUsers, setAllUsers] = useState<UserType[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const selectedUserIds = watch('selectedUsers') || []

  const userOptions: SelectOption[] = useMemo(
    () =>
      allUsers.map((u) => ({
        value: u?._id,
        label: u?.username,
        user: u,
      })),
    [allUsers]
  )

  const selectedOptions: MultiValue<SelectOption> = useMemo(
    () =>
      selectedUserIds
        .map((id) => userOptions.find((o) => o.value === id))
        .filter(Boolean) as SelectOption[],
    [selectedUserIds, userOptions]
  )

  const selectedUsersDetail = useMemo(
    () =>
      allUsers.filter((u) => selectedUserIds.includes(u._id)),
    [allUsers, selectedUserIds]
  )

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return
      setUsersLoading(true)
      try {
        const res = await fetch(`${BASE_API}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setAllUsers(Array.isArray(data) ? data : data?.data ?? data ?? [])
      } catch (err) {
        console.error(err)
        setAllUsers([])
      } finally {
        setUsersLoading(false)
      }
    }
    if (show) fetchUsers()
  }, [show, BASE_API, token])

  useEffect(() => {
    if (show) reset({ selectedUsers: editingUsers })
  }, [show, editingUsers, reset])

  const onSubmit = async (data: FormData) => {
    if (!token) return
    setSubmitLoading(true)
    try {
      const res = await fetch(`${BASE_API}/api/spo-users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds: data.selectedUsers }),
      })
      const responseData = await res.json()
      if (!res.ok) throw new Error(responseData?.message ?? 'Failed to save')
      Swal.fire('Success!', 'Special order email receivers updated.', 'success')
      onSuccess()
      onHide()
    } catch (err: any) {
      Swal.fire('Error', err?.message ?? 'Something went wrong', 'error')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleClose = () => {
    reset({ selectedUsers: editingUsers })
    onHide()
  }

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="lg"
      className="shadow"
      contentClassName="border-0 shadow-lg"
    >
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Select Users for Special Orders</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Users</Form.Label>
            <Controller
              name="selectedUsers"
              control={control}
              render={({ field }) => (
                <Select<SelectOption, true>
                  isMulti
                  isSearchable
                  isLoading={usersLoading}
                  placeholder={
                    usersLoading
                      ? 'Loading users...'
                      : 'Type to search, select multiple users'
                  }
                  options={userOptions}
                  value={selectedOptions}
                  onChange={(options: MultiValue<SelectOption>) => {
                    field.onChange(options ? options.map((o) => o.value) : [])
                  }}
                  getOptionLabel={(opt) => opt.label}
                  getOptionValue={(opt) => opt.value}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              )}
            />
            {usersLoading && (
              <div className="d-flex align-items-center gap-2 mt-2 text-muted small">
                <Spinner animation="border" size="sm" />
                <span>Fetching users...</span>
              </div>
            )}
          </Form.Group>

          {selectedUsersDetail.length > 0 && (
            <div className="mt-3">
              <Form.Label className="fw-semibold mb-2">
                Selected users ({selectedUsersDetail.length})
              </Form.Label>
              <div className="table-responsive rounded border shadow-sm">
                <Table size="sm" bordered hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUsersDetail?.map((u) => (
                      <tr key={u?._id}>
                        <td>{u?.username || "-"}</td>
                        <td>{u?.email || "-"}</td>
                        <td>
                          {u?.role?.role_name ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="success"
            type="submit"
            disabled={submitLoading || selectedUserIds.length === 0}
          >
            {submitLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default SpecialOrderModal
