import { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import CreateProduct from './CreateProduct'
import { useAuthContext } from '@/common'
import { ProductFormLoader } from '../other/SimpleLoader'

interface ProductUpdateModalProps {
    show: boolean
    onHide: () => void
    productId: string
    onUpdate?: () => void

}

const ProductUpdateModal = ({ show, onHide, productId, onUpdate }: ProductUpdateModalProps) => {
    const [productData, setProductData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const BASE_API = import.meta.env.VITE_BASE_API
    const { user } = useAuthContext()
    const { token } = user

    const fetchProductData = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${BASE_API}/api/products/${productId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (!response.ok) {
                throw new Error('Failed to fetch product data')
            }
            const products = await response.json();
console.log("product id in update modal ", productId);

            // Filter exact product we want to edit
            const data = Array.isArray(products)
                ? products.find(product => product._id === productId)
                : products;
            setProductData({
                ...data,
                categories: data.category?.map((cat: any) => cat._id) || [],
                subcategories: data.subcategory?.map((subCat: any) => subCat._id) || [],
                subsubcategories: data.subsubcategory?.map((subSubCat: any) => subSubCat._id) || [],
                brandId: data?.brand?._id,
                tags: data.tags?.map((tag: any) => ({
                    _id: tag._id,
                    name: tag.name
                })),
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
                    <CreateProduct
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
export default ProductUpdateModal