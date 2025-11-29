import { FormInput, PageBreadcrumb } from '@/components'
import {
	Button,
	Card,
	Form,
	Table,
	Pagination as BootstrapPagination,
	Modal,
	Row,	
	Col,
} from 'react-bootstrap'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import { TableRowSkeleton } from '../other/SimpleLoader'
import { useEffect, useRef, useState } from 'react'
import { FaFileCsv } from 'react-icons/fa6'
import { BASE_CITY } from '@/constants'
import { toastService } from '@/common/context/toast.service'
import Select from 'react-select'
import { Controller } from 'react-hook-form'

interface TableRecord {
	_id: string
	product: { _id: string; name: string; sku: string }
	warehouse: {
		_id: string
		name: string
		location: string
		capacity: number
		isActive: boolean
		description: string
		createdAt: string
		updatedAt: string
		isMain: boolean
	} | null
	city: { _id: string; name: string; __v: number }
	productType: any
	quantity: number
	stockAlertThreshold: number
	locationWithinWarehouse: string
	lastRestocked: string
	batchId: string
	expiryDate: string
	expiryDateThreshold: number
	barcode: string
	vat: number
	createdAt: string
	updatedAt: string
	__v: number
}

interface InventoryFormValues {
	product: string
	warehouse: string
	quantity: number
	stockAlertThreshold: number
	locationWithinWarehouse: string
	batchId: string
	expiryDate: string
	barcode: string
	vat: number
	expiryDateThreshold: number
}

