import { PageBreadcrumb } from '@/components'
import {
	Button,
	Col,
	Form,
	Row,
} from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import 'react-quill/dist/quill.snow.css'
import 'react-quill/dist/quill.bubble.css'
import { useEffect, useState } from 'react'
import { ProductFormData, ProductVariant } from '@/types'
import { ProductFormLoader } from '../other/SimpleLoader'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import ProductGallery from '@/components/ProductGallery'
import ProductPublish from '@/components/ProductPublish'
import ProductBasicInfoSpecial from '@/components/ProductBasicInfoSpecial'
import ProductCategoriesSpecial from '@/components/ProductCategoriesSpecial'
import ProductFeatureImageSpecial from '@/components/ProductFeatureImageSpecial'
import ProductDetailTabSpecial from '@/components/ProductDetailTabSpecial'
import { BASE_CITY } from '@/constants'

interface CreateProductProps {
	isEditing?: boolean
	initialData?: any
	onSuccess?: () => void
}
type VariantType = {
	_id: string
	name: string
}

const CreateSpecialProduct = ({
	isEditing, initialData, onSuccess
}: CreateProductProps) => {
	// *************************** states **************************************
	const [description, setDescription] = useState('')
	const [isBestSeller, setIsBestSeller] = useState<boolean>(false)
	const [gallery, setGallery] = useState<File[]>([])
	const [loading, setLoading] = useState(false)
	const [apiLoading, setApiLoading] = useState(false)
	const [variants, setVariants] = useState<ProductVariant[]>([])
	const [variantValues, setVariantValues] = useState<VariantType[]>([])
	const [addedVariants, setAddedVariants] = useState<any[]>([])
	const [productStatus, setProductStatus] = useState('active')
	const [featureImageFile, setFeatureImageFile] = useState<File | null>(null)
	const [cities, setCities] = useState<Array<{ _id: string; name: string }>>([])
	const [selectedImageUrl, setSelectedImageUrl] = useState('')
	const [isExistingImage, setIsExistingImage] = useState(false)
	const [createdProductId, setCreatedProductId] = useState<string | null>(null)
	const [postApiloading, setPostApiLoading] = useState(false)
	const [isShopByPet, setIsShopByPet] = useState<boolean>(false)
	const [isServiceProduct, setIsServiceProduct] = useState<boolean>(false);
	const [isNewArrival, setIsNewArrival] = useState<boolean>(false)
	const [metaTitle, setMetaTitle] = useState('')
	const [metaDescription, setMetaDescription] = useState('')
	const [imageAltText, setImageAltText] = useState('')
	const [selectedCategories, setSelectedCategories] = useState<string>('')
	const [productType, setProductType] = useState<string>('')
	const [addedPrices, setAddedPrices] = useState<
		Array<{ city: string; cityName: string; amount: string; salePrice?: string }>
	>([])
	const [createdProductData, setCreatedProductData] = useState<any>(null)
	const [localSalePrice, setLocalSalePrice] = useState('')

	// *************************** hooks & basics **************************************
	const BASE_API = import.meta.env.VITE_BASE_API
	const { user } = useAuthContext()
	const { token } = user

	const {
		handleSubmit,
		register,
		control,
		reset,
		getValues,
		formState: { errors },
	} = useForm<ProductFormData>({
		defaultValues: isEditing
			? {
				name: initialData?.name,
				description: initialData?.description,
				sku: initialData?.sku,
			}
			: {
				name: '',
				description: '',
				sku: '',
			},
	})

	// *************************** handle functions **************************************

	const uniqueVariantTypes = variants
		?.map((variant) => variant.variantName)
		?.filter(
			(variant, index, self) =>
				index === self.findIndex((v) => v._id === variant?._id) // keep only unique _id
		)


	const handleImageSelect = (imageUrl: string) => {
		setSelectedImageUrl(imageUrl)
	}
	const handleFeatureImageUpload = (file: File) => {
		setFeatureImageFile(file)
	}
	const handleTypeChange = (type: string) => {
		setProductType(type); // Add this state
	};

	// *************************** post apis functions *****************************
	const handleUpdateProduct = async () => {
		if (createdProductId) {
			await handleSubmit((data) => onSubmit(data))()
		}
	}
	const onSubmit = async (data: ProductFormData) => {
		const formData = new FormData()

		// Required fields
		formData.append('name', data.name)
		formData.append('sku', data.sku)
		formData.append('type', productType);
		// Price object needs to be stringified
		if (addedPrices && addedPrices.length > 0) {
			addedPrices.forEach((price, index) => {
				formData.append(`prices[${index}][city]`, BASE_CITY)
				formData.append(`prices[${index}][amount]`, price.amount)
				formData.append(`prices[${index}][salePrice]`, price.salePrice || '')

			})
		}

		// Optional fields
		if (description) formData.append('description', description)
		if (productStatus) formData.append('status', productStatus)

		if (selectedCategories) formData.append('specialCategory', selectedCategories)

		if (addedVariants && addedVariants?.length > 0) {
			const variantIds = addedVariants?.flatMap(variant => variant.valueIds);
			variantIds.forEach((id, index) => {
				formData.append(`productVariants[${index}]`, id);
			});
		}

		if (featureImageFile) {
			formData.append('image', featureImageFile)
		}

		if (gallery.length > 0) {
			gallery.forEach((file) => {
				formData.append('gallery', file)
			})
		}
		console.log("formData  .", ...formData);

		try {
			setApiLoading(true)
			const response = await fetch(
				createdProductId || isEditing
					? `${BASE_API}/api/special-products/${createdProductId || initialData._id}`
					: `${BASE_API}/api/special-products`,
				{
					method: createdProductId || isEditing ? 'PUT' : 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				}
			)

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to Add Product')
			}

			const responseData = await response.json()

			setCreatedProductId(responseData._id) // Store the created product ID
			setCreatedProductData(responseData);
			if (response.ok) {
				Swal.fire({
					title: createdProductId || isEditing ? 'Updated!' : 'Added!',
					text: createdProductId || isEditing ? 'Product updated successfully.' : 'Product added successfully.',
					icon: 'success',
					timer: 1500,
				})
			}
			if (isEditing) {

				onSuccess?.()
			}
		} catch (error: any) {
			console.error('Error:', error)
			Swal.fire({
				title: 'Error!',
				text: error.message,
				icon: 'error',
			})
		} finally {
			setApiLoading(false)
		}
	}
	const handleSaveAsNew = async () => {
		const currentFormData = getValues()

		// Create FormData directly without reset
		const formData = new FormData()

		// Add all required fields including new SKU
		formData.append('name', currentFormData.name)
		formData.append('sku', currentFormData.sku) // Current SKU will be used
		formData.append('type', productType);


		// Add prices
		if (addedPrices && addedPrices.length > 0) {
			addedPrices.forEach((price, index) => {
				formData.append(`prices[${index}][city]`, BASE_CITY)
				formData.append(`prices[${index}][amount]`, price?.amount)
				formData.append(`prices[${index}][salePrice]`, price?.salePrice || '')

			})
		}


		// Add optional fields
		if (description) formData.append('description', description)
		if (productStatus) formData.append('status', productStatus)

		if (selectedCategories) formData.append('specialCategory', selectedCategories)

		// Add gallery
		if (gallery.length > 0) {
			gallery.forEach((file) => {
				formData.append('gallery', file)
			})
		}
		if (featureImageFile) {
			formData.append('image', featureImageFile)
		}
		try {
			setPostApiLoading(true)
			const response = await fetch(
				`${BASE_API}/api/special-products`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				}
			)

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to create product')
			}

			const responseData = await response.json()
			setCreatedProductId(responseData._id)

			Swal.fire({
				title: 'Success!',
				text: 'New product created successfully',
				icon: 'success',
				timer: 1500,
			})
		} catch (error: any) {
			Swal.fire({
				title: 'Error!',
				text: error.message,
				icon: 'error',
			})
		} finally {
			setPostApiLoading(false)
		}
	}

	// ****************************** getting data from api **********************


	const getVariants = async () => {
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
			if (data) {
				setVariants(data)
			}
		} catch (error: any) {
			console.error('Error getting product variants data:', error)
		} finally {
			setLoading(false)
		}
	}

	const getCities = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/cities`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (!response.ok) {
				throw new Error('Failed to fetch cities')
			}
			const data = await response.json()
			setCities(data)
		} catch (error) {
			console.error('Error fetching cities:', error)
		}
	}

	useEffect(() => {
		const loadInitialData = async () => {
			await Promise.all([
				getVariants(),
				getCities(),
			])
			console.log("initial data of update ", initialData);

			if (isEditing && initialData) {
				reset({
					name: initialData.name,
					sku: initialData.sku,
				})

				setDescription(initialData.description || '')
				setProductStatus(initialData.status || 'active')
				setProductType(initialData.type || '')

				setSelectedCategories(initialData.categories)


				if (initialData.prices?.length) {
					setAddedPrices(
						initialData.prices.map((price: any) => ({
							city: price.city._id,
							cityName: price.city.name,
							amount: price.amount,
							salePrice: price.salePrice || ''
						}))
					)
					setLocalSalePrice(initialData.prices[0]?.salePrice || '')

				}
			}
		}
		console.log(setVariantValues);

		loadInitialData()
	}, [isEditing, initialData])

	// **************************** render **************************************]
	if (loading) {
		return <ProductFormLoader />
	}

	return (
		<>
			{!isEditing &&
				<PageBreadcrumb
					title={isEditing ? 'Edit Product' : 'Add New Product'}
					subName="Products"
				/>
			}
			<Form onSubmit={handleSubmit(onSubmit)}>
				<Row>
					<Col xs={12} md={8}>
						{/* Basics Details */}
						<ProductBasicInfoSpecial
							register={register}
							control={control}
							errors={errors}
							description={description}
							setDescription={setDescription}
							isEditing={isEditing}
						/>
						{/* Gallery Sections */}
						<ProductGallery setGallery={setGallery} />

						{/* Tabs Sections */}
						<ProductDetailTabSpecial
							cities={cities}
							addedPrices={addedPrices}
							setAddedPrices={setAddedPrices}
							uniqueVariantTypes={uniqueVariantTypes}
							addedVariants={addedVariants}
							setAddedVariants={setAddedVariants}
							variantValues={variantValues}
							register={register}
							control={control}
							errors={errors}
							isBestSeller={isBestSeller}
							setIsBestSeller={setIsBestSeller}
							variants={variants}
							parentProducts={createdProductData}
							isEditing={isEditing}
							initialVariants={initialData?.variants}
							isShopByPet={isShopByPet}
							setIsShopByPet={setIsShopByPet}
							isServiceProduct={isServiceProduct}
							setIsServiceProduct={setIsServiceProduct}
							isNewArrival={isNewArrival}
							setIsNewArrival={setIsNewArrival}
							localSalePrice={localSalePrice}
							setLocalSalePrice={setLocalSalePrice}
							metaTitle={metaTitle}
							setMetaTitle={setMetaTitle}
							metaDescription={metaDescription}
							setMetaDescription={setMetaDescription}
						/>

					</Col>
					{/* sideBar */}
					<Col xs={12} md={4}>
						{/* category section */}
						<ProductCategoriesSpecial
							onCategoryChange={(categoryIds) => setSelectedCategories(categoryIds)}
							onTypeChange={handleTypeChange}
							initialData={initialData}
							token={token}
							BASE_API={BASE_API}
						/>

						{/* Publish Section */}
						<ProductPublish
							productStatus={productStatus}
							setProductStatus={setProductStatus}
							register={register}
							errors={errors}
							control={control}
						/>
						{/* Tags Section */}

						{/* Feature Image Section */}
						<ProductFeatureImageSpecial
							selectedImage={selectedImageUrl}
							onImageSelect={handleImageSelect}
							onImageUpload={handleFeatureImageUpload}
							isExistingImage={isExistingImage}
							setIsExistingImage={setIsExistingImage}
							initialImage={initialData?.image}
							imageAltText={imageAltText}
							setImageAltText={setImageAltText}
						/>
					</Col>
				</Row>
				{isEditing ? (
					<Button
						variant="primary"
						onClick={handleSubmit(onSubmit)}
						disabled={apiLoading}
					>
						{apiLoading ? 'Updating...' : 'Update Product'}
					</Button>
				) : (
					<>
						{!createdProductId ? (
							<Button variant="success" type="submit" disabled={apiLoading}>
								{apiLoading ? 'Adding...' : 'Save Product'}
							</Button>
						) : (
							<div className="d-flex gap-2">
								<Button
									variant="primary"
									onClick={handleUpdateProduct}
									disabled={apiLoading}
								>
									{apiLoading ? 'Updating...' : 'Update Product'}
								</Button>
								<Button
									variant="success"
									onClick={handleSaveAsNew}
									disabled={postApiloading}
								>
									{postApiloading ? 'Saving...' : 'Save as New'}
								</Button>
							</div>
						)}
					</>
				)}

			</Form>
		</>
	)
}

export default CreateSpecialProduct
