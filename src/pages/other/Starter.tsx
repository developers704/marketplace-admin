import { FormInput, PageBreadcrumb } from '@/components'
import {
	Button,
	Card,
	Col,
	Dropdown,
	DropdownButton,
	Form,
	InputGroup,
	ListGroup,
	Nav,
	Row,
	Tab,
} from 'react-bootstrap'
import { Link } from 'react-router-dom'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import 'react-quill/dist/quill.bubble.css'
import { useForm } from 'react-hook-form'
import { FileUploader } from '@/components/FileUploader'
import { SingleFileUploader } from '@/components/FileUploader/SingleFileUploader'
import { useState } from 'react'
import { MdDelete } from 'react-icons/md'

// Define the type for a variant
interface Variant {
	type: string
	value: string
}

const Starter = () => {
	let valueSnow = ''
	const modules = {
		toolbar: [
			[{ font: [] }, { size: [] }],
			['bold', 'italic', 'underline', 'strike'],
			[{ color: [] }, { background: [] }],
			[{ script: 'super' }, { script: 'sub' }],
			[{ header: [false, 1, 2, 3, 4, 5, 6] }, 'blockquote', 'code-block'],
			[
				{ list: 'ordered' },
				{ list: 'bullet' },
				{ indent: '-1' },
				{ indent: '+1' },
			],
			['direction', { align: [] }],
			['link', 'image', 'video'],
			['clean'],
		],
	}
	const {
		handleSubmit,
		register,
		control,
		formState: { errors },
	} = useForm()
	const [currency, setCurrency] = useState('PKR')

	const [variantType, setVariantType] = useState('Size')
	const [productStatus, setProductStatus] = useState('active')

	const [options, setOptions] = useState([])
	const [variants, setVariants] = useState<Variant[]>([]) // State to hold added variants
	// Dummy data for options based on variant type
	const variantOptions: any = {
		Size: ['Small', 'Medium', 'Large'],
		Color: ['Red', 'Green', 'Blue'],
		Material: ['Cotton', 'Polyester', 'Wool'],
	}

	const handleVariantTypeChange = (event: any) => {
		const selectedType = event.target.value
		setVariantType(selectedType)
		setOptions(variantOptions[selectedType])
	}
	// Function to handle adding a new variant
	const handleAddVariant = () => {
		const firstSelectValue = variantType // The selected variant type
		const secondSelectValue = options[0] // Using the first option as a placeholder

		if (firstSelectValue && secondSelectValue) {
			setVariants((prevVariants) => [
				...prevVariants,
				{ type: firstSelectValue, value: secondSelectValue },
			])
		} else {
			alert('Please select both variant type and value.') // Alert if fields are empty
		}
	}
	const handleDeleteVariant = (index: number) => {
		setVariants((prevVariants) => prevVariants.filter((_, i) => i !== index))
	}

	const onSubmit = (data: any) => {
		console.log('Form Data:', data)
	}
	return (
		<>
			<Form onSubmit={handleSubmit(onSubmit)}>
				<Row>
					<Col lg={8} md={12}>
						<PageBreadcrumb title="Add New Product" subName="Products" />
						{/* Product Details */}
						<>
							<Card style={{ padding: '20px' }}>
								<FormInput
									label="Product Title"
									type="text"
									name="product_title"
									containerClass="mb-3"
									register={register}
									placeholder="Enter Product Title"
									key="text"
									errors={errors}
									control={control}
									style={{
										width: '100%',
										padding: '10px',
										boxSizing: 'border-box',
									}} // Apply the same spacing
								/>
								<h5 className="">Product Description</h5>
								<ul
									className="list-group list-group-flush"
									style={{ padding: '0px', paddingBottom: '10px' }}>
									<li className="list-group-item" style={{ padding: '0px' }}>
										<div
											className="mb-2"
											style={{ padding: '0px', overflowX: 'auto' }}>
											{/* Ensure the description field is responsive */}
											<ReactQuill
												modules={modules}
												defaultValue={valueSnow}
												theme="snow"
												className="pb-4"
												style={{
													height: 340,
													maxWidth: '100%', // Prevent overflow
													boxSizing: 'border-box', // Ensure padding works within the container
												}}
											/>
										</div>
									</li>
								</ul>
							</Card>
						</>
						{/* Product Gallery */}
						<>
							<Card style={{ padding: '20px' }}>
								<h4
									style={{
										borderBottom: '2px solid #d3d3d3',
										paddingBottom: '10px',
									}}>
									Product Gallery
								</h4>
								<Card.Body>
									{/* Single Image Uploader (Product Main Image) */}
									<div>
										<h5>Product Image</h5>
										<h6>Add Product main Image</h6>
									</div>
									<SingleFileUploader
										icon="ri-upload-cloud-2-line"
										text="Drop file here or click to upload a product image."
										onFileUpload={(file: any) => console.log(file)} // You can handle file upload here
									/>
								</Card.Body>

								<Card.Body>
									{/* Multiple Image Uploader (Product Gallery) */}
									<div>
										<h5>Product Gallery</h5>
										<h6>Add Product Gallery Images</h6>
									</div>
									<FileUploader
										icon="ri-upload-cloud-2-line"
										text="Drop files here or click to upload."
									// No maxFiles prop passed, allowing default multiple uploads
									/>
								</Card.Body>
							</Card>
						</>
						{/* Products Tabs / price / stock / variants */}
						<>
							<Card style={{ padding: '20px' }}>
								<h4
									style={{
										borderBottom: '2px solid #d3d3d3',
										paddingBottom: '10px',
									}}>
									Product Details
								</h4>
								<Card.Body>
									<Tab.Container defaultActiveKey="general">
										{/* Tabs for Different Sections */}
										<Nav variant="tabs" role="tablist" className="mb-3">
											<Nav.Item as="li" role="presentation">
												<Nav.Link as={Link} to="#" eventKey="general">
													<span className="d-none d-md-block">General</span>
												</Nav.Link>
											</Nav.Item>
											<Nav.Item as="li" role="presentation">
												<Nav.Link as={Link} to="#" eventKey="stock">
													<span className="d-none d-md-block">Stock</span>
												</Nav.Link>
											</Nav.Item>
											<Nav.Item as="li" role="presentation">
												<Nav.Link as={Link} to="#" eventKey="variants">
													<span className="d-none d-md-block">Variants</span>
												</Nav.Link>
											</Nav.Item>
										</Nav>

										{/* Tab Content for Different Sections */}
										<Tab.Content>
											{/* General Tab Content */}
											<Tab.Pane eventKey="general">
												<Form.Group className="mb-3">
													<Form.Label
														htmlFor="Price"
														style={{
															fontWeight: 'bold',
															fontSize: '1.1rem',
															color: '#333',
														}}>
														Price
													</Form.Label>
													<InputGroup className="mb-3">
														<DropdownButton
															variant="success"
															title={currency}
															id="input-group-dropdown-1">
															<Dropdown.Item onClick={() => setCurrency('PKR')}>
																PKR
															</Dropdown.Item>
															<Dropdown.Item onClick={() => setCurrency('USD')}>
																USD
															</Dropdown.Item>
															<Dropdown.Item onClick={() => setCurrency('EUD')}>
																EUD
															</Dropdown.Item>
														</DropdownButton>
														<Form.Control
															aria-label="Text input with dropdown button"
															type="number"
															placeholder="Enter Product Price"
														/>
													</InputGroup>
												</Form.Group>
												<Form.Check
													type="switch"
													className="mb-3 mt-2"
													id="custom-switch"
													label="Keep In Best Seller Product"></Form.Check>
											</Tab.Pane>

											{/* Stock Tab Content */}
											<Tab.Pane eventKey="stock">
												<Form.Group className="mb-3 d-flex align-items-center">
													<h4
														style={{
															fontWeight: 'bold',
															fontSize: '1.1rem',
															color: '#333',
														}}
														className="me-3 fw-bold">
														Product Stock:
													</h4>
													<FormInput
														type="number"
														name="number"
														placeholder="Enter Product Stock"
														containerClass="mb-0"
														register={register}
														key="number"
														errors={errors}
														control={control}
													/>
												</Form.Group>
											</Tab.Pane>

											{/* Variants Tab Content */}
											<Tab.Pane eventKey="variants">
												<h4>Select Variants Type</h4>
												<Row className="mb-3">
													<Col xs={6}>
														<Form.Select onChange={handleVariantTypeChange}>
															<option defaultValue="selected">Size</option>
															<option value="Color">Color</option>
															<option value="Material">Material</option>
														</Form.Select>
													</Col>
													<Col xs={6}>
														<Form.Select>
															<option defaultValue="selected">
																First Select Variant
															</option>
															{options.map((option, index) => (
																<option key={index} value={option}>
																	{option}
																</option>
															))}
														</Form.Select>
													</Col>
												</Row>
												<Button variant="success" onClick={handleAddVariant}>
													Add New Variants
												</Button>
												{/* List to display added variants */}
												{/* List to display added variants */}
												{variants.length > 0 && (
													<ListGroup className="mt-3">
														{variants.map((variant, index) => (
															<ListGroup.Item
																key={index}
																className="d-flex justify-content-between align-items-center mb-2"
															// Adjust width here
															>
																{/* Separate box for variant type */}
																<div
																	style={{
																		width: '48%', // Adjust as needed
																		display: 'flex',
																		justifyContent: 'center',
																		border: '1px solid #ced4da', // Bootstrap border color
																		borderRadius: '0.25rem', // Bootstrap border radius
																		padding: '0.375rem', // Padding for input-like appearance
																	}}>
																	{variant.type}
																</div>

																{/* Separate box for variant value with delete button */}
																<div
																	style={{
																		width: '48%', // Adjust as needed
																		display: 'flex',
																		justifyContent: 'center',
																		alignItems: 'center',
																		border: '1px solid #ced4da', // Bootstrap border color
																		borderRadius: '0.25rem', // Bootstrap border radius
																		padding: '0.375rem', // Padding for input-like appearance
																	}}>
																	{variant.value}
																</div>
																<MdDelete
																	onClick={() => handleDeleteVariant(index)}
																	style={{
																		color: 'red',
																		cursor: 'pointer',
																	}} // Ensure the default color is inherited
																/>
															</ListGroup.Item>
														))}
													</ListGroup>
												)}
											</Tab.Pane>
										</Tab.Content>
									</Tab.Container>
								</Card.Body>
							</Card>
						</>
					</Col>
					{/* SideBar Category */}
					<Col
						lg={4}
						className="d-none d-lg-block "
						style={{ marginTop: '75px' }}>
						<>
							<Card>
								<Card.Header>Product Categories</Card.Header>
								<Card.Body>
									<h5 className="mb-2">Category</h5>
									<Form.Select>
										<option defaultValue="selected">Categories</option>
										<option value="Color">Dry Fruit</option>
										<option value="Material">Cloths</option>
									</Form.Select>
									<h5 className="mb-2 mt-3">Sub-Category</h5>
									<Form.Select>
										<option defaultValue="selected">SubCategories</option>
										<option value="Color">Cocunut</option>
										<option value="Material">Peach</option>
									</Form.Select>
									<h5 className="mb-2 mt-3">Brands</h5>
									<Form.Select>
										<option defaultValue="selected">Brands</option>
										<option value="Color">3pl</option>
										<option value="Material">Imtiaz</option>
									</Form.Select>
								</Card.Body>
							</Card>
						</>
						{/* sideBar Product LifeCycle */}
						<>
							<Card>
								<Card.Header>Publish</Card.Header>
								<Card.Body>
									<h5 className="mb-2">Product Status</h5>
									<Form.Select
										value={productStatus} // Bind the selected value to state
										onChange={(e) => setProductStatus(e.target.value)}>
										<option value="active">Active</option>
										<option value="upcoming">UpComing</option>
										<option value="archived">Archived</option>
										<option value="discontinued">Discontinued</option>
									</Form.Select>
									{/* Conditionally show this text if 'upcoming' is selected */}
									{productStatus === 'upcoming' && (
										<FormInput
											label="Release Date"
											type="date"
											name="date"
											containerClass="mb-3 mt-3"
											register={register}
											key="date"
											errors={errors}
											control={control}
										/>
									)}
								</Card.Body>
							</Card>
						</>
					</Col>
				</Row>
				{/* For responsive: Show sidebar content in normal layout on small screens */}
				{/* <Col xs={12} className="d-block d-lg-none mt-3">
					<>
						<Card>
							<Card.Header>Product Categories</Card.Header>
							<Card.Body>
								<h5 className="mb-2">Category</h5>
								<Form.Select>
									<option defaultValue="selected">Categories</option>
									<option value="Color">Dry Fruit</option>
									<option value="Material">Cloths</option>
								</Form.Select>
								<h5 className="mb-2 mt-3">Sub-Category</h5>
								<Form.Select>
									<option defaultValue="selected">SubCategories</option>
									<option value="Color">Cocunut</option>
									<option value="Material">Peach</option>
								</Form.Select>
								<h5 className="mb-2 mt-3">Brands</h5>
								<Form.Select>
									<option defaultValue="selected">Brands</option>
									<option value="Color">3pl</option>
									<option value="Material">Imtiaz</option>
								</Form.Select>
							</Card.Body>
						</Card>
					</>
					<>
						<Card>
							<Card.Header>Publish</Card.Header>
							<Card.Body>
								<h5 className="mb-2">Product Status</h5>
								<Form.Select
									value={productStatus} // Bind the selected value to state
									onChange={(e) => setProductStatus(e.target.value)}>
									<option value="active">Active</option>
									<option value="upcoming">UpComing</option>
									<option value="archived">Archived</option>
									<option value="discontinued">Discontinued</option>
								</Form.Select>
								{productStatus === 'upcoming' && (
									<FormInput
										label="Release Date"
										type="date"
										name="date"
										containerClass="mb-3 mt-3"
										register={register}
										key="date"
										errors={errors}
										control={control}
									/>
								)}
							</Card.Body>
						</Card>
					</>
				</Col> */}
				<div className="d-flex justify-content-center">
					<Button variant="success" type="submit">
						Add Product
					</Button>
				</div>
			</Form>
		</>
	)
}

export default Starter
