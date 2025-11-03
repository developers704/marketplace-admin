import { Card, Col, Form, Row, Button } from 'react-bootstrap'
import { PageBreadcrumb, FormInput } from '@/components'
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { Link } from 'react-router-dom'
import { SmallLoader } from './SimpleLoader'
import Select from 'react-select'
import { toastService } from '@/common/context/toast.service'
import StoreModal from '@/components/modals/StoreModal'
import { useToggle } from '@/hooks'
import DepartmentModal from '@/components/modals/DepartmentModal'
const schemaResolver = yupResolver(
	yup.object().shape({
		username: yup.string().required('Please enter Username'),
		email: yup
			.string()
			.email('Please enter a valid email')
			.required('Please enter Email'),
		password: yup
			.string()
			.min(6, 'Password must be at least 6 characters')
			.required('Please enter Password'),
		phone_number: yup.string()
			.required('Please enter Phone Number'),
		role_name: yup.string().required('Please select a Role'),
		storeId: yup.string().required('Please select a Store'),
		department: yup.string().required('Please select a Department'),
	})
)

const UserCreate = () => {
	const methods = useForm({ resolver: schemaResolver })
	const { permissions, isSuperUser } = useAuthContext()

	const canCreate = isSuperUser || permissions.Users?.Create
	const canView = isSuperUser || permissions.Users?.View

	const {
		handleSubmit,
		register,
		control,
		reset,
		formState: { errors },
	} = methods

	// const [loading, setLoading] = useState(false)
	const [apiloading, setApiLoading] = useState(false)
	const [roles, setRoles] = useState<{ _id: string; role_name: string }[]>([]) // Store
	const [store, setStore] = useState<{ _id: number; name: string }[]>([])
	const [departments, setDepartments] = useState<{ _id: string; name: string }[]>([])
	const [storeModalOpen, toggleStoreModal] = useToggle()
	const [departmentModalOpen, toggleDepartmentModal] = useToggle()
	const { user } = useAuthContext()
	const BASE_API = import.meta.env.VITE_BASE_API

	const departmentOptions = departments.map(dept => ({
		value: dept._id,
		label: dept.name
	}))

	const handleStoreModalSuccess = () => {
		getStore() // Refresh the store list
		toggleStoreModal() // Close the modal
	}
	const roleOptions = roles.map(role => ({
		value: role.role_name,
		label: role.role_name,
		_id: role._id
	}))
	const warehouseOptions = store.map(warehouse => ({
		value: warehouse._id,
		label: warehouse.name
	}))
	const getRoles = async () => {
		try {
			// setLoading(true)
			const yourAuthToken = user.token
			const response = await fetch(`${BASE_API}/api/users/role/`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${yourAuthToken}`,
				},
			})
			if (!response.ok) {
				const error = await response.json()
				const errorMessage = error.message || 'Failed to fetch Role'
				throw new Error(errorMessage)
			}

			if (response.ok) {
				const data = await response.json() // getting user roles name here
				console.log(
					' user data ',
					data.map((item: any) => item.role_name) // item._id
				)

				setRoles(data)
			}
		} catch (error: any) {
			Swal.fire({
				title: 'Error!',
				text: error.message,
				icon: 'error',
				timer: 1500,
			})
		} finally {
			// setLoading(false)
		}
	}
	const getStore = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/warehouses`, {
				headers: {
					Authorization: `Bearer ${user.token}`,
				},
			})

			if (!response.ok) {
				throw new Error('Failed to fetch store')
			}

			const data = await response.json()
			setStore(data)
		} catch (error: any) {
			Swal.fire({
				title: 'Error!',
				text: error.message,
				icon: 'error',
				timer: 1500,
			})
		}
	}
	const getDepartments = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/departments`, {
				headers: {
					Authorization: `Bearer ${user.token}`,
				},
			})

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to fetch Departments')
			}

			const data = await response.json()
			setDepartments(data)
		} catch (error: any) {
			toastService.error(error.message)
		}
	}
	const handleDepartmentModalSuccess = () => {
		getDepartments() // Refresh the department list
		toggleDepartmentModal() // Close the modal
	}

	useEffect(() => {
		getRoles()
		getStore()
		getDepartments()
	}, [])

	const handleFormSubmit = async (data: any) => {
		setApiLoading(true)
		try {
			// Find the selected role's _id
			const selectedRole = roles.find(
				(role) => role.role_name === data.role_name
			)
			console.log('selected user ', selectedRole)
			console.log('role id ', selectedRole?._id)

			const formattedData = {
				username: data.username,
				email: data.email,
				password: data.password,
				phone_number: data.phone_number,
				warehouseId: data.storeId,
				userRoleId: selectedRole?._id, // Send _id instead of role_name
				department: data.department,
			}
			const BASE_API = import.meta.env.VITE_BASE_API
			const yourAuthToken = user.token

			const response = await fetch(`${BASE_API}/api/users`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${yourAuthToken}`,
				},
				body: JSON.stringify(formattedData),
			})
			if (!response.ok) {
				const errorMessage = await response.json()
				console.error('API error:', errorMessage)
				throw new Error(errorMessage.message || 'User creation failed')
			}

			await response.json()

			Swal.fire({
				icon: 'success',
				title: 'Success!',
				text: 'User has been created successfully!',
				timer: 1500,
				confirmButtonColor: "#9c5100",
			})
			reset({
				username: '',
				email: '',
				password: '',
				phone_number: '',
				role_name: '',
				storeId: '',
				department: '', // Added department field
			})
		} catch (error: any) {
			console.error('Error submitting User form:', error)
			Swal.fire({
				title: 'Oops!',
				text: error.message,
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setApiLoading(false)
		}
	}

	return (
		<>
			<PageBreadcrumb title="Add New User" subName="User" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">User Account</h4>
							<p className="text-muted mb-0">
								Fill in the information below to add a new user account
							</p>
						</div>
						<div className="mt-3 mt-lg-0">
							{' '}
							{/* Responsive margin for small screens */}
							<Button
								style={{ border: 'none' }}
								variant="none"
								disabled={!canView}>
								<Link to="/user/user-all" className="btn btn-danger">
									See All Users
								</Link>
							</Button>
						</div>
					</div>
				</Card.Header>
				<Form onSubmit={handleSubmit(handleFormSubmit)}>
					<Card.Body>
						<Row>
							<Col lg={6}>
								<FormInput
									required
									label="Name"
									type="text"
									name="username"
									placeholder="Enter Your Name"
									containerClass="mb-3"
									register={register}
									key="username"
									errors={errors}
									control={control}
								/>
							</Col>
							<Col lg={6}>
								<Form.Group className="mb-3">
									<Form.Label>Role</Form.Label>
									<Controller
										name="role_name"
										control={control}
										render={({ field }) => (
											<Select
												required
												{...field}
												options={roleOptions}
												isSearchable={true}
												placeholder="Select a Role"
												className="react-select"
												classNamePrefix="select"
												value={roleOptions.find(option => option.value === field.value)}
												onChange={(option) => field.onChange(option?.value)}
											/>
										)}
									/>
									{errors.role_name && (
										<Form.Text className="text-danger">
											{errors.role_name.message}
										</Form.Text>
									)}
								</Form.Group>
							</Col>

						</Row>
						<Row>
							<Col lg={6}>
								<Form.Group className="mb-3">
									<Form.Label className="d-flex align-items-center justify-content-between">
										Store
										<Button
											onClick={toggleStoreModal}
											title="Add New Store"
											className="p-0"
											variant="link"
										>
											<i className="bi bi-plus-circle-fill text-success" style={{ fontSize: '24px' }}></i>
										</Button>
									</Form.Label>
									<Controller
										name="storeId"
										control={control}
										render={({ field }) => (
											<Select
												isClearable
												{...field}
												options={warehouseOptions}
												isSearchable={true}
												placeholder="Select a Store"
												className="react-select"
												classNamePrefix="select"
												value={warehouseOptions.find((option: any) => option.value === field.value)}
												onChange={(option) => field.onChange(option?.value)}
											/>
										)}
									/>
								</Form.Group>
							</Col>
							<Col lg={6}>
								<Form.Group className="mb-3">
									<Form.Label className="d-flex align-items-center justify-content-between">
										Department
										<Button
											variant="link"
											onClick={toggleDepartmentModal}
											title="Add New Department"
											className="p-0"
										>
											<i className="bi bi-plus-circle-fill text-success" style={{ fontSize: '24px' }}></i>
										</Button>
									</Form.Label>
									<Controller
										name="department"
										control={control}
										render={({ field }) => (
											<Select
												isClearable
												{...field}
												options={departmentOptions}
												isSearchable={true}
												placeholder="Select a Department"
												className="react-select"
												classNamePrefix="select"
												value={departmentOptions.find((option: any) => option.value === field.value)}
												onChange={(option) => field.onChange(option?.value)}
											/>
										)}
									/>
								</Form.Group>
							</Col>

						</Row>
						<Row>
							<Col lg={6}>
								<FormInput
									required
									label="Email"
									type="email"
									name="email"
									placeholder="Email"
									containerClass="mb-3"
									register={register}
									key="email"
									errors={errors}
									control={control}
								/>
							</Col>
							<Col lg={6}>
								<FormInput
									required
									label="Phone Number"
									type="number"
									name="phone_number"
									placeholder="Enter Your Phone Number"
									containerClass="mb-3"
									register={register}
									key="phone_number"
									errors={errors}
									control={control}
								/>
							</Col>

						</Row>
						<Row>
							<Col lg={6}>
								<FormInput
									label="Password"
									type="password"
									name="password"
									placeholder="Enter Your Password"
									containerClass="mb-3"
									register={register}
									key="password"
									errors={errors}
									control={control}
								/>
							</Col>


						</Row>

						<Button
							type="submit"
							variant="success"
							disabled={apiloading || !canCreate}>
							{apiloading ? <SmallLoader /> : 'Register User'}
						</Button>
					</Card.Body>
				</Form>
			</Card>
			<StoreModal
				show={storeModalOpen}
				onHide={toggleStoreModal}
				onSuccess={handleStoreModalSuccess}
			/>
			<DepartmentModal
				show={departmentModalOpen}
				onHide={toggleDepartmentModal}
				onSuccess={handleDepartmentModalSuccess}
			/>
		</>
	)
}

export default UserCreate
