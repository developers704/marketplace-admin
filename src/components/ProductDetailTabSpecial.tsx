import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Accordion, Button, Card, Col, Form, ListGroup, Nav, Row, Tab } from 'react-bootstrap'
import { FormInput } from '@/components'
import { MdDelete } from 'react-icons/md'
import { ProductVariant } from '@/types'
import Select from 'react-select';
import { useAuthContext } from '@/common'
import { SingleFileUploader } from './FileUploader/SingleFileUploader'
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2'
import { BASE_CITY } from '@/constants'

interface ProductDetailTabsProps {
    cities: Array<{ _id: string; name: string }>
    addedPrices: Array<{ city: string; cityName: string; amount: string; salePrice?: string }>
    setAddedPrices: React.Dispatch<React.SetStateAction<Array<{ city: string; cityName: string; amount: string; salePrice?: string }>>>
    uniqueVariantTypes: Array<{ _id: string; name: string }>
    addedVariants: any[]
    setAddedVariants: React.Dispatch<React.SetStateAction<any[]>>
    variantValues: VariantType[]
    register: any
    isBestSeller: boolean
    variants: ProductVariant[]
    setIsBestSeller: (value: boolean) => void
    control: any
    errors: any
    parentProducts: any
    isEditing?: boolean
    initialVariants?: any[]
    isShopByPet: boolean
    setIsShopByPet: (value: boolean) => void
    isNewArrival: boolean
    isServiceProduct: boolean
    setIsServiceProduct: (value: boolean) => void
    setIsNewArrival: (value: boolean) => void
    localSalePrice: string
    setLocalSalePrice: (value: string) => void
    metaTitle: string
    setMetaTitle: (value: string) => void
    metaDescription: string
    setMetaDescription: (value: string) => void

}

type VariantType = {
    _id: string
    name: string
}

interface VariantFormData {
    selectedValues: { [key: string]: any }
    sku: string
    price: string
    featureImageFile: File | null
    isSubmitted: boolean
}