const AllInventory = () => {
	const { isSuperUser, permissions, user } = useAuthContext()
	const canUpdate = isSuperUser || permissions.Inventory?.Update
	const canDelete = isSuperUser || permissions.Inventory?.Delete
	const canCreate = isSuperUser || permissions.Inventory?.Create

	const [selectedRows, setSelectedRows] = useState<any[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(15)
	const [showDeleteButton, setShowDeleteButton] = useState(false)
	const [loading, setLoading] = useState(false)
	const [apiLoading, setApiLoading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [inventoryData, setInventoryData] = useState<TableRecord[]>([])
	const [warehouses, setWarehouses] = useState<any>([])
	const [productSearchTerm, setProductSearchTerm] = useState('')
	const [productSuggestions, setProductSuggestions] = useState<any>([])
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [isOpen, toggleModal] = useToggle()
	const [editingSubCategory, setEditingSubCategory] =
		useState<TableRecord | null>(null)
	// const [showCityModal, setShowCityModal] = useState(false)
	const [showWarehouseModal, setShowWarehouseModal] = useState(false)
	const [productType, setProductType] = useState('Product') // Default to regular product
	// const toggleCityModal = () => setShowCityModal(!showCityModal)
	const toggleWarehouseModal = () => setShowWarehouseModal(!showWarehouseModal)
	const [selectedCity, setSelectedCity] = useState<string>('')
	const [filterType, setFilterType] = useState('All')
	const [showUploadModal, setShowUploadModal] = useState(false)
	const [uploadProgress, setUploadProgress] = useState(0)

	const [isExporting, setIsExporting] = useState(false)
	// *********************** basics **********************
	const BASE_API = import.meta.env.VITE_BASE_API
	const token = user.token
	const {
		handleSubmit,
		register,
		control,
		reset,
		setValue,
		formState: { errors },
	} = useForm<InventoryFormValues>({
		 defaultValues: {
    	 warehouse: '',
	}, 
	})

	//  ************************* handle functions &***********************
	const handleDeleteSelected = () => {
		Swal.fire({
			title: 'Are you sure?',
			text: `${selectedRows.length} selected items will be deleted!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete them!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteInventoryItems(selectedRows)
			}
		})
	}
	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			// Select all records from current page only
			const currentPageIds = paginatedRecords.map((record) => record._id)
			setSelectedRows(currentPageIds)
		} else {
			setSelectedRows([])
		}
	}
	const handleSelectRow = (id: string) => {
		setSelectedRows((prev) =>
			prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
		)
	}
	const handleDeleteConfirmation = (id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'This item will be deleted!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteInventoryItems([id])
			}
		})
	}
	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
	}
	const filteredRecords = inventoryData
		?.filter((record) => {
			// Search by SKU, product name, and warehouse name
			const matchesSearch =
				record?.product?.sku
					?.toLowerCase()
					.includes(searchTerm?.toLowerCase()) ||
				record?.product?.name
					?.toLowerCase()
					.includes(searchTerm?.toLowerCase()) ||
				record?.warehouse?.name
					?.toLowerCase()
					.includes(searchTerm?.toLowerCase())

			// Filter by city if selected
			const matchesCity = selectedCity
				? record?.city?._id === selectedCity
				: true

			// Filter by product type
			if (filterType !== 'All' && record?.productType !== filterType) {
				return false
			}

			return matchesSearch && matchesCity
		})
		.sort((a, b) => a?.product?.sku?.localeCompare(b?.product?.sku))

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}
	const totalPages = Math.ceil(filteredRecords?.length / itemsPerPage)
	const paginatedRecords = filteredRecords?.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)
	const toggleEditModal = (inventory: TableRecord) => {
		setEditingSubCategory(inventory)
		setValue('product', inventory.product._id)
		setProductSearchTerm(inventory.product.name)
		setValue('warehouse', inventory.warehouse?._id || "")
		setValue('quantity', inventory.quantity)
		setValue('locationWithinWarehouse', inventory.locationWithinWarehouse || '')
		setValue('batchId', inventory.batchId || '')
		setValue(
			'expiryDate',
			inventory.expiryDate
				? new Date(inventory.expiryDate).toISOString().split('T')[0]
				: ''
		)
		setValue('barcode', inventory.barcode || '')
		setValue('vat', inventory.vat)
		setValue('stockAlertThreshold', inventory.stockAlertThreshold)
		setValue('expiryDateThreshold', inventory.expiryDateThreshold)
		setProductType(inventory.productType || 'Product')
		toggleModal()
	}
	const getRowStyle = (record: TableRecord) => {
		if (record?.quantity <= record?.stockAlertThreshold) {
			return { backgroundColor: 'rgba(255, 92, 92, 0.1)' } // Light red background
		}
		return {}
	}

	//  ************************ APIS funtions *************************
	const deleteInventoryItems = async (ids: string[]) => {
		try {
			setApiLoading(true)
			const response = await fetch(`${BASE_API}/api/inventory/bulk-delete`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ ids }),
			})

			if (!response.ok) {
				throw new Error('Failed to delete inventory items')
			}

			Swal.fire({
				title: 'Deleted!',
				text: `${ids.length} item${ids.length > 1 ? 's' : ''} deleted successfully.`,
				icon: 'success',
				timer: 1500,
			})

			getAllInventory()
			setSelectedRows([])
		} catch (error: any) {
			Swal.fire({
				title: 'Error!',
				text: error.message || 'Failed to delete items',
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setApiLoading(false)
		}
	}
	const handleAddInventory = async (inventoryData: any) => {
		try {
			setApiLoading(true)
			const response = await fetch(`${BASE_API}/api/inventory`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					product: inventoryData.product,
					warehouse: inventoryData.warehouse,
					quantity: Number(inventoryData.quantity),
					locationWithinWarehouse: inventoryData.locationWithinWarehouse,
					batchId: inventoryData.batchId,
					expiryDate: inventoryData.expiryDate,
					barcode: inventoryData.barcode,
					vat: Number(inventoryData.vat),
					stockAlertThreshold: Number(inventoryData.stockAlertThreshold),
					city: selectedCity,
					expiryDateThreshold: Number(inventoryData.expiryDateThreshold),
					productType: productType,
				}),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to add inventory')
			}

			await response.json()
			Swal.fire({
				title: 'Success',
				text: 'Inventory added successfully',
				icon: 'success',
				timer: 1500,
			})
			toggleModal()
			getAllInventory()
		} catch (error: any) {
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
	const handleUpdateInventory = async (formData: any) => {
		try {
			setApiLoading(true)
			const updateData = {
				...formData,
				city: selectedCity,
				warehouse: formData.warehouse || null,
				productType: productType,
			}
			const response = await fetch(
				`${BASE_API}/api/inventory/${editingSubCategory?._id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(updateData),
				}
			)

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to update inventory')
			}

			Swal.fire({
				title: 'Success',
				text: 'Inventory updated successfully',
				icon: 'success',
				timer: 1500,
			})

			getAllInventory()
			toggleModal()
			reset()
			setEditingSubCategory(null)
		} catch (error: any) {
			Swal.fire({
				title: 'Error',
				text: error.message || 'Failed to update inventory',
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setApiLoading(false)
		}
	}
	const getWarehouses = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/warehouses`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (response.ok) {
				const data = await response.json()
				setWarehouses(data)
			}
		} catch (error) {
			console.error('Error fetching warehouses:', error)
		}
	}
	const handleProductSearch = async (searchTerm: string) => {
		setProductSearchTerm(searchTerm)
		if (searchTerm.length < 3) {
			setShowSuggestions(false)
			return
		}

		try {
			// Change the endpoint based on the product type
			const endpoint =
				productType === 'SpecialProduct'
					? `${BASE_API}/api/special-products/search?query=${encodeURIComponent(searchTerm)}`
					: `${BASE_API}/api/products/search?search=${encodeURIComponent(searchTerm)}`

			const response = await fetch(endpoint, {
				method: 'GET',
				headers: { Authorization: `Bearer ${token}` },
			})

			if (response.ok) {
				const data = await response.json()
				console.log('product data', data)

				const filteredSuggestions = data.filter(
					(product: any) =>
						product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
						(product.sku &&
							product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
				)

				setProductSuggestions(filteredSuggestions)
				setShowSuggestions(filteredSuggestions.length > 0)
			}
		} catch (error) {
			console.error('Error fetching product suggestions:', error)
		}
	}
	
	const getAllInventory = async () => {
		try {
			setLoading(true)
			const response = await fetch(`${BASE_API}/api/inventory`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (response.ok) {
				const data = await response.json()
				setInventoryData(data)
			}
		} catch (error) {
			console.error('Error fetching inventory:', error)
		} finally {
			setLoading(false)
		}
	}
	// const handleDownloadTemplate = async () => {
	//     try {
	//         const response = await fetch(
	//             `${BASE_API}/api/inventory/sample-csv`,
	//             {
	//                 method: 'GET',
	//                 headers: {
	//                     Authorization: `Bearer ${token}`,
	//                 },
	//             }
	//         )

	//         if (!response.ok) throw new Error('Failed to download template')

	//         const blob = await response.blob()
	//         const url = window.URL.createObjectURL(blob)
	//         const a = document.createElement('a')
	//         a.href = url
	//         a.download = 'inventory-template.csv'
	//         document.body.appendChild(a)
	//         a.click()
	//         document.body.removeChild(a)
	//         window.URL.revokeObjectURL(url)
	//     } catch (error) {
	//         Swal.fire({
	//             title: 'Error',
	//             text: 'Failed to download template',
	//             icon: 'error',
	//             timer: 1500,
	//         })
	//     }
	// }
	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0]
		if (!file) return

		if (!file.name.endsWith('.csv')) {
			toastService.error('Please upload a CSV file')
			return
		}

		// Show warning confirmation dialog
		const result = await Swal.fire({
			title: 'Important Warning!',
			html: `
            <div class="text-left">
                <ul>
                    <li>This will update all inventory data</li>
                    <li>Missing items will be removed</li>
                    <li>All quantities will be replaced</li>
                </ul>
                <p class="mt-2">Please ensure your CSV data is complete and accurate.</p>
            </div>
        `,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, Upload CSV',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#d33',
			reverseButtons: true,
		})

		if (!result.isConfirmed) {
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
			return
		}

		const formData = new FormData()
		formData.append('csv', file)

		try {
			setApiLoading(true)
			setShowUploadModal(true)

			const progressInterval = setInterval(() => {
				setUploadProgress((prev) => {
					if (prev >= 90) {
						clearInterval(progressInterval)
						return 90
					}
					return prev + 10
				})
			}, 1000)

			const response = await fetch(`${BASE_API}/api/inventory/bulk-upload`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			})

			clearInterval(progressInterval)
			setUploadProgress(100)

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to upload inventory')
			}

			const response_data = await response.json()

			if (response_data.skipped > 0) {
				Swal.fire({
					title: 'Upload Complete!',
					html: `
                    <div class="text-left">
                        <p>✅ ${response_data.created} inventory items created successfully</p>
                        <p>ℹ️ ${response_data.skipped} inventory items skipped</p>
                    </div>
                    `,
					icon: 'success',
					confirmButtonText: 'Great!',
				})
			} else {
				Swal.fire({
					title: 'Success',
					text: 'Inventory uploaded successfully',
					icon: 'success',
					timer: 1500,
				})
			}

			getAllInventory()
		} catch (error: any) {
			Swal.fire({
				title: 'Error',
				text: error.message || 'Failed to upload inventory',
				icon: 'error',
				timer: 1500,
			})
		} finally {
			setApiLoading(false)
			setShowUploadModal(false)
			setUploadProgress(0)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		}
	}

	const handleAddWarehouse = async (warehouseData: any) => {
		setApiLoading(true)
		try {
			const response = await fetch(`${BASE_API}/api/warehouses`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					name: warehouseData.name,
					location: warehouseData.location,
					capacity: parseInt(warehouseData.capacity),
					description: warehouseData.description,
					initialBalance: parseFloat(warehouseData.initialBalance),
				}),
			})

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to Add Store')
			}

			const data_res = await response.json()
			if (data_res) {
				Swal.fire({
					title: 'ADDED!',
					text: 'Store added successfully!',
					icon: 'success',
					confirmButtonText: 'OK',
					timer: 1500,
				})
				getWarehouses()
				toggleWarehouseModal()
				reset()
			}
		} catch (error: any) {
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
	const handleExportProducts = async () => {
		setIsExporting(true)
		try {
			const response = await fetch(
				`${BASE_API}/api/csv-upload/export/inventory`,
				{ headers: { Authorization: `Bearer ${token}` } }
			)
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'mainproducts.csv'
			a.click()
		} catch (error) {
			console.error('Error exporting products:', error)
		} finally {
			setIsExporting(false)
		}
	}
	// useEffect(() => {
	//     if (inventoryData) {
	//       const filtered = inventoryData?.filter(item =>
	//         filterType ? item?.productType === filterType : true
	//       );
	//       setInventoryData(filtered);
	//     }
	//   }, [filterType]);

	useEffect(() => {
		if (BASE_CITY) {
			setSelectedCity(BASE_CITY)
		}
		getWarehouses()
		getAllInventory()
	}, [])

	useEffect(() => {
		if (!isOpen) {
			reset()
			setProductType('Product')
			setProductSearchTerm('')
			setEditingSubCategory(null)
		}
	}, [isOpen, reset])
	useEffect(() => {
		setCurrentPage(1)
		setShowDeleteButton(selectedRows.length > 0)
	}, [itemsPerPage, selectedRows])

	const warehouseHeaders: any[] = [
		{ width: '20px', type: 'checkbox' },
		{ width: '100px', type: 'text' },
		{ width: '60px', type: 'text' },
		{ width: '80px', type: 'number' },
		{ width: '80px', type: 'number' },
		{ width: '80px', type: 'number' },
		{ width: '100px', type: 'date' },
		{ width: '80px', type: 'date' },
		{ width: '80px', type: 'number' },
		{ width: '100px', type: 'actions' },
	]
	return (
		<>
			<PageBreadcrumb title="Manage Inventory" subName="Inventory" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">Inventory Management</h4>
							<p className="text-muted mb-0">
								Add and Manage your all Product Inventory here.
							</p>
						</div>
						<div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
							<Button
								className="d-flex align-items-center justify-content-center"
								onClick={handleExportProducts}
								disabled={isExporting}>
								{isExporting ? (
									<>
										<span
											className="spinner-border spinner-border-sm me-1"
											role="status"
										/>
										Downloading...
									</>
								) : (
									<>
										<i className="ri-download-2-line me-1"></i>
										Export
									</>
								)}
							</Button>
							<Button
								disabled={!canCreate || apiLoading}
								variant="primary"
								className="d-flex align-items-center mb-2 mb-sm-0"
								onClick={() => fileInputRef.current?.click()}>
								<FaFileCsv className="me-2" />
								{apiLoading ? 'Uploading...' : 'Bulk Import Inventory'}
							</Button>
							<input
								type="file"
								accept=".csv"
								ref={fileInputRef}
								style={{ display: 'none' }}
								onChange={handleFileChange}
							/>
							<Button
								disabled={!canCreate}
								style={{ border: 'none' }}
								variant="success"
								onClick={() => toggleModal()}
								className="mb-2 mb-sm-0">
								<i className="bi bi-plus"></i> Add New Inventory
							</Button>
							{showDeleteButton && (
								<Button
									variant="danger"
									className="ms-sm-2 mt-2 mt-sm-0"
									onClick={handleDeleteSelected}>
									Delete All Selected
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
										placeholder="Search Inventory..."
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
						<div className="me-3 d-flex align-items-center">
							<div
								style={{
									width: '20px',
									height: '20px',
									backgroundColor: 'rgba(255, 92, 92, 0.1)',
									border: '1px solid rgba(255, 92, 92, 0.2)',
									marginRight: '8px',
								}}
							/>
							<span>Low Stock Alert</span>
						</div>
						<div className="d-flex gap-2 align-items-center">
							<Form.Select
								onChange={(e) => setFilterType(e.target.value)}
								value={filterType}
								className="w-auto">
								<option value="All">Filter By Product Type</option>
								<option value="Product">Main Products</option>
								<option value="SpecialProduct">Special Products</option>
							</Form.Select>
							<Form.Select
								value={itemsPerPage}
								style={{ zIndex: 1 }}
								onChange={(e) => setItemsPerPage(Number(e.target.value))}
								className="w-auto">
								<option value={15}>15 items</option>
								<option value={30}>30 items</option>
								<option value={40}>40 items</option>
							</Form.Select>
						</div>
					</div>
				</Card.Header>
				<Card.Body>
					<div className="table-responsive-sm">
						<Table className="table-centered mb-0">
							<thead>
								<tr>
									<th>
										<input
											type="checkbox"
											onChange={handleSelectAll}
											checked={
												paginatedRecords.length > 0 &&
												selectedRows.length === paginatedRecords.length
											}
										/>
									</th>

									<th>Product Name</th>
									<th>SKU</th>
									<th>Store</th>
									<th>Quantity</th>
									<th>Stock Alert Threshold</th>
									<th>Last Restocked</th>
									<th>VAT (%)</th>
									<th>Expiry Date</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<TableRowSkeleton headers={warehouseHeaders} rowCount={4} />
								) : paginatedRecords.length > 0 ? (
									paginatedRecords.map((record, _idx) => {
										return (
											<tr key={_idx} style={getRowStyle(record)}>
												<td>
													<input
														type="checkbox"
														checked={selectedRows.includes(record._id)}
														onChange={() => handleSelectRow(record._id)}
													/>
												</td>
												<td>{record.product.name}</td>
												<td>{record.product.sku}</td>
												<td>{record.warehouse?.name || 'N/A'}</td>
												<td>{record.quantity}</td>
												<td>{record.stockAlertThreshold}</td>
												<td>
													{new Date(record.lastRestocked).toLocaleDateString()}
												</td>
												<td>{record.vat}%</td>
												<td>
													{new Date(record.expiryDate).toLocaleDateString()}
												</td>
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
																handleDeleteConfirmation(record._id)
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
										<td colSpan={10} className="text-center">
											No records found
										</td>
									</tr>
								)}
							</tbody>
						</Table>
						<nav className="d-flex justify-content-end mt-3">
							<BootstrapPagination className="pagination-rounded mb-0">
								<BootstrapPagination.Prev
									onClick={() =>
										currentPage > 1 && handlePageChange(currentPage - 1)
									}
								/>

								{/* Show first page if not in first set */}
								{currentPage > 2 && (
									<>
										<BootstrapPagination.Item
											onClick={() => handlePageChange(1)}>
											1
										</BootstrapPagination.Item>
										{currentPage > 3 && <BootstrapPagination.Ellipsis />}
									</>
								)}

								{/* Show 3 pages around current page */}
								{Array.from({ length: totalPages }, (_, index) => {
									const pageNumber = index + 1
									if (
										pageNumber === currentPage ||
										pageNumber === currentPage - 1 ||
										pageNumber === currentPage + 1
									) {
										return (
											<BootstrapPagination.Item
												key={pageNumber}
												active={pageNumber === currentPage}
												onClick={() => handlePageChange(pageNumber)}>
												{pageNumber}
											</BootstrapPagination.Item>
										)
									}
									return null
								})}

								{/* Show last page if not in last set */}
								{currentPage < totalPages - 1 && (
									<>
										{currentPage < totalPages - 2 && (
											<BootstrapPagination.Ellipsis />
										)}
										<BootstrapPagination.Item
											onClick={() => handlePageChange(totalPages)}>
											{totalPages}
										</BootstrapPagination.Item>
									</>
								)}

								<BootstrapPagination.Next
									onClick={() =>
										currentPage < totalPages &&
										handlePageChange(currentPage + 1)
									}
								/>
							</BootstrapPagination>
						</nav>
					</div>
				</Card.Body>
			</Card>
			{/* Modal for adding a new inventory */}
			<Modal
				show={isOpen}
				onHide={toggleModal}
				dialogClassName="modal-lg modal-dialog-centered">
				<Modal.Header closeButton>
					<h4 className="modal-title">
						{editingSubCategory ? 'Update Inventory' : 'Add New Inventory'}
					</h4>
				</Modal.Header>
				<Form
					onSubmit={handleSubmit(
						editingSubCategory ? handleUpdateInventory : handleAddInventory
					)}>
					<Modal.Body>
						<Row>
							<Col md={12}>
								<Form.Group className="mb-3">
									<div className="d-flex align-items-center mt-2">
										<Form.Check
											type="checkbox"
											id="specialProductToggle"
											label="Inventory For Special Product"
											checked={productType === 'SpecialProduct'}
											onChange={(e) => {
												setProductType(
													e.target.checked ? 'SpecialProduct' : 'Product'
												)
												// Clear product selection when switching type
												setProductSearchTerm('')
												setValue('product', '')
												setProductSuggestions([])
												setShowSuggestions(false)
											}}
										/>
										<small className="text-muted ms-3">
											{productType === 'SpecialProduct'
												? 'Search will display special products only'
												: 'Search will display regular products'}
										</small>
									</div>
								</Form.Group>
							</Col>
						</Row>
						<Row>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label className="d-flex align-items-center">
										Product <span className="text-danger ms-1">*</span>
									</Form.Label>
									<FormInput
										type="text"
										name="product"
										containerClass="mb-0"
										value={productSearchTerm}
										onChange={(e) => handleProductSearch(e.target.value)}
										placeholder="Search product by name or SKU..."
										errors={errors}
										control={control}
									/>
									{showSuggestions && productSuggestions.length > 0 && (
										<div className="suggestion-dropdown">
											{productSuggestions.map((product: any) => (
												<div
													key={product._id}
													className="suggestion-item d-flex align-items-center p-2"
													onClick={() => {
														setProductSearchTerm(product.name)
														setShowSuggestions(false)
														setValue('product', product._id)
													}}>
													<img
														src={`${BASE_API}${product.image}`}
														alt={product.name}
														className="suggestion-image me-2"
														style={{
															width: '40px',
															height: '40px',
															objectFit: 'cover',
														}}
													/>
													<div>
														<div className="suggestion-name">
															{product.name}
														</div>
														<div className="suggestion-sku text-muted">
															{product.sku}
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</Form.Group>
							</Col>
							<Col md={6}>
								<Form.Group className="mb-3">
									<FormInput
										label="Barcode"
										type="text"
										name="barcode"
										containerClass="mb-3"
										register={register}
										placeholder="Enter barcode"
										errors={errors}
										control={control}
									/>
								</Form.Group>
							</Col>
						</Row>

						<Row>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label className="d-flex align-items-center">
										Quantity <span className="text-danger ms-1">*</span>
									</Form.Label>
									<FormInput
										type="number"
										name="quantity"
										containerClass="mb-3"
										register={register}
										placeholder="Enter quantity"
										errors={errors}
										control={control}
									/>
								</Form.Group>
							</Col>
							<Col md={6}>
								<Form.Group className="mb-3">
									<FormInput
										label="Stock Alert Threshold"
										type="number"
										name="stockAlertThreshold"
										containerClass="mb-3"
										register={register}
										placeholder="Enter threshold value"
										errors={errors}
										control={control}
									/>
								</Form.Group>
							</Col>
						</Row>
						<Row>
							<Col lg={6}>
  <Form.Group className="mb-3">
    <Form.Label className="d-flex align-items-center justify-content-between">
      Stores
    </Form.Label>

    <Controller
      name="warehouse"
      control={control}
      render={({ field }) => {
        // All warehouses converted to Select options
        const warehouseOptions =
          warehouses?.map((w: any) => ({
            value: w._id,
            label: w.name,
          })) || []

        // Single value for react-select
        const selectedValue = warehouseOptions.find(
          (opt) => opt.value === field.value
        ) || null

        // Custom checkbox-style option (single selection)
        const Option = (props: any) => {
          return (
            <div
              {...props.innerProps}
              className={`d-flex align-items-center p-2 ${
                props.isFocused ? 'bg-light' : ''
              }`}
              style={{ cursor: 'pointer' }}
            >
              <input
                type="radio"
                name="warehouse-single"
                checked={field.value === props.data.value}
                onChange={() => field.onChange(props.data.value)}
                style={{ marginRight: '8px' }}
              />
              <label className="m-0">{props.label}</label>
            </div>
          )
        }

        // MenuList with scroll (no select all for single)
        const MenuList = (props: any) => {
          return (
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {props.children}
            </div>
          )
        }

        return (
          <Select
            {...field}
            closeMenuOnSelect
            hideSelectedOptions={false}
            options={warehouseOptions}
            placeholder="Select Store"
            className="react-select"
            classNamePrefix="select"
            value={selectedValue}
            onChange={(selectedOption) =>
              field.onChange(selectedOption ? selectedOption.value : '')
            }
            components={{
              Option,
              MenuList,
            }}
            styles={{
              menu: (base) => ({
                ...base,
                zIndex: 9999, // fix dropdown overlay
              }),
            } as any}
          />
        )
      }}
    />

    {errors.warehouse && (
      <Form.Text className="text-danger">
        {errors.warehouse.message}
      </Form.Text>
    )}
  </Form.Group>
</Col>



							<Col md={6}>
								<FormInput
									label="Location Within Store"
									type="text"
									name="locationWithinWarehouse"
									containerClass="mb-3 mt-1"
									register={register}
									placeholder="Enter location"
									errors={errors}
									control={control}
								/>
							</Col>
						</Row>
						<Row>
							<Col md={6}>
								<Form.Group className="mb-3">
									<FormInput
										label="Expiry Date"
										type="date"
										name="expiryDate"
										containerClass="mb-3"
										register={register}
										errors={errors}
										control={control}
									/>
								</Form.Group>
							</Col>
							<Col md={6}>
								<Form.Group className="mb-3">
									<FormInput
										label="Expiry Date Threshold (days)"
										type="number"
										name="expiryDateThreshold"
										containerClass="mb-3"
										register={register}
										placeholder="Enter threshold in days"
										errors={errors}
										control={control}
									/>
								</Form.Group>
							</Col>
							<Col md={6}></Col>
						</Row>
						<Row>
							<Col md={6}>
								<Form.Group className="mb-3">
									<FormInput
										label="VAT"
										type="number"
										name="vat"
										containerClass="mb-3"
										register={register}
										placeholder="Enter VAT percentage"
										errors={errors}
										control={control}
									/>
								</Form.Group>
							</Col>
							{/* <Col md={6}><Form.Group className="mb-3">
                                <FormInput
                                    label="Batch ID"
                                    type="text"
                                    name="batchId"
                                    containerClass="mb-3"
                                    register={register}
                                    placeholder="Enter batch ID"
                                    errors={errors}
                                    control={control}
                                />
                            </Form.Group></Col> */}
						</Row>
					</Modal.Body>

					<Modal.Footer>
						<Button variant="light" onClick={toggleModal}>
							Close
						</Button>
						<Button
							variant="soft-success"
							type="submit"
							disabled={editingSubCategory ? !canUpdate : !canCreate}>
							{apiLoading
								? editingSubCategory
									? 'Updating...'
									: 'Adding...'
								: editingSubCategory
									? 'Update Inventory'
									: 'Save Inventory'}
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>
			{/* Modal for adding warehouse */}
			<Modal
				show={showWarehouseModal}
				onHide={toggleWarehouseModal}
				dialogClassName="modal-dialog-centered"
				backdropClassName="modal-backdrop-dark"
				style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
				<Modal.Header closeButton>
					<h4 className="modal-title">Add New Store</h4>
				</Modal.Header>
				<Form onSubmit={handleSubmit(handleAddWarehouse)}>
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
						<Form.Group className="mb-3">
							<FormInput
								label="Initial Balance $"
								type="number"
								name="initialBalance"
								containerClass="mb-3"
								register={register}
								placeholder="Enter Initial Balance ($)"
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
						<Button variant="light" onClick={toggleWarehouseModal}>
							Close
						</Button>
						<Button variant="soft-success" type="submit">
							{apiLoading ? 'Adding...' : 'Save Store'}
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>

			{/* Upload Progress Modal */}
			<Modal show={showUploadModal} centered backdrop="static" keyboard={false}>
				<Modal.Header>
					<Modal.Title>Uploading Inventory</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<div className="text-center">
						<div className="mb-3">
							<div className="progress" style={{ height: '20px' }}>
								<div
									className="progress-bar progress-bar-striped progress-bar-animated"
									role="progressbar"
									style={{ width: `${uploadProgress}%` }}
									aria-valuenow={uploadProgress}
									aria-valuemin={0}
									aria-valuemax={100}>
									{uploadProgress}%
								</div>
							</div>
						</div>
						<p>Please wait while your inventory data is being uploaded...</p>
					</div>
				</Modal.Body>
			</Modal>
		</>
	)
}
export default AllInventory
