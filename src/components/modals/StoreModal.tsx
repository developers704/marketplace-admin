import { Modal, Button, Form } from 'react-bootstrap'
import { FormInput } from '@/components'
import { useForm } from 'react-hook-form'
import { useAuthContext } from '@/common'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

interface StoreModalProps {
    show: boolean
    onHide: () => void
    onSuccess?: () => void
    editingStore?: {
        _id: number
        name: string
        location: string
        capacity?: number
        description?: string
        inventoryWallet?: {
            balance: number
        }
        suppliesWallet?: {
            balance: number
        }

         // 🟢 Add these 2 optional fields
        districtManager?: {
            _id: string
            name: string
        } | null

        corporateManager?: {
            _id: string
            name: string
        } | null

        // B2B Approval Permission Flags (v2)
        requireDMApproval?: boolean
        requireCMApproval?: boolean
    } | null
}

const StoreModal: React.FC<StoreModalProps> = ({
    show,
    onHide,
    onSuccess,
    editingStore = null
}) => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Products?.Update
    const canCreate = isSuperUser || permissions.Products?.Create
    const [apiLoading, setApiLoading] = useState(false)
    const [managers, setManagers] = useState([])
    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user

    const {
        handleSubmit,
        register,
        control,
        reset,
        setValue,
        formState: { errors },
    } = useForm()

    // Handle form submission
    useEffect(() => {
    const fetchManagers = async () => {
        try {
            const res = await fetch(`${BASE_API}/api/customers/getcustomer-forstore`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = await res.json()
            console.log("data for user store", data);
            

            // 🟢 Sirf "District Manager" ya "Corporate Manager" roles filter kar lo
            const filteredManagers = data.filter(
                (user: any) =>
                    user.role?.role_name?.toLowerCase() === 'district manager' ||
                    user.role?.role_name?.toLowerCase() === 'corporate manager'
            )

            setManagers(filteredManagers)
        } catch (err) {
            console.error('Failed to fetch managers', err)
        }
    }

    if (show) fetchManagers()
}, [show])

    const handleFormSubmit = async (storeData: any) => {
        setApiLoading(true)
        try {
            const url = editingStore
                ? `${BASE_API}/api/warehouses/${editingStore._id}`
                : `${BASE_API}/api/warehouses`

            const method = editingStore ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: storeData.name,
                    location: storeData.location,
                    capacity: parseInt(storeData.capacity) || 0,
                    description: storeData.description,
                    initialInventoryBalance: parseFloat(storeData.initialInventoryBalance) || 0,
                    initialSuppliesBalance: parseFloat(storeData.initialSuppliesBalance) || 0,
                    districtManager: storeData.districtManager || null,
                    corporateManager: storeData.corporateManager || null,
                    requireDMApproval: storeData.requireDMApproval !== false, // Default true
                    requireCMApproval: storeData.requireCMApproval !== false, // Default true
                }),
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || `Failed to ${editingStore ? 'Update' : 'Add'} Store`)
            }

            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: editingStore ? 'UPDATED!' : 'ADDED!',
                    text: `Store ${editingStore ? 'updated' : 'added'} successfully!`,
                    icon: 'success',
                    confirmButtonText: 'OK',
                    timer: 1500,
                })

                handleModalClose()
                if (onSuccess) {
                    onSuccess()
                }
            }
        } catch (error: any) {
            console.error(`Error ${editingStore ? 'Updating' : 'Adding'} Store`, error)
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setApiLoading(false)
        }
    }

    const handleModalClose = () => {
        reset({
            name: '',
            location: '',
            capacity: '',
            description: '',
            initialInventoryBalance: '',
            initialSuppliesBalance: ''
        })
        onHide()
    }

    // Set form values when editing
    useEffect(() => {
        if (show && editingStore) {
            setValue('name', editingStore.name)
            setValue('location', editingStore.location)
            setValue('capacity', editingStore.capacity || '')
            setValue('initialInventoryBalance', editingStore.inventoryWallet?.balance || 0)
            setValue('initialSuppliesBalance', editingStore.suppliesWallet?.balance || 0)
            setValue('description', editingStore.description || '')
            setValue('districtManager', editingStore.districtManager || '')
            setValue('corporateManager', editingStore.corporateManager || '')
            setValue('requireDMApproval', editingStore.requireDMApproval !== false)
            setValue('requireCMApproval', editingStore.requireCMApproval !== false)
        } else if (show && !editingStore) {
            reset({
                name: '',
                location: '',
                capacity: '',
                description: '',
                initialInventoryBalance: '',
                initialSuppliesBalance: ''
            })
        }
    }, [show, editingStore, setValue, reset])

    return (
        <Modal show={show} onHide={handleModalClose} dialogClassName="modal-dialog-centered">
            <Modal.Header closeButton>
                <h4 className="modal-title">
                    {editingStore ? 'Update Store' : 'Add New Store'}
                </h4>
            </Modal.Header>
            <Form onSubmit={handleSubmit(handleFormSubmit)}>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center">
                            Name <span className="text-danger ms-1">*</span>
                        </Form.Label>
                        <FormInput
                            type="text"
                            name="name"
                            containerClass="mb-3"
                            register={register}
                            placeholder="Enter Store Name"
                            errors={errors}
                            control={control}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                    <Form.Label>District Manager</Form.Label>
                    <Form.Select {...register("districtManager")}>
                        <option value="">Select District Manager</option>
                        {managers
                            .filter((m: any) => m.role?.role_name?.toLowerCase() === 'district manager')
                            .map((manager: any) => (
                                <option key={manager._id} value={manager._id}>
                                    {manager.username}
                                </option>
                            ))}
                    </Form.Select>
                    </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Corporate Manager</Form.Label>
                            <Form.Select {...register("corporateManager")}>
                                <option value="">Select Corporate Manager</option>
                                {managers
                                    .filter((m: any) => m.role?.role_name?.toLowerCase() === 'corporate manager')
                                    .map((manager: any) => (
                                        <option key={manager._id} value={manager._id}>
                                            {manager.username}
                                        </option>
                                    ))}
                            </Form.Select>
                        </Form.Group>

                    {/* B2B Approval Permission Switches (v2) */}
                    <div className="mb-3 p-3 border rounded bg-light">
                        <h6 className="mb-3">Purchase Approval Settings</h6>
                        <Form.Group className="mb-2">
                            <Form.Check
                                type="switch"
                                id="requireDMApproval"
                                label="Require District Manager Approval"
                                {...register('requireDMApproval')}
                                defaultChecked={editingStore?.requireDMApproval !== false}
                            />
                            <Form.Text className="text-muted">
                                If enabled, DM must approve before request proceeds to next stage
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Check
                                type="switch"
                                id="requireCMApproval"
                                label="Require Corporate Manager Approval"
                                {...register('requireCMApproval')}
                                defaultChecked={editingStore?.requireCMApproval !== false}
                            />
                            <Form.Text className="text-muted">
                                If enabled, CM must approve before request proceeds to Admin
                            </Form.Text>
                        </Form.Group>
                        <Form.Text className="text-muted d-block mt-2">
                            <small>
                                <strong>Note:</strong> If both switches are OFF, requests go directly to Admin. 
                                Admin always has final approval authority.
                            </small>
                        </Form.Text>
                    </div>

                    <Form.Group className="mb-3">
                        <FormInput
                            label="Location"
                            type="text"
                            name="location"
                            containerClass="mb-3"
                            register={register}
                            placeholder="Enter Store Location"
                            errors={errors}
                            control={control}
                        />
                    </Form.Group>

                    {/* <Form.Group className="mb-3">
                        <FormInput
                            label="Capacity"
                            type="number"
                            name="capacity"
                            containerClass="mb-3"
                            register={register}
                            placeholder="Enter Store Capacity"
                            errors={errors}
                            control={control}
                        />
                    </Form.Group> */}

                    <Form.Group className="mb-3">
                        <FormInput
                            label="Inventory Wallet Balance $"
                            type="number"
                            name="initialInventoryBalance"
                            containerClass="mb-3"
                            register={register}
                            placeholder="Enter Initial Inventory Balance ($)"
                            errors={errors}
                            control={control}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <FormInput
                            label="Supplies Wallet Balance $"
                            type="number"
                            name="initialSuppliesBalance"
                            containerClass="mb-3"
                            register={register}
                            placeholder="Enter Initial Supplies Balance ($)"
                            errors={errors}
                            control={control}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <FormInput
                            type="textarea"
                            name="description"
                            containerClass="mb-3"
                            register={register}
                            placeholder="Enter Store Description"
                            errors={errors}
                            control={control}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={handleModalClose}>
                        Close
                    </Button>
                    <Button
                        variant="soft-success"
                        type="submit"
                        disabled={editingStore ? !canUpdate : !canCreate}>
                        {apiLoading
                            ? editingStore
                                ? 'Updating...'
                                : 'Adding...'
                            : editingStore
                                ? 'Update Store'
                                : 'Save Store'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}

export default StoreModal
