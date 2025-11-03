import { FormInput, PageBreadcrumb } from '@/components'
import {
	Button,
	Card,
	Form,
	Table,
	Pagination as BootstrapPagination,
	Modal,
} from 'react-bootstrap'
// import { FaDownload, FaFileCsv } from 'react-icons/fa6'
import Select from 'react-select'
import { memo, useCallback, useEffect, useMemo,  useState } from 'react'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import { useForm } from 'react-hook-form'
import React from 'react'
import { TableRowSkeleton } from '../other/SimpleLoader'
import { toastService } from '@/common/context/toast.service'

// basic tables
export interface TableRecord {
	_id: number
	name: string
	description?: string
	isNotShowed?: string
	animal?: string
	productCount?: string
	image?: string
	cell?: string
	activeClass?: string
	parentCategory?: any
}
interface Category {
	id: string;
	name: string;
	sortOrder: number;
	isOptionOne: boolean;
}

interface LandingPageModalProps {
	show: boolean;
	onHide: () => void;
	categories: Category[];
	availableCategories: Array<{ value: string | number; label: string }>;
	onSave: (categories: Category[]) => Promise<void>;
	isSubmitting: boolean;
	title: string;
}

const Categories = () => {
	const { isSuperUser, permissions, user } = useAuthContext()
	const canUpdate = isSuperUser || permissions.Products?.Update
	const canDelete = isSuperUser || permissions.Products?.Delete
	const canCreate = isSuperUser || permissions.Products?.Create

	const [selectedRows, setSelectedRows] = useState<number[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(15)
	const [sortedAsc, setSortedAsc] = useState(true)
	const [showDeleteButton, setShowDeleteButton] = useState(false)
	const [selectedImage, setSelectedImage] = useState<File | null>(null)
	const [apiLoading, setApiLoading] = useState(false)
	const [loading, setLoading] = useState(false)
	const [categoryData, setCategoryData] = useState<TableRecord[]>([])
	const [editingCategory, setEditingCategory] = useState<TableRecord | null>(
		null
	)
	// const fileInputRef = useRef<HTMLInputElement>(null)
	const [showLandingPageModal, setShowLandingPageModal] = useState(false);
	const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSecondaryModal, setShowSecondaryModal] = useState(false);
	const [selectedSecondaryCategories, setSelectedSecondaryCategories] = useState<Category[]>([]);
	const [isSubmittingSecondary, setIsSubmittingSecondary] = useState(false);
	// const [isExporting, setIsExporting] = useState(false);
	const [showGuidanceModal, setShowGuidanceModal] = useState(false);
	const [animalCategories, setAnimalCategories] = useState<Category[]>([]);
	const [lifestageCategories, setLifestageCategories] = useState<Category[]>([]);
	const [isSubmittingAnimal, setIsSubmittingAnimal] = useState(false);
	const [isSubmittingLifestage, setIsSubmittingLifestage] = useState(false);
	const [showAnimalModal, setShowAnimalModal] = useState(false);
	const [showLifestageModal, setShowLifestageModal] = useState(false);



	const BASE_API = import.meta.env.VITE_BASE_API
	const { token } = user

	const {
		handleSubmit,
		register,
		reset,
		control,
		setValue,
		formState: { errors },
	} = useForm()

	useEffect(() => {
		setShowDeleteButton(selectedRows.length > 0)
	}, [selectedRows])

	useEffect(() => {
		setCurrentPage(1)
	}, [itemsPerPage])


	useEffect(() => {
		getCategories()
	}, [])

	const deleteCategory = async (categoryId: string) => {
		try {
			const response = await fetch(
				`${BASE_API}/api/categories/category/${categoryId}`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
				}
			)

			if (!response.ok) {
				throw new Error('Failed to delete category')
			}

			getCategories() // Refresh the data after deletion
			Swal.fire({
				title: 'Deleted!',
				text: 'Category deleted successfully.',
				icon: 'success',
				timer: 1500,
			})
		} catch (error: any) {
			// setError(error.message)
			Swal.fire('Oops!', 'Category deletion failed.', 'error')
		}
	}
	const deleteSelectedCategory = async () => {
		try {
			console.log(' selected Rows ', selectedRows)

			const response = await fetch(
				`${BASE_API}/api/categories/categories`, // Correct endpoint
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ ids: selectedRows }), // Include the IDs in the body
				}
			)

			if (!response.ok) {
				throw new Error('Failed to delete category')
			}

			getCategories() // Refresh the data after deletion
			Swal.fire({
				title: 'Deleted!',
				text: `All the selected ${selectedRows.length} Category deleted successfully.`,
				icon: 'success',
				timer: 1500,
			})
		} catch (error: any) {
			// setError(error.message)
			Swal.fire('Oops!', 'Category deletion failed.', 'error')
		}
	}
	// Add this function inside the Categories component
	// const handleDownloadTemplate = async () => {
	// 	try {
	// 		const response = await fetch(
	// 			`${BASE_API}/api/categories/download-categories-template`,
	// 			{
	// 				method: 'GET',
	// 				headers: {
	// 					Authorization: `Bearer ${token}`,
	// 				},
	// 			}
	// 		)

	// 		if (!response.ok) throw new Error('Failed to download template')

	// 		const blob = await response.blob()
	// 		const url = window.URL.createObjectURL(blob)
	// 		const a = document.createElement('a')
	// 		a.href = url
	// 		a.download = 'categories-template.csv'
	// 		document.body.appendChild(a)
	// 		a.click()
	// 		document.body.removeChild(a)
	// 		window.URL.revokeObjectURL(url)
	// 	} catch (error) {
	// 		Swal.fire({
	// 			title: 'Error',
	// 			text: 'Failed to download template',
	// 			icon: 'error',
	// 			timer: 1500,
	// 		})
	// 	}
	// }

	const handleDeleteSelected = () => {
		Swal.fire({
			title: 'Are you sure?',
			text: `All the ${selectedRows.length} selected items will be deleted!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Remove All!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteSelectedCategory()
				console.log('delete user success')
			}
		})
		console.log('Delete IDs:', selectedRows)
	}
	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelectedRows(categoryData.map((record) => record._id))
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
			text: 'This Items will be deleted!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Remove!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteCategory(userId)
				console.log('delete user success')
			}
		})
	}
	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
	}

	const handleSort = () => {
		setSortedAsc(!sortedAsc)
	}

	const filteredRecords = categoryData
		.filter((record) =>
			record.name.toLowerCase().includes(searchTerm.toLowerCase())
		)
		.sort((a, b) =>
			sortedAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
		)

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}
	const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
	const paginatedRecords = filteredRecords.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)
	const [isOpen, toggleModal] = useToggle() // Using toggle for modal state
	const handletoggleModal = () => {
		if (isOpen) {
			reset({ name: '', description: '' })
			setSelectedImage(null)
			setEditingCategory(null)
		}
		toggleModal()
	}

	// *************************** apis call ********************************

	const handleAddCategory = async (categoryData: any) => {
		// You can further handle this data and send it to an API endpoint here

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

		formData.forEach((value, key) => {
			console.log(key, value)
		})

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
			}
		} catch (error: any) {
			console.error('Error Adding Category', error)
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

	// const handleFileChange = async (
	// 	event: React.ChangeEvent<HTMLInputElement>
	// ) => {
	// 	const file = event.target.files?.[0]
	// 	if (!file) return

	// 	// Validate file type
	// 	if (!file.name.endsWith('.csv')) {
	// 		Swal.fire({
	// 			title: 'Error',
	// 			text: 'Please upload a CSV file',
	// 			icon: 'error',
	// 			timer: 1500,
	// 		})
	// 		return
	// 	}

	// 	// // Validate file size (5MB limit)
	// 	// const MAX_FILE_SIZE = 5 * 1024 * 1024
	// 	// if (file.size > MAX_FILE_SIZE) {
	// 	// 	Swal.fire({
	// 	// 		title: 'Error',
	// 	// 		text: 'File size should not exceed 5MB',
	// 	// 		icon: 'error',
	// 	// 		timer: 1500,
	// 	// 	})
	// 	// 	return
	// 	// }

	// 	const formData = new FormData()
	// 	formData.append('file', file)

	// 	try {
	// 		setApiLoading(true)
	// 		const response = await fetch(
	// 			`${BASE_API}/api/categories/cat/bulk-upload`,
	// 			{
	// 				method: 'POST',
	// 				headers: {
	// 					Authorization: `Bearer ${token}`,
	// 				},
	// 				body: formData,
	// 			}
	// 		)

	// 		if (!response.ok) {
	// 			throw new Error('Failed to upload categories')
	// 		}
	// 		const response_data = await response.json()
	// 		console.log('data of csv response, ', response_data)

	// 		Swal.fire({
	// 			title: 'Upload Complete!',
	// 			html: `
	// 			<div class="text-left">
	// 			<p>✅ ${response_data.created} categories created successfully</p>
	// 			${response_data.skipped > 0
	// 					? `<p>${response_data.skipped} categories skipped (already exist)</p>`
	// 					: ''
	// 				}
	// 			</div>
	// 			`,
	// 			icon: 'success',
	// 			confirmButtonText: 'Great!',
	// 			// timer: 3000,
	// 		})
	// 		await getCategories()
	// 	} catch (error: any) {
	// 		Swal.fire({
	// 			title: 'Error',
	// 			text: error.message || 'Failed to upload categories',
	// 			icon: 'error',
	// 			timer: 1500,
	// 		})
	// 	} finally {
	// 		setApiLoading(false)
	// 		if (fileInputRef.current) {
	// 			fileInputRef.current.value = ''
	// 		}
	// 	}
	// }

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
				setCategoryData(data_res)
			}
			console.log(' date get from the api is ', data_res)
		} catch (error: any) {
			console.error('Error updating user Password:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleUpdateCategory = async (categoryData: any) => {
		console.log('Updating Category Data:', categoryData)

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
			console.log(
				'before sending the request see my the id ',
				editingCategory?._id
			)

			const response = await fetch(
				`${BASE_API}/api/categories/category/${editingCategory?._id}`,
				{
					method: 'PUT',
					headers: {
						Authorization: `${token}`,
					},
					body: formData,
				}
			)

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to Update Category')
			}

			const data_res = await response.json()
			if (data_res) {
				getCategories()
				handletoggleModal()
				Swal.fire({
					title: 'Updated!',
					text: 'Category updated successfully!',
					icon: 'success',
					confirmButtonText: 'OK',
					timer: 1500,
				})
				reset()
				setEditingCategory(null)
			}
		} catch (error: any) {
			console.error('Error Updating Category', error)
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
	
	// const handleExportCategories = async () => {
	// 	setIsExporting(true);
	// 	try {
	// 		const response = await fetch(`${BASE_API}/api/categories/categories/download-data`, {
	// 			headers: {
	// 				Authorization: `Bearer ${token}`,
	// 			},
	// 		});
	// 		const blob = await response.blob();
	// 		const url = window.URL.createObjectURL(blob);
	// 		const a = document.createElement('a');
	// 		a.href = url;
	// 		a.download = 'categories.csv';
	// 		document.body.appendChild(a);
	// 		a.click();
	// 		document.body.removeChild(a);
	// 	} catch (error) {
	// 		console.error('Error exporting categories:', error);
	// 	} finally {
	// 		setIsExporting(false);
	// 	}
	// };
	
	const handleAnimalCategories = async () => {
		setShowGuidanceModal(false);
		try {
			const response = await fetch(`${BASE_API}/api/categories/small-animals`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				const formattedCategories = data.map((cat: any) => ({
					id: cat._id,
					name: cat.name,
					sortOrder: cat.smallAnimalsSortOrder,
				}));
				setAnimalCategories(formattedCategories);
			}
		} catch (error) {
			console.error('Error fetching animal categories:', error);
		}
		setShowAnimalModal(true);
	};

	const handleLifestageCategories = async () => {
		setShowGuidanceModal(false);
		try {
			const response = await fetch(`${BASE_API}/api/categories/shop-by-lifestage`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				const formattedCategories = data.map((cat: any) => ({
					id: cat._id,
					name: cat.name,
					sortOrder: cat.shopByLifestageSortOrder,
				}));
				setLifestageCategories(formattedCategories);
			}
		} catch (error) {
			console.error('Error fetching lifestage categories:', error);
		}
		setShowLifestageModal(true);
	};
	const handleSaveAnimalCategories = async (categories: Category[]) => {
		try {
			setIsSubmittingAnimal(true);
			const response = await fetch(`${BASE_API}/api/categories/small-animals`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					categoryIds: categories.map(cat => cat.id),
					sortOrders: categories.map(cat => cat.sortOrder)
				})
			});

			if (!response.ok) {
				throw new Error('Failed to update animal categories');
			}

			Swal.fire({
				title: 'Success!',
				text: 'Animal categories updated successfully',
				icon: 'success',
				timer: 1500
			});
			setShowAnimalModal(false);
			setAnimalCategories(categories);
		} catch (error: any) {
			Swal.fire({
				title: 'Error',
				text: error.message,
				icon: 'error'
			});
		} finally {
			setIsSubmittingAnimal(false);
		}
	};

	const handleSaveLifestageCategories = async (categories: Category[]) => {
		try {
			setIsSubmittingLifestage(true);
			const response = await fetch(`${BASE_API}/api/categories/shop-by-lifestage`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					categoryIds: categories.map(cat => cat.id),
					sortOrders: categories.map(cat => cat.sortOrder)
				})
			});

			if (!response.ok) {
				throw new Error('Failed to update lifestage categories');
			}

			Swal.fire({
				title: 'Success!',
				text: 'Lifestage categories updated successfully',
				icon: 'success',
				timer: 1500
			});
			setShowLifestageModal(false);
			setLifestageCategories(categories);
		} catch (error: any) {
			Swal.fire({
				title: 'Error',
				text: error.message,
				icon: 'error'
			});
		} finally {
			setIsSubmittingLifestage(false);
		}
	};


	const toggleEditModal = (category: TableRecord) => {
		setEditingCategory(category)
		setValue('name', category.name)
		setValue('description', category.description || '')
		toggleModal()
	}
	useEffect(() => {
		if (!isOpen) {
			reset()
			setSelectedImage(null)
			setEditingCategory(null)
		}
	}, [isOpen, reset])

	// Update form values when editing category changes
	useEffect(() => {
		if (editingCategory) {
			setValue('name', editingCategory.name)
			setValue('description', editingCategory.description || '')
			setValue('animal', editingCategory.animal || '')
		} else {
			reset({ name: '', description: '', animal: '' })
		}
	}, [editingCategory, setValue, reset])


	const handleLandingPageCategories = async () => {
		setShowGuidanceModal(false);
		try {
			const response = await fetch(`${BASE_API}/api/categories/category`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (response.ok) {
				const data = await response.json()
				const formattedCategories = data
					.filter((cat: any) => cat.isOptionOne)
					.map((cat: any) => ({
						id: cat._id,
						name: cat.name,
						sortOrder: cat.sortOrderOptionOne,
						isOptionOne: true
					}))
				setSelectedCategories(formattedCategories)
			}
		} catch (error) {
			console.error('Error fetching categories:', error)
		}
		setShowLandingPageModal(true)
	}

	const availableCategories = useMemo(() =>
		categoryData.map(cat => ({
			value: cat._id.toString(), // Convert number to string
			label: cat.name
		})),
		[categoryData]
	);
	const handleSaveLandingPageCategories = useCallback(async (categories: Category[]) => {
		try {
			setIsSubmitting(true);
			const response = await fetch(`${BASE_API}/api/categories/option1/set-categories`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					categoryIds: categories.map(cat => cat.id),
					sortOrders: categories.map(cat => cat.sortOrder)
				})
			});

			if (!response.ok) {
				throw new Error('Failed to update landing page categories');
			}

			Swal.fire({
				title: 'Success!',
				text: 'Landing page categories updated successfully',
				icon: 'success',
				timer: 1500
			});
			setShowLandingPageModal(false);
			setSelectedCategories(categories);
		} catch (error: any) {
			Swal.fire({
				title: 'Error',
				text: error.message,
				icon: 'error'
			});
		} finally {
			setIsSubmitting(false);
		}
	}, [BASE_API, token]);

	const handleSecondaryCategories = async () => {
		setShowGuidanceModal(false);
		try {
			const response = await fetch(`${BASE_API}/api/categories/category`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				const formattedCategories = data
					.filter((cat: any) => cat.isOptionTwo)
					.map((cat: any) => ({
						id: cat._id,
						name: cat.name,
						sortOrder: cat.sortOrderOptionTwo,
						isOptionTwo: true
					}));
				setSelectedSecondaryCategories(formattedCategories);
			}
		} catch (error) {
			console.error('Error fetching secondary categories:', error);
		}
		setShowSecondaryModal(true);
	};

	const handleSaveSecondaryCategories = async (categories: Category[]) => {
		try {
			setIsSubmittingSecondary(true);
			const response = await fetch(`${BASE_API}/api/categories/option2`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					categoryIds: categories.map(cat => cat.id),
					sortOrders: categories.map(cat => cat.sortOrder)
				})
			});
			const responseData = await response.json();
			if (!response.ok) {
				throw new Error(responseData.error || responseData.message || 'Failed to update secondary categories');
			}

			Swal.fire({
				title: 'Success!',
				text: 'Data updated successfully',
				icon: 'success',
				timer: 1500
			});
			setShowSecondaryModal(false);
			setSelectedSecondaryCategories(categories);
		} catch (error: any) {
			toastService.error(error.message || 'An error occurred');
		} finally {
			setIsSubmittingSecondary(false);
		}
	};


	const categoryHeaders: any = [
		{ width: '20px', type: 'checkbox' },
		{ width: '80px', type: 'image' },
		{ width: '150px', type: 'text' },
		{ width: '200px', type: 'text' },
		{ width: '100px', type: 'actions' }
	]
	const LandingPageGuidanceModal = () => (
		<Modal
			show={showGuidanceModal}
			onHide={() => setShowGuidanceModal(false)}
			size="lg"
		>
			<Modal.Header closeButton>
				<Modal.Title>Manage Website Sectionss</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<div className="p-3">
					<div className="mb-4">
						<h5 className="mb-3">Landing Page Section to Manage</h5>
						<p className="text-muted">Select which section of the landing page you want to customize:</p>
						<div className="alert alert-info d-flex align-items-center">
							<i className="ri-information-line fs-4 me-2"></i>
							<div>
								<strong>Info:</strong> Visit <span className="fw-bold">'Feature Titles'</span> under Content Management in the sidebar to view the sort order numbers for each landing page section. This helps you identify exact section positions.
							</div>
						</div>
					</div>

					<div className="row g-3">
						<div className="col-md-6">
							<div className="card h-100 hover-shadow cursor-pointer"
								onClick={handleLandingPageCategories}>
								<div className="card-body">
									<div className="d-flex align-items-center mb-3">
										<i className="bi bi-layout-text-window-reverse fs-3 text-primary"></i>
										<h5 className="ms-3 mb-0">Section 18</h5>
									</div>
									<p className="text-muted mb-0">
										Selected categories will display their products in this section of the landing page.
									</p>
								</div>
							</div>
						</div>

						<div className="col-md-6">
							<div className="card h-100 hover-shadow cursor-pointer"
								onClick={handleSecondaryCategories}>
								<div className="card-body">
									<div className="d-flex align-items-center mb-3">
										<i className="bi bi-grid-3x3-gap fs-3 text-info"></i>
										<h5 className="ms-3 mb-0">Section 15,16 & 17</h5>
									</div>
									<p className="text-muted mb-0">
										Selected categories will display their products in this section of the landing page.
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className='mt-4'>
						<h5 className="mb-3">Mega Menu Section to Manage</h5>
						<p className="text-muted">Select which section of the mega menu you want to customize:</p>
						<div className='row g-3'>

							<div className="col-md-6">
								<div className="card h-100 hover-shadow cursor-pointer"
									onClick={handleAnimalCategories}>
									<div className="card-body">
										<div className="d-flex align-items-center mb-3">
											<i className="bi bi-shop fs-3 text-success"></i>
											<h5 className="ms-3 mb-0">Small Animal Menu</h5>
										</div>
										<p className="text-muted mb-0">
											Selected categories will display their products in the section of the Small Animal Menu.
										</p>
									</div>
								</div>
							</div>

							<div className="col-md-6">
								<div className="card h-100 hover-shadow cursor-pointer"
									onClick={handleLifestageCategories}>
									<div className="card-body">
										<div className="d-flex align-items-center mb-3">
											<i className="bi bi-calendar2-week fs-3 text-warning"></i>
											<h5 className="ms-3 mb-0">Shop By Lifestage Menu</h5>
										</div>
										<p className="text-muted mb-0">
											Selected categories will display their products in the section of the Shop By Lifestage Menu.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Modal.Body>
		</Modal>
	);
	return (
		<>
			<PageBreadcrumb title="Categories" subName="Products" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">Category Management</h4>
							<p className="text-muted mb-0">
								Add and Manage all your Product categories here.
							</p>
						</div>
						<div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
							{/* <Button
								className="btn btn-primary mt-3 mt-lg-0 me-2"
								onClick={handleExportCategories}
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
										Export Categories
									</>
								)} */}
							{/* </Button>
							<Button
								variant="info"
								className="d-flex align-items-center mb-2 mb-sm-0"
								onClick={handleDownloadTemplate}>
								<FaDownload className="me-2" />
								Download Template
							</Button>
							<Button
								disabled={!canCreate || apiLoading}
								variant="primary"
								className="d-flex align-items-center mb-2 mb-sm-0"
								onClick={() => fileInputRef.current?.click()}>
								<FaFileCsv className="me-2" />
								{apiLoading ? 'Importing...' : 'Bulk Import Category'}
							</Button>
							<input
								type="file"
								accept=".csv"
								ref={fileInputRef}
								style={{ display: 'none' }}
								onChange={handleFileChange}
							/> */}
							<Button
								disabled={!canCreate}
								variant="success"
								style={{ border: 'none' }}
								onClick={toggleModal}
								className="mb-2 mb-sm-0">
								<i className="bi bi-plus"></i> Add New Category
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
										placeholder="Search Category here..."
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
						<div className='d-flex flex-column flex-lg-row justify-content-between align-items-lg-center'>
							{/* <Button
								variant="primary"
								className="d-flex align-items-center mb-2 mb-sm-0 me-2"
								onClick={() => setShowGuidanceModal(true)}
							>
								<i className="bi bi-collection me-2"></i>
								Manage Website Sections
							</Button> */}
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
											checked={selectedRows.length === categoryData.length}
										/>{' '}
									</th>

									<th>Image</th>
									<th>
										<span onClick={handleSort} style={{ cursor: 'pointer' }}>
											Name {sortedAsc ? '↑' : '↓'}
										</span>
									</th>
									<th>Description</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<TableRowSkeleton headers={categoryHeaders} rowCount={6} />
								) : paginatedRecords.length > 0 ? (
									(paginatedRecords).map((record, idx) => {
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

												<td className="table-user">
													{record?.image ? (
														<img
															src={`${BASE_API}/uploads/images/${record.image}`}
															alt="category"
															className="me-2 rounded-circle"
														/>
													) : (
														''
													)}
												</td>
												<td>{record.name}</td>
												<td>{record.description}</td>
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
										<td colSpan={5} className="text-center">
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
				{/* Modal for adding a new category */}
				<Modal
					show={isOpen}
					onHide={handletoggleModal}
					dialogClassName="modal-dialog-centered">
					<Modal.Header closeButton>
						<h4 className="modal-title">
							{editingCategory ? 'Update Category' : 'Add New Category'}
						</h4>
					</Modal.Header>
					<Form
						onSubmit={handleSubmit(
							editingCategory ? handleUpdateCategory : handleAddCategory
						)}>
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
								<Form.Label>
									{editingCategory ? 'Upload New Image' : 'Upload Image'}
								</Form.Label>
								<div className="mb-2">
									<p
										style={{ fontSize: '0.8rem' }}
										className="text-danger mb-0">
										{'File Size: Upload images up to 5 MB.'}
									</p>
									<p
										style={{ fontSize: '0.8rem' }}
										className="text-danger mb-0">
										{'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
									</p>
									<p
										style={{ fontSize: '0.8rem' }}
										className="text-danger mb-0">
										{'Upload Limit: Only 1 image can be uploaded.'}
									</p>
								</div>
								<SingleFileUploader
									icon="ri-upload-cloud-2-line"
									text="Drop file here or click to upload a product image."
									onFileUpload={(file: File) => setSelectedImage(file)}
								/>
								{editingCategory?.image && (
									<div className="mt-3 d-flex flex-column ">
										<Form.Label>Current Image</Form.Label>
										<img
											src={`${BASE_API}/uploads/images/${editingCategory.image}`}
											alt="Category"
											className="img-thumbnail mb-3"
											style={{ width: '100px', height: '100px' }}
										/>
									</div>
								)}
							</Form.Group>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="light" onClick={handletoggleModal}>
								Close
							</Button>
							<Button
								variant="soft-success"
								type="submit"
								disabled={editingCategory ? !canUpdate : !canCreate}>
								{apiLoading
									? editingCategory
										? 'Updating...'
										: 'Adding...'
									: editingCategory
										? 'Update Category'
										: 'Save Category'}
							</Button>
						</Modal.Footer>
					</Form>
				</Modal>
			</Card>
			<LandingPageModal
				show={showLandingPageModal}
				onHide={() => setShowLandingPageModal(false)}
				categories={selectedCategories}
				availableCategories={availableCategories}
				onSave={handleSaveLandingPageCategories}
				isSubmitting={isSubmitting}
				title="Section 18 Landing Page Products"
			/>
			<LandingPageModal
				show={showSecondaryModal}
				onHide={() => setShowSecondaryModal(false)}
				categories={selectedSecondaryCategories}
				availableCategories={availableCategories}
				onSave={handleSaveSecondaryCategories}
				isSubmitting={isSubmittingSecondary}
				title="Section 15,16 & 17 Landing Page Products"
			/>
			<LandingPageModal
				show={showAnimalModal}
				onHide={() => setShowAnimalModal(false)}
				categories={animalCategories}
				availableCategories={availableCategories}
				onSave={handleSaveAnimalCategories}
				isSubmitting={isSubmittingAnimal}
				title="Animal Section Categories"
			/>

			<LandingPageModal
				show={showLifestageModal}
				onHide={() => setShowLifestageModal(false)}
				categories={lifestageCategories}
				availableCategories={availableCategories}
				onSave={handleSaveLifestageCategories}
				isSubmitting={isSubmittingLifestage}
				title="Shop By Lifestage Categories"
			/>
			<LandingPageGuidanceModal />

		</>
	)
}
export default Categories



// Memoized Table Component
const SelectedCategoriesTable = memo(({
	categories,
	onSortOrderChange,
	onRemove
}: {
	categories: Category[];
	onSortOrderChange: (index: number, newOrder: number) => void;
	onRemove: (id: string) => void;
}) => (
	<Table className="table-centered">
		<thead>
			<tr>
				<th>Category Name</th>
				<th>Sort Order</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{categories.map((category, idx) => (
				<tr key={category.id}>
					<td>{category.name}</td>
					<td>
						<Form.Control
							type="number"
							min="1"
							value={category.sortOrder}
							onChange={(e) => onSortOrderChange(idx, parseInt(e.target.value))}
							style={{ width: "80px" }}
						/>
					</td>
					<td>
						<Button
							variant="danger"
							size="sm"
							onClick={() => onRemove(category.id)}>
							<MdDelete />
						</Button>
					</td>
				</tr>
			))}
		</tbody>
	</Table>
));

// Memoized Modal Component
const LandingPageModal = memo(({
	show,
	onHide,
	categories,
	availableCategories,
	onSave,
	isSubmitting,
	title
}: LandingPageModalProps) => {
	const [localCategories, setLocalCategories] = useState<Category[]>([]);

	// Initialize local state when modal opens
	React.useEffect(() => {
		if (show) {
			setLocalCategories(categories);
		}
	}, [show, categories]);

	const handleCategorySelect = useCallback((selected: any) => {
		setLocalCategories(prev => {
			const newCategories = selected.map((item: any, index: number) => ({
				id: item.value,
				name: item.label,
				sortOrder: prev.length + index + 1,
				isOptionOne: true
			}));
			return [...prev, ...newCategories];
		});
	}, []);

	const handleSortOrderChange = useCallback((index: number, newOrder: number) => {
		setLocalCategories(prev => {
			const updated = [...prev];
			updated[index].sortOrder = newOrder;
			return updated;
		});
	}, []);

	const handleRemoveCategory = useCallback((categoryId: string) => {
		setLocalCategories(prev => prev.filter(cat => cat.id !== categoryId));
	}, []);

	const handleSave = useCallback(async () => {
		await onSave(localCategories);
	}, [localCategories, onSave]);

	const selectOptions = useMemo(() =>
		availableCategories.filter(cat =>
			!localCategories.find(sc => sc.id === cat.value)
		),
		[availableCategories, localCategories]
	);

	return (
		<Modal show={show} onHide={onHide} size="lg">
			<Modal.Header closeButton>
				<h4 className="modal-title">{title}</h4>
			</Modal.Header>
			<Modal.Body>
				<div className="mb-4">
					<Select
						isMulti
						options={selectOptions}
						onChange={handleCategorySelect}
						placeholder="Select categories to display"
					/>
				</div>

				<SelectedCategoriesTable
					categories={localCategories}
					onSortOrderChange={handleSortOrderChange}
					onRemove={handleRemoveCategory}
				/>
			</Modal.Body>

			<Modal.Footer>
				<Button variant="light" onClick={onHide}>
					Close
				</Button>
				<Button
					variant="success"
					onClick={handleSave}
					disabled={isSubmitting}
				>
					{isSubmitting ? 'Saving...' : 'Save Changes'}
				</Button>
			</Modal.Footer>
		</Modal>
	);
});


