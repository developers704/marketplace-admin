import { useState, useEffect } from 'react'
import { Card, Form, Button, Modal } from 'react-bootstrap'
import { FormInput } from '@/components'
import { useForm } from 'react-hook-form'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import Swal from 'sweetalert2'
import { TableRecord } from '@/pages/products/Categories'
import Select from 'react-select'

interface ProductCategoriesProps {
    onBrandChange: (brandId: string) => void
    onCategoryChange: (categoryIds: string[]) => void
    onSubCategoryChange: (subCategoryIds: string[]) => void
    // onSubSubCategoryChange: (subSubCategoryIds: string[]) => void
    token: string
    BASE_API: string
    initialBrand: any
    initialData?: any
}


const ProductCategories = ({
    onCategoryChange,
    onSubCategoryChange,
    // onSubSubCategoryChange,
    onBrandChange,
    token,
    initialBrand,
    initialData,
    BASE_API
}: ProductCategoriesProps) => {
    // States moved from CreateProduct
    const [categories, setCategories] = useState<any[]>([])
    const [subCategories, setSubCategories] = useState<any[]>([])
    const [brands, setBrands] = useState<any[]>([])
    const [selectedBrand, setSelectedBrand] = useState('')
    const [loading, setLoading] = useState(false)
    const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false)
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
    const [brandSearchTerm, setBrandSearchTerm] = useState('')
    const [isSearchingBrands, setIsSearchingBrands] = useState(false)
    const [isSearchingCategories, setIsSearchingCategories] = useState(false)
    const [subSubCategories, setSubSubCategories] = useState<any[]>([])
    // const [isSubSubCategoryModalOpen, setIsSubSubCategoryModalOpen] = useState(false)
    // const [filteredSubCategories, setFilteredSubCategories] = useState<any[]>([])

    const [selectedCategories, setSelectedCategories] = useState<any[]>([])
    const [selectedSubCategories, setSelectedSubCategories] = useState<any[]>([])
    // const [selectedSubSubCategories, setSelectedSubSubCategories] = useState<any[]>([])

    const categoryOptions = categories.map(cat => ({
        value: cat?._id,
        label: cat?.name
    }))

    const subCategoryOptions = subCategories
        .filter(subCat => selectedCategories.some(cat => cat?.value === subCat?.parentCategory?._id))
        .map(subCat => ({
            value: subCat?._id,
            label: subCat?.name
        }))


    // Modal states
    const [isOpen, setIsOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [apiLoading, setApiLoading] = useState(false)

    const {
        handleSubmit,
        register,
        reset,
        control,
        formState: { errors },
    } = useForm()
    // ****************** helping functions **************************
    const filteredBrands = brands.filter(brand =>
        brand.name.toLowerCase().includes(brandSearchTerm.toLowerCase())
    )


    const handleCategoryChange = (selected: any) => {
        console.log("Category change - sending back:", selected?.map((item: any) => item.value));
        setSelectedCategories(selected || [])
        setSelectedSubCategories([])
        // setSelectedSubSubCategories([])
        onCategoryChange(selected.map((item: any) => item.value))
    }

    const handleSubCategoryChange = (selected: any) => {
        console.log("SubCategory change - sending back:", selected?.map((item: any) => item.value));
        setSelectedSubCategories(selected || [])
        // setSelectedSubSubCategories([])
        onSubCategoryChange(selected.map((item: any) => item.value))
    }

    // const handleSubSubCategoryChange = (selected: any) => {
    //     console.log("SubSubCategory change - sending back:", selected?.map((item: any) => item.value));
    //     setSelectedSubSubCategories(selected || [])
    //     onSubSubCategoryChange(selected.map((item: any) => item.value))
    // }


    const handleBrandChange = (e: any) => {
        const brandId = e.target.value
        setSelectedBrand(brandId)
        onBrandChange(brandId)
    }

    // ************************** get apis ******************************
    const getCategories = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/categories/category`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get categories')
            }

            const data_res: TableRecord[] = await response.json()
            if (data_res) {
                setCategories(data_res)
            }
        } catch (error: any) {
            console.error('Error getting categories api data : ', error)
        } finally {
            setLoading(false)
        }
    }

    const getSubCategories = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/categories/subcategory`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get subcategories')
            }
            const data: TableRecord[] = await response.json()
            if (data) {
                setSubCategories(data)
            }
        } catch (error: any) {
            console.error('Error getting category data :', error)
        } finally {
            setLoading(false)
        }
    }
    const getSubSubCategories = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/categories/subsubcategory`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get sub-subcategories')
            }
            const data = await response.json()
            if (data) {
                setSubSubCategories(data)
            }
        } catch (error: any) {
            console.error('Error getting sub-subcategory data:', error)
        } finally {
            setLoading(false)
        }
    }
    const getBrands = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/brands`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get brands')
            }
            const data: TableRecord[] = await response.json()
            if (data) {
                setBrands(data)
            }
        } catch (error: any) {
            console.error('Error getting brands data :', error, loading)
        } finally {
            setLoading(false)
        }
    }

    // ********************* post apis *************************
    const handleAddCategory = async (categoryData: any) => {
        const formData = new FormData()
        formData.append('name', categoryData.name)
        formData.append('description', categoryData.description)
        if (selectedImage) {
            formData.append('image', selectedImage)
        }
        if (categoryData.animal) {
            formData.append('animal', categoryData.animal)
        }

        setApiLoading(true)

        try {
            const response = await fetch(`${BASE_API}/api/categories/category`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to Add Category')
            }

            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: 'ADDED!',
                    text: 'Category added successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    timer: 1500,
                })
                getCategories()
                reset()
                setIsOpen(false)
            }
        } catch (error: any) {
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

    const handleAddSubCategory = async (subCategoryData: any) => {
        const formData = new FormData()
        formData.append('name', subCategoryData.name)
        formData.append('description', subCategoryData.description)
        formData.append('parentCategory', subCategoryData.parentCategory)
        if (selectedImage) {
            formData.append('image', selectedImage)
        }
        if (subCategoryData.animal) {
            formData.append('animal', subCategoryData.animal)
        }
        try {
            setApiLoading(true)
            const response = await fetch(`${BASE_API}/api/categories/subcategory`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to add new Sub-category')
            }

            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: 'ADDED!',
                    text: 'Sub-Category added successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    timer: 1500,
                })
                getSubCategories()
                reset()
                setIsSubCategoryModalOpen(false)
            }
        } catch (error: any) {
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
    // const handleAddSubSubCategory = async (subSubCategoryData: any) => {
    //     const formData = new FormData()
    //     formData.append('name', subSubCategoryData.name)
    //     formData.append('description', subSubCategoryData.description)
    //     formData.append('parentSubCategory', subSubCategoryData.parentSubCategory.value) // Extract the value from select object
    //     if (selectedImage) {
    //         formData.append('image', selectedImage)
    //     }

    //     try {
    //         setApiLoading(true)
    //         const response = await fetch(`${BASE_API}/api/categories/subsubcategory`, {
    //             method: 'POST',
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //             },
    //             body: formData,
    //         })

    //         if (!response.ok) {
    //             const errorMessage = await response.json()
    //             throw new Error(errorMessage.message || 'Failed to add new Sub-sub-category')
    //         }

    //         const data_res = await response.json()
    //         if (data_res) {
    //             Swal.fire({
    //                 title: 'ADDED!',
    //                 text: 'Sub-sub-Category added successfully!',
    //                 icon: 'success',
    //                 confirmButtonText: 'OK',
    //                 timer: 1500,
    //             })
    //             getSubSubCategories()
    //             reset()
    //             setIsSubSubCategoryModalOpen(false)
    //         }
    //     } catch (error: any) {
    //         Swal.fire({
    //             title: 'Oops!',
    //             text: error.message,
    //             icon: 'error',
    //             timer: 1500,
    //         })
    //     } finally {
    //         setApiLoading(false)
    //     }
    // }


    const handleAddBrand = async (brandData: any) => {
        const formData = new FormData()
        formData.append('name', brandData.name)
        if (selectedImage) {
            formData.append('image', selectedImage)
        }

        try {
            setApiLoading(true)
            const response = await fetch(`${BASE_API}/api/brands`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to add new Brand')
            }

            const data_res = await response.json()
            if (data_res) {
                Swal.fire({
                    title: 'ADDED!',
                    text: 'Brand added successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    timer: 1500,
                })
                getBrands()
                reset()
                setIsBrandModalOpen(false)
            }
        } catch (error: any) {
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


    const handleCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        handleSubmit(handleAddCategory)()
    }
    const handleSubcategorySubmit = (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        handleSubmit(handleAddSubCategory)()
    }
    const handleBrandsSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        handleSubmit(handleAddBrand)()
    }
    // const handleSubSubCategorySubmit = (e: React.FormEvent) => {
    //     e.preventDefault()
    //     e.stopPropagation()
    //     handleSubmit(handleAddSubSubCategory)()
    // }

    useEffect(() => {
        getCategories()
        getSubCategories()
        getSubSubCategories()
        getBrands()
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element
            if (
                (isSearchingCategories && !target.closest('.position-relative')) ||
                (isSearchingBrands && !target.closest('.position-relative'))
            ) {
                setIsSearchingCategories(false)
                setIsSearchingBrands(false)
                setBrandSearchTerm('')
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isSearchingCategories, isSearchingBrands])

    useEffect(() => {
        if (initialData) {

            const initialCats = initialData.category?.map((cat: any) => ({
                value: cat._id,
                label: cat.name
            })) || []

            const initialSubCats = initialData.subcategory?.map((subCat: any) => ({
                value: subCat._id,
                label: subCat.name
            })) || []

            // const initialSubSubCats = initialData.subsubcategory?.map((subSubCat: any) => ({
            //     value: subSubCat._id,
            //     label: subSubCat.name
            // })) || []


            setSelectedCategories(initialCats)
            setSelectedSubCategories(initialSubCats)
            // setSelectedSubSubCategories(initialSubSubCats)
            // Important: Notify parent components of initial values
            onCategoryChange(initialData.categories || []);
            onSubCategoryChange(initialData.subcategories || []);
            // onSubSubCategoryChange(initialData.subsubcategories || []);


        }
    }, [initialData, categories, subCategories, subSubCategories])

    return (
        <>
            <Card>
                <Card.Header>Product Categories</Card.Header>
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center ">
                        <h5 className="mb-0">Category</h5>
                        <Button
                            variant="link"
                            className="p-0"
                            onClick={() => setIsOpen(true)}
                        >
                            <i className="bi bi-plus-circle-fill text-success" style={{ fontSize: '24px' }}></i>
                        </Button>
                    </div>
                    <Select
                        isMulti
                        value={selectedCategories}
                        onChange={handleCategoryChange}
                        options={categoryOptions}
                        placeholder="Select Categories"
                    />

                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <h5 className="mb-0">Sub-Category</h5>
                        <Button
                            variant="link"
                            className="p-0"
                            onClick={() => setIsSubCategoryModalOpen(true)}
                        >
                            <i className="bi bi-plus-circle-fill text-success" style={{ fontSize: '24px' }}></i>
                        </Button>
                    </div>
                    <Select
                        isMulti
                        value={selectedSubCategories}
                        onChange={handleSubCategoryChange}
                        options={subCategoryOptions}
                        placeholder="Select Sub Categories"
                        isDisabled={!selectedCategories.length}
                    />

                    {/* <div className="d-flex justify-content-between align-items-center mt-2">
                        <h5 className="mb-2">Sub-Sub-Category</h5>
                        <Button
                            variant="link"
                            className="p-0"
                            onClick={() => setIsSubSubCategoryModalOpen(true)}
                        >
                            <i className="bi bi-plus-circle-fill text-success" style={{ fontSize: '24px' }}></i>
                        </Button>
                    </div>

                    <Select
                        isMulti
                        value={selectedSubSubCategories}
                        onChange={handleSubSubCategoryChange}
                        options={subSubCategoryOptions}
                        placeholder="Select Sub Sub Categories"
                        isDisabled={!selectedSubCategories.length}
                    /> */}


                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <h5 className="mb-0">Brands</h5>
                        <Button
                            variant="link"
                            className="p-0"
                            onClick={() => setIsBrandModalOpen(true)}
                        >
                            <i className="bi bi-plus-circle-fill text-success" style={{ fontSize: '24px' }}></i>
                        </Button>
                    </div>
                    <div className="position-relative">
                        <div
                            className="form-select"
                            onClick={() => setIsSearchingBrands(true)}
                            style={{ cursor: 'pointer' }}
                        >
                            {selectedBrand ? brands.find(b => b._id === selectedBrand)?.name : 'Select Brand'}
                        </div>

                        {isSearchingBrands && (
                            <div
                                className="position-absolute w-100 mt-1 shadow bg-white rounded border"
                                style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}
                            >
                                <div className="p-2 border-bottom">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search brands..."
                                        value={brandSearchTerm}
                                        onChange={(e) => setBrandSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    {filteredBrands.map((brand) => (
                                        <div
                                            key={brand._id}
                                            className="px-3 py-2 cursor-pointer hover-bg-light"
                                            onClick={() => {
                                                handleBrandChange({ target: { value: brand._id } })
                                                setIsSearchingBrands(false)
                                                setBrandSearchTerm('')
                                            }}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: selectedBrand === brand._id ? '#e9ecef' : 'white'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedBrand === brand._id ? '#e9ecef' : 'white'}
                                        >
                                            {brand.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </Card.Body>
            </Card>

            <Modal
                show={isOpen}
                onHide={() => setIsOpen(false)}
                dialogClassName="modal-dialog-centered"
            >
                <Modal.Header closeButton>
                    <h4 className="modal-title">Add New Category</h4>
                </Modal.Header>
                <Form onSubmit={handleCategorySubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <FormInput
                                label="Name"
                                type="text"
                                name="name"
                                containerClass="mb-3"
                                register={register}
                                placeholder="Enter Category Name here.."
                                errors={errors}
                                control={control}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Description</Form.Label>
                            <p style={{ fontSize: '0.8rem' }} className="mb-2">
                                You may write a description of up to 15 words.
                            </p>
                            <FormInput
                                type="textarea"
                                name="description"
                                containerClass="mb-3"
                                register={register}
                                placeholder="Enter Description here.."
                                errors={errors}
                                control={control}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Upload Image</Form.Label>
                            <div className="mb-2">
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    {'File Size: Upload images up to 5 MB.'}
                                </p>
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    {'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
                                </p>
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    {'Upload Limit: Only 1 image can be uploaded.'}
                                </p>
                            </div>
                            <SingleFileUploader
                                icon="ri-upload-cloud-2-line"
                                text="Drop file here or click to upload a product image."
                                onFileUpload={(file: File) => setSelectedImage(file)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setIsOpen(false)}>
                            Close
                        </Button>
                        <Button variant="success" type="submit" disabled={apiLoading}>
                            {apiLoading ? 'Adding...' : 'Save Category'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            <Modal
                show={isSubCategoryModalOpen}
                onHide={() => setIsSubCategoryModalOpen(false)}
                dialogClassName="modal-dialog-centered"
            >
                <Modal.Header closeButton>
                    <h4 className="modal-title">Add New Sub-Category</h4>
                </Modal.Header>
                <Form onSubmit={handleSubcategorySubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Parent Category</Form.Label>
                            <Form.Select {...register('parentCategory')} defaultValue="">
                                <option value="" disabled>Select Parent Category</option>
                                {categories.map((category) => (
                                    <option key={category._id} value={category._id}>
                                        {category.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <FormInput
                                label="SubCategory Name"
                                type="text"
                                name="name"
                                containerClass="mb-3"
                                register={register}
                                placeholder="Enter Sub-Category Name here.."
                                errors={errors}
                                control={control}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Description</Form.Label>
                            <FormInput
                                type="textarea"
                                name="description"
                                containerClass="mb-3"
                                register={register}
                                placeholder="Enter Description here.."
                                errors={errors}
                                control={control}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Upload Image</Form.Label>
                            <div className="mb-2">
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    {'File Size: Upload images up to 5 MB.'}
                                </p>
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    {'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
                                </p>
                                <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                    {'Upload Limit: Only 1 image can be uploaded.'}
                                </p>
                            </div>
                            <SingleFileUploader
                                icon="ri-upload-cloud-2-line"
                                text="Drop file here or click to upload a product image."
                                onFileUpload={(file: File) => setSelectedImage(file)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setIsSubCategoryModalOpen(false)}>
                            Close
                        </Button>
                        <Button variant="success" type="submit" disabled={apiLoading}>
                            {apiLoading ? 'Adding...' : 'Save Sub-Category'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Brand Modal */}
            <Modal
                show={isBrandModalOpen}
                onHide={() => setIsBrandModalOpen(false)}
                dialogClassName="modal-dialog-centered"
            >
                <Modal.Header closeButton>
                    <h4 className="modal-title">Add New Brand</h4>
                </Modal.Header>
                <Form onSubmit={handleBrandsSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <FormInput
                                label="Name"
                                type="text"
                                name="name"
                                containerClass="mb-3"
                                register={register}
                                placeholder="Enter Brand Name here.."
                                errors={errors}
                                control={control}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Upload Logo</Form.Label>
                            <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                {'File Size: Upload images up to 5 MB.'}
                            </p>
                            <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                {'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
                            </p>
                            <SingleFileUploader
                                icon="ri-upload-cloud-2-line"
                                text="Drop file here or click to upload brand logo."
                                onFileUpload={(file: File) => setSelectedImage(file)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setIsBrandModalOpen(false)}>
                            Close
                        </Button>
                        <Button variant="success" type="submit" disabled={apiLoading}>
                            {apiLoading ? 'Adding...' : 'Save Brand'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* <Modal
                show={isSubSubCategoryModalOpen}
                onHide={() => setIsSubSubCategoryModalOpen(false)}
                dialogClassName="modal-dialog-centered"
            >
                <Modal.Header closeButton>
                    <h4 className="modal-title">Add New Sub-Sub-Category</h4>
                </Modal.Header>
                <Form onSubmit={handleSubSubCategorySubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Main Category</Form.Label>
                            <Controller
                                name="mainCategory"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={categoryOptions}
                                        onChange={(option) => {
                                            field.onChange(option)
                                            const filtered = subCategories.filter(
                                                (sub) => sub.parentCategory._id === option?.value
                                            )
                                            setFilteredSubCategories(filtered)
                                        }}
                                        placeholder="Select Main Category"
                                        isClearable
                                    />
                                )}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Sub Category</Form.Label>
                            <Controller
                                name="parentSubCategory"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={filteredSubCategories.map(sub => ({
                                            value: sub._id,
                                            label: sub.name
                                        }))}
                                        placeholder="Select Sub Category"
                                        isClearable
                                    />
                                )}
                            />
                        </Form.Group>

                        <FormInput
                            label="Sub-Sub-Category Name"
                            type="text"
                            name="name"
                            containerClass="mb-3"
                            register={register}
                            placeholder="Enter Sub-Sub-Category Name"
                            errors={errors}
                        />

                        <Form.Group className="mb-2">
                            <Form.Label>Description</Form.Label>
                            <FormInput
                                type="textarea"
                                name="description"
                                register={register}
                                placeholder="Enter Description"
                                errors={errors}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Upload Image</Form.Label>
                            <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                {'File Size: Upload images up to 5 MB.'}
                            </p>
                            <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                {'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
                            </p>
                            <SingleFileUploader
                                icon="ri-upload-cloud-2-line"
                                text="Drop file here or click to upload"
                                onFileUpload={(file: File) => setSelectedImage(file)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setIsSubSubCategoryModalOpen(false)}>
                            Close
                        </Button>
                        <Button variant="success" type="submit" disabled={apiLoading}>
                            {apiLoading ? 'Processing...' : 'Save'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal> */}



        </>
    )
}

export default ProductCategories
