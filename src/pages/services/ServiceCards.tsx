import { PageBreadcrumb } from '@/components'
import {
    Button,
    Card,
    Form,
    Table,
} from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { MdDelete, MdEdit, MdRemoveRedEye } from 'react-icons/md'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
import { useToggle } from '@/hooks'
import { useForm } from 'react-hook-form'
import { Pagination as BootstrapPagination } from 'react-bootstrap'
import { TableRowSkeleton } from '../other/SimpleLoader'
import { toastService } from '@/common/context/toast.service'
import ServiceCardsModal from '@/components/ServiceCardsModal'
import ServiceCardDetails from '@/components/ServiceCardsDetail'



const ServiceCards = () => {
    const { isSuperUser, permissions, user } = useAuthContext()
    const canUpdate = isSuperUser || permissions.Products?.Update
    const canDelete = isSuperUser || permissions.Products?.Delete
    const canCreate = isSuperUser || permissions.Products?.Create

    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [sortedAsc, setSortedAsc] = useState(true)
    const [showDeleteButton, setShowDeleteButton] = useState(false)
    const [apiLoading, setApiLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [storeData, setStoreData] = useState<any[]>([])
    const [editingStore, setEditingStore] = useState<any | null>(null)
    const [isOpen, toggleModal] = useToggle()
    const [selectedCard, setSelectedCard] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);


    // ************* basics *************


    const BASE_API = import.meta.env.VITE_BASE_API
    const {
        reset,
        setValue,
    } = useForm()

    // *************************** handle functions *************************

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
        console.log(setSortedAsc)
    }
    const handleDeleteConfirmation = (storeId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This Service Cards will be deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: "#9c5100",
            cancelButtonColor: '#d33',
            confirmButtonText: 'Remove!'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteServiceCards([storeId]) // Pass as array for consistent API call
            }
        })
    }

    const handleBulkDelete = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `All the ${selectedRows.length} selected items will be deleted!`,
            icon: 'warning',
            showCancelButton: true,
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!',
            confirmButtonColor: "#9c5100",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteServiceCards(selectedRows)
            }
        })
    }

    const handletoggleModal = () => {
        if (isOpen) {
            reset(); // Reset form data
            setEditingStore(null);
            setValue('name', '');
            setValue('description', '');
            setValue('price', '');
            setValue('serviceCategories', []);
            setValue('serviceSubCategories', []);
            setValue('serviceSubSubCategories', []);
            setValue('locations', []);
            setValue('petTypes', []);
        }
        toggleModal();
    };


    const filteredRecords = storeData
        ?.filter(record =>
            record?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        ?.sort((a, b) =>
            sortedAsc ? a?.name?.localeCompare(b?.name) : b?.name?.localeCompare(a?.name)
        )

    // const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const paginatedRecords = filteredRecords?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRows(event.target.checked ? storeData.map(store => store._id) : [])
    }

    const handleSelectRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }
    // ********************** API CALLS **********************

    const getAllServiceCards = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_API}/api/service-cards`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            if (!response.ok) {
                const responseData = await response.json();
                throw new Error(responseData?.message || responseData?.error || "falied to fetch data");
            }

            const data = await response.json();
            setStoreData(data);
        } catch (error: any) {
            toastService.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (formData: any) => {
        try {
            setApiLoading(true);

            const apiFormData = new FormData();
            apiFormData.append('name', formData?.name);
            if (formData?.description) apiFormData.append('description', formData?.description);
            apiFormData.append('price', formData?.price);

            // Add arrays with only IDs
            const serviceCategories = formData?.serviceCategories?.map((cat: any) => cat?.value) || [];
            const serviceSubCategories = formData?.serviceSubCategories?.map((sub: any) => sub?.value) || [];
            const serviceSubSubCategories = formData?.serviceSubSubCategories?.map((subsub: any) => subsub?.value) || [];
            const locations = formData?.locations?.map((loc: any) => loc?.value) || [];
            const petTypes = formData?.petTypes?.map((pet: any) => pet?.value) || [];

            // Append each ID to the FormData
            serviceCategories.forEach((id: string) => {
                apiFormData.append('serviceCategories[]', id);
            });

            serviceSubCategories.forEach((id: string) => {
                apiFormData.append('serviceSubCategories[]', id);
            });

            serviceSubSubCategories.forEach((id: string) => {
                apiFormData.append('serviceSubSubCategories[]', id);
            });

            locations.forEach((id: string) => {
                apiFormData.append('locations[]', id);
            });

            petTypes.forEach((id: string) => {
                apiFormData.append('petTypes[]', id);
            });

            // Add image if exists
            if (formData?.image) {
                apiFormData.append('image', formData?.image);
            }

            const endpoint = editingStore
                ? `${BASE_API}/api/service-cards/${editingStore?._id}`
                : `${BASE_API}/api/service-cards`;

            const response = await fetch(endpoint, {
                method: editingStore ? 'PUT' : 'POST',
                headers: {
                    Authorization: `Bearer ${user.token}`
                },
                body: apiFormData
            });
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || "falied to add data");
            }

            Swal.fire({
                title: 'Success',
                text: `Service card ${editingStore ? 'updated' : 'added'} successfully!`,
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            });

            getAllServiceCards();
            handletoggleModal();
        } catch (error: any) {
            toastService.error(error.message);
        } finally {
            setApiLoading(false);
        }
    };

    const deleteServiceCards = async (ids: string[]) => {
        try {
            const response = await fetch(`${BASE_API}/api/service-cards/bulk-delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ ids })
            });
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || "falied to delete data");
            }

            Swal.fire({
                title: 'Deleted!',
                text: `${ids.length} item(s) deleted successfully.`,
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            });

            getAllServiceCards();
            setSelectedRows([]);
        } catch (error: any) {
            toastService.error(error.message);
        }
    };

    useEffect(() => {
        getAllServiceCards();
    }, []);

    useEffect(() => {
        setCurrentPage(1)
        setShowDeleteButton(selectedRows?.length > 0)
    }, [itemsPerPage, selectedRows])

    const storeHeaders: any[] = [
        { width: '20px', type: 'checkbox' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'text' },
        { width: '100px', type: 'actions' }
    ]
    return (
        <>
            <PageBreadcrumb title="Service Cards" subName="Settings" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Service Cards</h4>
                            <p className="text-muted mb-0">
                                Add and Manage all your Service Cards here.
                            </p>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <Button
                                disabled={!canCreate}
                                variant="success"
                                onClick={toggleModal}
                                className="mb-2 mb-sm-0 ">
                                <i className="bi bi-plus"></i> Add New Service Cards
                            </Button>
                            {showDeleteButton && (
                                <Button
                                    variant="danger"
                                    className="ms-sm-2 mt-2 mt-sm-0"
                                    onClick={handleBulkDelete}>
                                    Delete All Selected
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mt-3">
                        <div className="app-search d-none d-lg-block">
                            <form>
                                <div className="input-group" style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(0, 0, 0, 0.1)'
                                }}>
                                    <input
                                        type="search"
                                        className="form-control"
                                        placeholder="Search here..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        style={{
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            paddingLeft: '10px',
                                            color: '#333'
                                        }}
                                    />
                                    <span className="ri-search-line search-icon text-muted"
                                        style={{ marginRight: '10px', color: '#666' }}
                                    />
                                </div>
                            </form>
                        </div>

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
                </Card.Header>

                <Card.Body>
                    <Table responsive className="table-centered">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={storeData?.length > 0 && selectedRows?.length === storeData?.length}
                                    />
                                </th>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableRowSkeleton headers={storeHeaders} rowCount={3} />
                            ) : paginatedRecords?.length > 0 ?
                                (
                                    paginatedRecords?.map((store) => (
                                        <tr key={store?._id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.includes(store?._id)}
                                                    onChange={() => handleSelectRow(store?._id)}
                                                />
                                            </td>
                                            <td> {store.image ? (
                                                <img
                                                    src={`${BASE_API}/${store?.image}`}
                                                    alt={store?.name}
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                                    <i className="ri-image-line me-1"></i>
                                                    No Image
                                                </div>
                                            )}</td>
                                            <td>{store?.name}</td>
                                            <td>
                                                {store?.description?.length > 50
                                                    ? `${store?.description.substring(0, 50)}...`
                                                    : store?.description}
                                            </td>

                                            <td>{store?.price}</td>
                                            <td>
                                                <Button
                                                    variant="info"
                                                    className="me-2"
                                                    onClick={() => {
                                                        setSelectedCard(store);
                                                        setShowDetails(true);
                                                    }}>
                                                    <MdRemoveRedEye />
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    disabled={!canUpdate}
                                                    onClick={() => {
                                                        setEditingStore(store);
                                                        toggleModal();
                                                    }}
                                                    className="me-2">
                                                    <MdEdit />
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    disabled={!canDelete}
                                                    onClick={() => handleDeleteConfirmation(store?._id)}>
                                                    <MdDelete />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4">
                                            <div className="d-flex flex-column align-items-center">
                                                <i className="ri-file-list-3-line fs-2 text-muted mb-2"></i>
                                                <h5 className="text-muted mb-1">No Records Found</h5>
                                                <p className="text-muted mb-0">Add some Data to see them listed here.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )

                            }
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
                </Card.Body>
            </Card>

            <ServiceCardsModal
                isOpen={isOpen}
                onClose={handletoggleModal}
                editingCard={editingStore}
                onSubmit={handleFormSubmit}
                apiLoading={apiLoading}
            />
            <ServiceCardDetails
                show={showDetails}
                onHide={() => {
                    setShowDetails(false);
                    setSelectedCard(null);
                }}
                cardData={selectedCard}
            />
        </>
    )
}
export default ServiceCards
