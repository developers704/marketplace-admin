import { useAuthContext } from '@/common'
import { FormInput, PageBreadcrumb } from '@/components'
import { useEffect, useState, useMemo } from 'react'
import { Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import { SmallLoader } from './SimpleLoader'
import {
	MENU_PERMISSIONS,
	ADDITIONAL_PERMISSIONS,
	getDefaultPermissions,
	mergeApiPermissions,
	type PermissionState,
} from '@/constants/rolePermissions'

const CRUD_KEYS = ['Create', 'View', 'Update', 'Delete'] as const

const RoleUpdate = () => {
	const { id } = useParams()
	const { user, isSuperUser, permissions } = useAuthContext()
	const { token } = user
	const BASE_API = import.meta.env.VITE_BASE_API
	const [role, setRole] = useState('')
	const [loading, setLoading] = useState<boolean>(true)
	const [apiLoading, setApiLoading] = useState(false)
	const canUpdate = isSuperUser || permissions?.Users?.Update
	const canView = isSuperUser || permissions?.Users?.View

	const defaultPermission = useMemo(() => getDefaultPermissions(), [])
	const [permission, setPermission] = useState<PermissionState>(defaultPermission)

	const menuKeys = Object.values(MENU_PERMISSIONS)
	const additionalKeys = Object.values(ADDITIONAL_PERMISSIONS)

	const handlePermissionChange = (
		pageKey: string,
		permissionType: 'Create' | 'View' | 'Update' | 'Delete'
	) => {
		setPermission((prev) => ({
			...prev,
			[pageKey]: {
				...prev[pageKey],
				[permissionType]: !prev[pageKey]?.[permissionType],
			},
		}))
	}

	useEffect(() => {
		const fetchRoles = async () => {
			try {
				const response = await fetch(`${BASE_API}/api/users/role`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
				})
				const data = await response.json()
				if (response.ok) {
					const userRole = data.find((r: any) => r._id === id)
					if (userRole) {
						setRole(userRole.role_name)
						// Merge API permissions into full default so ALL menus always show
						setPermission(mergeApiPermissions(userRole.permissions))
					}
				}
			} catch (error) {
				console.error('Error fetching roles:', error)
			} finally {
				setLoading(false)
			}
		}
		fetchRoles()
	}, [id, token, BASE_API])

	// Select All for entire menu section
	const allMenuSelected = menuKeys.every((key) =>
		CRUD_KEYS.every((p) => permission[key]?.[p])
	)
	const toggleAllMenu = () => {
		const next = !allMenuSelected
		setPermission((prev) => {
			const nextPerm = { ...prev }
			menuKeys.forEach((key) => {
				nextPerm[key] = {
					...prev[key],
					Create: next,
					View: next,
					Update: next,
					Delete: next,
				}
			})
			return nextPerm
		})
	}

	const allCreateSelected = menuKeys.every((key) => permission[key]?.Create)
	const allViewSelected = menuKeys.every((key) => permission[key]?.View)
	const allUpdateSelected = menuKeys.every((key) => permission[key]?.Update)
	const allDeleteSelected = menuKeys.every((key) => permission[key]?.Delete)

	const toggleAllByColumn = (permType: 'Create' | 'View' | 'Update' | 'Delete') => {
		const current =
			permType === 'Create'
				? allCreateSelected
				: permType === 'View'
				? allViewSelected
				: permType === 'Update'
				? allUpdateSelected
				: allDeleteSelected
		const next = !current
		setPermission((prev) => {
			const nextPerm = { ...prev }
			menuKeys.forEach((key) => {
				nextPerm[key] = { ...prev[key], [permType]: next }
			})
			return nextPerm
		})
	}

	const allAdditionalViewSelected = additionalKeys.every((key) => permission[key]?.View)
	const toggleAllAdditionalView = () => {
		const next = !allAdditionalViewSelected
		setPermission((prev) => {
			const nextPerm = { ...prev }
			additionalKeys.forEach((key) => {
				nextPerm[key] = { ...prev[key], View: next }
			})
			return nextPerm
		})
	}

	const handleSubmit = async () => {
		setApiLoading(true)
		const roleData = { role_name: role, permissions: permission }
		try {
			const res = await fetch(`${BASE_API}/api/users/role/${id ?? ''}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${user.token}`,
				},
				body: JSON.stringify(roleData),
			})
			if (!res.ok) {
				const err = await res.json()
				throw new Error(err.message || 'Role update failed')
			}
			await res.json()
			Swal.fire({
				title: 'Update Successfully!',
				text: 'Role with permission has been updated successfully!',
				icon: 'success',
				timer: 1500,
			})
		} catch (error: any) {
			Swal.fire({
				title: 'Sorry!',
				text: 'An error occurred while updating Role. Please try again later.',
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setApiLoading(false)
		}
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
			<PageBreadcrumb title="Update Role" subName="User" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">Role & Permission</h4>
						</div>
						<div className="mt-3 mt-lg-0">
							<Button style={{ border: 'none' }} variant="none" disabled={!canView}>
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
							<FormInput
								label="Role"
								type="text"
								name="role_name"
								value={role}
								placeholder="Enter Role Name"
								onChange={(e) => setRole(e.target.value)}
								containerClass="mb-3"
							/>
						</Col>
					</Row>

					{/* Menu Permissions - always show all menus */}
					<Table className="table-hover table-centered mb-0">
						<thead>
							<tr>
								<th>Menu</th>
								<th>
									<span className="d-block small text-muted mb-1">Select All</span>
									<Form.Check
										type="switch"
										className="form-switch mb-0"
										checked={allMenuSelected}
										onChange={toggleAllMenu}
									/>
								</th>
								<th>
									<span className="d-block small text-muted mb-1">Create</span>
									<Form.Check
										type="switch"
										className="form-switch mb-0"
										checked={allCreateSelected}
										onChange={() => toggleAllByColumn('Create')}
									/>
								</th>
								<th>
									<span className="d-block small text-muted mb-1">View</span>
									<Form.Check
										type="switch"
										className="form-switch mb-0"
										checked={allViewSelected}
										onChange={() => toggleAllByColumn('View')}
									/>
								</th>
								<th>
									<span className="d-block small text-muted mb-1">Update</span>
									<Form.Check
										type="switch"
										className="form-switch mb-0"
										checked={allUpdateSelected}
										onChange={() => toggleAllByColumn('Update')}
									/>
								</th>
								<th>
									<span className="d-block small text-muted mb-1">Delete</span>
									<Form.Check
										type="switch"
										className="form-switch mb-0"
										checked={allDeleteSelected}
										onChange={() => toggleAllByColumn('Delete')}
									/>
								</th>
							</tr>
						</thead>
						<tbody>
							{Object.entries(MENU_PERMISSIONS).map(([name, key]) => (
								<tr key={key}>
									<td>{name}</td>
									<td>
										<Form.Check
											type="switch"
											className="form-switch mb-0"
											checked={CRUD_KEYS.every((p) => permission[key]?.[p])}
											onChange={() => {
												const next = !CRUD_KEYS.every((p) => permission[key]?.[p])
												setPermission((prev) => ({
													...prev,
													[key]: {
														...prev[key],
														Create: next,
														View: next,
														Update: next,
														Delete: next,
													},
												}))
											}}
										/>
									</td>
									{CRUD_KEYS.map((perm) => (
										<td key={perm}>
											<Form.Check
												type="switch"
												className="form-switch mb-0"
												checked={!!permission[key]?.[perm]}
												onChange={() => handlePermissionChange(key, perm)}
											/>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</Table>

					<h5 className="mt-4">Additional Permissions</h5>
					<Table className="table-hover table-centered mb-0">
						<thead>
							<tr>
								<th>Menu</th>
								<th>
									<span className="d-block small text-muted mb-1">View</span>
									<Form.Check
										type="switch"
										className="form-switch mb-0"
										checked={allAdditionalViewSelected}
										onChange={toggleAllAdditionalView}
									/>
								</th>
							</tr>
						</thead>
						<tbody>
							{Object.entries(ADDITIONAL_PERMISSIONS).map(([name, key]) => (
								<tr key={key}>
									<td>{name}</td>
									<td>
										<Form.Check
											type="switch"
											className="form-switch mb-0"
											checked={!!permission[key]?.View}
											onChange={() => handlePermissionChange(key, 'View')}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</Table>

					<Button
						className="mt-3"
						variant="success"
						onClick={handleSubmit}
						disabled={apiLoading || !canUpdate}>
						{apiLoading ? <SmallLoader /> : 'Save Role & Permission'}
					</Button>
				</Card.Body>
			</Card>
		</>
	)
}

export default RoleUpdate
