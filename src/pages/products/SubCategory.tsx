import { FormInput, PageBreadcrumb } from '@/components'
import {
	Button,
	Card,
	Form,
	Table,
	Pagination as BootstrapPagination,
	Modal,
} from 'react-bootstrap'
import { MdDelete, MdEdit } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import { useForm } from 'react-hook-form'
import { TableRecord } from './Categories'
import { memo, useEffect, useState } from 'react'
// import { FaDownload, FaFileCsv } from 'react-icons/fa6'
import Select from 'react-select'
import { TableRowSkeleton } from '../other/SimpleLoader'

interface SubCategorySection {
	id: string;
	name: string;
	sortOrder: number;
	section: 'one' | 'two' | 'three';
}

interface LandingPageSubCategoryModalProps {
	show: boolean;
	onHide: () => void;
	sectionOneCategories: SubCategorySection[];
	sectionTwoCategories: SubCategorySection[];
	sectionThreeCategories: SubCategorySection[];
	availableSubCategories: Array<{ value: string; label: string }>;
	onSave: (sections: {
		sectionOne: SubCategorySection[];
		sectionTwo: SubCategorySection[];
		sectionThree: SubCategorySection[];
	}) => Promise<void>;
	isSubmitting: boolean;
}
interface SectionFourData {
	section: number;
	subCategoryIds: string[];
	sortOrders: number[];
}

interface OptionFourModalProps {
	show: boolean;
	onHide: () => void;
	sectionOneCategories: SubCategorySection[];
	sectionTwoCategories: SubCategorySection[];
	sectionThreeCategories: SubCategorySection[];
	availableSubCategories: Array<{ value: string; label: string }>;
	onSave: (sections: SectionFourData[]) => Promise<void>;
	isSubmitting: boolean;
}


