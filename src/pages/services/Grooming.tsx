import { FormInput, PageBreadcrumb } from '@/components'
import Select from 'react-select'
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
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import { useForm } from 'react-hook-form'
import { SimpleLoader } from '../other/SimpleLoader'
import { useEffect, useState } from 'react'

interface TableRecord {
    _id: number
    name: string
    logo?: string
    price: number
    isFullGroom: boolean
    description: string
    petNames: any[]
    locations: any[]
}

const Grooming = () => {
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
    const [brandsData, setBrandsData] = useState<any[]>([])
    const [editingBrand, setEditingBrand] = useState<TableRecord | null>(null)
    const [petNameOptions, setPetNameOptions] = useState<Array<{ value: string, label: string }>>([])
    const [isPetModalOpen, togglePetModal] = useToggle()
    const [petNames, setPetNames] = useState<string[]>([])
    const [inputValue, setInputValue] = useState<string>('')
    const [isOpen, toggleModal] = useToggle()
    const [isAllPetsSelected, setIsAllPetsSelected] = useState(false)
    const [locationOptions, setLocationOptions] = useState<Array<{ value: string, label: string }>>([])
    const [isAllLocationsSelected, setIsAllLocationsSelected] = useState(false)
    const [locations, setLocations] = useState<string[]>([])
    const [locationInputValue, setLocationInputValue] = useState<string>('')
    const [isLocationModalOpen, toggleLocationModal] = useToggle()
    const [selectedPetFilter, setSelectedPetFilter] = useState<string | null>(null)
    const [selectedLocationFilter, setSelectedLocationFilter] = useState<string | null>(null)
    const [mainServiceOptions, setMainServiceOptions] = useState<Array<{ value: string, label: string }>>([])


    const BASE_API = import.meta.env.VITE_BASE_API
    const { token } = user
    const {
        handleSubmit,
        register,
        control,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm()


    // ************* Handle and Basic Functions *************

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(brandsData.map((record) => record._id))
        } else {
            setSelectedRows([])
        }
    }

    const handleSelectRow = (id: number) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        )
    }

    const handleDelete = (ids: number | number[]) => {
        const idsArray = Array.isArray(ids) ? ids : [ids]
        const message = idsArray.length > 1
            ? `All the ${idsArray.length} selected items will be deleted!`
            : 'This item will be deleted!'

        Swal.fire({
            title: 'Are you sure?',
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteServices(idsArray)
            }
        })
    }

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }
    const handleAddPetName = () => {
        const trimmedValue = inputValue.trim()
        if (trimmedValue && !petNames.includes(trimmedValue)) {
            setPetNames([...petNames, trimmedValue])
            setInputValue('') // Clear the input field
        }
    }

    const handleRemovePetName = (value: string) => {
        setPetNames(petNames.filter((val) => val !== value))
    }

    const handleSort = () => {
        setSortedAsc(!sortedAsc)
    }

    const filteredRecords = brandsData
        .filter((record) => {
            const nameMatch = record.name.toLowerCase().includes(searchTerm.toLowerCase())
            const petMatch = !selectedPetFilter || record.petNames.some((pet: any) => pet._id === selectedPetFilter)
            const locationMatch = !selectedLocationFilter || record.locations.some((loc: any) => loc._id === selectedLocationFilter)
            return nameMatch && petMatch && locationMatch
        })
        .sort((a, b) => sortedAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const toggleEditModal = (service: TableRecord) => {
        setEditingBrand(service)
        setValue('name', service.name)
        setValue('price', service.price)
        setValue('description', service.description)
        setValue('isFullGroom', service.isFullGroom)

        // Check if all pets were selected
        const isAllSelected = service.petNames.length === petNameOptions.length
        setIsAllPetsSelected(isAllSelected)
        // Check if all locations were selected
        const isAllLocationsSelected = service.locations.length === locationOptions.length
        setIsAllLocationsSelected(isAllLocationsSelected)

        const selectedPetOptions = isAllSelected
            ? petNameOptions
            : service.petNames.map(petId => {
                return petNameOptions.find(option => option.value === petId._id)
            }).filter(Boolean)

        const selectedLocationOptions = isAllLocationsSelected
            ? locationOptions
            : service.locations.map(locationId => {
                return locationOptions.find(option => option.value === locationId._id)
            }).filter(Boolean)

        setValue('petNames', selectedPetOptions, { shouldValidate: true })
        setValue('locations', selectedLocationOptions, { shouldValidate: true })

        toggleModal()
    }

    const handleToggleModal = () => {
        if (isOpen) {
            reset({ name: '' })
            setSelectedImage(null)
            setEditingBrand(null)
        } else {
            const groomingService = mainServiceOptions.find(option =>
                option.label.toLowerCase().includes('grooming')
            )
            if (groomingService) {
                setValue('service', groomingService)
            }
        }
        toggleModal()
    }
    const handleAllPetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsAllPetsSelected(e.target.checked)
        if (e.target.checked) {
            setValue('petNames', petNameOptions)
        } else {
            setValue('petNames', [])
        }
    }
    const handleAllLocationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsAllLocationsSelected(e.target.checked)
        if (e.target.checked) {
            setValue('locations', locationOptions)
        } else {
            setValue('locations', [])
        }
    }
    const handleAddLocation = () => {
        const trimmedValue = locationInputValue.trim()
        if (trimmedValue && !locations.includes(trimmedValue)) {
            setLocations([...locations, trimmedValue])
            setLocationInputValue('')
        }
    }
    const handleRemoveLocation = (value: string) => {
        setLocations(locations.filter((val) => val !== value))
    }
    // ********************** APis Functions  ***********************

    const getPetNames = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/petname`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = await response.json()
            const options = data.map((pet: any) => ({
                value: pet._id,
                label: pet.name
            }))
            setPetNameOptions(options)
        } catch (error) {
            console.error('Error fetching pet names:', error)
        }
    }

    const handleAddPetNames = async (formData: any) => {
        try {
            if (petNames.length === 0) {
                throw new Error('Please add at least one pet name')
            }

            const response = await fetch(`${BASE_API}/api/petname`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    names: petNames
                }),
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to add pet name')
            }

            const data = await response.json()

            Swal.fire({
                title: 'Success!',
                html: `
                    <div class="text-left">
                        <p>✅ ${data.created.length} new pet name added</p>
                        ${data.skipped.length > 0 ?
                        `<p>ℹ ${data.skipped.length} name skipped: ${data.skipped.join(', ')}</p>`
                        : ''
                    }
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Great!',
                timer: 1500,
            })

            togglePetModal()
            getPetNames()
            setPetNames([])
            setInputValue('')
        } catch (error: any) {
            Swal.fire({
                title: 'Oops!',
                text: error.message || 'Something went wrong',
                icon: 'error',
                timer: 1500,
            })
        }
    }

    const getAllGroomingServices = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/grooming-services`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to get grooming services')
            }
            const data: TableRecord[] = await response.json()
            setBrandsData(data)
        } catch (error: any) {
            console.error('Error getting grooming services:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddGrooming = async (groomingData: any) => {
        const formData = new FormData()
        formData.append('name', groomingData.name)
        formData.append('price', groomingData.price)
        formData.append('isFullGroom', groomingData.isFullGroom)
        formData.append('description', groomingData.description)

        if (groomingData.petNames) {
            groomingData.petNames.forEach((pet: any) => {
                formData.append('petNames', pet.value)
            })
        }
        if (groomingData.locations) {
            groomingData.locations.forEach((location: any) => {
                formData.append('locations', location.value)
            })
        }
        if (selectedImage) {
            formData.append('image', selectedImage)
        }
        if (groomingData.service) {
            formData.append('service', groomingData.service.value)
        }


        try {
            setApiLoading(true)
            const response = await fetch(`${BASE_API}/api/grooming-services`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message)
            }
            Swal.fire({
                title: 'Success!',
                text: 'Grooming service added successfully!',
                icon: 'success',
                timer: 1500,
            })
            handleToggleModal()
            getAllGroomingServices()
        } catch (error: any) {
            Swal.fire({
                title: 'Error!',
                text: error.message,
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setApiLoading(false)
        }
    }

    const handleUpdateGrooming = async (groomingData: any) => {
        const formData = new FormData()
        formData.append('name', groomingData.name)
        formData.append('price', groomingData.price)
        formData.append('isFullGroom', groomingData.isFullGroom)
        formData.append('description', groomingData.description)

        if (groomingData.petNames) {
            groomingData.petNames.forEach((pet: any) => {
                formData.append('petNames', pet.value)
            })
        }

        if (selectedImage) {
            formData.append('image', selectedImage)
        }
        if (groomingData.locations) {
            groomingData.locations.forEach((location: any) => {
                formData.append('locations', location.value)
            })
        }

        try {
            setApiLoading(true)
            const response = await fetch(
                `${BASE_API}/api/grooming-services/${editingBrand?._id}`,
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
                throw new Error(errorMessage.message)
            }

            Swal.fire({
                title: 'Updated!',
                text: 'Grooming service updated successfully!',
                icon: 'success',
                timer: 1500,
            })
            handleToggleModal()
            getAllGroomingServices()
        } catch (error: any) {
            Swal.fire({
                title: 'Error!',
                text: error.message,
                icon: 'error',
                timer: 1500,
            })
        } finally {
            setApiLoading(false)
        }
    }
    const deleteServices = async (ids: number[]) => {
        try {
            const response = await fetch(
                `${BASE_API}/api/grooming-services/bulk`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ ids }),
                }
            )

            if (!response.ok) {
                throw new Error('Failed to delete grooming services')
            }

            getAllGroomingServices()
            setSelectedRows([])

            Swal.fire({
                title: 'Deleted!',
                text: `Grooming service(s) deleted successfully.`,
                icon: 'success',
                timer: 1500,
            })
        } catch (error: any) {
            Swal.fire({
                title: 'Error!',
                text: error.message,
                icon: 'error',
                timer: 1500,
            })
        }
    }
    const getLocations = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/locations`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = await response.json()
            const options = data.map((location: any) => ({
                value: location._id,
                label: location.name
            }))
            setLocationOptions(options)
        } catch (error) {
            console.error('Error fetching locations:', error)
        }
    }

    const handleAddLocations = async (formData: any) => {
        try {
            if (locations.length === 0) {
                throw new Error('Please add at least one location')
            }

            const response = await fetch(`${BASE_API}/api/locations`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    names: locations
                }),
            })

            if (!response.ok) {
                const errorMessage = await response.json()
                throw new Error(errorMessage.message || 'Failed to add location')
            }

            const data = await response.json()
            Swal.fire({
                title: 'Success!',
                html: `
                    <div class="text-left">
                        <p>✅ ${data.created.length} new location added</p>
                        ${data.skipped.length > 0 ?
                        `<p>ℹ ${data.skipped.length} location skipped: ${data.skipped.join(', ')}</p>`
                        : ''
                    }
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Great!',
                timer: 1500,
            })

            toggleLocationModal()
            getLocations()
            setLocations([])
            setLocationInputValue('')
        } catch (error: any) {
            Swal.fire({
                title: 'Oops!',
                text: error.message || 'Something went wrong',
                icon: 'error',
                timer: 1500,
            })
        }
    }
    const getMainServices = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/services`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = await response.json()
            const options = data.map((service: any) => ({
                value: service._id,
                label: service.name
            }))
            setMainServiceOptions(options)
            const groomingService = options.find((option: any) =>
                option.label.toLowerCase().includes('grooming')
            )
            if (groomingService) {
                setValue('service', groomingService)
            }

        } catch (error) {
            console.error('Error fetching main services:', error)
        }
    }

    useEffect(() => {
        setCurrentPage(1)
        setShowDeleteButton(selectedRows.length > 0)
    }, [itemsPerPage, selectedRows])
    useEffect(() => {
        if (!isOpen) {
            reset()
            setSelectedImage(null)
            setEditingBrand(null)
        } else {
            const groomingService = mainServiceOptions.find(option =>
                option.label.toLowerCase().includes('grooming')
            )
            if (groomingService) {
                setValue('service', groomingService)
            }
        }
    }, [isOpen, reset, mainServiceOptions])
    useEffect(() => {
        if (editingBrand) {
            setValue('name', editingBrand.name)
        } else {
            reset({ name: '' })
        }
    }, [editingBrand, setValue, reset])

    useEffect(() => {
        getAllGroomingServices()
        getPetNames()
        getMainServices()
        getLocations()
    }, [])

    if (loading) {
        return <SimpleLoader />
    }

    return (
        <>
            <PageBreadcrumb title="Grooming Service" subName="Services" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Grooming Service Management</h4>
                            <p className="text-muted mb-0">
                                Add and Manage your all grooming service here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">

                            <Button
                                style={{ border: 'none' }}
                                variant="success"
                                disabled={!canCreate}
                                onClick={toggleModal}
                                className="mb-2 mb-sm-0">
                                <i className="bi bi-plus"></i> Add New Service
                            </Button>
                            {showDeleteButton && (
                                <Button
                                    variant="danger"
                                    className="ms-sm-2 mt-2 mt-sm-0"
                                    onClick={() => handleDelete(selectedRows)}>
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
                                        placeholder="Search Grooming here..."
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


                        {/* Filters section */}
                        <div className="mt-3 mt-lg-0 d-flex flex-column flex-sm-row align-items-start align-items-lg-center gap-2">
                            <Select
                                isClearable
                                placeholder="Filter by Pet"
                                options={petNameOptions}
                                className="react-select min-w-150 mb-2 mb-sm-0"
                                classNamePrefix="react-select"
                                onChange={(option) => setSelectedPetFilter(option?.value || null)}
                            />
                            <Select
                                isClearable
                                placeholder="Filter by Location"
                                options={locationOptions}
                                className="react-select min-w-150 mb-2 mb-sm-0"
                                classNamePrefix="react-select"
                                onChange={(option) => setSelectedLocationFilter(option?.value || null)}
                            />
                            <Form.Select
                                value={itemsPerPage}
                                className="w-auto"
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}>
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
                                    <th><input type="checkbox" onChange={handleSelectAll} checked={selectedRows.length === brandsData.length} /></th>
                                    <th>Image</th>
                                    <th><span onClick={handleSort} style={{ cursor: 'pointer' }}>Name {sortedAsc ? '↑' : '↓'}</span></th>
                                    <th>Price</th>
                                    <th>Full Groom</th>
                                    <th>Description</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedRecords.length > 0 ? (
                                    (paginatedRecords || []).map((record, idx) => {
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
                                                            src={`${BASE_API}/${record.image}`}
                                                            alt="grooming"
                                                            className="me-2 rounded-circle"
                                                        />
                                                    ) : (
                                                        ''
                                                    )}
                                                </td>
                                                <td>{record.name}</td>
                                                <td>{record.price}</td>
                                                <td>{record.isFullGroom ? 'Yes' : 'No'}</td>
                                                <td>{record.description.substring(0, 50)}...</td>
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
                                                            onClick={() => handleDelete(record._id)}
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
                                        <td colSpan={7} className="text-center">
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
                                {Array.from({ length: totalPages }, (_, index) => (
                                    <BootstrapPagination.Item
                                        key={index + 1}
                                        active={index + 1 === currentPage}
                                        onClick={() => handlePageChange(index + 1)}>
                                        {index + 1}
                                    </BootstrapPagination.Item>
                                ))}
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
                {/* Modal for adding a new grooming */}
                <Modal
                    show={isOpen}
                    onHide={handleToggleModal}
                    dialogClassName="modal-lg modal-dialog-centered">
                    <Modal.Header closeButton>
                        <h4 className="modal-title">
                            {editingBrand ? 'Update Service' : 'Add New Service'}
                        </h4>
                    </Modal.Header>
                    <Form
                        onSubmit={handleSubmit(
                            editingBrand ? handleUpdateGrooming : handleAddGrooming
                        )}>
                        <Modal.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Main Service</Form.Label>
                                        <Select
                                            value={watch('service')}
                                            options={mainServiceOptions}
                                            className="react-select"
                                            classNamePrefix="react-select"
                                            placeholder="Select main service..."
                                            isSearchable={false}
                                            isDisabled={true}
                                            onChange={(selected) => {
                                                setValue('service', selected)
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className='d-flex align-items-center'>Name <span className="text-danger ms-1">*</span></Form.Label>
                                        <FormInput
                                            type="text"
                                            name="name"
                                            containerClass="mb-3"
                                            register={register}
                                            placeholder="Enter Service Name"
                                            errors={errors}
                                            control={control}
                                        />
                                    </Form.Group>
                                </Col>

                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className='d-flex align-items-center'>Price <span className="text-danger ms-1">*</span></Form.Label>
                                        <FormInput
                                            type="number"
                                            name="price"
                                            containerClass="mb-3"
                                            register={register}
                                            placeholder="Enter Price"
                                            errors={errors}
                                            control={control}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mt-3">
                                        <Form.Check
                                            type="checkbox"
                                            label="Full Grooming Service"
                                            {...register('isFullGroom')}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={12}>
                                    <Form.Group className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <Form.Label>Pets</Form.Label>
                                            <div className="d-flex align-items-center gap-3">
                                                <Form.Check
                                                    type="checkbox"
                                                    label="Available for all pets"
                                                    checked={isAllPetsSelected}
                                                    onChange={handleAllPetsChange}
                                                />
                                                <Button
                                                    variant="link"
                                                    className="p-0 text-success"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        togglePetModal()
                                                    }}>
                                                    <i className="bi bi-plus-circle-fill" style={{ fontSize: '22px' }}></i>
                                                </Button>
                                            </div>
                                        </div>
                                        <Select
                                            isMulti
                                            value={watch('petNames')}
                                            options={petNameOptions}
                                            className="react-select"
                                            classNamePrefix="react-select"
                                            placeholder="Select pet names..."
                                            isSearchable={true}
                                            isDisabled={isAllPetsSelected}
                                            onChange={(selected) => {
                                                setValue('petNames', selected)
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={12}>
                                    <Form.Group className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <Form.Label>Locations</Form.Label>
                                            <div className="d-flex align-items-center gap-3">
                                                <Form.Check
                                                    type="checkbox"
                                                    label="Available in all locations"
                                                    checked={isAllLocationsSelected}
                                                    onChange={handleAllLocationsChange}
                                                />
                                                <Button
                                                    variant="link"
                                                    className="p-0 text-success"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        toggleLocationModal()
                                                    }}>
                                                    <i className="bi bi-plus-circle-fill" style={{ fontSize: '22px' }}></i>
                                                </Button>
                                            </div>
                                        </div>
                                        <Select
                                            isMulti
                                            value={watch('locations')}
                                            options={locationOptions}
                                            className="react-select"
                                            classNamePrefix="react-select"
                                            placeholder="Select locations..."
                                            isSearchable={true}
                                            isDisabled={isAllLocationsSelected}
                                            onChange={(selected) => {
                                                setValue('locations', selected)
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label className='d-flex align-items-center'>Description <span className="text-danger ms-1">*</span></Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    {...register('description')}
                                    placeholder="Enter service description"
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Service Image</Form.Label>
                                <SingleFileUploader
                                    icon="ri-upload-cloud-2-line"
                                    text="Drop file here or click to upload an image."
                                    onFileUpload={(file: File) => setSelectedImage(file)}
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="light" onClick={handleToggleModal}>
                                Close
                            </Button>
                            <Button
                                variant="soft-success"
                                type="submit"
                                disabled={editingBrand ? !canUpdate : !canCreate}>
                                {apiLoading
                                    ? editingBrand
                                        ? 'Updating...'
                                        : 'Adding...'
                                    : editingBrand
                                        ? 'Update Service'
                                        : 'Save Service'}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
                {/* pet modal */}
                <Modal
                    show={isPetModalOpen}
                    onHide={togglePetModal}
                    backdropClassName="modal-backdrop-dark"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    dialogClassName="modal-dialog-centered">
                    <Modal.Header closeButton>
                        <h4 className="modal-title">Add New Pet</h4>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleSubmit(handleAddPetNames)}>
                            <Form.Group className="mb-3">
                                <Form.Label>Pet Names</Form.Label>
                                <div className="d-flex">
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter pet name"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddPetName()
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="success"
                                        onClick={handleAddPetName}
                                        className="ms-2">
                                        +
                                    </Button>
                                </div>
                                <small className="text-muted mt-1 d-block">
                                    Enter name and press Enter or click '+' button to add multiple names
                                </small>
                                <div className="selected-values mt-2">
                                    {petNames.map((name, index) => (
                                        <span key={index} className="badge bg-primary me-1">
                                            {name}
                                            <button
                                                type="button"
                                                className="btn-close ms-1"
                                                onClick={() => handleRemovePetName(name)}>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </Form.Group>
                            <Modal.Footer>
                                <Button variant="light" onClick={togglePetModal}
                                >
                                    Close
                                </Button>
                                <Button variant="soft-success" type="submit">
                                    {apiLoading ? 'Adding...' : 'Save Pet Names'}
                                </Button>
                            </Modal.Footer>
                        </Form>
                    </Modal.Body>
                </Modal>
                {/* location modal */}
                <Modal
                    show={isLocationModalOpen}
                    onHide={toggleLocationModal}
                    dialogClassName="modal-dialog-centered"
                    backdropClassName="modal-backdrop-dark"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <Modal.Header closeButton>
                        <h4 className="modal-title">Add New Location</h4>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleSubmit(handleAddLocations)}>
                            <Form.Group className="mb-3">
                                <Form.Label>Location Names</Form.Label>
                                <div className="d-flex">
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter location name"
                                        value={locationInputValue}
                                        onChange={(e) => setLocationInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddLocation()
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="success"
                                        onClick={handleAddLocation}
                                        className="ms-2">
                                        +
                                    </Button>
                                </div>
                                <small className="text-muted mt-1 d-block">
                                    Enter name and press Enter or click '+' button to add multiple locations
                                </small>
                                <div className="selected-values mt-2">
                                    {locations.map((name, index) => (
                                        <span key={index} className="badge bg-primary me-1">
                                            {name}
                                            <button
                                                type="button"
                                                className="btn-close ms-1"
                                                onClick={() => handleRemoveLocation(name)}>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </Form.Group>
                            <Modal.Footer>
                                <Button variant="light" onClick={toggleLocationModal}>
                                    Close
                                </Button>
                                <Button variant="soft-success" type="submit">
                                    {apiLoading ? 'Adding...' : 'Save Locations'}
                                </Button>
                            </Modal.Footer>
                        </Form>
                    </Modal.Body>
                </Modal>
            </Card >
        </>
    )
}

export default Grooming
