import { Button, Card, Form } from 'react-bootstrap'

interface ProductTagsProps {
    tagInput: string
    setTagInput: (value: string) => void
    handleTagInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void  // Add this
    handleAddTag: (tagName: string, isNewTag: boolean) => void
    showSuggestions: boolean
    filteredTags: Array<{ _id: string; name: string }>
    productTags: Array<{ _id: string; name: string }>
    setProductTags: React.Dispatch<React.SetStateAction<Array<{ _id: string; name: string }>>>
}


const ProductTags = ({
    tagInput,
    setTagInput,
    handleAddTag,
    showSuggestions,
    handleTagInputChange,
    filteredTags, 
    productTags,
    setProductTags
}: ProductTagsProps) => {
    return (
        <Card>
            <Card.Header>Product Tags</Card.Header>
            <Card.Body>
                <div className="position-relative">
                    <div className="d-flex">
                        <Form.Control
                            type="text"
                            placeholder="Enter tag"
                            value={tagInput}
                            onChange={handleTagInputChange}  // Use the passed handler instead
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddTag(tagInput, true)
                                }
                            }}
                        />

                        <Button
                            variant="success"
                            onClick={() => handleAddTag(tagInput, true)}
                            className="ms-2"
                        >
                            +
                        </Button>
                    </div>

                    {showSuggestions && filteredTags.length > 0 && (
                        <div
                            className="position-absolute w-100 mt-1 shadow-sm bg-white border rounded"
                            style={{
                                zIndex: 1000,
                                maxHeight: '200px',
                                overflowY: 'auto',
                            }}
                        >
                            {filteredTags.map((tag) => (
                                <div
                                    key={tag._id}
                                    className="p-2 cursor-pointer hover-bg-light"
                                    onClick={() => handleAddTag(tag.name, false)}
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.backgroundColor = '#f8f9fa')
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.backgroundColor = 'white')
                                    }
                                >
                                    {tag.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="selected-values mt-2">
                    {productTags.map((tag, index) => (
                        <span key={index} className="badge bg-primary me-1">
                            {tag.name}
                            <button
                                type="button"
                                className="btn-close ms-1"
                                onClick={() =>
                                    setProductTags(productTags.filter((t) => t._id !== tag._id))
                                }
                            ></button>
                        </span>
                    ))}
                </div>
            </Card.Body>
        </Card>
    )
}

export default ProductTags