const SubCategory = () => {
	const { isSuperUser, permissions, user } = useAuthContext()
	const canUpdate = isSuperUser || permissions.Products?.Update
	const canDelete = isSuperUser || permissions.Products?.Delete
	const canCreate = isSuperUser || permissions.Products?.Create
	// const canView = isSuperUser || permissions.Products?.View

	const [selectedRows, setSelectedRows] = useState<number[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(15)
	const [sortedAsc, setSortedAsc] = useState(true)
	const [showDeleteButton, setShowDeleteButton] = useState(false)
	const [selectedImage, setSelectedImage] = useState<File | null>(null)
	const [loading, setLoading] = useState(false)
	const [parentCategories, setParentCategories] = useState<TableRecord[]>([])
	const [apiLoading, setApiLoading] = useState(false)
	const [subCategoryData, setSubCategoryData] = useState<TableRecord[]>([])
	// const fileInputRef = useRef<HTMLInputElement>(null)
	const [editingSubCategory, setEditingSubCategory] =
		useState<TableRecord | null>(null)
	const [isOpen, toggleModal] = useToggle()

	const [showLandingPageModal, setShowLandingPageModal] = useState(false);
	const [sectionOneCategories, setSectionOneCategories] = useState<SubCategorySection[]>([]);
	const [sectionTwoCategories, setSectionTwoCategories] = useState<SubCategorySection[]>([]);
	const [sectionThreeCategories, setSectionThreeCategories] = useState<SubCategorySection[]>([]);

	const [showOptionFourModal, setShowOptionFourModal] = useState(false);
	const [optionFourSectionOne, setOptionFourSectionOne] = useState<SubCategorySection[]>([]);
	const [optionFourSectionTwo, setOptionFourSectionTwo] = useState<SubCategorySection[]>([]);
	const [optionFourSectionThree, setOptionFourSectionThree] = useState<SubCategorySection[]>([]);

	// const [isExportingSubcategories, setIsExportingSubcategories] = useState(false);


	const BASE_API = import.meta.env.VITE_BASE_API
	const token = user.token
	const {
		handleSubmit,
		register,
		control,
		reset,
		setValue,
		formState: { errors },
	} = useForm()

	useEffect(() => {
		setShowDeleteButton(selectedRows.length > 0)
	}, [selectedRows])

	useEffect(() => {
		setCurrentPage(1)
	}, [itemsPerPage])


	// const handleFileChange = async (
	// 	event: React.ChangeEvent<HTMLInputElement>
	// ) => {
	// 	const file = event.target.files?.[0]
	// 	if (!file) return

	// 	if (!file.name.endsWith('.csv')) {
	// 		Swal.fire({
	// 			title: 'Error',
	// 			text: 'Please upload a CSV file',
	// 			icon: 'error',
	// 			timer: 1500,
	// 		})
	// 		return
	// 	}

	// 	const formData = new FormData()
	// 	formData.append('file', file)

	// 	try {
	// 		setApiLoading(true)
	// 		const response = await fetch(
	// 			`${BASE_API}/api/categories/sub/bulk-upload`,
	// 			{
	// 				method: 'POST',
	// 				headers: {
	// 					Authorization: `Bearer ${token}`,
	// 				},
	// 				body: formData,
	// 			}
	// 		)

	// 		if (!response.ok) {
	// 			throw new Error('Failed to upload subcategories')
	// 		}
	// 		const response_data = await response.json()

	// 		Swal.fire({
	// 			title: 'Upload Complete!',
	// 			html: `
	// 			<div class="text-left">
	// 			<p>✅ ${response_data.created} subcategories created successfully</p>
	// 			${response_data.skipped > 0
	// 					? `<p>${response_data.skipped} subcategories skipped</p>`
	// 					: ''
	// 				}
	// 			</div>
	// 			`,
	// 			icon: 'success',
	// 			confirmButtonText: 'Great!',
	// 		})
	// 		await getAllSubCategories()
	// 	} catch (error: any) {
	// 		Swal.fire({
	// 			title: 'Error',
	// 			text: error.message || 'Failed to upload subcategories',
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

	const deleteSelectedSubCategory = async () => {
		try {
			console.log(' selected Rows ', selectedRows)

			const response = await fetch(
				`${BASE_API}/api/categories/subcategories`, // Correct endpoint
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

			getAllSubCategories() // Refresh the data after deletion
			Swal.fire({
				title: 'Deleted!',
				text: `All the selected ${selectedRows.length} SubCategory deleted successfully.`,
				icon: 'success',
				timer: 1500,
			})
		} catch (error: any) {
			// setError(error.message)
			Swal.fire('Oops!', 'SubCategory deletion failed.', 'error')
		}
	}
	const handleDeleteSelected = () => {
		Swal.fire({
			title: 'Are you sure?',
			text: `All the ${selectedRows.length} selected items will be deleted!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!',
		}).then((result) => {
			if (result.isConfirmed) {
				deleteSelectedSubCategory()
			}
		})
	}
	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelectedRows(subCategoryData.map((record) => record._id))
		} else {
			setSelectedRows([])
		}
	}

	const handleSelectRow = (_id: number) => {
		setSelectedRows((prev) =>
			prev.includes(_id)
				? prev.filter((row_id) => row_id !== _id)
				: [...prev, _id]
		)
	}

	// Add this function inside the SubCategory component
	// const handleDownloadTemplate = async () => {
	// 	try {
	// 		const response = await fetch(
	// 			`${BASE_API}/api/categories/download-subcategories-template`,
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
	// 		a.download = 'subcategories-template.csv'
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

	const deleteItem = async (user_id: string) => {
		try {
			setApiLoading(true)
			const response = await fetch(
				`${BASE_API}/api/categories/subcategory/${user_id}`,
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

			Swal.fire({
				title: 'Deleted!',
				text: 'Sub-Category deleted successfully.',
				icon: 'success',
				timer: 1500,
			})
			getAllSubCategories() // Refresh the data after deletion
		} catch (error: any) {
			console.error('Error deleting user:', error)
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
	const handleDeleteConfirmation = (user_id: string) => {
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
				deleteItem(user_id)
			}
		})
	}
	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
	}

	const handleSort = () => {
		setSortedAsc(!sortedAsc)
	}

	const filteredRecords = subCategoryData
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

	const toggleEditModal = (subCategory: TableRecord) => {
		setEditingSubCategory(subCategory)
		setValue('name', subCategory.name)
		setValue('description', subCategory.description || '')
		setValue('animal', subCategory.animal || '')
		setValue('parentCategory', subCategory.parentCategory._id)
		toggleModal()
	}
	const handleAddSubCategory = async (categoryData: any) => {
		// You can further handle this data and send it to an API endpoint here
		console.log('Sub Category Data:', categoryData)

		const formData = new FormData()
		formData.append('name', categoryData.name)
		formData.append('description', categoryData.description)
		formData.append('parentCategory', categoryData.parentCategory)
		if (selectedImage) {
			formData.append('image', selectedImage)
		}
		if (categoryData.animal) {
			formData.append('animal', categoryData.animal)
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
				throw new Error(
					errorMessage.message || 'Failed to add new Sub-category'
				)
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
				getAllSubCategories()
			}
		} catch (error: any) {
			console.error('Error adding sub-category:', error)
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
	const getAllSubCategories = async () => {
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

			console.log('data from sub-category ', data)

			if (data) {
				setSubCategoryData(data)
			}
		} catch (error: any) {
			console.error('Error getting category data :', error)
		} finally {
			setLoading(false)
		}
	}

	const getParentCategory = async () => {
		try {
			setLoading(true)
			const response = await fetch(`${BASE_API}/api/categories/category`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			})

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to get Category')
			}

			const data_res = await response.json()
			if (data_res.length > 0) {
				setParentCategories(data_res)
			}
			console.log(' data from api of categories get ', data_res)
		} catch (error: any) {
			console.error('Error getting category data :', error)
		} finally {
			setLoading(false)
		}
	}
	// Add handleUpdateSubCategory function
	const handleUpdateSubCategory = async (subCategoryData: any) => {
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
			const response = await fetch(
				`${BASE_API}/api/categories/subcategory/${editingSubCategory?._id}`,
				{
					method: 'PUT',
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				}
			)

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to Update Sub-Category')
			}

			const data_res = await response.json()
			if (data_res) {
				Swal.fire({
					title: 'Updated!',
					text: 'Sub-Category updated successfully!',
					icon: 'success',
					confirmButtonText: 'OK',
					timer: 1500,
				})
				getAllSubCategories()
				reset()
				setEditingSubCategory(null)
				toggleModal()
			}
		} catch (error: any) {
			console.error('Error Updating Sub-Category:', error)
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

	const handleLandingPageSubCategories = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/categories/subcategory`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (response.ok) {
				const data = await response.json();

				setSectionOneCategories(data
					.filter((sub: any) => sub.isOptionThreeSectionOne)
					.map((sub: any) => ({
						id: sub._id,
						name: sub.name,
						sortOrder: sub.sortOrderSectionOne,
						section: 'one'
					}))
				);

				setSectionTwoCategories(data
					.filter((sub: any) => sub.isOptionThreeSectionTwo)
					.map((sub: any) => ({
						id: sub._id,
						name: sub.name,
						sortOrder: sub.sortOrderSectionTwo,
						section: 'two'
					}))
				);

				setSectionThreeCategories(data
					.filter((sub: any) => sub.isOptionThreeSectionThree)
					.map((sub: any) => ({
						id: sub._id,
						name: sub.name,
						sortOrder: sub.sortOrderSectionThree,
						section: 'three'
					}))
				);
			}
		} catch (error) {
			console.error('Error fetching subcategories:', error);
		}
		setShowLandingPageModal(true);
	};

	const handleSaveSubCategories = async (sections: any) => {
		try {
			const response = await fetch(`${BASE_API}/api/categories/option3`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					sectionOneSubCategoryIds: sections.sectionOne.map((cat: any) => cat.id),
					sectionOneSortOrders: sections.sectionOne.map((cat: any) => cat.sortOrder),
					sectionTwoSubCategoryIds: sections.sectionTwo.map((cat: any) => cat.id),
					sectionTwoSortOrders: sections.sectionTwo.map((cat: any) => cat.sortOrder),
					sectionThreeSubCategoryIds: sections.sectionThree.map((cat: any) => cat.id),
					sectionThreeSortOrders: sections.sectionThree.map((cat: any) => cat.sortOrder),
				})
			});

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to update landing page subcategories')
			}

			Swal.fire({
				title: 'Success!',
				text: 'Landing page subcategories updated successfully',
				icon: 'success',
				timer: 1500
			});
			setShowLandingPageModal(false);
		} catch (error: any) {
			Swal.fire({
				title: 'Error',
				text: error.message,
				icon: 'error'
			});
		}
	};
	const handleOptionFourCategories = async () => {
		try {
			const response = await fetch(`${BASE_API}/api/categories/subcategory`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				const data = await response.json();

				setOptionFourSectionOne(data
					.filter((sub: any) => sub.isOptionFourSectionOne)
					.map((sub: any) => ({
						id: sub._id,
						name: sub.name,
						sortOrder: sub.sortOrderOptionFourSectionOne,
						section: 1
					}))
				);

				setOptionFourSectionTwo(data
					.filter((sub: any) => sub.isOptionFourSectionTwo)
					.map((sub: any) => ({
						id: sub._id,
						name: sub.name,
						sortOrder: sub.sortOrderOptionFourSectionTwo,
						section: 2
					}))
				);
				setOptionFourSectionThree(data
					.filter((sub: any) => sub.isOptionFourSectionThree)
					.map((sub: any) => ({
						id: sub._id,
						name: sub.name,
						sortOrder: sub.sortOrderOptionFourSectionThree,
						section: 3
					})))
			}
		} catch (error) {
			console.error('Error fetching option four subcategories:', error);
		}
		setShowOptionFourModal(true);
	};
	console.log(handleOptionFourCategories, handleLandingPageSubCategories);

	const handleSaveOptionFour = async (sections: SectionFourData[]) => {
		try {
			const response = await fetch(`${BASE_API}/api/categories/option4`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ sections })
			});

			if (!response.ok) {
				const errorMessage = await response.json()
				throw new Error(errorMessage.message || 'Failed to update option four subcategories')
			}

			Swal.fire({
				title: 'Success!',
				text: 'Secondary subcategories updated successfully',
				icon: 'success',
				timer: 1500
			});
			setShowOptionFourModal(false);
		} catch (error: any) {
			Swal.fire({
				title: 'Error',
				text: error.message,
				icon: 'error'
			});
		}
	};
	// const handleExportSubcategories = async () => {
	// 	setIsExportingSubcategories(true);
	// 	try {
	// 		const response = await fetch(`${BASE_API}/api/categories/subcategories/download-data`, {
	// 			headers: {
	// 				Authorization: `Bearer ${token}`,
	// 			},
	// 		});
	// 		const blob = await response.blob();
	// 		const url = window.URL.createObjectURL(blob);
	// 		const a = document.createElement('a');
	// 		a.href = url;
	// 		a.download = 'subcategories.csv';
	// 		document.body.appendChild(a);
	// 		a.click();
	// 		document.body.removeChild(a);
	// 	} catch (error) {
	// 		console.error('Error exporting subcategories:', error);
	// 	} finally {
	// 		setIsExportingSubcategories(false);
	// 	}
	// };


	// Add useEffect for form reset on modal close
	useEffect(() => {
		if (!isOpen) {
			reset()
			setSelectedImage(null)
			setEditingSubCategory(null)
		}
	}, [isOpen, reset])

	useEffect(() => {
		getAllSubCategories()
		getParentCategory()
	}, [])

	const categoryHeaders: any = [
		{ width: '20px', type: 'checkbox' },
		{ width: '80px', type: 'image' },
		{ width: '100px', type: 'text' },
		{ width: '120px', type: 'text' },
		{ width: '150px', type: 'text' },
		{ width: '100px', type: 'actions' }
	]
	return (
		<>
			<PageBreadcrumb title="Sub-Category" subName="Products" />
			<Card>
				<Card.Header>
					<div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
						<div>
							<h4 className="header-title">Sub-Category Management</h4>
							<p className="text-muted mb-0">
								Add and Manage your all Product sub-categories here.
							</p>
						</div>
						<div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
							{/* <Button
								className="btn btn-primary mt-3 mt-lg-0 me-2"
								onClick={handleExportSubcategories}
								disabled={isExportingSubcategories}
							>
								{isExportingSubcategories ? (
									<>
										<span className="spinner-border spinner-border-sm me-1" role="status" />
										Downloading...
									</>
								) : (
									<>
										<i className="ri-download-2-line me-1"></i>
										Export Subcategories
									</>
								)}
							</Button>
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
								{apiLoading ? 'Uploading...' : 'Bulk Import SubCategory'}
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
								style={{ border: 'none' }}
								variant="success"
								onClick={() => toggleModal()}
								className="mb-2 mb-sm-0">
								<i className="bi bi-plus"></i> Add New Sub-Category
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
										placeholder="Search SubCategory..."
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
								variant="info"
								className="d-flex align-items-center mb-2 mb-sm-0 me-2"
								onClick={handleLandingPageSubCategories}>
								<i className="bi bi-layout-text-window-reverse me-2"></i>
								Manage Landing Page SubCategories
							</Button>
							<Button
								variant="info"
								className="d-flex align-items-center mb-2 mb-sm-0 me-2"
								onClick={handleOptionFourCategories}>
								<i className="bi bi-grid-3x3-gap me-2"></i>
								Manage Secondary SubCategories
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
											checked={selectedRows.length === subCategoryData.length}
										/>{' '}
									</th>

									<th>Image</th>
									<th>Parent Category</th>
									<th>
										<span onClick={handleSort} style={{ cursor: 'pointer' }}>
											SubCategory {sortedAsc ? '↑' : '↓'}
										</span>
									</th>
									<th>Description</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<TableRowSkeleton headers={categoryHeaders} rowCount={3} />
								) :
									paginatedRecords?.length > 0 ? (
										(paginatedRecords || []).map((record, _idx) => {
											const isSelected = selectedRows.includes(record._id)
											return (
												<tr key={_idx}>
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
													<td>{record.parentCategory.name}</td>
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
					onHide={toggleModal}
					dialogClassName="modal-dialog-centered">
					<Modal.Header closeButton>
						<h4 className="modal-title">
							{editingSubCategory
								? 'Update Sub-Category'
								: 'Add New Sub-Category'}
						</h4>
					</Modal.Header>
					<Form
						onSubmit={handleSubmit(
							editingSubCategory
								? handleUpdateSubCategory
								: handleAddSubCategory
						)}>
						<Modal.Body>
							<Form.Group className="mb-3">
								<Form.Label>Parent Category</Form.Label>
								<Form.Select {...register('parentCategory')} defaultValue="">
									<option value="" disabled>
										Select Parent Category
									</option>
									{parentCategories ? (
										parentCategories.map((category) => (
											<option key={category._id} value={category._id}>
												{category.name}
											</option>
										))
									) : (
										<option>No Parent Categories Available</option>
									)}
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
								<Form.Label>Image</Form.Label>
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
									onFileUpload={(file: File) => setSelectedImage(file)} // Handle image selection separately
								/>
								{editingSubCategory?.image && (
									<div className="mt-3 d-flex flex-column">
										<Form.Label>Current Image</Form.Label>
										<img
											src={`${BASE_API}/uploads/images/${editingSubCategory.image}`}
											alt="Sub-Category"
											className="img-thumbnail mb-3"
											style={{ width: '100px', height: '100px' }}
										/>
									</div>
								)}
							</Form.Group>
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
										? 'Update Sub-Category'
										: 'Save Sub-Category'}
							</Button>
						</Modal.Footer>
					</Form>
				</Modal>
			</Card>
			<LandingPageSubCategoryModal
				show={showLandingPageModal}
				onHide={() => setShowLandingPageModal(false)}
				sectionOneCategories={sectionOneCategories}
				sectionTwoCategories={sectionTwoCategories}
				sectionThreeCategories={sectionThreeCategories}
				availableSubCategories={subCategoryData.map((sub: any) => ({
					value: sub._id,
					label: sub.name
				}))}
				onSave={handleSaveSubCategories}
				isSubmitting={apiLoading}
			/>
			<OptionFourModal
				show={showOptionFourModal}
				onHide={() => setShowOptionFourModal(false)}
				sectionOneCategories={optionFourSectionOne}
				sectionTwoCategories={optionFourSectionTwo}
				sectionThreeCategories={optionFourSectionThree}
				availableSubCategories={subCategoryData.map((sub: any) => ({
					value: sub._id,
					label: sub.name
				}))}
				onSave={handleSaveOptionFour}
				isSubmitting={apiLoading}
			/>
		</>
	)
}
export default SubCategory


const LandingPageSubCategoryModal = memo(({
	show,
	onHide,
	sectionOneCategories,
	sectionTwoCategories,
	sectionThreeCategories,
	availableSubCategories,
	onSave,
	isSubmitting
}: LandingPageSubCategoryModalProps) => {
	const [localSectionOne, setLocalSectionOne] = useState<SubCategorySection[]>([]);
	const [localSectionTwo, setLocalSectionTwo] = useState<SubCategorySection[]>([]);
	const [localSectionThree, setLocalSectionThree] = useState<SubCategorySection[]>([]);

	useEffect(() => {
		if (show) {
			setLocalSectionOne(sectionOneCategories);
			setLocalSectionTwo(sectionTwoCategories);
			setLocalSectionThree(sectionThreeCategories);
		}
	}, [show, sectionOneCategories, sectionTwoCategories, sectionThreeCategories]);

	const handleSectionOneSelect = (selected: any) => {
		setLocalSectionOne(selected.map((item: any, index: number) => ({
			id: item.value,
			name: item.label,
			sortOrder: index + 1,
			section: 'one'
		})));
	};

	const handleSectionTwoSelect = (selected: any) => {
		setLocalSectionTwo(selected.map((item: any, index: number) => ({
			id: item.value,
			name: item.label,
			sortOrder: index + 1,
			section: 'two'
		})));
	};

	const handleSectionThreeSelect = (selected: any) => {
		setLocalSectionThree(selected.map((item: any, index: number) => ({
			id: item.value,
			name: item.label,
			sortOrder: index + 1,
			section: 'three'
		})));
	};

	const handleSave = async () => {
		await onSave({
			sectionOne: localSectionOne,
			sectionTwo: localSectionTwo,
			sectionThree: localSectionThree
		});
	};

	return (
		<Modal show={show} onHide={onHide} size="lg">
			<Modal.Header closeButton>
				<h4 className="modal-title">Manage Landing Page SubCategories</h4>
			</Modal.Header>
			<Modal.Body>
				{/* Section One */}
				<div className="mb-4">
					<h5 className="d-flex align-items-center">
						Section 2 <i
							className="ri-information-line ms-1"
							title="See the Name of Section 2 in Feature Title in Content Mangement"
							style={{ cursor: 'help' }}
						/>
						<span className="ms-2 text-muted" style={{ fontSize: '0.9rem' }}>
							(Select up to 4 subcategories)
						</span>
					</h5>
					<Select
						isMulti
						options={availableSubCategories}
						onChange={handleSectionOneSelect}
						value={availableSubCategories.filter(option =>
							localSectionOne.some(cat => cat.id === option.value)
						)}
						isOptionDisabled={() => localSectionOne.length >= 4}
					/>
					<Table className="mt-2">
						<thead>
							<tr>
								<th>Name</th>
								<th>Sort Order</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{localSectionOne.map((item, idx) => (
								<tr key={item.id}>
									<td>{item.name}</td>
									<td>
										<Form.Control
											type="number"
											min="1"
											value={item.sortOrder}
											onChange={(e) => {
												const newItems = [...localSectionOne];
												newItems[idx].sortOrder = parseInt(e.target.value);
												setLocalSectionOne(newItems);
											}}
											style={{ width: "80px" }}
										/>
									</td>
									<td>
										<Button
											variant="danger"
											size="sm"
											onClick={() => {
												setLocalSectionOne(prev =>
													prev.filter(cat => cat.id !== item.id)
												);
											}}>
											<MdDelete />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				</div>
				{/* Section Two */}
				<div className="mb-4">
					<h5 className="d-flex align-items-center">
						Section 19 <i
							className="ri-information-line ms-1"
							title="See the Name of Section 19 in Feature Title in Content Mangement"
							style={{ cursor: 'help' }}
						/>
						<span className="ms-2 text-muted" style={{ fontSize: '0.9rem' }}>
							(Select up to 4 subcategories)
						</span>
					</h5>
					<Select
						isMulti
						options={availableSubCategories}
						onChange={handleSectionTwoSelect}
						value={availableSubCategories.filter(option =>
							localSectionTwo.some(cat => cat.id === option.value)
						)}
						isOptionDisabled={() => localSectionTwo.length >= 4}
					/>
					<Table className="mt-2">
						<thead>
							<tr>
								<th>Name</th>
								<th>Sort Order</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{localSectionTwo.map((item, idx) => (
								<tr key={item.id}>
									<td>{item.name}</td>
									<td>
										<Form.Control
											type="number"
											min="1"
											value={item.sortOrder}
											onChange={(e) => {
												const newItems = [...localSectionTwo];
												newItems[idx].sortOrder = parseInt(e.target.value);
												setLocalSectionTwo(newItems);
											}}
											style={{ width: "80px" }}
										/>
									</td>
									<td>
										<Button
											variant="danger"
											size="sm"
											onClick={() => {
												setLocalSectionTwo(prev =>
													prev.filter(cat => cat.id !== item.id)
												);
											}}>
											<MdDelete />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				</div>
				{/* Section three */}
				<div className="mb-4">
					<h5 className="d-flex align-items-center">
						Section 20 <i
							className="ri-information-line ms-1"
							title="See the Name of Section 20 in Feature Title in Content Mangement"
							style={{ cursor: 'help' }}
						/>
						<span className="ms-2 text-muted" style={{ fontSize: '0.9rem' }}>
							(Select up to 4 subcategories)
						</span>
					</h5>
					<Select
						isMulti
						options={availableSubCategories}
						onChange={handleSectionThreeSelect}
						value={availableSubCategories.filter(option =>
							localSectionThree.some(cat => cat.id === option.value)
						)}
						isOptionDisabled={() => localSectionThree.length >= 4}
					/>
					<Table className="mt-2">
						<thead>
							<tr>
								<th>Name</th>
								<th>Sort Order</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{localSectionThree.map((item, idx) => (
								<tr key={item.id}>
									<td>{item.name}</td>
									<td>
										<Form.Control
											type="number"
											min="1"
											value={item.sortOrder}
											onChange={(e) => {
												const newItems = [...localSectionThree];
												newItems[idx].sortOrder = parseInt(e.target.value);
												setLocalSectionThree(newItems);
											}}
											style={{ width: "80px" }}
										/>
									</td>
									<td>
										<Button
											variant="danger"
											size="sm"
											onClick={() => {
												setLocalSectionThree(prev =>
													prev.filter(cat => cat.id !== item.id)
												);
											}}>
											<MdDelete />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				</div>
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

const OptionFourModal = memo(({ show, onHide, sectionOneCategories, sectionTwoCategories, sectionThreeCategories, availableSubCategories, onSave, isSubmitting }: OptionFourModalProps) => {
	const [localSectionOne, setLocalSectionOne] = useState<SubCategorySection[]>([]);
	const [localSectionTwo, setLocalSectionTwo] = useState<SubCategorySection[]>([]);
	const [localSectionThree, setLocalSectionThree] = useState<SubCategorySection[]>([]);

	useEffect(() => {
		if (show) {
			setLocalSectionOne(sectionOneCategories);
			setLocalSectionTwo(sectionTwoCategories);
			setLocalSectionThree(sectionThreeCategories);
		}
	}, [show, sectionOneCategories, sectionTwoCategories, sectionThreeCategories]);

	const handleSave = () => {
		const formattedData = [
			{
				section: 1,
				subCategoryIds: localSectionOne.map(cat => cat.id),
				sortOrders: localSectionOne.map(cat => cat.sortOrder)
			},
			{
				section: 2,
				subCategoryIds: localSectionTwo.map(cat => cat.id),
				sortOrders: localSectionTwo.map(cat => cat.sortOrder)
			},
			{
				section: 3,
				subCategoryIds: localSectionThree.map(cat => cat.id),
				sortOrders: localSectionThree.map(cat => cat.sortOrder)
			}
		];
		onSave(formattedData);
	};

	return (
		<Modal show={show} onHide={onHide} size="lg">
			<Modal.Header closeButton>
				<h4 className="modal-title">Manage Secondary SubCategories</h4>
			</Modal.Header>
			<Modal.Body>
				{/* Section One */}
				<div className="mb-4">
					<h5 className="d-flex align-items-center">
						Section 9 <i
							className="ri-information-line ms-1"
							title="See the Name of Section 9 in Feature Title in Content Mangement"
							style={{ cursor: 'help' }}
						/>
						<span className="ms-2 text-muted" style={{ fontSize: '0.9rem' }}>
							(Select exactly 3 subcategories)
						</span>
					</h5>
					<Select
						isMulti
						options={availableSubCategories}
						value={availableSubCategories.filter(option =>
							localSectionOne.some(cat => cat.id === option.value)
						)}
						onChange={(selected: any) => {
							if (selected.length <= 3) {
								setLocalSectionOne(selected.map((item: any, index: number) => ({
									id: item.value,
									name: item.label,
									sortOrder: index + 1,
									section: 1
								})));
							}
						}}
						isOptionDisabled={() => localSectionOne.length >= 3}
					/>
					<Table className="mt-2">
						<thead>
							<tr>
								<th>Name</th>
								<th>Sort Order</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{localSectionOne.map((item, idx) => (
								<tr key={item.id}>
									<td>{item.name}</td>
									<td>
										<Form.Control
											type="number"
											min="1"
											value={item.sortOrder}
											onChange={(e) => {
												const newItems = [...localSectionOne];
												newItems[idx].sortOrder = parseInt(e.target.value);
												setLocalSectionOne(newItems);
											}}
											style={{ width: "80px" }}
										/>
									</td>
									<td>
										<Button
											variant="danger"
											size="sm"
											onClick={() => {
												setLocalSectionOne(prev =>
													prev.filter(cat => cat.id !== item.id)
												);
											}}>
											<MdDelete />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				</div>

				{/* Section Two - Similar structure */}
				<div className="mb-4">
					<h5 className="d-flex align-items-center">
						Section 11 <i
							className="ri-information-line ms-1"
							title="See the Name of Section 11 in Feature Title in Content Mangement"
							style={{ cursor: 'help' }}
						/>
						<span className="ms-2 text-muted" style={{ fontSize: '0.9rem' }}>
							(Select exactly 3 subcategories)
						</span>
					</h5>
					<Select
						isMulti
						options={availableSubCategories}
						value={availableSubCategories.filter(option =>
							localSectionTwo.some(cat => cat.id === option.value)
						)}
						onChange={(selected: any) => {
							if (selected.length <= 3) {
								setLocalSectionTwo(selected.map((item: any, index: number) => ({
									id: item.value,
									name: item.label,
									sortOrder: index + 1,
									section: 1
								})));
							}
						}}
						isOptionDisabled={() => localSectionTwo.length >= 3}
					/>
					<Table className="mt-2">
						<thead>
							<tr>
								<th>Name</th>
								<th>Sort Order</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{localSectionTwo.map((item, idx) => (
								<tr key={item.id}>
									<td>{item.name}</td>
									<td>
										<Form.Control
											type="number"
											min="1"
											value={item.sortOrder}
											onChange={(e) => {
												const newItems = [...localSectionTwo];
												newItems[idx].sortOrder = parseInt(e.target.value);
												setLocalSectionTwo(newItems);
											}}
											style={{ width: "80px" }}
										/>
									</td>
									<td>
										<Button
											variant="danger"
											size="sm"
											onClick={() => {
												setLocalSectionTwo(prev =>
													prev.filter(cat => cat.id !== item.id)
												);
											}}>
											<MdDelete />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				</div>
				{/* Section Three */}
				<div className="mb-4">
					<h5 className="d-flex align-items-center">
						Section 10 <i
							className="ri-information-line ms-1"
							title="See the Name of Section 10 in Feature Title in Content Mangement"
							style={{ cursor: 'help' }}
						/>
						<span className="ms-2 text-muted" style={{ fontSize: '0.9rem' }}>
							(Select exactly 3 subcategories)
						</span>
					</h5>
					<Select
						isMulti
						options={availableSubCategories}
						value={availableSubCategories.filter(option =>
							localSectionThree.some(cat => cat.id === option.value)
						)}
						onChange={(selected: any) => {
							if (selected.length <= 3) {
								setLocalSectionThree(selected.map((item: any, index: number) => ({
									id: item.value,
									name: item.label,
									sortOrder: index + 1,
									section: 3
								})));
							}
						}}
						isOptionDisabled={() => localSectionThree.length >= 3}
					/>
					<Table className="mt-2">
						<thead>
							<tr>
								<th>Name</th>
								<th>Sort Order</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{localSectionThree.map((item, idx) => (
								<tr key={item.id}>
									<td>{item.name}</td>
									<td>
										<Form.Control
											type="number"
											min="1"
											value={item.sortOrder}
											onChange={(e) => {
												const newItems = [...localSectionThree];
												newItems[idx].sortOrder = parseInt(e.target.value);
												setLocalSectionThree(newItems);
											}}
											style={{ width: "80px" }}
										/>
									</td>
									<td>
										<Button
											variant="danger"
											size="sm"
											onClick={() => {
												setLocalSectionThree(prev =>
													prev.filter(cat => cat.id !== item.id)
												);
											}}>
											<MdDelete />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				</div>

			</Modal.Body>
			<Modal.Footer>
				<Button variant="light" onClick={onHide}>Close</Button>
				<Button
					variant="success"
					onClick={handleSave}
					disabled={isSubmitting || localSectionOne.length !== 3 || localSectionTwo.length !== 3 || localSectionThree.length !== 3}
				>
					{isSubmitting ? 'Saving...' : 'Save Changes'}
				</Button>
			</Modal.Footer>
		</Modal>
	);
});
