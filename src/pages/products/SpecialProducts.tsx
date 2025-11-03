import { PageBreadcrumb } from '@/components'
import {
	Button,
	Card,
	Form,
	Table,
	Pagination as BootstrapPagination,
} from 'react-bootstrap'
import { useEffect, useRef, useState } from 'react'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { Link } from 'react-router-dom'
import { TableRowSkeleton } from '../other/SimpleLoader'
import {
	Offcanvas as BootstrapOffcanvas // Add this
} from 'react-bootstrap'
import { MdRemoveRedEye } from 'react-icons/md'
import { RiCloseLine } from 'react-icons/ri'
import BulkEditModal from './BulkEditModal'
import ProductUpdateModalSpecial from './ProductUpdateModalSpecial'
import { BASE_CITY } from '@/constants'
import axios from 'axios'

// basic tables
interface TableRecord {
	_id: string
	name: string
	brandId: string
	description: string
	isBestSeller: boolean
	prices: any
	specialCategory: any
	subcategory: any
	videoLink?: string // Optional if not always provided
	variants: Array<any> // Specify the type for the variants if known
	status: 'active' | 'discontinued' | 'upcoming' | 'archived'
	releaseDate: Date // Ensure the date is handled appropriately
	sku: string
	image: File // Ensure File type is correct based on how it's used
	gallery: File[] // Array of File objects
	brand?: any
	isOutOfStock?: any
	tags?: any
	image_alt_text?: string
	currency?: string
	isShopByPet?: boolean
	isNewArrival?: boolean
	inventory?: any
	createdAt?: any
	updatedAt?: any
	meta_title?: string
	meta_description?: string
	subsubcategory?: any
	type: any
	isServiceProduct?: boolean
}

