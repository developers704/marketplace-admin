import { PageBreadcrumb } from '@/components'
import {
	Button,
	Card,
	Form,
	Table,
	Pagination as BootstrapPagination,
	Modal,
} from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import Variations from './Variations'
import { ProductVariant } from '@/types'
import { TableRowSkeleton } from '../other/SimpleLoader'

interface VariantName {
	_id: string
	name: string
}

const ProductVarations = () => {
	const { isSuperUser, permissions, user } = useAuthContext()
	const canUpdate = isSuperUser || permissions.Products?.Update
	const canDelete = isSuperUser || permissions.Products?.Delete
	const canCreate = isSuperUser || permissions.Products?.Create

	// ************************** states **********************************
	const [selectedRows, setSelectedRows] = useState<string[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(15)
	const [sortedAsc, setSortedAsc] = useState(true)
	const [showDeleteButton, setShowDeleteButton] = useState(false)
	const [apiLoading, setApiLoading] = useState(false)
	const [selectAll, setSelectAll] = useState(false)
	const [loading, setLoading] = useState(false)
	const [productVariantsData, setProductVariantsData] = useState<
		ProductVariant[]
	>([])
	const [variantNames, setVariantNames] = useState<VariantName[]>([])
	const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(
		null
	)
	const [inputValue, setInputValue] = useState<string>('') // Track current input value

	const [variantValues, setVariantValues] = useState<string[]>([])

	// *************************** Basics & initiatlizations *****************************
	const BASE_API = import.meta.env.VITE_BASE_API
	const { token } = user
	const {
		handleSubmit,
		register,
		reset,
		setValue,
		formState: { errors },
	} = useForm()
	const [isOpen, toggleModal] = useToggle()

	// ************************** helping functions **********************************
	useEffect(() => {
		setShowDeleteButton(selectedRows.length > 0)
	}, [selectedRows])

	useEffect(() => {
		setCurrentPage(1)
	}, [itemsPerPage])


	useEffect(() => {
		getAllProductVariants()
	}, [])
	// Add this useEffect
	useEffect(() => {
		getVariantNames()
	}, [])

	// Add this useEffect to watch for changes
	useEffect(() => {
		getVariantNames()
	}, [isOpen]) // This will fetch variant names whenever modal opens

	const filteredRecords = productVariantsData
		.filter((record) =>
			record.value.toLowerCase().includes(searchTerm.toLowerCase())
		)
		.sort((a, b) =>
			sortedAsc
				? a.value.localeCompare(b.value)
				: b.value.localeCompare(a.value)
		)

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}

	const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
	const paginatedRecords = filteredRecords.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)

	const handleToggleModal = () => {
		if (isOpen) {
			reset({ variantName: '', value: '' })
			setEditingVariant(null)
			setVariantValues([])
			setInputValue('')
		}
		toggleModal()
	}

	const toggleEditModal = (variant: ProductVariant) => {
		setEditingVariant(variant)
		setValue('variantName', variant.variantName._id)
		setValue('value', variant.value)
		toggleModal()
	}

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectAll(event.target.checked)
		if (event.target.checked) {
			setSelectedRows(productVariantsData.map((record) => record._id))
		} else {
			setSelectedRows([])
		}
	}

	const handleSelectRow = (id: string) => {
		setSelectedRows((prev) => {
			const newSelection = prev.includes(id)
				? prev.filter((rowId) => rowId !== id)
				: [...prev, id]

			// Update selectAll state based on whether all visible items are selected
			setSelectAll(newSelection.length === paginatedRecords.length)
			return newSelection
		})
	}

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
	}

	const handleSort = () => {
		setSortedAsc(!sortedAsc)
	}

	const handleDeleteConfirmation = (variantId: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'This product variant will be deleted!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Remove!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteProductVariant(variantId)
			}
		})
	}

	const handleDeleteSelected = () => {
		Swal.fire({
			title: 'Are you sure?',
			text: `All the ${selectedRows.length} selected product variants will be deleted!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete them!',
		}).then((result) => {
			if (result.isConfirmed) {
				// Implement bulk delete functionality
				deleteProductVariant(selectedRows)
				console.log('Delete product variants:', selectedRows)
			}
		})
	}

	const handleAddVariantValue = () => {
		const trimmedValue = inputValue.trim()
		if (trimmedValue && !variantValues.includes(trimmedValue)) {
			setVariantValues([...variantValues, trimmedValue])
			setInputValue('') // Clear the input field
		}
	}

	const handleRemoveVariantValue = (value: string) => {
		setVariantValues(variantValues.filter((val) => val !== value))
	}
	//  ***************************** api calling functions ***********************************
	const getVariantNames = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/variants/variant-names`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			})
			if (!response.ok) {
				throw new Error('Failed to fetch variant names')
			}
			const data: VariantName[] = await response.json()
			setVariantNames(data)
		} catch (error: any) {
			console.error('Error fetching variant names:', error)
		}
	}
	const handleAddProductVariant = async (variantData: any) => {
		try {
			setApiLoading(true)
			const response = await fetch(
				`${BASE_API}/api/variants/product-variants`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						variantName: variantData.variantName,
						values: variantValues,
					}),
				}
			)

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(
					errorMessage.message || 'Failed to add new product variant'
				)
			}

			const data_res = await response.json()
			if (data_res) {
				handleToggleModal()
				Swal.fire({
					title: 'Added!',
					text: 'Product variant added successfully!',
					icon: 'success',
					confirmButtonText: 'OK',
					timer: 1500,
				})
				getAllProductVariants()
			}
		} catch (error: any) {
			console.error('Error adding product variant:', error)
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

	const getAllProductVariants = async () => {
		try {
			setLoading(true)
			const response = await fetch(
				`${BASE_API}/api/variants/product-variants`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
				}
			)
			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(
					errorMessage.message || 'Failed to get product variants'
				)
			}
			const data: ProductVariant[] = await response.json()
			setProductVariantsData(data)
		} catch (error: any) {
			console.error('Error getting product variants data:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleUpdateProductVariant = async (variantData: any) => {
		try {
			setApiLoading(true)
			const response = await fetch(
				`${BASE_API}/api/variants/product-variants/${editingVariant?._id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						variantName: variantData.variantName,
						value: variantData.value,
					}),
				}
			)

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(
					errorMessage.message || 'Failed to update product variant'
				)
			}

			const data_res = await response.json()
			if (data_res) {
				handleToggleModal()
				await getAllProductVariants()
				Swal.fire({
					title: 'Updated!',
					text: 'Product variant updated successfully!',
					icon: 'success',
					confirmButtonText: 'OK',
					timer: 1500,
				})
				reset()
				setEditingVariant(null)
			}
		} catch (error: any) {
			console.error('Error updating product variant:', error)
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

	const deleteProductVariant = async (variantId: any) => {
		try {
			const id_select = typeof variantId === 'string' ? [variantId] : variantId
			const response = await fetch(
				`${BASE_API}/api/variants/product-variants/bulk-delete`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ ids: id_select }),
				}
			)

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(
					errorMessage.message || 'Failed to delete product variant(s)'
				)
			}

			const data_res = await response.json()
			if (data_res) {
				Swal.fire({
					title: 'Deleted!',
					text: data_res.message,
					icon: 'success',
					confirmButtonText: 'OK',
				})
				await getAllProductVariants()
			}
		} catch (error: any) {
			console.error('Error deleting product variant(s):', error)
			Swal.fire({
				title: 'Oops!',
				text: error.message,
				icon: 'error',
			})
		}
	}

	const categoryHeaders: any = [
		{ width: '20px', type: 'checkbox' },
		{ width: '80px', type: 'image' },
		{ width: '150px', type: 'text' },
		{ width: '100px', type: 'actions' }
	]
	return (
		<>
			<PageBreadcrumb title="Product Attributes" subName="Products" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">Product Attributes Management</h4>
							<p className="text-muted mb-0">
								Add and manage your Product Attributes here.
							</p>
							<p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
								{
									'Note: You will need to first create a attribute name before you can create product attributes.'
								}
							</p>
						</div>

						<div className="mt-3 mt-lg-0">
							<Button
								style={{ border: 'none' }}
								variant="success"
								disabled={!canCreate}
								onClick={handleToggleModal}>
								<i className="bi bi-plus"></i> Add New Product Attributes
							</Button>
							{showDeleteButton && (
								<Button
									variant="danger"
									className="ms-2"
									onClick={handleDeleteSelected}>
									Delete Selected
								</Button>
							)}
						</div>
					</div>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
						<div className="app-search d-none d-lg-block">
							<form>
								<div
									className="input-group"
									style={{
										backgroundColor: 'rgba(255, 255, 255, 0.8)',
										borderRadius: '10px',
										border: '1px solid rgba(0, 0, 0, 0.1)',
									}}>
									<input
										type="search"
										className="form-control"
										placeholder="Search Attributes here..."
										value={searchTerm}
										onChange={handleSearch}
										style={{
											backgroundColor: 'transparent',
											border: 'none',
											paddingLeft: '10px',
											color: '#333',
										}}
									/>
									<span
										className="ri-search-line search-icon text-muted"
										style={{ marginRight: '10px', color: '#666' }}
									/>
								</div>
							</form>
						</div>
						<Form.Select
							value={itemsPerPage}
							style={{ zIndex: 1 }}
							onChange={(e) => setItemsPerPage(Number(e.target.value))}
							className="w-auto mt-3 mt-lg-0">
							<option value={15}>15 items</option>
							<option value={30}>30 items</option>
							<option value={40}>40 items</option>
						</Form.Select>
					</div>
				</Card.Header>
				<Card.Body>
					<div className="table-responsive-sm">
						<Table className="table-striped table-centered mb-0">
							<thead>
								<tr>
									<th>
										<input
											type="checkbox"
											onChange={handleSelectAll}
											checked={selectAll}
										/>
									</th>
									<th>
										<span onClick={handleSort} style={{ cursor: 'pointer' }}>
											Attribute Name {sortedAsc ? '↑' : '↓'}
										</span>
									</th>
									<th>Value</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<TableRowSkeleton headers={categoryHeaders} rowCount={6} />
								) :
									paginatedRecords.length > 0 ? (
										paginatedRecords.map((record, idx) => {
											const isSelected = selectedRows.includes(record._id)
											return (
												<tr key={idx}>
													<td>
														<input
															type="checkbox"
															checked={isSelected}
															onChange={() => handleSelectRow(record._id)}
														/>
													</td>
													<td>{record.variantName.name}</td>
													<td>{record.value}</td>
													<td>
														<div className="d-flex">
															<Button
																variant="secondary"
																disabled={!canUpdate}
																onClick={() => toggleEditModal(record)}>
																<MdEdit />
															</Button>
															<Button
																variant="danger"
																className="ms-2"
																onClick={() =>
																	handleDeleteConfirmation(record._id.toString())
																}
																disabled={!canDelete}>
																<MdDelete />
															</Button>
														</div>
													</td>
												</tr>
											)
										})
									) : (
										<tr>
											<td colSpan={4} className="text-center">
												No product attribute found
											</td>
										</tr>
									)}
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
					</div>
				</Card.Body>
			</Card>

			<Modal
				show={isOpen}
				onHide={handleToggleModal}
				dialogClassName="modal-dialog-centered">
				<Modal.Header closeButton>
					<Modal.Title>
						{editingVariant ? 'Edit' : 'Add New'} Product Attribute
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form
						onSubmit={handleSubmit(
							editingVariant
								? handleUpdateProductVariant
								: handleAddProductVariant
						)}>
						<Form.Group className="mb-3">
							<Form.Label>Attribute Name</Form.Label>
							<Form.Select
								{...register('variantName', {
									required: 'Attribute name is required',
								})}
								isInvalid={!!errors.variantName}>
								<option value="">Select Attribute Name</option>
								{variantNames.map((variant) => (
									<option key={variant._id} value={variant._id}>
										{variant.name}
									</option>
								))}
							</Form.Select>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Attribute Values</Form.Label>
							<div className="d-flex">
								<Form.Control
									type="text"
									placeholder="Enter a value"
									value={inputValue}
									onChange={(e) => setInputValue(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault()
											handleAddVariantValue()
										}
									}}
								/>
								<Button
									variant="success"
									onClick={handleAddVariantValue}
									className="ms-2">
									+
								</Button>
							</div>
							{/* Add helper text */}
							<small className="text-muted mt-1 d-block">
								Enter value and click '+' button to add multiple values
							</small>
							<div className="selected-values mt-2">
								{variantValues.map((value, index) => (
									<span key={index} className="badge bg-primary me-1">
										{value}
										<button
											type="button"
											className="btn-close ms-1"
											onClick={() => handleRemoveVariantValue(value)}></button>
									</span>
								))}
							</div>
						</Form.Group>
						<Modal.Footer>
							<Button variant="light" onClick={handleToggleModal}>
								Close
							</Button>
							<Button
								variant="soft-success"
								type="submit"
								disabled={editingVariant ? !canUpdate : !canCreate}>
								{apiLoading
									? editingVariant
										? 'Updating...'
										: 'Adding...'
									: editingVariant
										? 'Update Attribute'
										: 'Save Attribute'}
							</Button>
						</Modal.Footer>
					</Form>
				</Modal.Body>
			</Modal>
			<Variations refreshProductVariants={getAllProductVariants} />
		</>
	)
}

export default ProductVarations
