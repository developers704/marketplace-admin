import { FormInput } from '@/components'
import { Card, Form } from 'react-bootstrap'

interface ProductPublishProps {
    productStatus: string
    setProductStatus: (status: string) => void
    register: any
    errors: any
    control: any
}

const ProductPublish = ({
    productStatus,
    setProductStatus,
    register, 
    errors,
    control
}: ProductPublishProps) => { 
    return (
        <Card>
            <Card.Header>Publish</Card.Header>
            <Card.Body>
                <h5 className="mb-2">Product Status</h5>
                <Form.Select
                    value={productStatus}
                    onChange={(e) => setProductStatus(e.target.value)}
                >
                    <option value="active">Active</option>
                    <option value="upcoming">UpComing</option>
                    <option value="archived">Archived</option>
                    <option value="discontinued">Discontinued</option>
                </Form.Select>

                {productStatus === 'upcoming' && (
                    <FormInput
                        label="Release Date"
                        type="date"
                        name="releaseDate"
                        containerClass="mb-3 mt-3"
                        register={register}
                        key="date"
                        errors={errors}
                        control={control}
                    />
                )}
            </Card.Body>
        </Card>
    )
}

export default ProductPublish