const SpecialsProducts = () => {
	//  **************************** states **************************************
	const [selectedRows, setSelectedRows] = useState<any[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(15)
	const [sortedAsc, setSortedAsc] = useState(true)
	const [showDeleteButton, setShowDeleteButton] = useState(false)
	const [productData, setProductData] = useState<TableRecord[]>([])
	const [loading, setLoading] = useState(false)
	const [showProductDetails, setShowProductDetails] = useState(false)
	const [selectedProductId, setSelectedProductId] = useState<string>('')
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [selectionType, setSelectionType] = useState<'all' | 'page' | null>(null)
	const [showBulkEditModal, setShowBulkEditModal] = useState(false)
	const [isExporting, setIsExporting] = useState(false)

	//  *************************** hooks & basics **************************************

	const BASE_API = import.meta.env.VITE_BASE_API
	const { isSuperUser, permissions, user } = useAuthContext()
	// const canUpdate = isSuperUser || permissions.Users?.Update
	const canDelete = isSuperUser || permissions.Users?.Delete
	const { token } = user

	// ******************************** handle functions ***************************************
	const handleUpdateClick = (productId: string) => {
		setSelectedProductId(productId)
		setShowUpdateModal(true)
	}
	const filteredRecords = productData
		.filter((record) =>
			record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			record.sku.toLowerCase().includes(searchTerm.toLowerCase())
		)
		.sort((a, b) =>
			sortedAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
		)


	const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)

	const paginatedRecords = filteredRecords?.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)


	const handleDeleteSelected = () => {
		const itemCount = selectionType === 'all' ? productData.length : selectedRows.length

		Swal.fire({
			title: 'Are you sure?',
			text: `${itemCount} items will be deleted!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete them!'
		}).then((result) => {
			if (result.isConfirmed) {
				deleteProduct(selectedRows)
				setSelectionType(null)
				setSelectedRows([])
			}
		})
	}

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			Swal.fire({
				title: 'Select Items',
				text: 'Would you like to select all items or just items on this page?',
				icon: 'question',
				showDenyButton: true,
				showCancelButton: true,
				confirmButtonText: 'All Items',
				denyButtonText: 'Current Page',
				cancelButtonText: 'Cancel'
			}).then((result) => {
				if (result.isConfirmed) {
					// Select all items
					setSelectedRows(productData.map(product => product._id))
				} else if (result.isDenied) {
					// Select current page items only
					setSelectedRows(paginatedRecords.map(product => product._id))
				}
			})
		} else {
			setSelectedRows([])
		}
	}

	const handleSelectRow = (id: number) => {
		setSelectedRows((prev) =>
			prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
		)
	}
	const handleDeleteConfirmation = (userId: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'This Item will be deleted!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Remove!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteProduct(userId)
			}
		})
	}
	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
	}

	const handleSort = () => {
		setSortedAsc(!sortedAsc)
	}


	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}
	const handleViewProduct = (productId: string) => {
		setSelectedProductId(productId)
		setShowProductDetails(true)
	}

	// ******************************** post api calls ***************************************

	const deleteProduct = async (productId: any) => {
		try {
			const id_select = typeof productId === 'string' ? [productId] : productId
			const response = await fetch(`${BASE_API}/api/special-products/bulk-delete`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ productIds: id_select }),
			})
			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to delete product')
			}
			getAllProducts()
			Swal.fire({
				title: 'Deleted!',
				text: 'Product deleted successfully.',
				icon: 'success',
				timer: 1500,
			})
			// You can update the state or perform any other necessary actions
		} catch (error: any) {
			console.error('Error deleting product:', error)
			Swal.fire({
				title: 'Oops!',
				text: error.message,
				icon: 'error',
				timer: 1500,
			})
		}
	}
	const handleExportProducts = async () => {
		setIsExporting(true)
		try {
			const response = await fetch(`${BASE_API}/api/csv-upload/export/special`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'SpecialProducts.csv'
			a.click()
		} catch (error) {
			console.error('Error exporting products:', error)
		} finally {
			setIsExporting(false)
		}
	}
	const [isImporting, setIsImporting] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)


	
	const handleImportProducts = () => {
		fileInputRef.current?.click()
	}

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		if (!file.name.endsWith('.csv')) {
			Swal.fire({
				title: 'Error',
				text: 'Please upload a CSV file',
				icon: 'error',
				timer: 1500,
			})
			return
		}

		const formData = new FormData()
		formData.append('csvFile', file)

		try {
			setIsImporting(true)
			const response = await fetch(`${BASE_API}/api/bulk-products/import`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			})

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to import products')
			}

			const result = await response.json()
			console.log(result)
			Swal.fire({
				title: 'Success!',
				text: 'Products imported successfully!',
				icon: 'success',
				timer: 1500,
			})
			getAllProducts()
		} catch (error: any) {
			console.error('Error importing products:', error)
			Swal.fire({
				title: 'Error',
				text: error.message || 'Failed to import products',
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setIsImporting(false)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		}
	}
	const [templateFile, setTemplateFile] = useState(false)
	const handleTemplateFileChange = async () => {
	  try{
		setTemplateFile(true)
		const encodedToken = encodeURIComponent(token)
		const response = await axios.get(`${BASE_API}/api/bulk-other-products/template`, {
			headers: {
				Authorization: `Bearer ${encodedToken}`,
			},
		})
		const blob = new Blob([response.data], { type: 'text/csv' })
		const url = window.URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'other-products-template.csv'
		a.click()
		setTemplateFile(false)
	  } catch (error) {
		console.error('Error getting template file:', error)
	  } finally {
		setTemplateFile(false)
	  }
	}
	
	// *********************************** data come from api *******************************************
	
	const getAllProducts = async () => {
		try {
			setLoading(true)
			const url = BASE_CITY
				? `${BASE_API}/api/special-products?city=${BASE_CITY}`
				: `${BASE_API}/api/special-products`;

			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to get products')
			}

			const data_res = await response.json()
			if (data_res) {
				setProductData(data_res)
			}
		} catch (error: any) {
			console.error('Error get data of product:', error)
		} finally {
			setLoading(false)
		}
	}
	useEffect(() => {
		getAllProducts()
	}, [])

	useEffect(() => {
		setShowDeleteButton(selectedRows.length > 0)
	}, [selectedRows])

	useEffect(() => {
		setCurrentPage(1)
	}, [itemsPerPage])



	// **************************************** render ***************************************************
	const warehouseHeaders: any[] = [
		{ width: '20px', type: 'checkbox' },
		{ width: '100px', type: 'text' },
		{ width: '100px', type: 'text' },
		{ width: '80px', type: 'number' },
		{ width: '80px', type: 'number' },
		{ width: '80px', type: 'date' },
		{ width: '80px', type: 'date' },
		{ width: '100px', type: 'actions' }
	]

	return (
		<>
			<PageBreadcrumb title="Special Products Management" subName="Products" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div className="mb-3 mb-lg-0">
							<h4 className="header-title">Special Product Management</h4>
							<p className="text-muted mb-0">
								Add and Manage your all Special Product here.
							</p>
						</div>
						<div className="d-flex flex-column flex-lg-row gap-2">
						<Button
						   style={{ backgroundColor: 'orange', border: 'none' }}
								className="d-flex align-items-center justify-content-center"
								onClick={handleTemplateFileChange}
								disabled={templateFile}
							>
								{templateFile ? (
									<>
										<span className="spinner-border spinner-border-sm me-1" role="status" />
										Template...
									</>
								) : (
									<>
										<i className="ri-download-2-line me-1"></i>
										Template
									</>
								)}
							</Button>								<Button
								className="d-flex align-items-center justify-content-center"
								onClick={handleImportProducts}
								style={{ backgroundColor: 'red', border: 'none' }}
								disabled={isImporting}
							>
								{isImporting ? (
									<>
										<span className="spinner-border spinner-border-sm me-1" role="status" />
										Importing...
									</>
								) : (
									<>
										<i className="ri-upload-2-line me-1"></i>
										Import Products
									</>
								)}
							</Button>
						<Button
								className="d-flex align-items-center justify-content-center"
								onClick={handleExportProducts}
								disabled={isExporting}
							>
								{isExporting ? (
									<>
										<span className="spinner-border spinner-border-sm me-1" role="status" />
										Downloading...
									</>
								) : (
									<>
										<i className="ri-download-2-line me-1"></i>
										Export Products
									</>
								)}
							</Button>
							<Link to="/products/add-special-product" className="btn btn-success d-flex align-items-center justify-content-center">
								<i className="bi bi-plus me-2"></i> Add New Special Product
							</Link>
							{showDeleteButton && (
								<div className="d-flex gap-2">
									<Button
										variant="danger"
										className="d-flex align-items-center justify-content-center"
										onClick={handleDeleteSelected}>
										<MdDelete className="me-2" />
										Delete {selectionType === 'all' ? 'All' : selectedRows.length} Selected
										{selectionType === 'all' && (
											<span className="badge bg-light text-dark ms-2">
												Total: {productData.length}
											</span>
										)}
									</Button>
									<Button
										variant="light"
										className="d-flex align-items-center justify-content-center"
										onClick={() => {
											setSelectedRows([])
											setSelectionType(null)
										}}>
										<RiCloseLine className="me-2" />
										Clear Selection
									</Button>
								</div>
							)}


						</div>
					</div>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
						<div className="app-search ">
							<form>
								<div className="input-group" style={{
									backgroundColor: 'rgba(255, 255, 255, 0.8)',
									borderRadius: '10px',
									border: '1px solid rgba(0, 0, 0, 0.1)',
								}}>
									<input
										type="search"
										className="form-control"
										placeholder="Search Product here..."
										value={searchTerm}
										onChange={handleSearch}
										style={{
											backgroundColor: 'transparent',
											border: 'none',
											paddingLeft: '10px',
											color: '#333',
										}}
									/>
									<span className="ri-search-line search-icon text-muted"
										style={{ marginRight: '10px', color: '#666' }}
									/>
								</div>
							</form>
						</div>
						{/* {showDeleteButton && (
							<div className="d-flex gap-2">
								<Button
									variant="primary"
									className="d-flex align-items-center justify-content-center"
									onClick={() => setShowBulkEditModal(true)}>
									<MdEdit className="me-2" />
									Bulk Edit ({selectedRows.length})
								</Button>
							</div>
						)} */}
						<div className="d-flex flex-column flex-lg-row gap-2">

							{/* <Form.Select
								value={selectedCity}
								onChange={(e) => setSelectedCity(e.target.value)} style={{ zIndex: 1 }}>
								{cities.map((city) => (
									<option key={city._id} value={city._id}>
										{city.name}
									</option>
								))}
							</Form.Select> */}
							<Form.Select
								value={itemsPerPage}
								onChange={(e) => {
									setItemsPerPage(Number(e.target.value))
									setCurrentPage(1)
								}} style={{ zIndex: 1 }}>
								<option value={15}>15 items</option>
								<option value={30}>30 items</option>
								<option value={40}>40 items</option>
							</Form.Select>
						</div>
					</div>
				</Card.Header>
				<Card.Body>
					<div className="table-responsive-sm">
						<Table responsive className="table-striped table-centered mb-0">
							<thead>
								<tr>
									<th>
										<input
											type="checkbox"
											onChange={handleSelectAll}
											checked={selectedRows.length > 0 &&
												(selectionType === 'all' ||
													(selectionType === 'page' &&
														selectedRows?.length === paginatedRecords?.length))}
											style={{ cursor: 'pointer' }}
										/>
										{selectedRows?.length > 0 && (
											<span className="ms-2 text-muted small">
												{selectionType === 'all' ? 'All Selected' : `${selectedRows?.length} Selected`}
											</span>
										)}
									</th>

									<th>Image</th>
									<th>
										<span onClick={handleSort} style={{ cursor: 'pointer' }}>
											Product Name {sortedAsc ? '↑' : '↓'}
										</span>
									</th>
									<th>Price</th>
									<th>SKU</th>
									<th>Status</th>
									<th>Type</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<TableRowSkeleton headers={warehouseHeaders} rowCount={6} />
								) : paginatedRecords?.length > 0 ? (
									paginatedRecords?.map((record: any, idx) => {
										const isSelected = selectedRows.includes(record._id)

										return (
											<tr key={idx}>
												<td>
													<input
														type="checkbox"
														checked={isSelected}
														onChange={() => handleSelectRow(record._id)}
														style={{ cursor: 'pointer' }}
													/>
												</td>
												<td className="table-user">
													{record?.image ? (
														<img
															src={`${BASE_API}${record?.image}`}
															alt="product"
															// className="me-2 rounded-circle"
															className="fs-14 avatar-md"
														/>
													) : (
														''
													)}
												</td>
												<td>{record?.name}</td>
												<td>{record?.prices[0]?.amount}</td>
												<td>{record?.sku}</td>
												<td>{record?.status}</td>
												<td>{record?.type?.charAt(0).toUpperCase() + record?.type?.slice(1)}</td>


												<td>
													<div className="d-flex">
														<Button
															variant="info"
															className="me-2"
															onClick={() => handleViewProduct(record?._id)}>
															<MdRemoveRedEye />
														</Button>
														<Button
															variant="secondary"
															className="me-2"
															onClick={() => handleUpdateClick(record?._id)}>
															<MdEdit />
														</Button>
														<Button
															variant="danger"
															className="me-1"
															onClick={() =>
																handleDeleteConfirmation(record?._id.toString())
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
										<td colSpan={8} className="text-center">
											No records found
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
			
			{/* Hidden file input for CSV import */}
			<input
				type="file"
				accept=".csv"
				ref={fileInputRef}
				style={{ display: 'none' }}
				onChange={handleFileChange}
			/>
			
			<BootstrapOffcanvas
				show={showProductDetails}
				onHide={() => setShowProductDetails(false)}
				placement="end"
				className="offcanvas-end">
				<BootstrapOffcanvas.Header closeButton>
					<BootstrapOffcanvas.Title>Product Details</BootstrapOffcanvas.Title>
				</BootstrapOffcanvas.Header>
				<BootstrapOffcanvas.Body>
					{(() => {
						const selectedProduct = productData?.find(product => product?._id === selectedProductId);
						if (!selectedProduct) return null;

						return (
							<div className="product-details">
								{/* Hero Section */}
								<div className="position-relative mb-4">
									<div className="text-center">
										<img
											src={`${BASE_API}${selectedProduct?.image}`}
											alt={"Product"}
											className="img-fluid rounded-3 shadow"
											style={{ maxHeight: '300px', objectFit: 'cover', width: '100%' }}
										/>
									</div>
									<div className="position-absolute top-0 end-0 p-3 d-flex gap-2">
										<span className={`badge ${selectedProduct?.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
											{selectedProduct?.status}
										</span>
									</div>
								</div>

								{/* Basic Info Section */}
								<div className="card shadow-sm mb-4">
									<div className="card-body">
										<h4 className="fw-bold mb-2">{selectedProduct?.name}</h4>
										<div className="d-flex justify-content-between align-items-center mb-3">
											<span className="text-muted">SKU: {selectedProduct?.sku}</span>
											<div className="d-flex gap-2">
												<span className="badge bg-primary fs-6">
													{selectedProduct.currency} {selectedProduct?.prices[0]?.amount}
												</span>
												{selectedProduct?.prices[0]?.salePrice && (
													<span className="badge bg-danger fs-6">
														Sale: {selectedProduct?.prices[0]?.salePrice}
													</span>
												)}
											</div>
										</div>
									</div>
								</div>


								{/* Categories Section */}
								<div className="card shadow-sm mb-4">
									<div className="card-body">
										<h5 className="fw-bold mb-3">Categories</h5>
										<div className="row g-3">
											<div className="col-md-12">
												<div className="p-3 bg-light rounded-3">
													<div className="small text-muted">Categories</div>
													<div className="fw-medium">
														{selectedProduct?.specialCategory?.name}
													</div>
												</div>
											</div>
										</div>
										<div className="row g-3">
											<div className="col-md-12">
												<div className="p-3 bg-light rounded-3">
													<div className="small text-muted">Type</div>
													<div className="fw-medium">
														{selectedProduct?.type}
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>




								{/* Description */}
								<div className="card shadow-sm mb-4">
									<div className="card-body">
										<h5 className="fw-bold mb-3">Description</h5>
										<div className="bg-light p-3 rounded-3">
											<div dangerouslySetInnerHTML={{ __html: selectedProduct?.description || '' }} />
										</div>
									</div>
								</div>

								{/* Gallery */}
								{selectedProduct?.gallery && selectedProduct?.gallery.length > 0 && (
									<div className="card shadow-sm mb-4">
										<div className="card-body">
											<h5 className="fw-bold mb-3">Gallery</h5>
											<div className="row g-2">
												{selectedProduct.gallery.map((image: any, index: number) => (
													<div className="col-4" key={index}>
														<img
															src={`${BASE_API}${image}`}
															alt={`Gallery ${index + 1}`}
															className="img-fluid rounded-3 shadow-sm hover-zoom"
															style={{
																height: '100px',
																width: '100%',
																objectFit: 'cover',
																cursor: 'pointer',
																transition: 'transform 0.2s'
															}}
														/>
													</div>
												))}
											</div>
										</div>
									</div>
								)}


								{/* Timestamps */}
								<div className="card shadow-sm mb-4">
									<div className="card-body">
										<h5 className="fw-bold mb-3">Timestamps</h5>
										<div className="row g-3">
											<div className="col-6">
												<div className="p-3 bg-light rounded-3">
													<div className="small text-muted">Created At</div>
													<div className="fw-medium">
														{new Date(selectedProduct.createdAt).toLocaleString()}
													</div>
												</div>
											</div>
											<div className="col-6">
												<div className="p-3 bg-light rounded-3">
													<div className="small text-muted">Last Updated</div>
													<div className="fw-medium">
														{new Date(selectedProduct.updatedAt).toLocaleString()}
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						);
					})()}
				</BootstrapOffcanvas.Body>
			</BootstrapOffcanvas>



			<ProductUpdateModalSpecial
				show={showUpdateModal}
				onHide={() => setShowUpdateModal(false)}
				productId={selectedProductId}
				onUpdate={() => {
					getAllProducts() // Refresh the list after update
				}}
			/>

			<BulkEditModal
				show={showBulkEditModal}
				onHide={() => setShowBulkEditModal(false)}
				selectedProducts={selectedRows}
				token={token}
				BASE_API={BASE_API}
				onSuccess={() => {
					getAllProducts()
					setShowBulkEditModal(false)
					setSelectedRows([])
				}}
			/>
		</>
	)
}
export default SpecialsProducts
