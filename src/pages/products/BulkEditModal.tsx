import { useState, useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import Select from 'react-select'
import Swal from 'sweetalert2'
import { MultiValue } from 'react-select'

interface SelectOption {
    value: string
    label: string
}

interface ProductBulkEditModalProps {
    show: boolean
    onHide: () => void
    selectedProducts: string[]
    token: string
    BASE_API: string
    onSuccess: () => void
}

const ProductBulkEditModal = ({
    show,
    onHide,
    selectedProducts,
    token,
    BASE_API,
    onSuccess
}: ProductBulkEditModalProps) => {
    // States for categories
    const [categories, setCategories] = useState<any[]>([])
    const [subCategories, setSubCategories] = useState<any[]>([])
    const [subSubCategories, setSubSubCategories] = useState<any[]>([])
    const [brands, setBrands] = useState<any[]>([])

    // States for selected values
    const [selectedCategories, setSelectedCategories] = useState<any[]>([])
    const [selectedSubCategories, setSelectedSubCategories] = useState<any[]>([])
    const [selectedSubSubCategories, setSelectedSubSubCategories] = useState<any[]>([])
    const [selectedBrand, setSelectedBrand] = useState('')

    // Toggle states
    const [isBestSeller, setIsBestSeller] = useState(false)
    const [isShopByPet, setIsShopByPet] = useState(false)
    const [isServiceProduct, setIsServiceProduct] = useState(false)
    const [isNewArrival, setIsNewArrival] = useState(false)

    const [loading, setLoading] = useState(false)

    // Convert categories to Select options
    const categoryOptions = categories.map(cat => ({
        value: cat._id,
        label: cat.name
    }))

    const subCategoryOptions = subCategories
        .filter(subCat => selectedCategories.some(cat => cat.value === subCat.parentCategory._id))
        .map(subCat => ({
            value: subCat._id,
            label: subCat.name
        }))

    const subSubCategoryOptions = subSubCategories
        .filter(subSubCat => selectedSubCategories.some(subCat => subCat.value === subSubCat.parentSubCategory._id))
        .map(subSubCat => ({
            value: subSubCat._id,
            label: subSubCat.name
        }))

    const brandOptions = brands.map(brand => ({
        value: brand._id,
        label: brand.name
    }))

    const resetForm = () => {
        setSelectedCategories([])
        setSelectedSubCategories([])
        setSelectedSubSubCategories([])
        setSelectedBrand('')
        setIsBestSeller(false)
        setIsShopByPet(false)
        setIsServiceProduct(false)
        setIsNewArrival(false)
    }
    // Fetch all necessary data
    const fetchData = async () => {
        try {
            const [categoriesRes, subCategoriesRes, subSubCategoriesRes, brandsRes] = await Promise.all([
                fetch(`${BASE_API}/api/categories/category`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BASE_API}/api/categories/subcategory`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BASE_API}/api/categories/subsubcategory`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BASE_API}/api/brands`, { headers: { Authorization: `Bearer ${token}` } })
            ])

            const [categoriesData, subCategoriesData, subSubCategoriesData, brandsData] = await Promise.all([
                categoriesRes.json(),
                subCategoriesRes.json(),
                subSubCategoriesRes.json(),
                brandsRes.json()
            ])

            setCategories(categoriesData)
            setSubCategories(subCategoriesData)
            setSubSubCategories(subSubCategoriesData)
            setBrands(brandsData)
        } catch (error) {
            console.error('Error fetching data:', error)
        }
    }

    const handleBulkUpdate = async () => {
        try {
            setLoading(true)
            const updates: any = {}

            if (selectedCategories.length > 0) {
                updates.category = selectedCategories.map(cat => cat.value)
            }
            if (selectedSubCategories.length > 0) {
                updates.subcategory = selectedSubCategories.map(subCat => subCat.value)
            }
            if (selectedSubSubCategories.length > 0) {
                updates.subsubcategory = selectedSubSubCategories.map(subSubCat => subSubCat.value)
            }
            if (selectedBrand) {
                updates.brandId = selectedBrand
            }

            // Add toggles to updates if they've been modified
            updates.isBestSeller = isBestSeller
            updates.isShopByPet = isShopByPet
            updates.isServiceProduct = isServiceProduct
            updates.isNewArrival = isNewArrival

            const response = await fetch(`${BASE_API}/api/products/bulk-update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    productIds: selectedProducts,
                    updates
                })
            })

            if (!response.ok) {
                throw new Error('Failed to update products')
            }

            Swal.fire({
                title: 'Success!',
                text: 'Products updated successfully',
                icon: 'success',
                timer: 1500
            })

            onSuccess()
        } catch (error: any) {
            Swal.fire({
                title: 'Error',
                text: error.message || 'Failed to update products',
                icon: 'error'
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (show) {
            fetchData()
            resetForm()
        }
    }, [show])

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    Bulk Edit Products ({selectedProducts.length} selected)
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Categories</Form.Label>
                        {/* <Select
                            isMulti
                            value={selectedCategories}
                            onChange={(selected) => {
                                setSelectedCategories(selected || [])
                                setSelectedSubCategories([])
                                setSelectedSubSubCategories([])
                            }}
                            options={categoryOptions}
                            placeholder="Select Categories"
                        /> */}
                        <Select
                            isMulti
                            value={selectedCategories}
                            onChange={(selected: MultiValue<SelectOption>) => {
                                setSelectedCategories(Array.isArray(selected) ? selected : [])
                                setSelectedSubCategories([])
                                setSelectedSubSubCategories([])
                            }}
                            options={categoryOptions}
                        />

                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Sub-Categories</Form.Label>
                        {/* <Select
                            isMulti
                            value={selectedSubCategories}
                            onChange={(selected) => {
                                setSelectedSubCategories(selected || [])
                                setSelectedSubSubCategories([])
                            }}
                            options={subCategoryOptions}
                            placeholder="Select Sub Categories"
                            isDisabled={!selectedCategories.length}
                        /> */}
                        <Select
                            isMulti
                            value={selectedSubCategories}
                            onChange={(selected: MultiValue<SelectOption>) => {
                                setSelectedSubCategories(Array.isArray(selected) ? selected : [])
                                setSelectedSubSubCategories([])
                            }}
                            options={subCategoryOptions}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Sub-Sub-Categories</Form.Label>
                        {/* <Select
                            isMulti
                            value={selectedSubSubCategories}
                            onChange={(selected) => setSelectedSubSubCategories(selected || [])}
                            options={subSubCategoryOptions}
                            placeholder="Select Sub Sub Categories"
                            isDisabled={!selectedSubCategories.length}
                        /> */}
                        <Select
                            isMulti
                            value={selectedSubSubCategories}
                            onChange={(selected: MultiValue<SelectOption>) => {
                                setSelectedSubSubCategories(Array.isArray(selected) ? selected : [])
                            }}
                            options={subSubCategoryOptions}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Brand</Form.Label>
                        <Select
                            value={brandOptions.find(option => option.value === selectedBrand)}
                            onChange={(selected: any) => setSelectedBrand(selected?.value || '')}
                            options={brandOptions}
                            placeholder="Select Brand"
                            isClearable
                        />
                    </Form.Group>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="switch"
                                    id="isBestSeller"
                                    label="Section 14"
                                    checked={isBestSeller}
                                    onChange={(e) => setIsBestSeller(e.target.checked)}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="switch"
                                    id="isShopByPet"
                                    label="Section 6"
                                    checked={isShopByPet}
                                    onChange={(e) => setIsShopByPet(e.target.checked)}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="switch"
                                    id="isServiceProduct"
                                    label="Service Product"
                                    checked={isServiceProduct}
                                    onChange={(e) => setIsServiceProduct(e.target.checked)}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="switch"
                                    id="isNewArrival"
                                    label="New Arrival"
                                    checked={isNewArrival}
                                    onChange={(e) => setIsNewArrival(e.target.checked)}
                                />
                            </Form.Group>
                        </div>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="light" onClick={onHide}>
                    Cancel
                </Button>
                <Button
                    variant="success"
                    onClick={handleBulkUpdate}
                    disabled={loading}
                >
                    {loading ? 'Updating...' : 'Update Selected Products'}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default ProductBulkEditModal
