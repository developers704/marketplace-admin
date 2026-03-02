import { Card, Col, Row, Button, Table, Form } from 'react-bootstrap';
import { useState, useMemo } from 'react';
import { FormInput, PageBreadcrumb } from '@/components';
import { useAuthContext } from '@/common';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import { SmallLoader } from './SimpleLoader';
import {
	MENU_PERMISSIONS,
	ADDITIONAL_PERMISSIONS,
	getDefaultPermissions,
	type PermissionState,
} from '@/constants/rolePermissions';

const CRUD_KEYS = ['Create', 'View', 'Update', 'Delete'] as const;

const Roles = () => {
	const defaultPermission = useMemo(() => getDefaultPermissions(), []);
	const [permission, setPermission] = useState<PermissionState>(defaultPermission);
	const { user } = useAuthContext();
	const [error, setError] = useState('');
	const [role, setRole] = useState('');
	const [apiLoading, setApiLoading] = useState(false);

	const menuKeys = Object.values(MENU_PERMISSIONS);
	const additionalKeys = Object.values(ADDITIONAL_PERMISSIONS);

	const resetForm = () => {
		setPermission(defaultPermission);
		setRole('');
	};

	const handlePermissionToggle = (menuKey: string, permType: 'Create' | 'View' | 'Update' | 'Delete') => {
		setPermission((prev) => ({
			...prev,
			[menuKey]: {
				...prev[menuKey],
				[permType]: !prev[menuKey]?.[permType],
			},
		}));
	};

	// Select All for entire menu section (all CRUD for all menu rows)
	const allMenuSelected = menuKeys.every((key) =>
		CRUD_KEYS.every((p) => permission[key]?.[p])
	);
	const toggleAllMenu = () => {
		const next = !allMenuSelected;
		setPermission((prev) => {
			const nextPerm = { ...prev };
			menuKeys.forEach((key) => {
				nextPerm[key] = {
					...prev[key],
					Create: next,
					View: next,
					Update: next,
					Delete: next,
				};
			});
			return nextPerm;
		});
	};

	// Select All per CRUD column (for menu rows only)
	const allCreateSelected = menuKeys.every((key) => permission[key]?.Create);
	const allViewSelected = menuKeys.every((key) => permission[key]?.View);
	const allUpdateSelected = menuKeys.every((key) => permission[key]?.Update);
	const allDeleteSelected = menuKeys.every((key) => permission[key]?.Delete);

	const toggleAllByColumn = (permType: 'Create' | 'View' | 'Update' | 'Delete') => {
		const current = permType === 'Create' ? allCreateSelected : permType === 'View' ? allViewSelected : permType === 'Update' ? allUpdateSelected : allDeleteSelected;
		const next = !current;
		setPermission((prev) => {
			const nextPerm = { ...prev };
			menuKeys.forEach((key) => {
				nextPerm[key] = { ...prev[key], [permType]: next };
			});
			return nextPerm;
		});
	};

	// Select All for Additional Permissions (View only)
	const allAdditionalViewSelected = additionalKeys.every((key) => permission[key]?.View);
	const toggleAllAdditionalView = () => {
		const next = !allAdditionalViewSelected;
		setPermission((prev) => {
			const nextPerm = { ...prev };
			additionalKeys.forEach((key) => {
				nextPerm[key] = { ...prev[key], View: next };
			});
			return nextPerm;
		});
	};

	const handleSubmit = async () => {
		if (!role) {
			setError('Please Enter a Role Name.');
			return;
		}
		setError('');
		setApiLoading(true);

		const roleData = {
			role_name: role,
			permissions: permission,
		};

		try {
			const token = user.token;
			const BASE_API = import.meta.env.VITE_BASE_API;
			const response = await fetch(`${BASE_API}/api/users/role`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(roleData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Registration failed');
			}

			await response.json();
			Swal.fire({
				title: 'Role Created Successfully!',
				text: 'Role with permission has been created successfully!',
				icon: 'success',
				timer: 1500,
				confirmButtonColor: '#9c5100',
			});
			resetForm();
		} catch (error) {
			Swal.fire({
				title: 'Error!',
				text: 'This Role is already taken. Please choose another one.',
				icon: 'error',
				timer: 1500,
			});
		} finally {
			setApiLoading(false);
		}
	};

	return (
		<div>
			<PageBreadcrumb title="Create New Role" subName="User" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">{`Role & Permission`}</h4>
						</div>
						<div className="mt-3 mt-lg-0">
							<Button style={{ border: 'none' }} variant="none">
								<Link to="/user/role-all" className="btn btn-danger">
									See All Roles
								</Link>
							</Button>
						</div>
					</div>
				</Card.Header>
				<Card.Body>
					<Row>
						<Col lg={6} className="mb-3">
							<FormInput
								label="Role"
								type="text"
								name="role_name"
								placeholder="Enter Role Name"
								value={role}
								onChange={(e) => setRole(e.target.value)}
							/>
							{error && <small className="text-danger">{error}</small>}
						</Col>
					</Row>
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
												const next = !CRUD_KEYS.every((p) => permission[key]?.[p]);
												setPermission((prev) => ({
													...prev,
													[key]: {
														...prev[key],
														Create: next,
														View: next,
														Update: next,
														Delete: next,
													},
												}));
											}}
										/>
									</td>
									{CRUD_KEYS.map((perm) => (
										<td key={perm}>
											<Form.Check
												type="switch"
												className="form-switch mb-0"
												checked={!!permission[key]?.[perm]}
												onChange={() => handlePermissionToggle(key, perm)}
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
											onChange={() => handlePermissionToggle(key, 'View')}
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
						disabled={apiLoading}
					>
						{apiLoading ? <SmallLoader /> : 'Save Role & Permission'}
					</Button>
				</Card.Body>
			</Card>
		</div>
	);
};

export default Roles;
