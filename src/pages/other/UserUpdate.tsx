import { Card, Col, Form, Row, Button, Spinner } from 'react-bootstrap'
import { PageBreadcrumb, FormInput } from '@/components'
import { useForm, Controller } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuthContext } from '@/common'
import { Link, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import Select, { components } from 'react-select'

// Define the WarehouseRecord type
interface WarehouseRecord {
	_id: string;
	name: string;
	location: string;
	capacity: number;
	isActive: boolean;
	description: string;
	createdAt: string;
	updatedAt: string;
	__v: number;
}

interface SelectOption {
	value: string;
	label: string;
}

interface UpdateUserFormData {
	username: string;
	email: string;
	phone_number: string;
	userRoleId: string;
	password?: string;
	warehouseId?: string;
	department: string;
}

// Schema for form validation
const schema = yup.object().shape({
	username: yup.string().required('Please enter Username'),
	email: yup
		.string()
		.email('Please enter a valid email')
		.required('Please enter Email'),
	password: yup
  .string()
  .transform((value) => (value === '' ? null : value)) // ✅ convert empty string → null
  .nullable()
  .notRequired()
  .min(6, 'Password must be at least 6 characters'),
	phone_number: yup.string().required('Please enter Phone Number'),
	role_name: yup.string().required('Please select a Role'),
	warehouseId: yup
		.array()
		.of(yup.string())
		.min(1, 'Please select at least one Store'),
	department: yup.string().required('Please select a Department'),
})

const UserUpdate = () => {
	const { id } = useParams()
	const { user, isSuperUser, permissions } = useAuthContext()
	const { token } = user
	const BASE_API = import.meta.env.VITE_BASE_API

	const canUpdate = isSuperUser || permissions.Users?.Update
	const canView = isSuperUser || permissions.Users?.View

	const [roles, setRoles] = useState<SelectOption[]>([])
	const [warehouseData, setWarehouseData] = useState<SelectOption[]>([])
	const [loading, setLoading] = useState(false)
	const [apiLoading, setApiLoading] = useState(false)
	const [departments, setDepartments] = useState<SelectOption[]>([])

	const methods = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			username: '',
			email: '',
			phone_number: '',
			role_name: '',
			password: null,
			warehouseId: [],
			department: '',
		},
	})

	const {
		handleSubmit,
		register,
		setValue,
		control,
		formState: { errors },
	} = methods

	// Function to fetch warehouses
	const getWarehouses = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/warehouses`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to get warehouses')
			}

			const data_res: WarehouseRecord[] = await response.json()
			if (data_res) {
				const formattedWarehouses = data_res.map((warehouse) => ({
					value: warehouse._id,
					label: warehouse.name,
				}))
				setWarehouseData(formattedWarehouses)
			}
		} catch (error: any) {
			console.error('Error fetching warehouses:', error)
		}
	}

	const getDepartments = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/departments`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to fetch Departments')
			}

			const data = await response.json()
			const formattedDepartments = data.map(
				(dept: { _id: string; name: string }) => ({
					value: dept._id,
					label: dept.name,
				})
			)
			setDepartments(formattedDepartments)
		} catch (error: any) {
			console.error('Error fetching departments:', error)
		}
	}

	// Fetch user data, roles and warehouses
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true)
			try {
				// Fetch roles
				const rolesResponse = await fetch(`${BASE_API}/api/users/role/`, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
				})
				const rolesData = await rolesResponse.json()
				const formattedRoles = rolesData.map((role: any) => ({
					value: role._id,
					label: role.role_name,
				}))
				setRoles(formattedRoles)

				// Fetch warehouses
				await getWarehouses()
				await getDepartments()

				// Fetch user data by ID
				const userResponse = await fetch(`${BASE_API}/api/users/${id}`, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})

				const userData = await userResponse.json()
				setValue('username', userData.username)
				setValue('email', userData.email)
				setValue('phone_number', userData.phone_number)

				// Set values for react-select fields
				if (userData.role && userData.role._id) {
					setValue('role_name', userData.role._id)
				}

				if (userData.warehouse) {
					let warehouseIds: string[] = []

					if (Array.isArray(userData.warehouse)) {
						warehouseIds = userData.warehouse.map((wh: any) =>
							typeof wh === 'object' ? wh._id : wh
						)
					} else {
						warehouseIds = [
							typeof userData.warehouse === 'object'
								? userData.warehouse._id
								: userData.warehouse,
						]
					}

					setValue('warehouseId', warehouseIds)
				}

				if (userData.department) {
					setValue('department', userData.department)
				}
			} catch (error) {
				console.error('Error fetching data:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [id, token, setValue])

	// Handle form submission
	const handleFormSubmit = async (data: any) => {
		try {
			setApiLoading(true)

			const formattedData: UpdateUserFormData = {
				username: data.username,
				email: data.email,
				phone_number: data.phone_number,
				userRoleId: data.role_name, // Send _id instead of role_name
				department: data.department,
			}
			if (data.password) {
				formattedData.password = data.password;
			}

			// Only add warehouseId if it's not empty
			if (data.warehouseId) {
				formattedData.warehouseId = data.warehouseId;
			}

			console.log('data before sending to api ', formattedData)

			const response = await fetch(`${BASE_API}/api/users/${id}`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formattedData),
			})

			if (!response.ok) throw new Error('Failed to update user.')

			console.log('User updated successfully:', await response.json())
			Swal.fire({
				title: 'Success!',
				text: 'User updated successfully',
				icon: 'success',
				confirmButtonText: 'OK',
				timer: 1500,
			})
		} catch (error) {
			console.error('Error updating user:', error)
			Swal.fire({
				title: 'Error!',
				text: 'Failed to update user',
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setApiLoading(false)
		}
	}

	// Custom styles for react-select
	const customStyles = {
		control: (provided: any, state: any) => ({
			...provided,
			borderColor: state.isFocused ? '#80bdff' : '#ced4da',
			boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : null,
			'&:hover': {
				borderColor: state.isFocused ? '#80bdff' : '#ced4da',
			},
			minHeight: '38px',
		}),
		placeholder: (provided: any) => ({
			...provided,
			color: '#6c757d',
		}),
		option: (provided: any, state: any) => ({
			...provided,
			backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#f8f9fa' : null,
			color: state.isSelected ? 'white' : '#212529',
			cursor: 'pointer',
			'&:active': {
				backgroundColor: '#007bff',
			},
		}),
	}

	if (loading) {
		return (
			<div
				className="d-flex justify-content-center align-items-center"
				style={{ height: '100vh' }}>
				<Spinner animation="grow" style={{ margin: '0 5px' }} />
				<Spinner animation="grow" style={{ margin: '0 5px' }} />
				<Spinner animation="grow" style={{ margin: '0 5px' }} />
			</div>
		)
	}

	return (
		<>
			<PageBreadcrumb title="Update User Info" subName="User" />
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
									label="Name"
									type="text"
									name="username"
									placeholder="Enter Your Name"
									containerClass="mb-3"
									register={register}
									errors={errors}
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
												{...field}
												options={roles}
												styles={customStyles}
												placeholder="Select a Role"
												className="react-select"
												classNamePrefix="react-select"
												onChange={(option) => field.onChange(option?.value)}
												value={roles.find(option => option.value === field.value) || null}
												isDisabled={!canUpdate}
											/>
										)}
									/>
									{errors.role_name && (
										<Form.Control.Feedback type="invalid" className="d-block">
											{errors.role_name.message}
										</Form.Control.Feedback>
									)}
								</Form.Group>
							</Col>
						</Row>
						<Row>
							<Col lg={6}>
								<Form.Group className="mb-3">
									<Form.Label>Stores</Form.Label>
									<Controller
										name="warehouseId"
										control={control}
										render={({ field }) => {
											const selectedValues = warehouseData.filter(
												(opt) => field.value?.includes?.(opt.value)
											)

											const Option = (props: any) => {
												const { data, innerProps, isFocused } = props
												const isChecked = field.value?.includes(data.value)

												return (
													<div
														{...innerProps}
														className={`d-flex align-items-center p-2 ${
															isFocused ? 'bg-light' : ''
														}`}
														style={{ cursor: 'pointer' }}>
														<input
															type="checkbox"
															checked={isChecked}
															onChange={() => {
																const current = field.value || []
																if (isChecked) {
																	field.onChange(
																		current.filter(
																			(v: string) => v !== data.value
																		)
																	)
																} else {
																	field.onChange([...current, data.value])
																}
															}}
															style={{ marginRight: '8px' }}
														/>
														<label className="m-0">{data.label}</label>
													</div>
												)
											}

											const MenuList = (props: any) => {
												const allSelected =
													field.value?.length === warehouseData.length
												return (
													<div>
														<div
															className="d-flex align-items-center p-2 border-bottom"
															style={{
																cursor: 'pointer',
																background: '#f8f9fa',
																position: 'sticky',
																top: 0,
																zIndex: 1,
															}}
															onClick={() => {
																if (allSelected) field.onChange([])
																else
																	field.onChange(
																		warehouseData.map((o) => o.value)
																	)
															}}>
															<input
																type="checkbox"
																checked={allSelected}
																readOnly
																style={{ marginRight: '8px' }}
															/>
															<label className="m-0 fw-semibold">
																{allSelected ? 'Unselect All' : 'Select All'}
															</label>
														</div>

														<div
															style={{ maxHeight: '220px', overflowY: 'auto' }}>
															{props.children}
														</div>
													</div>
												)
											}

											return (
												<Select
													{...field}
													isMulti
													closeMenuOnSelect={false}
													hideSelectedOptions={false}
													options={warehouseData}
													placeholder="Select Stores"
													className="react-select"
													classNamePrefix="select"
													value={selectedValues}
													onChange={(selectedOptions) =>
														field.onChange(
															selectedOptions
																? selectedOptions.map((o: any) => o.value)
																: []
														)
													}
													components={{ Option, MenuList }}
													styles={{
														...customStyles,
														menu: (base: any) => ({
															...base,
															zIndex: 9999,
														}),
													}}
													isDisabled={!canUpdate}
												/>
											)
										}}
									/>
									{errors.warehouseId && (
										<Form.Control.Feedback type="invalid" className="d-block">
											{errors.warehouseId.message}
										</Form.Control.Feedback>
									)}
								</Form.Group>
							</Col>
							<Col lg={6}>
								<Form.Group className="mb-3">
									<Form.Label>Department</Form.Label>
									<Controller
										name="department"
										control={control}
										render={({ field }) => (
											<Select
												{...field}
												options={departments}
												styles={customStyles}
												placeholder="Select a Department"
												className="react-select"
												classNamePrefix="react-select"
												onChange={(option) => field.onChange(option?.value)}
												value={departments.find(option => option.value === field.value) || null}
												isDisabled={!canUpdate}
											/>
										)}
									/>
									{errors.department && (
										<Form.Control.Feedback type="invalid" className="d-block">
											{errors.department.message}
										</Form.Control.Feedback>
									)}
								</Form.Group>
							</Col>
						</Row>
						<Row>
							<Col lg={6}>
								<FormInput
									label="Email"
									type="email"
									name="email"
									placeholder="Enter Your Email"
									register={register}
									containerClass="mb-3"
									errors={errors}
								/>
							</Col>
							<Col lg={6}>
								<FormInput
									label="Phone Number"
									type="number"
									name="phone_number"
									placeholder="Enter Your Phone Number"
									register={register}
									containerClass="mb-3"
									errors={errors}
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
									register={register}
									containerClass="mb-3"
									errors={errors}
								/>
							</Col>
						</Row>
						<Button
							type="submit"
							variant="success"
							disabled={apiLoading || !canUpdate}>
							{apiLoading ? 'Updating..' : 'Update User'}
						</Button>
					</Card.Body>
				</Form>
			</Card>
		</>
	)
}

export default UserUpdate
