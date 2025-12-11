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
import ProductBasicInfo from '@/components/ProductBasicInfo'
import ProductGallery from '@/components/ProductGallery'
import ProductDetailTabs from '@/components/ProductDetailTab'
import ProductCategories from '@/components/ProductCategories'
import ProductPublish from '@/components/ProductPublish'
import ProductTags from '@/components/ProductTags'
import ProductFeatureImage from '@/components/ProductFeatureImage'
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

const CreateProduct = ({
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
	// const [brands, setBrands] = useState<any[]>([])
	const [selectedBrand, setSelectedBrand] = useState('')
	const [productStatus, setProductStatus] = useState('active')
	const [tagInput, setTagInput] = useState('')
	const [productTags, setProductTags] = useState<any[]>([])
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [featureImageFile, setFeatureImageFile] = useState<File | null>(null)
	const [cities, setCities] = useState<Array<{ _id: string; name: string }>>([])
	const [selectedImageUrl, setSelectedImageUrl] = useState('')
	const [isExistingImage, setIsExistingImage] = useState(false)
	const [createdProductId, setCreatedProductId] = useState<string | null>(null)
	const [allTags, setAllTags] = useState<Array<{ _id: string; name: string }>>(
		[]
	)
	const [postApiloading, setPostApiLoading] = useState(false)
	const [isShopByPet, setIsShopByPet] = useState<boolean>(false)
	const [isServiceProduct, setIsServiceProduct] = useState<boolean>(false);
	const [isNewArrival, setIsNewArrival] = useState<boolean>(false)
	const [metaTitle, setMetaTitle] = useState('')
	const [metaDescription, setMetaDescription] = useState('')
	const [imageAltText, setImageAltText] = useState('')
	const [selectedCategories, setSelectedCategories] = useState<string[]>([])
	const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([])
	// const [selectedSubSubCategories, setSelectedSubSubCategories] = useState<string[]>([])

	const [filteredTags, setFilteredTags] = useState<
		Array<{ _id: string; name: string }>
	>([])
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
		.map((variant) => variant.variantName)
		.filter(
			(variant, index, self) =>
				index === self.findIndex((v) => v._id === variant._id) // keep only unique _id
		)

	const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		setTagInput(value)

		if (value.trim()) {
			const filtered = allTags.filter((tag) =>
				tag.name.toLowerCase().includes(value.toLowerCase())
			)
			setFilteredTags(filtered)
			setShowSuggestions(true)
		} else {
			setShowSuggestions(false)
		}
	}
	const handleAddTag = async (tagName: string, isNewTag: boolean = false) => {
		const trimmedTag = tagName.trim()
		if (trimmedTag && !productTags.some((tag) => tag.name === trimmedTag)) {
			if (isNewTag) {
				try {
					const response = await fetch(`${BASE_API}/api/tags`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({ name: trimmedTag }),
					})
					const data = await response.json()
					if (response.ok) {
						setAllTags([...allTags, data.tag])
						setProductTags([...productTags, data.tag])
					}
				} catch (error) {
					console.error('Error adding new tag:', error)
				}
			} else {
				const existingTag = allTags.find((tag) => tag.name === trimmedTag)
				if (existingTag) {
					setProductTags([...productTags, existingTag])
				}
			}
			setTagInput('')
			setShowSuggestions(false)
		}
	}

	const handleImageSelect = (imageUrl: string) => {
		setSelectedImageUrl(imageUrl)
	}
	const handleFeatureImageUpload = (file: File) => {
		setFeatureImageFile(file)
	}

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


		formData.append('currency', data.currency || 'PKR')
		// formData.append('isBestSeller', String(isBestSeller))
		// formData.append('isShopByPet', String(isShopByPet))
		// formData.append('isServiceProduct', String(isServiceProduct));
		// formData.append('isNewArrival', String(isNewArrival))

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
		if (selectedBrand) formData.append('brandId', selectedBrand)
		// if (data.videoLink) formData.append('videoLink', data.videoLink)
		if (productStatus) formData.append('lifecycleStage', productStatus)
		if (data.releaseDate) formData.append('releaseDate', data.releaseDate)
		if (metaTitle) formData.append('meta_title', metaTitle)
		if (metaDescription) formData.append('meta_description', metaDescription)
		if (imageAltText) formData.append('image_alt_text', imageAltText)
		// Add category arrays
		if (selectedCategories.length > 0) {
			selectedCategories.forEach((catId, index) => {
				formData.append(`category[${index}]`, catId)
			})
		}

		if (selectedSubCategories.length > 0) {
			selectedSubCategories.forEach((subCatId, index) => {
				formData.append(`subcategory[${index}]`, subCatId)
			})
		}

		// if (selectedSubSubCategories.length > 0) {
		// 	selectedSubSubCategories.forEach((subSubCatId, index) => {
		// 		formData.append(`subsubcategory[${index}]`, subSubCatId)
		// 	})
		// }
		if (productTags.length > 0) {
			productTags.forEach((tag) => {
				formData.append('tags[]', tag._id)
			})
		}
		if (addedVariants && addedVariants.length > 0) {
			const variantIds = addedVariants.flatMap(variant => variant.valueIds);
			variantIds.forEach((id, index) => {
				formData.append(`variants[${index}]`, id);
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

		try {
			setApiLoading(true)
			const response = await fetch(
				createdProductId || isEditing
					? `${BASE_API}/api/products/${createdProductId || initialData._id}`
					: `${BASE_API}/api/products`,
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

			setCreatedProductId(responseData.product._id) // Store the created product ID
			setCreatedProductData(responseData.product);
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
		formData.append('currency', currentFormData.currency || 'PKR')
		// formData.append('isBestSeller', String(isBestSeller))
		// formData.append('isShopByPet', String(isShopByPet))
		// formData.append('isServiceProduct', String(isServiceProduct));
		// formData.append('isNewArrival', String(isNewArrival))

		// Add prices
		if (addedPrices && addedPrices.length > 0) {
			addedPrices.forEach((price, index) => {
				formData.append(`prices[${index}][city]`, BASE_CITY)
				formData.append(`prices[${index}][amount]`, price.amount)
				formData.append(`prices[${index}][salePrice]`, price.salePrice || '')

			})
		}

		if (addedVariants && addedVariants.length > 0) {
			const variantIds = addedVariants.flatMap(variant => variant.valueIds);
			variantIds.forEach((id, index) => {
				formData.append(`variants[${index}]`, id);
			});
		}

		selectedCategories.forEach((catId, index) => {
			formData.append(`category[${index}]`, catId)
		})

		selectedSubCategories.forEach((subCatId, index) => {
			formData.append(`subcategory[${index}]`, subCatId)
		})

		// selectedSubSubCategories.forEach((subSubCatId, index) => {
		// 	formData.append(`subsubcategory[${index}]`, subSubCatId)
		// })

		// Add optional fields
		if (description) formData.append('description', description)
		if (selectedBrand) formData.append('brandId', selectedBrand)
		// if (selectedCategory) formData.append('category', selectedCategory)
		// if (selectedSubCategory) formData.append('subcategory', selectedSubCategory)
		// if (currentFormData.videoLink) formData.append('videoLink', currentFormData.videoLink)
		if (productStatus) formData.append('lifecycleStage', productStatus)
		if (currentFormData.releaseDate) formData.append('releaseDate', currentFormData.releaseDate)
		if (metaTitle) formData.append('meta_title', metaTitle)
		if (metaDescription) formData.append('meta_description', metaDescription)
		if (imageAltText) formData.append('image_alt_text', imageAltText)

		if (productTags.length > 0) {
			productTags.forEach((tag) => {
				formData.append('tags[]', tag._id)
			})
		}

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
				`${BASE_API}/api/products`,
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
			setCreatedProductId(responseData.product._id)

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
	const fetchAllTags = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/tags`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			const data = await response.json()
			setAllTags(data)
		} catch (error) {
			console.error('Error fetching tags:', error)
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
				fetchAllTags(),
				getCities(),
			])
			console.log("initial data of update ", initialData);

			if (isEditing && initialData) {
				reset({
					name: initialData?.name,
					sku: initialData?.sku,
					currency: initialData?.currency,
					videoLink: initialData?.videoLink,
					releaseDate: initialData?.releaseDate,
					brandId: initialData?.brandId,
				})

				setDescription(initialData?.description || '')
				setIsBestSeller(initialData?.isBestSeller || false)
				setSelectedBrand(initialData?.brandId || '',)
				setProductStatus(initialData?.lifecycleStage || 'active')
				setIsShopByPet(initialData?.isShopByPet || false)
				setIsServiceProduct(initialData?.isServiceProduct || false)
				setIsNewArrival(initialData?.isNewArrival || false)
				setMetaTitle(initialData?.meta_title || '')
				setMetaDescription(initialData?.meta_description || '')
				setImageAltText(initialData?.image_alt_text || '')

				setSelectedCategories(initialData?.categories?.map((cat: any) => cat?._id) || [])
				setSelectedSubCategories(initialData?.subcategories?.map((subCat: any) => subCat?._id) || [])
				// setSelectedSubSubCategories(initialData.subsubcategories?.map((subSubCat: any) => subSubCat._id) || [])

				if (initialData?.tags?.length) {
					setProductTags(
						initialData?.tags.map((tag: any) => ({
							_id: tag?._id,
							name: tag?.name,
						}))
					)
				}

				if (initialData?.prices?.length) {
					setAddedPrices(
						initialData?.prices?.map((price: any) => ({
							city: price?.city?._id,
							cityName: price?.city?.name,
							amount: price?.amount,
							salePrice: price?.salePrice || ''
						}))
					)
					setLocalSalePrice(initialData?.prices[0]?.salePrice || '')

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
						<ProductBasicInfo
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
						<ProductDetailTabs
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
						<ProductCategories
							onBrandChange={(brandId) => setSelectedBrand(brandId)}
							onCategoryChange={(categoryIds) => setSelectedCategories(categoryIds)}
							onSubCategoryChange={(subCategoryIds) => setSelectedSubCategories(subCategoryIds)}
							// onSubSubCategoryChange={(subSubCategoryIds) => setSelectedSubSubCategories(subSubCategoryIds)}
							token={token}
							BASE_API={BASE_API}
							initialData={initialData}
							initialBrand={initialData?.brandId}
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
						<ProductTags
							tagInput={tagInput}
							setTagInput={setTagInput}
							handleTagInputChange={handleTagInputChange}
							handleAddTag={handleAddTag}
							showSuggestions={showSuggestions}
							filteredTags={filteredTags}
							productTags={productTags}
							setProductTags={setProductTags}
						/>
						{/* Feature Image Section */}
						<ProductFeatureImage
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

export default CreateProduct
