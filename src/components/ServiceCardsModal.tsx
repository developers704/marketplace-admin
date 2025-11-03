import { useAuthContext } from "@/common";
import { useEffect, useMemo, useState } from "react";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import Select from "react-select"
import { SingleFileUploader } from "./FileUploader/SingleFileUploader";
import ReactQuill from 'react-quill'
import DOMPurify from 'dompurify'
import 'react-quill/dist/quill.snow.css'
import 'react-quill/dist/quill.bubble.css'


interface ServiceCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingCard?: any;
    onSubmit: (formData: any) => Promise<void>;
    apiLoading: boolean;
}

const ServiceCardModal = ({ isOpen, onClose, editingCard, onSubmit, apiLoading }: ServiceCardModalProps) => {
    const { control, handleSubmit, reset, setValue, watch } = useForm();
    const { user } = useAuthContext();
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [subSubCategories, setSubSubCategories] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [petTypes, setPetTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const BASE_API = import.meta.env.VITE_BASE_API;
    const selectedCategories = watch('serviceCategories');
    const selectedSubCategories = watch('serviceSubCategories');

    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean']
        ]
    };

    const handleDescriptionChange = (content: any) => {
        const sanitizedDescription = DOMPurify.sanitize(content);
        setDescription(sanitizedDescription);
    };

    useEffect(() => {
        if (editingCard) {
            setDescription(editingCard.description || '');
        } else {
            setDescription('');
        }
    }, [editingCard]);

    const fetchDropdownData = async () => {
        try {
            setLoading(true);
            const [categoriesRes, subCategoriesRes, subSubCategoriesRes, locationsRes, petTypesRes] = await Promise.all([
                fetch(`${BASE_API}/api/service-categories`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                }),
                fetch(`${BASE_API}/api/service-subcategories`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                }),
                fetch(`${BASE_API}/api/service-sub-subcategories`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                }),
                fetch(`${BASE_API}/api/locations`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                }),
                fetch(`${BASE_API}/api/petname`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                })
            ]);

            const [categories, subCategories, subSubCategories, locations, petTypes] = await Promise.all([
                categoriesRes.json(),
                subCategoriesRes.json(),
                subSubCategoriesRes.json(),
                locationsRes.json(),
                petTypesRes.json()
            ]);

            setCategories(categories);
            setSubCategories(subCategories);
            setSubSubCategories(subSubCategories);
            setLocations(locations);
            setPetTypes(petTypes);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSubCategories = useMemo(() => {
        if (!selectedCategories?.length) return [];
        return subCategories?.filter(sub =>
            selectedCategories?.some((cat: any) => cat?.value === sub?.serviceCategory?._id)
        );
    }, [selectedCategories, subCategories]);

    // Filter subsubcategories based on selected subcategories
    const filteredSubSubCategories = useMemo(() => {
        if (!selectedSubCategories?.length) return [];
        return subSubCategories?.filter(subsub =>
            selectedSubCategories?.some((sub: any) => sub?.value === subsub?.serviceSubCategory?._id)
        );
    }, [selectedSubCategories, subSubCategories]);

    useEffect(() => {
        fetchDropdownData();
    }, []);

    useEffect(() => {
        if (editingCard) {
            setValue('name', editingCard?.name);
            setValue('description', editingCard?.description);
            setValue('price', editingCard?.price);
            // Handle Categories
            if (editingCard?.serviceCategories?.length) {
                const categoryOptions = editingCard?.serviceCategories.map((cat: any) => ({
                    value: cat?._id || cat,
                    label: categories.find(c => c?._id === (cat?._id || cat))?.name || ''
                }));
                setValue('serviceCategories', categoryOptions);
            }

            // Handle SubCategories
            if (editingCard?.serviceSubCategories?.length) {
                const subCategoryOptions = editingCard?.serviceSubCategories?.map((sub: any) => ({
                    value: sub?._id || sub,
                    label: subCategories?.find(s => s?._id === (sub?._id || sub))?.name || ''
                }));
                setValue('serviceSubCategories', subCategoryOptions);
            }

            // Handle SubSubCategories
            if (editingCard?.serviceSubSubCategories?.length) {
                const subSubCategoryOptions = editingCard?.serviceSubSubCategories?.map((subsub: any) => ({
                    value: subsub?._id || subsub,
                    label: subSubCategories?.find(ss => ss?._id === (subsub?._id || subsub))?.name || ''
                }));
                setValue('serviceSubSubCategories', subSubCategoryOptions);
            }

            if (editingCard?.locations?.length) {
                const locationOptions = editingCard?.locations?.map((loc: any) => ({
                    value: loc?._id || loc,
                    label: locations.find(l => l?._id === (loc?._id || loc))?.name || ''
                }));
                setValue('locations', locationOptions);
            }

            if (editingCard?.petTypes?.length) {
                const petTypeOptions = editingCard?.petTypes?.map((pet: any) => ({
                    value: pet?._id || pet,
                    label: petTypes.find(p => p?._id === (pet?._id || pet))?.name || ''
                }));
                setValue('petTypes', petTypeOptions);
            }
        } else {
            reset();
            setDescription('');
            setSelectedFile(null);
            setValue('name', '');
            setValue('price', '');
            setValue('serviceCategories', []);
            setValue('serviceSubCategories', []);
            setValue('serviceSubSubCategories', []);
            setValue('locations', []);
            setValue('petTypes', []);
        }
    }, [editingCard, categories, subCategories, subSubCategories, locations, petTypes]);
    const handleFormSubmit = (data: any) => {
        // Include the selectedFile in the form data
        onSubmit({
            ...data,
            description,
            image: selectedFile // Pass the selected file directly
        });
    };
    return (
        <Modal show={isOpen} onHide={onClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    {editingCard ? 'Edit Service Card' : 'Add New Service Card'}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit(handleFormSubmit)}>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Name</Form.Label>
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Control {...field} type="text" placeholder="Enter name" required />
                                    )}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Price</Form.Label>
                                <Controller
                                    name="price"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Control {...field} type="number" placeholder="Enter price" required />
                                    )}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Service Categories</Form.Label>
                        <Controller
                            name="serviceCategories"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    isMulti
                                    options={categories.map(cat => ({
                                        value: cat._id,
                                        label: cat.name
                                    }))}
                                    placeholder="Select categories"
                                />
                            )}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Service Sub Categories</Form.Label>
                        <Controller
                            name="serviceSubCategories"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    isMulti
                                    isDisabled={!selectedCategories?.length}
                                    options={filteredSubCategories.map(sub => ({
                                        value: sub._id,
                                        label: sub.name
                                    }))}
                                    placeholder="Select sub categories"
                                />
                            )}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Service Sub Sub Categories</Form.Label>
                        <Controller
                            name="serviceSubSubCategories"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    isMulti
                                    isDisabled={!selectedSubCategories?.length}
                                    options={filteredSubSubCategories.map(subsub => ({
                                        value: subsub._id,
                                        label: subsub.name
                                    }))}
                                    placeholder="Select sub sub categories"
                                />
                            )}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <div className="mb-2" style={{ padding: '0px', overflowY: 'auto' }}>
                            <ReactQuill
                                modules={modules}
                                theme="snow"
                                value={description}
                                onChange={handleDescriptionChange}
                                className="pb-4"
                                style={{
                                    height: 200,
                                    maxWidth: '100%',
                                    boxSizing: 'border-box',
                                    overflow: 'hidden'
                                }}
                            />
                        </div>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Image</Form.Label>
                        <div className="mb-2">
                            <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                File Size: Upload images up to 5 MB.
                            </p>
                            <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).
                            </p>
                        </div>
                        <SingleFileUploader
                            icon="ri-upload-cloud-2-line"
                            text="Drop file here or click to upload an image"
                            onFileUpload={(file: File) => setSelectedFile(file)}

                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Locations</Form.Label>
                        <Controller
                            name="locations"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    isMulti
                                    options={locations.map(loc => ({
                                        value: loc?._id,
                                        label: loc.name
                                    }))}
                                    placeholder="Select locations"
                                />
                            )}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Pet Types</Form.Label>
                        <Controller
                            name="petTypes"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    isMulti
                                    options={petTypes.map(pet => ({
                                        value: pet._id,
                                        label: pet.name
                                    }))}
                                    placeholder="Select pet types"
                                />
                            )}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onClose}>
                        Close
                    </Button>
                    <Button variant="success" type="submit" disabled={apiLoading || loading}>
                        {apiLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};
export default ServiceCardModal