import { useAuthContext } from '@/common'
import { FormInput, PageBreadcrumb } from '@/components'
import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import { Permission } from '@/types'
import Swal from 'sweetalert2'
import { SmallLoader } from './SimpleLoader'

const RoleUpdate = () => {
	const { id } = useParams() // Get the user id from the URL params
	const { user, isSuperUser, permissions } = useAuthContext() // Get the authenticated user's token
	const { token } = user
	const BASE_API = import.meta.env.VITE_BASE_API
	const [role, setRole] = useState('')

	const [loading, setLoading] = useState<Boolean>(true)
	const [apiLoading, setApiLoading] = useState(false)
	const canUpdate = isSuperUser || permissions.Users?.Update
	const canView = isSuperUser || permissions.Users?.View
	const defaultPermission: Permission = {
		Products: { Create: false, View: false, Update: false, Delete: false },
		Inventory: { Create: false, View: false, Update: false, Delete: false },
		Orders: { Create: false, View: false, Update: false, Delete: false },
		Users: { Create: false, View: false, Update: false, Delete: false },
		Wallets: { Create: false, View: false, Update: false, Delete: false },
		Settings: { Create: false, View: false, Update: false, Delete: false },
		Policies: { Create: false, View: false, Update: false, Delete: false },
	}
	const [permission, setPermission] = useState<Permission>(defaultPermission)
	const handlePermissionChange = (
		page: keyof Permission,
		permissionType: 'Create' | 'View' | 'Update' | 'Delete'
	) => {
		setPermission((prevPermission) => ({
			...prevPermission,
			[page]: {
				...prevPermission[page],
				[permissionType]: !prevPermission[page][permissionType],
			},
		}))
	}
	useEffect(() => {
		const fetchRoles = async () => {
			try {
				// Fetch all user roles from the API
				const response = await fetch(`${BASE_API}/api/users/role`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`, // Pass token for authorization
					},
				})

				const data = await response.json()

				if (response.ok) {
					// Find the specific role based on the ID
					const userRole = data.find((role: any) => role._id === id)
					if (userRole) {
						console.log('User Role:', userRole)
						setRole(userRole.role_name) // Set the role in state
						setPermission(userRole.permissions) // Set the permission in state
					} else {
						console.log('No role found for the provided user ID.')
					}
				} else {
					console.error('Failed to fetch roles:', data.message)
				}
			} catch (error) {
				console.error('Error fetching roles:', error)
			} finally {
				setLoading(false) // Turn off the loading spinner
			}
		}

		// Call the fetch function on mount
		fetchRoles()
	}, [id])

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
	const handleSubmit = async () => {
		setApiLoading(true)
		const roleData = {
			role_name: role,
			permissions: permission,
		}
		console.log(roleData)

		try {
			const token = user.token
			const BASE_API = import.meta.env.VITE_BASE_API
			const response = await fetch(
				`${BASE_API}/api/users/role/${id ? id : ''}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(roleData),
				}
			)

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Role Updation failed')
			}

			if (response.ok) {
				await response.json()
				Swal.fire({
					title: 'Update Successfully!',
					text: 'Role with permission has been updated successfully!',
					icon: 'success',
					timer: 1500,
				})
				// resetForm()
			}
		} catch (error: any) {
			console.log(' error is caught ', error)

			Swal.fire({
				title: 'Sorry!',
				text: `An Error Occured, while updating Role Policy. Please try again later.`,
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setApiLoading(false)
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
	}
	return (
		<>
			<PageBreadcrumb title="Update Role" subName="User" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">{`Role & Permission`}</h4>
						</div>
						<div className="mt-3 mt-lg-0">
							{' '}
							{/* Responsive margin for small screens */}
							<Button
								style={{ border: 'none' }}
								variant="none"
								disabled={!canView}>
								<Link to="/user/role-all" className="btn btn-danger">
									See All Roles
								</Link>
							</Button>
						</div>
					</div>
				</Card.Header>
				<Card.Body>
					<Row>
						<Col lg={6}>
							{/* Input field for Role */}
							<FormInput
								label="Role"
								type="text"
								name="role_name"
								value={role} // Bind the role state to input
								placeholder="Enter Role Name"
								onChange={(e) => setRole(e.target.value)} // Update state on change
								containerClass="mb-3"
								key="role_name"
							/>
						</Col>
					</Row>

					{/* Table for Permission */}
					<div className="table-responsive-sm">
						<Table className="table-hover table-centered mb-0">
							<thead>
								<tr>
									<th>Page</th>
									<th>View</th>
									<th>Create</th>
									<th>Update</th>
									<th>Delete</th>
								</tr>
							</thead>
							<tbody>
								{Object.keys(permission).map((page) => (
									<tr key={page}>
										<td>{page}</td>

										<td>
											<Form.Check
												type="checkbox"
												style={{ margin: '0 auto', display: 'block' }} // Center checkbox
												checked={permission[page as keyof Permission].View}
												onChange={() =>
													handlePermissionChange(
														page as keyof Permission,
														'View'
													)
												}
											/>
										</td>
										<td>
											<Form.Check
												type="checkbox"
												style={{ margin: '0 auto', display: 'block' }} // Center checkbox
												checked={permission[page as keyof Permission].Create}
												onChange={() =>
													handlePermissionChange(
														page as keyof Permission,
														'Create'
													)
												}
											/>
										</td>
										<td>
											<Form.Check
												type="checkbox"
												style={{ margin: '0 auto', display: 'block' }} // Center checkbox
												checked={permission[page as keyof Permission].Update}
												onChange={() =>
													handlePermissionChange(
														page as keyof Permission,
														'Update'
													)
												}
											/>
										</td>
										<td>
											<Form.Check
												type="checkbox"
												style={{ margin: '0 auto', display: 'block' }} // Center checkbox
												checked={permission[page as keyof Permission].Delete}
												onChange={() =>
													handlePermissionChange(
														page as keyof Permission,
														'Delete'
													)
												}
											/>
										</td>
									</tr>
								))}
							</tbody>
						</Table>
					</div>

					{/* Button to Submit Role & Permission */}
					<Button
						className="mt-3"
						variant="success"
						onClick={handleSubmit}
						disabled={apiLoading || !canUpdate}>
						{apiLoading ? <SmallLoader /> : `Save Role & Permission`}
					</Button>
				</Card.Body>
			</Card>
		</>
	)
}

export default RoleUpdate
