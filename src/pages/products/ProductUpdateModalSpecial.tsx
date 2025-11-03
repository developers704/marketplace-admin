import { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { useAuthContext } from '@/common'
import { ProductFormLoader } from '../other/SimpleLoader'
import CreateSpecialProduct from './CreateSpecialProducts'

interface ProductUpdateModalProps {
    show: boolean
    onHide: () => void
    productId: string
    onUpdate?: () => void

}

const ProductUpdateModalSpecial = ({ show, onHide, productId, onUpdate }: ProductUpdateModalProps) => {
    const [productData, setProductData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const BASE_API = import.meta.env.VITE_BASE_API
    const { user } = useAuthContext()
    const { token } = user

    const fetchProductData = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/special-products/${productId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (!response.ok) {
                throw new Error('Failed to fetch product data')
            }
            const data = await response.json()

            // Directly use the data if it's a single product
            setProductData({
                ...data,
                categories: data?.specialCategory,
                prices: data.prices?.map((price: any) => ({
                    city: price.city._id,
                    cityName: price.city.name,
                    amount: price.amount,
                    salePrice: price.salePrice
                })),
                variants: data.variants,
            })

        } catch (error) {
            console.error('Error fetching product:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (show && productId) {
            fetchProductData()
        }
    }, [show, productId])

    return (
        <Modal show={show} onHide={onHide} size="xl">
            <Modal.Header closeButton>
                <h4>Update Product</h4>
            </Modal.Header>
            <Modal.Body >
                {loading ? (
                    <ProductFormLoader />
                ) : (
                    <CreateSpecialProduct
                        isEditing={true}
                        initialData={productData}
                        onSuccess={() => {
                            onUpdate?.()
                            onHide()
                        }}
                    />
                )}
            </Modal.Body>
        </Modal>
    )
}
export default ProductUpdateModalSpecial