const ProductDetailTabs = ({
    isShopByPet,
    setIsShopByPet,
    isServiceProduct,
    setIsServiceProduct,
    isNewArrival,
    setIsNewArrival,
    control,
    errors,
    variants,
    cities,
    addedPrices,
    setAddedPrices,
    uniqueVariantTypes,
    addedVariants,
    setAddedVariants,
    variantValues,
    register,
    isBestSeller,
    parentProducts,
    setIsBestSeller,
    isEditing,
    initialVariants,
    metaTitle,
    setMetaTitle,
    metaDescription,
    setMetaDescription,
}: ProductDetailTabsProps) => {
    const [localCityPrice, setLocalCityPrice] = useState('')
    const [productType, setProductType] = useState('simple')
    const [useForVariation, setUseForVariation] = useState(false);
    const [variationAttributes, setVariationAttributes] = useState<any[]>([]);
    const [showVariantForm, setShowVariantForm] = useState(false);
    const [manualVariants, setManualVariants] = useState<VariantFormData[]>([{
        selectedValues: {},
        sku: '',
        price: '',
        featureImageFile: null,
        isSubmitted: false
    }]);

    const [selectedVariantId, setSelectedVariantId] = useState('')
    const [selectedVariantValue, setSelectedVariantValue] = useState<any>('')

    // Add these to existing states
    const [localSalePrice, setLocalSalePrice] = useState('')



    const BASE_API = import.meta.env.VITE_BASE_API
    const { user } = useAuthContext()
    const { token } = user

    const handleVariantTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value
        setSelectedVariantId(selectedId)
        setSelectedVariantValue('')

        const values = variants
            .filter((variant) => variant.variantName._id === selectedId)
            .map((variant) => ({
                _id: variant._id,
                name: variant.value
            }))

        variantValues.splice(0, variantValues.length, ...values)
    }

    const handleDeleteVariant = (index: number) => {
        setAddedVariants(addedVariants.filter((_, i) => i !== index))
    }

    const handleAddVariant = () => {
        if (selectedVariantId && selectedVariantValue?.length > 0) {
            const selectedVariant = uniqueVariantTypes.find(
                variant => variant._id === selectedVariantId
            );

            const values = selectedVariantValue.map((item: any) => ({
                valueId: item.value,
                value: item.label
            }));

            if (useForVariation) {
                const existingAttrIndex = variationAttributes.findIndex(
                    attr => attr.type === selectedVariant?.name
                );

                if (existingAttrIndex !== -1) {
                    const updatedAttributes = [...variationAttributes];
                    updatedAttributes[existingAttrIndex].values = [
                        ...updatedAttributes[existingAttrIndex].values,
                        ...values
                    ];
                    setVariationAttributes(updatedAttributes);
                } else {
                    setVariationAttributes([
                        ...variationAttributes,
                        {
                            type: selectedVariant?.name,
                            values: values
                        }
                    ]);
                }
            } else {
                const newVariant = {
                    type: selectedVariant?.name,
                    value: values.map((v: any) => v.value).join(' | '),
                    variantId: selectedVariantId,
                    valueIds: values.map((v: any) => v.valueId),
                    useForVariation: useForVariation
                };

                setAddedVariants([...addedVariants, newVariant]);
            }

            setSelectedVariantValue([]);
            setSelectedVariantId('');
            setUseForVariation(false);
        }
    };


    const handleRemoveVariantPart = (index: number) => {
        if (!manualVariants[index].isSubmitted) {
            setManualVariants(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleAddNewVariant = () => {
        setManualVariants(prev => [...prev, {
            selectedValues: {},
            sku: '',
            price: '',
            featureImageFile: null,
            isSubmitted: false
        }]);
    };
    const VariantForm = ({
        index,
        data,
        onRemove
    }: {
        index: number;
        data: VariantFormData;
        onRemove: (index: number) => void
    }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const [selectedValues, setSelectedValues] = useState(data.selectedValues);
        const [sku, setSku] = useState(data.sku);
        const [price, setPrice] = useState(data.price);
        const [featureImageFile, setFeatureImageFile] = useState<File | null>(data.featureImageFile);
        const [isSaving, setIsSaving] = useState(false);
        const [salePriceChild, setSalePriceChild] = useState('')
        const handleImageChange = (file: File) => {
            setFeatureImageFile(file);
        };

        const handleSaveVariant = async () => {
            if (!parentProducts?._id) {
                Swal.fire({
                    icon: 'info',
                    title: 'Oops!',
                    text: 'Please Save a Parent Product first.'
                });
                return;
            }
            const formData = new FormData();

            // Add form data
            formData.append('name', parentProducts.name);
            formData.append('sku', sku);
            formData.append(`prices[0][city]`, BASE_CITY);
            formData.append(`prices[0][amount]`, price);
            formData.append(`prices[0][salePrice]`, salePriceChild || '');

            if (parentProducts.description) formData.append('description', parentProducts.description);
            if (parentProducts.status) formData.append('status', parentProducts.status);
            if (parentProducts.variationId) formData.append('variationId', parentProducts.variationId);
            if (parentProducts.specialCategory) formData.append('specialCategory', parentProducts.specialCategory);

            if (Object.values(selectedValues).length > 0) {
                Object.values(selectedValues).forEach((selected: any) => {
                    formData.append('productVariants[]', selected.value);
                });
            }

            if (featureImageFile) {
                formData.append('image', featureImageFile);
            } else if (parentProducts.image) {
                try {
                    const response = await fetch(`${BASE_API}${parentProducts.image}`, {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    const blob = await response.blob();
                    const fileName = parentProducts.image.split('/').pop() || 'feature-image.jpg';
                    const file = new File([blob], fileName, { type: blob.type });
                    formData.append('image', file);

                } catch (error) {
                    console.error('Error converting parent image to file:', error);
                }
            }
            if (parentProducts.gallery && parentProducts.gallery.length > 0) {
                const galleryPromises = parentProducts.gallery.map(async (galleryUrl: string) => {
                    const response = await fetch(`${BASE_API}${galleryUrl}`, {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    const blob = await response.blob();
                    const fileName = galleryUrl.split('/').pop() || 'gallery-image.jpg';
                    return new File([blob], fileName, { type: blob.type });
                });

                const galleryFiles = await Promise.all(galleryPromises);
                galleryFiles.forEach(file => {
                    formData.append('gallery', file);
                });
            }
            try {
                setIsSaving(true);
                const response = await fetch(`${BASE_API}/api/special-products`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to save variant');
                }

                // Update the variant's submitted status and data
                setManualVariants(prev => {
                    const updated = [...prev];
                    updated[index] = {
                        selectedValues,
                        sku,
                        price,
                        featureImageFile,
                        isSubmitted: true
                    };
                    return updated;
                });
                toast.success('Variant saved successfully!');
            } catch (error: any) {
                console.error('Error:', error);
                toast.error(error.message || 'Failed to save variant');
            } finally {
                setIsSaving(false);
            }
        };

        return (
            <Card className="mb-3 variant-form">
                <Card.Header
                    className="d-flex justify-content-between align-items-center py-2 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{ backgroundColor: data.isSubmitted ? '#e8f5e9' : '#e7e7e6' }}
                >
                    <div className="d-flex align-items-center gap-3">
                        {variationAttributes.map((attr) => (
                            <div key={attr.type} onClick={(e) => e.stopPropagation()}>
                                <Select
                                    value={selectedValues[attr.type]}
                                    options={attr.values.map((v: any) => ({
                                        value: v.valueId,
                                        label: v.value
                                    }))}
                                    onChange={(selected) => {
                                        setSelectedValues(prev => ({
                                            ...prev,
                                            [attr.type]: selected
                                        }));
                                    }}
                                    isDisabled={data.isSubmitted}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="d-flex gap-2">
                        {!data.isSubmitted && (
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(index);
                                }}
                            >
                                <MdDelete size={18} />
                            </Button>
                        )}
                        <Button
                            variant="outline-info"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                        >
                            <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                        </Button>
                    </div>
                </Card.Header>

                <Accordion activeKey={isExpanded ? index.toString() : ''}>
                    <Accordion.Collapse eventKey={index.toString()}>
                        <Card.Body>
                            {data.isSubmitted ? (
                                <Row>
                                    <Col md={4}>
                                        <p><strong>SKU:</strong> {sku}</p>
                                    </Col>
                                    <Col md={4}>
                                        <p><strong>Regular Price:</strong> {price}</p>
                                    </Col>
                                    <Col md={4}>
                                        <p><strong>Discount Price:</strong> {salePriceChild}</p>
                                    </Col>
                                </Row>
                            ) : (
                                <>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>SKU <span className="text-danger ms-1">*</span></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={sku}
                                                    onChange={(e) => setSku(e.target.value)}
                                                    placeholder='Enter Unique SKU ..'
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Price <span className="text-danger ms-1">*</span></Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={price}
                                                    placeholder='Enter Price ..'
                                                    required
                                                    onChange={(e) => setPrice(e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Discount Price</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={salePriceChild}
                                                    placeholder='Enter Discount Price (Optional)'
                                                    onChange={(e) => setSalePriceChild(e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col xs={12}>
                                            <Form.Group className="mb-3">
                                                <div className="mb-2">
                                                    <h5>Feature Image</h5>
                                                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                                        {'File Size: Upload images up to 5 MB.'}
                                                    </p>
                                                    <p style={{ fontSize: '0.8rem' }} className="text-danger mb-0">
                                                        {'Supported Formats: JPEG (.jpg, .jpeg), PNG (.png).'}
                                                    </p>
                                                    <SingleFileUploader
                                                        icon="ri-upload-cloud-2-line"
                                                        text="Drop file here or click to upload"
                                                        onFileUpload={handleImageChange}
                                                    />
                                                </div>
                                            </Form.Group>
                                        </Col>
                                    </Row>


                                    <div className="d-flex justify-content-end">
                                        <Button
                                            variant="success"
                                            onClick={handleSaveVariant}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-1" />
                                                    Saving...
                                                </>
                                            ) : (
                                                'Save Variant'
                                            )}
                                        </Button>

                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Accordion.Collapse>
                </Accordion>
                <Toaster
                    position="bottom-right"
                />
            </Card>
        );
    };
    useEffect(() => {
        if (isEditing && initialVariants) {
            const existingVariants = initialVariants.map((variant) => ({
                type: variant.variantName.name,
                value: variant.value,
                variantId: variant.variantName._id,
                valueIds: [variant._id],
                useForVariation: false
            }));
            setAddedVariants(existingVariants);
        }
    }, [isEditing, initialVariants]);




    return (
        <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h4>Product Details</h4>
                {!isEditing &&
                    <div className="d-flex align-items-center">
                        <span className="me-2 fw-medium">Select Product Type:</span>
                        <Form.Select
                            style={{ width: 'auto', minWidth: '200px', zIndex: 0 }}
                            value={productType}
                            onChange={(e) => setProductType(e.target.value)}
                        >
                            <option value="simple">Simple Product</option>
                            <option value="variable">Variable Product</option>
                        </Form.Select>
                    </div>
                }
            </Card.Header>
            <Card.Body>
                <Tab.Container defaultActiveKey="general">
                    <Nav variant="tabs" className="mb-3">
                        <Nav.Item>
                            <Nav.Link as={Link} to="#" eventKey="general">
                                <span className="d-block">General</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link as={Link} to="#" eventKey="attribute">
                                <span className="d-block">Attributes</span>
                            </Nav.Link>
                        </Nav.Item>
                        {productType === 'variable' && (
                            <Nav.Item>
                                <Nav.Link as={Link} to="#" eventKey="variants">
                                    <span className="d-block">Variants</span>
                                </Nav.Link>
                            </Nav.Item>
                        )}
                    </Nav>

                    <Tab.Content>
                        <Tab.Pane eventKey="general">

                            <Row>
                                <Col xs={12}>
                                    <h5>Product Pricing</h5>
                                    <Row className="mb-3">
                                        <Col xs={12} md={6}>
                                            <Form.Label>Regular Price <span style={{ color: "red" }}>*</span></Form.Label>
                                            <Form.Control
                                                type="number"
                                                required
                                                placeholder="Enter Regular Price"
                                                value={localCityPrice || (addedPrices[0]?.amount || '')}
                                                onChange={(e) => {
                                                    const karachiCityId = "6745bc8f9b0338a09d843eb5";
                                                    setLocalCityPrice(e.target.value);
                                                    setAddedPrices([{
                                                        city: karachiCityId,
                                                        cityName: "Karachi",
                                                        amount: e.target.value
                                                    }]);
                                                }}
                                            />
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Form.Label>Discount Price</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Enter Discount Price"
                                                value={localSalePrice || (addedPrices[0]?.salePrice || '')}
                                                onChange={(e) => {
                                                    setLocalSalePrice(e.target.value);
                                                    setAddedPrices(prev => [{
                                                        ...prev[0],
                                                        salePrice: e.target.value
                                                    }]);
                                                }}
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>

                            <Row className="align-items-center">
                                <Col xs={6}>
                                    <Form.Group className="mb-4">
                                        <div className="d-flex align-items-center mb-1">
                                            <Form.Label className="mb-0">SKU <span className="text-danger">*</span></Form.Label>
                                            <span className="badge bg-info ms-2">Must be unique</span>
                                        </div>
                                        <p className="text-muted small mb-2">Keep SKU name same as feature image name for automatic image assignment</p>
                                        <FormInput
                                            type="text"
                                            name="sku"
                                            containerClass="mb-0"
                                            register={register}
                                            placeholder="Enter Product SKU..."
                                            errors={errors}
                                            control={control}
                                            required
                                        />
                                    </Form.Group>
                                </Col>

                            </Row>
                        </Tab.Pane>
                        <Tab.Pane eventKey="attribute">
                            <>
                                <p className='mt-3 text-lg font-semibold text-gray-800' style={{ fontSize: '1rem', fontWeight: 400, color: '#2d3748' }}>Select Attributes</p>

                                <Row className="mb-3">
                                    <Col xs={12} md={6} className="mb-3 mb-md-0">
                                        <Form.Select onChange={handleVariantTypeChange} value={selectedVariantId}>
                                            <option value="">Select Attribute Type</option>
                                            {uniqueVariantTypes.map((variant) => (
                                                <option key={variant._id} value={variant._id}>
                                                    {variant.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Select
                                            isMulti
                                            value={selectedVariantValue}
                                            options={variantValues.map(value => ({
                                                value: value._id,
                                                label: value.name
                                            }))}
                                            className="react-select"
                                            classNamePrefix="react-select"
                                            placeholder={selectedVariantId ? 'Select Values' : 'First Select Attribute'}
                                            isSearchable={true}
                                            onChange={(selected) => {
                                                setSelectedVariantValue(selected);
                                            }}
                                            isDisabled={!selectedVariantId}
                                        />
                                    </Col>
                                    {productType === 'variable' && (
                                        <Col xs={12} className="mt-2">
                                            <Form.Check
                                                type="checkbox"
                                                label="Use for variations"
                                                checked={useForVariation}
                                                onChange={(e) => setUseForVariation(e.target.checked)}
                                            />
                                        </Col>
                                    )}

                                </Row>
                                <Button variant="success" onClick={handleAddVariant}>
                                    Save & Add New Attribute
                                </Button>
                                {(isEditing || addedVariants.length > 0) && (
                                    <ListGroup className="mt-3">
                                        {addedVariants.map((variant, index) => (
                                            <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="variant-display fw-bold" style={{ minWidth: '150px' }}>{variant.type}</div>
                                                <div className="variant-display flex-grow-1 px-3">{variant.value}</div>
                                                <MdDelete
                                                    onClick={() => handleDeleteVariant(index)}
                                                    style={{ color: 'red', cursor: 'pointer', fontSize: '20px' }}
                                                />
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </>
                        </Tab.Pane>

                        <Tab.Pane eventKey="variants">
                            {variationAttributes.length > 0 ? (
                                <div className="mt-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5>Product Variants</h5>
                                        <Button
                                            variant="info"
                                            onClick={() => setShowVariantForm(true)}
                                        >
                                            Add Variant Manually
                                        </Button>
                                    </div>

                                    {showVariantForm && (
                                        <>
                                            {manualVariants.map((variant, index) => (
                                                <VariantForm
                                                    key={index}
                                                    index={index}
                                                    data={variant}
                                                    onRemove={handleRemoveVariantPart}
                                                />
                                            ))}
                                            <Button
                                                variant="outline-info"
                                                className="w-100 mb-3"
                                                onClick={handleAddNewVariant}
                                            >
                                                + Add New Variant
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-4 p-4 bg-light border rounded text-center">
                                    <p className="mb-0">
                                        Add some attributes in the Attributes tab and mark them as "Used for variations" to generate variations here.
                                    </p>
                                </div>
                            )}
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Card.Body>
        </Card>
    )
}

export default ProductDetailTabs

