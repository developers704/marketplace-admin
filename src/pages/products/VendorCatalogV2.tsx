import { PageBreadcrumb } from '@/components'
import { Button, Card, Form, Table, Pagination as BootstrapPagination, Modal, Dropdown } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { MdDelete, MdEdit, MdVisibility } from 'react-icons/md'

type VendorProductListItem = {
	_id: string
	vendorModel: string
	title: string
	brand?: string
	category?: string
	skuCount?: number
	totalInventory?: number
	minPrice?: number
	maxPrice?: number
	defaultSku?: {
		_id: string
		sku: string
		price: number
		currency?: string
		images?: string[]
		metalColor?: string
		metalType?: string
		size?: string
	}
}

const VendorCatalogV2 = () => {
	const BASE_API = import.meta.env.VITE_BASE_API
	const { user } = useAuthContext()
	const { token } = user

	const [items, setItems] = useState<VendorProductListItem[]>([])
	const [loading, setLoading] = useState(false)
	const [page, setPage] = useState(1)
	const [limit] = useState(20)
	const [paginatorInfo, setPaginatorInfo] = useState<any>(null)
	const [importingCatalog, setImportingCatalog] = useState(false)
	const [importingInventory, setImportingInventory] = useState(false)
	const [inventoryMode, setInventoryMode] = useState<'replace' | 'increment'>('replace')
	const [viewModal, setViewModal] = useState<{ show: boolean; product: VendorProductListItem | null }>({ show: false, product: null })
	const [editModal, setEditModal] = useState<{ show: boolean; product: VendorProductListItem | null }>({ show: false, product: null })
	const [productDetails, setProductDetails] = useState<any>(null)
	const [loadingDetails, setLoadingDetails] = useState(false)

	const vendorFileInputRef = useRef<HTMLInputElement>(null)
	const inventoryFileInputRef = useRef<HTMLInputElement>(null)

	const fetchVendorProducts = async () => {
		setLoading(true)
		try {
			const response = await fetch(`${BASE_API}/api/v2/products?page=${page}&limit=${limit}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			const data = await response.json()
			setItems(data?.data || [])
			setPaginatorInfo(data?.paginatorInfo || null)
		} catch (error: any) {
			console.error('Failed to fetch vendor products', error)
			Swal.fire({ title: 'Error', text: error?.message || 'Failed to fetch vendor products', icon: 'error' })
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchVendorProducts()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page])

	const uploadVendorCatalog = async (file: File) => {
		const formData = new FormData()
		formData.append('csvFile', file)

		setImportingCatalog(true)
		try {
			const response = await fetch(`${BASE_API}/api/v2/bulk/vendor-catalog/import`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			})
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data?.message || 'Vendor catalog import failed')
			}

			Swal.fire({
				title: 'Import Complete',
				icon: 'success',
				html: `
          <div style="text-align:left;">
            <p><b>Rows:</b> ${data?.meta?.totalRows ?? 0}</p>
            <p><b>Vendor Models:</b> ${data?.meta?.vendorModels ?? 0}</p>
            <p><b>Duration:</b> ${data?.meta?.durationMs ?? 0} ms</p>
            <p><b>Errors (shown):</b> ${(data?.errors || []).length}</p>
          </div>
        `,
			})

			setPage(1)
			await fetchVendorProducts()
		} catch (error: any) {
			Swal.fire({ title: 'Error', text: error?.message || 'Vendor catalog import failed', icon: 'error' })
		} finally {
			setImportingCatalog(false)
			if (vendorFileInputRef.current) vendorFileInputRef.current.value = ''
		}
	}

	const uploadSkuInventory = async (file: File) => {
		const formData = new FormData()
		formData.append('csvFile', file)

		setImportingInventory(true)
		try {
			const response = await fetch(
				`${BASE_API}/api/v2/bulk/sku-inventory/import?mode=${inventoryMode}`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				}
			)
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data?.message || 'SKU inventory import failed')
			}

			Swal.fire({
				title: 'Inventory Import Complete',
				icon: 'success',
				html: `
          <div style="text-align:left;">
            <p><b>Rows:</b> ${data?.meta?.totalRows ?? 0}</p>
            <p><b>Resolved:</b> ${data?.meta?.resolvedRows ?? 0}</p>
            <p><b>Mode:</b> ${data?.meta?.mode ?? '-'}</p>
            <p><b>Duration:</b> ${data?.meta?.durationMs ?? 0} ms</p>
            <p><b>Errors (shown):</b> ${(data?.errors || []).length}</p>
          </div>
        `,
			})

			await fetchVendorProducts()
		} catch (error: any) {
			Swal.fire({ title: 'Error', text: error?.message || 'SKU inventory import failed', icon: 'error' })
		} finally {
			setImportingInventory(false)
			if (inventoryFileInputRef.current) inventoryFileInputRef.current.value = ''
		}
	}

	const totalPages = paginatorInfo?.totalPages || 1

	// Fetch product details for view/edit
	const fetchProductDetails = async (productId: string) => {
		setLoadingDetails(true)
		try {
			const response = await fetch(`${BASE_API}/api/v2/products/${productId}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			const data = await response.json()
			if (data.success) {
				setProductDetails(data.data)
				return data.data
			}
			throw new Error(data?.message || 'Failed to fetch product details')
		} catch (error: any) {
			Swal.fire({ title: 'Error', text: error?.message || 'Failed to fetch product details', icon: 'error' })
			return null
		} finally {
			setLoadingDetails(false)
		}
	}

	// View product
	const handleView = async (product: VendorProductListItem) => {
		const details = await fetchProductDetails(product._id)
		if (details) {
			setViewModal({ show: true, product })
		}
	}

	// Edit product
	const handleEdit = async (product: VendorProductListItem) => {
		const details = await fetchProductDetails(product._id)
		if (details) {
			setEditModal({ show: true, product })
		}
	}

	// Update product
	const handleUpdate = async (productId: string, updateData: any) => {
		try {
			const response = await fetch(`${BASE_API}/api/v2/products/${productId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(updateData),
			})
			const data = await response.json()
			if (!response.ok) {
				throw new Error(data?.message || 'Update failed')
			}
			Swal.fire({ title: 'Success', text: 'Product updated successfully', icon: 'success' })
			setEditModal({ show: false, product: null })
			await fetchVendorProducts()
		} catch (error: any) {
			Swal.fire({ title: 'Error', text: error?.message || 'Failed to update product', icon: 'error' })
		}
	}

	// Delete single SKU
	const handleDeleteSku = async (skuId: string, productId: string) => {
		const result = await Swal.fire({
			title: 'Delete SKU?',
			text: 'This will delete the SKU and all its inventory. This action cannot be undone.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
		})

		if (result.isConfirmed) {
			try {
				const response = await fetch(`${BASE_API}/api/v2/skus/${skuId}`, {
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
				const data = await response.json()
				if (!response.ok) {
					throw new Error(data?.message || 'Delete failed')
				}
				Swal.fire({ title: 'Deleted!', text: 'SKU deleted successfully', icon: 'success' })
				setProductDetails(null) // Clear cached details
				await fetchVendorProducts()
			} catch (error: any) {
				Swal.fire({ title: 'Error', text: error?.message || 'Failed to delete SKU', icon: 'error' })
			}
		}
	}

	// Show SKU delete selection
	// const showSkuDeleteModal = async (product: VendorProductListItem) => {
	// 	const details = await fetchProductDetails(product._id)
	// 	if (!details || !details.skus || details.skus.length === 0) {
	// 		Swal.fire({ title: 'No SKUs', text: 'This product has no SKUs to delete', icon: 'info' })
	// 		return
	// 	}

	// 	const skuOptions = details.skus.map((sku: any) => ({
	// 		value: sku._id,
	// 		label: `${sku.sku} - ${sku.metalColor || ''} ${sku.metalType || ''} ${sku.size || ''}`.trim(),
	// 	}))

	// 	const { value: selectedSkuId } = await Swal.fire({
	// 		title: 'Select SKU to Delete',
	// 		html: `
	// 			<select id="skuSelect" class="swal2-select" >
	// 				<option value="">Select a SKU</option>
	// 				${skuOptions.map((opt: any) => `<option value="${opt.value}">${opt.label}</option>`).join('')}
	// 			</select>
	// 		`,
	// 		showCancelButton: true,
	// 		confirmButtonText: 'Delete SKU',
	// 		confirmButtonColor: '#d33',
	// 		preConfirm: () => {
	// 			const select = document.getElementById('skuSelect') as HTMLSelectElement
	// 			return select?.value || null
	// 		},
	// 	})

	// 	if (selectedSkuId) {
	// 		handleDeleteSku(selectedSkuId, product._id)
	// 	}
	// }
const showSkuDeleteModal = async (product: VendorProductListItem) => {
  const details = await fetchProductDetails(product._id);

  if (!details?.skus?.length) {
    await Swal.fire({
      icon: 'info',
      title: 'No SKUs Available',
      text: 'This product does not have any SKUs to delete.',
      confirmButtonText: 'OK',
    });
    return;
  }

  // Build select options
  const skuOptions: Record<string, string> = {};
  details.skus.forEach((sku: any) => {
    skuOptions[sku._id] = `${sku.sku} • ${[
      sku.metalColor,
      sku.metalType,
      sku.size,
    ]
      .filter(Boolean)
      .join(' ')}`;
  });

  const { value: selectedSkuId } = await Swal.fire({
    title: 'Delete Product SKU',
    icon: 'warning',
    text: 'Please select a SKU you want to permanently delete.',
    input: 'select',
    inputOptions: skuOptions,
    inputPlaceholder: 'Select SKU',
    showCancelButton: true,
    confirmButtonText: 'Delete SKU',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#d33',
    reverseButtons: true,

    inputValidator: (value) => {
      if (!value) {
        return 'You must select a SKU before deleting';
      }
      return null;
    },
  });

  if (selectedSkuId) {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: 'This action cannot be undone.',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      reverseButtons: true,
    });

    if (confirm.isConfirmed) {
      handleDeleteSku(selectedSkuId, product._id);
    }
  }
};

	// Delete vendor product (all SKUs)
	const handleDeleteProduct = async (productId: string) => {
		const result = await Swal.fire({
			title: 'Delete Vendor Product?',
			text: 'This will delete the vendor product and ALL its SKUs and inventory. This action cannot be undone.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
		})

		if (result.isConfirmed) {
			try {
				const response = await fetch(`${BASE_API}/api/v2/products/${productId}`, {
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
				const data = await response.json()
				if (!response.ok) {
					throw new Error(data?.message || 'Delete failed')
				}
				Swal.fire({ title: 'Deleted!', text: 'Vendor product and all SKUs deleted successfully', icon: 'success' })
				await fetchVendorProducts()
			} catch (error: any) {
				Swal.fire({ title: 'Error', text: error?.message || 'Failed to delete product', icon: 'error' })
			}
		}
	}

	// Delete all vendor data
	const handleDeleteAll = async () => {
		const result = await Swal.fire({
			title: 'Delete ALL Vendor Data?',
			html: '<p>This will delete <strong>ALL</strong> vendor products, SKUs, and inventory.</p><p class="text-danger"><strong>This action cannot be undone!</strong></p>',
			icon: 'error',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete everything!',
			input: 'text',
			inputPlaceholder: 'Type "DELETE ALL" to confirm',
			inputValidator: (value) => {
				if (value !== 'DELETE ALL') {
					return 'You must type "DELETE ALL" to confirm'
				}
			},
		})

		if (result.isConfirmed) {
			try {
				const response = await fetch(`${BASE_API}/api/v2/products/all?confirm=true`, {
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
				const data = await response.json()
				if (!response.ok) {
					throw new Error(data?.message || 'Delete failed')
				}
				Swal.fire({
					title: 'Deleted!',
					html: `<p>All vendor data deleted successfully.</p><p>Products: ${data?.data?.deletedProducts || 0}</p><p>SKUs: ${data?.data?.deletedSkus || 0}</p><p>Inventory: ${data?.data?.deletedInventory || 0}</p>`,
					icon: 'success',
				})
				await fetchVendorProducts()
			} catch (error: any) {
				Swal.fire({ title: 'Error', text: error?.message || 'Failed to delete all data', icon: 'error' })
			}
		}
	}

	// Download CSV templates
	const downloadTemplate = async (type: 'vendor-catalog' | 'sku-inventory') => {
		try {
			const response = await fetch(`${BASE_API}/api/v2/templates/${type}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (!response.ok) throw new Error('Failed to download template')
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = type === 'vendor-catalog' ? 'vendor-catalog-template.csv' : 'sku-inventory-template.csv'
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
			document.body.removeChild(a)
			Swal.fire({ title: 'Success', text: 'Template downloaded successfully', icon: 'success', timer: 1500 })
		} catch (error: any) {
			Swal.fire({ title: 'Error', text: error?.message || 'Failed to download template', icon: 'error' })
		}
	}

	return (
		<>
			<PageBreadcrumb title="Vendor Catalog (v2)" subName="Products" />

			<Card>
				<Card.Body>
					<div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
						<div>
							
							<h4 className="mb-1">Vendor-Model Catalog</h4>
							{/* <div className="text-muted">
								Listing is vendorModel-based. Inventory is SKU-based (warehouse + city).
							</div> */}
						</div>

						<div className="d-flex flex-wrap gap-2 align-items-center">
							<Form.Select
								style={{ width: 220 }}
								value={inventoryMode}
								onChange={(e) => setInventoryMode(e.target.value as any)}
							>
								<option value="replace">Inventory Mode: Replace</option>
								<option value="increment">Inventory Mode: Increment</option>
							</Form.Select>

							<Button
								variant="outline-info"
								size="sm"
								onClick={() => downloadTemplate('vendor-catalog')}
							>
								 Download Product Template
							</Button>

							<Button
								variant="outline-info"
								size="sm"
								onClick={() => downloadTemplate('sku-inventory')}
							>
								 Download Inventory Template
							</Button>

							<Button
								variant="primary"
								disabled={importingCatalog}
								onClick={() => vendorFileInputRef.current?.click()}
							>
								{importingCatalog ? 'Importing…' : 'Import Product CSV'}
							</Button>

							<Button
								variant="secondary"
								disabled={importingInventory}
								onClick={() => inventoryFileInputRef.current?.click()}
							>
								{importingInventory ? 'Importing…' : 'Import Inventory CSV'}
							</Button>

							<Button
								variant="danger"
								size="sm"
								onClick={handleDeleteAll}
							>
								 Delete All Data
							</Button>
						</div>
					</div>

					<input
						ref={vendorFileInputRef}
						type="file"
						accept=".csv"
						style={{ display: 'none' }}
						onChange={(e) => {
							const file = e.target.files?.[0]
							if (file) uploadVendorCatalog(file)
						}}
					/>

					<input
						ref={inventoryFileInputRef}
						type="file"
						accept=".csv"
						style={{ display: 'none' }}
						onChange={(e) => {
							const file = e.target.files?.[0]
							if (file) uploadSkuInventory(file)
						}}
					/>

					<div className="mt-4">
						<Table hover responsive>
							<thead>
								<tr>
									<th>Vendor Model</th>
									<th>Title</th>
									<th>Brand</th>
									<th>Category</th>
									<th className="text-end">SKUs</th>
									<th className="text-end">Total Qty</th>
									<th className="text-end">Price Range</th>
									<th className="text-center">Actions</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td colSpan={8}>Loading…</td>
									</tr>
								) : items.length === 0 ? (
									<tr>
										<td colSpan={8}>No vendor products found.</td>
									</tr>
								) : (
									items.map((p) => (
										<tr key={p._id}>
											<td>{p.vendorModel}</td>
											<td>{p.title}</td>
											<td>{p.brand || '—'}</td>
											<td>{p.category || '—'}</td>
											<td className="text-end">{p.skuCount ?? 0}</td>
											<td className="text-end">{p.totalInventory ?? 0}</td>
											<td className="text-end">
												{(p.minPrice ?? 0) === (p.maxPrice ?? 0)
													? `$${p.minPrice ?? 0}`
													: `$${p.minPrice ?? 0} - $${p.maxPrice ?? 0}`}
											</td>
											<td className="text-center">
												<div className="d-flex gap-1 justify-content-center">
													<Button
														variant="info"
														size="sm"
														onClick={() => handleView(p)}
													>
														 <MdVisibility size={20} />
													</Button>
													<Button
														// variant="warning"
														size="sm"
														onClick={() => handleEdit(p)}
													>
														<MdEdit />
													</Button>
													<Dropdown>
														<Dropdown.Toggle variant="danger" size="sm" id={`dropdown-${p._id}`}>
														<MdDelete size={20}/>
														</Dropdown.Toggle>
														<Dropdown.Menu>
															<Dropdown.Item onClick={() => showSkuDeleteModal(p)}>
																Delete Single SKU
															</Dropdown.Item>
															<Dropdown.Item
																onClick={() => handleDeleteProduct(p._id)}
																className="text-danger"
															>
																Delete Complete Vendor Product
															</Dropdown.Item>
														</Dropdown.Menu>
													</Dropdown>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</Table>

						<div className="d-flex justify-content-end">
							<BootstrapPagination className="mb-0">
								<BootstrapPagination.Prev
									disabled={page <= 1}
									onClick={() => setPage((p) => Math.max(1, p - 1))}
								/>
								<BootstrapPagination.Item active>{page}</BootstrapPagination.Item>
								<BootstrapPagination.Next
									disabled={page >= totalPages}
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								/>
							</BootstrapPagination>
						</div>
					</div>
				</Card.Body>
			</Card>

			{/* View Modal */}
			<Modal show={viewModal.show} onHide={() => setViewModal({ show: false, product: null })} size="lg">
				<Modal.Header closeButton>
					<Modal.Title>View Vendor Product</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{loadingDetails ? (
						<div className="text-center py-4">Loading...</div>
					) : productDetails ? (
						<div>
							<h5>Product Information</h5>
							<Table bordered size="sm" className="mb-4">
								<tbody>
									<tr>
										<th style={{ width: '30%' }}>Vendor Model</th>
										<td>{productDetails.product?.vendorModel || '—'}</td>
									</tr>
									<tr>
										<th>Title</th>
										<td>{productDetails.product?.title || '—'}</td>
									</tr>
									<tr>
										<th>Brand</th>
										<td>{productDetails.product?.brand || '—'}</td>
									</tr>
									<tr>
										<th>Category</th>
										<td>{productDetails.product?.category || '—'}</td>
									</tr>
									<tr>
										<th>Description</th>
										<td>{productDetails.product?.description || '—'}</td>
									</tr>
									<tr>
										<th>SKU Count</th>
										<td>{productDetails.product?.skuCount || 0}</td>
									</tr>
									<tr>
										<th>Total Inventory</th>
										<td>{productDetails.product?.totalInventory || 0}</td>
									</tr>
								</tbody>
							</Table>

							<h5 className="mt-4">SKUs ({productDetails.skus?.length || 0})</h5>
							{productDetails.skus && productDetails.skus.length > 0 ? (
								<Table bordered size="sm">
									<thead>
										<tr>
											<th>SKU</th>
											<th>Metal Color</th>
											<th>Metal Type</th>
											<th>Size</th>
											<th className="text-end">Price</th>
											<th className="text-end">Inventory</th>
										</tr>
									</thead>
									<tbody>
										{productDetails.skus.map((sku: any) => (
											<tr key={sku._id}>
												<td>{sku.sku}</td>
												<td>{sku.metalColor || '—'}</td>
												<td>{sku.metalType || '—'}</td>
												<td>{sku.size || '—'}</td>
												<td className="text-end">${sku.price || 0} {sku.currency || 'USD'}</td>
												<td className="text-end">{sku.totalQuantity || 0}</td>
											</tr>
										))}
									</tbody>
								</Table>
							) : (
								<p className="text-muted">No SKUs found</p>
							)}
						</div>
					) : (
						<div className="text-center py-4 text-muted">No data available</div>
					)}
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setViewModal({ show: false, product: null })}>
						Close
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Edit Modal */}
			<Modal show={editModal.show} onHide={() => { setEditModal({ show: false, product: null }); setProductDetails(null); }}>
				<Modal.Header closeButton>
					<Modal.Title>Edit Vendor Product</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{loadingDetails ? (
						<div className="text-center py-4">Loading...</div>
					) : productDetails ? (
						<Form
							onSubmit={(e) => {
								e.preventDefault()
								const formData = new FormData(e.target as HTMLFormElement)
								const updateData = {
									vendorModel: formData.get('vendorModel'),
									title: formData.get('title'),
									brand: formData.get('brand'),
									category: formData.get('category'),
									description: formData.get('description'),
								}
								handleUpdate(editModal.product!._id, updateData)
							}}
						>
							<Form.Group className="mb-3">
								<Form.Label>Vendor Model</Form.Label>
								<Form.Control
									type="text"
									name="vendorModel"
									defaultValue={productDetails.product?.vendorModel || ''}
									required
								/>
							</Form.Group>
							<Form.Group className="mb-3">
								<Form.Label>Title</Form.Label>
								<Form.Control
									type="text"
									name="title"
									defaultValue={productDetails.product?.title || ''}
									required
								/>
							</Form.Group>
							<Form.Group className="mb-3">
								<Form.Label>Brand</Form.Label>
								<Form.Control
									type="text"
									name="brand"
									defaultValue={productDetails.product?.brand || ''}
									required
								/>
							</Form.Group>
							<Form.Group className="mb-3">
								<Form.Label>Category</Form.Label>
								<Form.Control
									type="text"
									name="category"
									defaultValue={productDetails.product?.category || ''}
									required
								/>
							</Form.Group>
							<Form.Group className="mb-3">
								<Form.Label>Description</Form.Label>
								<Form.Control
									as="textarea"
									rows={3}
									name="description"
									defaultValue={productDetails.product?.description || ''}
								/>
							</Form.Group>
							<div className="d-flex gap-2 justify-content-end">
								<Button variant="secondary" onClick={() => { setEditModal({ show: false, product: null }); setProductDetails(null); }}>
									Cancel
								</Button>
								<Button type="submit" variant="primary">
									Update Product
								</Button>
							</div>
						</Form>
					) : (
						<div className="text-center py-4 text-muted">No data available</div>
					)}
				</Modal.Body>
			</Modal>
		</>
	)
}

export default VendorCatalogV2


