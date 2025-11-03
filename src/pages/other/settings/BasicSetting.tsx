import { useAuthContext } from '@/common'
import { PageBreadcrumb } from '@/components'
import { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Row, Col } from 'react-bootstrap'
import { Pagination as BootstrapPagination } from 'react-bootstrap'
import { MdDelete } from 'react-icons/md'
import { useForm } from 'react-hook-form'
import { toastService } from '@/common/context/toast.service'
import { TableRowSkeleton } from '../SimpleLoader'

interface IPRecord {
	_id: string
	address: string
	description: string
}

const BasicSetting = () => {
	const { user, isSuperUser, permissions } = useAuthContext()
	const { token } = user
	const BASE_API = import.meta.env.VITE_BASE_API
	const canUpdate = isSuperUser || permissions.Settings?.Update

	// States
	const [loading, setLoading] = useState(false)
	const [ipAddresses, setIpAddresses] = useState<IPRecord[]>([])
	const [isOtpEnabled, setIsOtpEnabled] = useState(false)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(6)
	const [apiLoading, setApiLoading] = useState(false)
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [selectedIpId, setSelectedIpId] = useState<string>('');
	const [adminPassword, setAdminPassword] = useState('');
	const [searchTerm, setSearchTerm] = useState('')
	const { register, handleSubmit, reset, formState: { errors } } = useForm()

	// Fetch IP Addresses
	const fetchIPAddresses = async () => {
		setLoading(true)
		try {
			const response = await fetch(`${BASE_API}/api/ip-access`, {
				headers: {
					Authorization: `Bearer ${token}`,
				}
			})
			const data = await response.json()
			if (!response.ok) throw new Error(data.message)
			setIpAddresses(data)
		} catch (error: any) {
			toastService.error(error.message)
		} finally {
			setLoading(false)
		}
	}

	// Add new IP
	const handleAddIP = async (formData: any) => {
		setApiLoading(true)
		try {
			const response = await fetch(`${BASE_API}/api/ip-access`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData)
			})
			const data = await response.json()
			if (!response.ok) throw new Error(data.message)

			fetchIPAddresses()
			setIsModalOpen(false)
			reset()
			toastService.success('IP Address added successfully')
		} catch (error: any) {
			toastService.error(error.message)
		} finally {
			setApiLoading(false)
		}
	}


	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
	}
	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}
	const handleDeleteConfirmation = (ipId: string) => {
		setSelectedIpId(ipId);
		setShowPasswordModal(true);
	}
	const handlePasswordSubmit = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/ip-access/${selectedIpId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					adminPassword: adminPassword
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Failed to delete IP');
			}

			toastService.success('IP Address deleted successfully');
			setShowPasswordModal(false);
			setAdminPassword('');
			fetchIPAddresses();
		} catch (error: any) {
			toastService.error(error.message);
		}
	}

	// Pagination
	const totalPages = Math.ceil(ipAddresses.length / itemsPerPage)
	const paginatedRecords = ipAddresses.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)
	const filteredRecords = paginatedRecords
		?.filter((record) =>
			record?.description?.toLowerCase().includes(searchTerm.toLowerCase())
		)
		.sort((a, b) => a?.description?.localeCompare(b?.description))

	const fetch2FAStatus = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/users/two-factor-auth`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			const data = await response.json()
			if (!response.ok) throw new Error(data.message)
			setIsOtpEnabled(data.twoFactorAuthEnabled)
		} catch (error: any) {
			toastService.error(error.message)
		}
	}

	// Toggle 2FA status
	const handle2FAToggle = async () => {
		const newState = !isOtpEnabled
		try {
			const response = await fetch(`${BASE_API}/api/users/toggle-2fa`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ enabled: newState }),
			})
			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.message)
			}
			setIsOtpEnabled(newState)
			toastService.success('2FA status updated successfully')
		} catch (error: any) {
			toastService.error(error.message)
		}
	}

	// Update the useEffect to include 2FA status fetch
	useEffect(() => {
		fetchIPAddresses()
		fetch2FAStatus()
	}, [])

	useEffect(() => {
		fetchIPAddresses()
	}, [])
	const storeHeaders: any[] = [
		{ width: '20px', type: 'checkbox' },
		{ width: '330px', type: 'text' },
		{ width: '330px', type: 'text' },
		{ width: '60px', type: 'actions' }
	]
	return (
		<>
			<PageBreadcrumb title="Basic Settings" subName="Settings" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">IP Access Management</h4>
							<p className="text-muted mb-0">Manage IP addresses and 2FA settings</p>
						</div>
						<Button variant="success" onClick={() => setIsModalOpen(true)}>
							Add New IP
						</Button>
					</div>

					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
						<div className="app-search">
							<form>
								<div className="input-group" style={{
									backgroundColor: 'rgba(255, 255, 255, 0.8)',
									borderRadius: '10px',
									border: '1px solid rgba(0, 0, 0, 0.1)'
								}}>
									<input
										type="search"
										className="form-control"
										placeholder="Search here..."
										value={searchTerm}
										onChange={handleSearch}
										style={{
											backgroundColor: 'transparent',
											border: 'none',
											paddingLeft: '10px',
											color: '#333'
										}}
									/>
									<span className="ri-search-line search-icon text-muted"
										style={{ marginRight: '10px', color: '#666' }}
									/>
								</div>
							</form>
						</div>

						<Form.Select
							value={itemsPerPage}
							onChange={(e) => setItemsPerPage(Number(e.target.value))}
							className="w-auto mt-3 mt-lg-0"
						>
							<option value={6}>6 items</option>
							<option value={15}>15 items</option>
							<option value={50}>50 items</option>
						</Form.Select>
					</div>
				</Card.Header>


				<Card.Body>
					{
						<>
							<Table responsive>
								<thead>
									<tr>
										<th>S. NO</th>
										<th>IP Address</th>
										<th>Description</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{loading ? (
										<TableRowSkeleton headers={storeHeaders} rowCount={3} />
									) : (
										filteredRecords && filteredRecords?.map((ip, i) => (
											<tr key={ip._id}>
												<td>{i + 1}</td>
												<td>{ip?.address}</td>
												<td>{ip?.description}</td>
												<td>
													<Button
														variant="danger"
														onClick={() => handleDeleteConfirmation(ip._id.toString())}
														disabled={!canUpdate}
													>
														<MdDelete />
													</Button>
												</td>
											</tr>
										)))}
								</tbody>
							</Table>

							<nav className="d-flex justify-content-end mt-3">
								<BootstrapPagination className="pagination-rounded mb-0">
									<BootstrapPagination.Prev
										onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
									/>

									{/* Show first page if not in first set */}
									{currentPage > 2 && (
										<>
											<BootstrapPagination.Item onClick={() => handlePageChange(1)}>
												1
											</BootstrapPagination.Item>
											{currentPage > 3 && <BootstrapPagination.Ellipsis />}
										</>
									)}

									{/* Show 3 pages around current page */}
									{Array.from({ length: totalPages }, (_, index) => {
										const pageNumber = index + 1;
										if (
											pageNumber === currentPage ||
											pageNumber === currentPage - 1 ||
											pageNumber === currentPage + 1
										) {
											return (
												<BootstrapPagination.Item
													key={pageNumber}
													active={pageNumber === currentPage}
													onClick={() => handlePageChange(pageNumber)}
												>
													{pageNumber}
												</BootstrapPagination.Item>
											);
										}
										return null;
									})}

									{/* Show last page if not in last set */}
									{currentPage < totalPages - 1 && (
										<>
											{currentPage < totalPages - 2 && <BootstrapPagination.Ellipsis />}
											<BootstrapPagination.Item onClick={() => handlePageChange(totalPages)}>
												{totalPages}
											</BootstrapPagination.Item>
										</>
									)}

									<BootstrapPagination.Next
										onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
									/>
								</BootstrapPagination>

							</nav>
						</>
					}

					<div className="mt-4">
						<h5>Two-Factor Authentication (2FA)</h5>
						<div style={{ display: 'flex', alignItems: 'center' }}>
							<div className="toggle-container" style={{ marginRight: '10px' }}>
								<label className="toggle">
									<input
										type="checkbox"
										checked={isOtpEnabled}
										onChange={handle2FAToggle}
										disabled={!canUpdate}
									/>
									<span className="slider"></span>
									<span className="text on">ON</span>
									<span className="text off">OFF</span>
								</label>
							</div>
							<div className="info-text">
								<p style={{ margin: 0 }}>
									Two-Factor Authentication (2FA) adds an extra layer of security to your customer login by requiring a one-time password.
								</p>
							</div>
						</div>
					</div>
				</Card.Body>
			</Card>

			<Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Add New IP Address</Modal.Title>
				</Modal.Header>
				<Form onSubmit={handleSubmit(handleAddIP)}>
					<Modal.Body>
						<Row>
							<Col>
								<Form.Group className="mb-3">
									<Form.Label>IP Address</Form.Label>
									<Form.Control
										type="text"
										{...register('address', { required: true })}
										isInvalid={!!errors.address}
										placeholder="Enter IP address"
									/>
									{errors.address && (
										<Form.Control.Feedback type="invalid">
											IP address is required
										</Form.Control.Feedback>
									)}
								</Form.Group>
							</Col>
						</Row>
						<Row>
							<Col>
								<Form.Group>
									<Form.Label>Description</Form.Label>
									<Form.Control
										type="text"
										{...register('description', { required: true })}
										isInvalid={!!errors.description}
										placeholder="Enter description"
									/>
									{errors.description && (
										<Form.Control.Feedback type="invalid">
											Description is required
										</Form.Control.Feedback>
									)}
								</Form.Group>
							</Col>
						</Row>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={() => setIsModalOpen(false)}>
							Close
						</Button>
						<Button variant="success" type="submit" disabled={apiLoading}>
							{apiLoading ? 'Adding...' : 'Add IP'}
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>
			<Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Confirm IP Deletion</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>Please enter your admin password to confirm IP deletion</p>
					<Form.Group>
						<Form.Label>Admin Password</Form.Label>
						<Form.Control
							type="password"
							placeholder="Enter your password"
							value={adminPassword}
							onChange={(e) => setAdminPassword(e.target.value)}
						/>
					</Form.Group>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => {
						setShowPasswordModal(false);
						setAdminPassword('');
					}}>
						Cancel
					</Button>
					<Button
						variant="danger"
						onClick={handlePasswordSubmit}
						disabled={!adminPassword}
					>
						Delete IP
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default BasicSetting
