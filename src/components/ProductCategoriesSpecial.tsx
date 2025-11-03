import { useState, useEffect } from 'react'
import { Card, Form, Button, Modal } from 'react-bootstrap'
import { FormInput } from '@/components'
import { Controller, useForm } from 'react-hook-form'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import Swal from 'sweetalert2'
import Select from 'react-select'

const TYPE_OPTIONS = [
    { value: 'supplies', label: 'Supplies' },
    { value: 'GWP', label: 'GWP' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'tool finding', label: 'Tool Finding' }
]

interface ProductCategoriesProps {
    onCategoryChange: (categoryIds: string) => void
    onTypeChange: (type: string) => void
    token: string
    BASE_API: string
    initialData?: any
}


const ProductCategories = ({
    onCategoryChange,
    token,
    initialData,
    BASE_API,
    onTypeChange,
}: ProductCategoriesProps) => {
    // States moved from CreateProduct
    const [categories, setCategories] = useState<any[]>([])
    const [isSearchingBrands, setIsSearchingBrands] = useState(false)
    const [isSearchingCategories, setIsSearchingCategories] = useState(false)
    const [selectedType, setSelectedType] = useState('')

    const [selectedCategories, setSelectedCategories] = useState<any>()

    const categoryOptions = categories.map(cat => ({
        value: cat._id,
        label: cat.name
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

    // ************************** get apis ******************************
    const getCategories = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/special-categories`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get categories')
            }

            const data_res: any[] = await response.json()
            if (data_res) {
                setCategories(data_res)
            }
        } catch (error: any) {
            console.error('Error getting categories api data : ', error)
        }
    }


    // ********************* post apis *************************
    const handleAddCategory = async (categoryData: any) => {
        const formData = new FormData()
        formData.append('name', categoryData.name)
        formData.append('description', categoryData.description)
        formData.append('type', categoryData.type.value)
        if (selectedImage) {
            formData.append('image', selectedImage)
        }

        setApiLoading(true)

        try {
            const response = await fetch(`${BASE_API}/api/special-categories`, {
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


    const handleCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        handleSubmit(handleAddCategory)()
    }


    useEffect(() => {
        getCategories()
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
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isSearchingCategories, isSearchingBrands])
    useEffect(() => {
        if (initialData) {
            setSelectedType(initialData.type);
            onTypeChange(initialData.type);

            // Set the initial category
            const categoryOption = {
                value: initialData.specialCategory._id,
                label: initialData.specialCategory.name
            };
            setSelectedCategories(categoryOption);
            onCategoryChange(initialData.specialCategory._id);
        }
    }, [initialData])

    return (
        <>
            <Card>
                <Card.Header>Product Categories</Card.Header>
                <Card.Body>
                    <div className="mb-3">
                        <h5 className="mb-2">Type <span style={{ color: 'red' }}>* </span></h5>
                        <Select
                            value={TYPE_OPTIONS.find(option => option.value === selectedType)}
                            onChange={(selected: any) => {
                                setSelectedType(selected.value);
                                onTypeChange(selected.value);
                            }}
                            options={TYPE_OPTIONS}
                            placeholder="Select Type"
                            required
                        />
                    </div>

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
                        value={selectedCategories}
                        onChange={(selected: any) => {
                            setSelectedCategories(selected);
                            onCategoryChange(selected.value); // Now sends single value
                        }}
                        options={categoryOptions}
                        placeholder="Select Category"
                        isClearable
                    />
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
                        <Form.Group className="mb-3">
                            <Form.Label>Type</Form.Label>
                            <Controller
                                name="type"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={TYPE_OPTIONS}
                                        className="react-select"
                                        classNamePrefix="react-select"
                                    />
                                )}
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

        </>
    )
}

export default ProductCategories
