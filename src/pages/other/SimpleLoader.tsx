import { Col, Row, Spinner } from 'react-bootstrap'

export const SimpleLoader = () => {
	return (
		<>
			<div
				className="d-flex justify-content-center align-items-center"
				style={{ height: '100vh' }}>
				<Spinner animation="grow" style={{ margin: '0 5px' }} />
				<Spinner animation="grow" style={{ margin: '0 5px' }} />
				<Spinner animation="grow" style={{ margin: '0 5px' }} />
			</div>
		</>
	)
}

export const SmallLoader = () => {
	return (
		<div className="d-flex justify-content-center align-items-center">
			<Spinner animation="grow" size="sm" style={{ margin: '0 5px' }} />
			<Spinner animation="grow" size="sm" style={{ margin: '0 5px' }} />
			<Spinner animation="grow" size="sm" style={{ margin: '0 5px' }} />
		</div>
	)
}

export interface SkeletonHeader {
	width: string
	type: 'checkbox' | 'text' | 'number' | 'date' | 'actions' | 'image'
}

interface TableSkeletonProps {
	headers: SkeletonHeader[]
	rowCount?: number
}

export const TableRowSkeleton = ({ headers, rowCount = 4 }: TableSkeletonProps) => {
	return (
		<>
			{[...Array(rowCount)].map((_, rowIndex) => (
				<tr key={rowIndex} style={{ height: '57px' }}>
					{headers.map((header, colIndex) => (
						<td key={colIndex} className="align-middle">
							{header.type === 'checkbox' && (
								<div className="skeleton-loader" style={{ width: header.width, height: '20px', borderRadius: '4px' }} />
							)}
							{header.type === 'text' && (
								<div className="skeleton-loader" style={{ width: header.width, height: '20px', borderRadius: '2px' }} />
							)}
							{header.type === 'number' && (
								<div className="skeleton-loader" style={{ width: header.width, height: '20px', borderRadius: '2px' }} />
							)}
							{header.type === 'date' && (
								<div className="skeleton-loader" style={{ width: header.width, height: '20px', borderRadius: '2px' }} />
							)}
							{header.type === 'image' && (
								<div className="skeleton-loader" style={{ width: '40px', height: '20px', borderRadius: '50%' }} />
							)}
							{header.type === 'actions' && (
								<div className="skeleton-loader" style={{ width: header.width, height: '20px', borderRadius: '4px' }} />
							)}
						</td>
					))}
				</tr>
			))}
		</>
	)
}

export const ProductFormLoader = () => {
	return (
		<div className="animate-pulse mt-3">
			<Row>
				<Col xs={12} md={8}>
					{/* Basic Info Skeleton */}
					<div className="bg-white p-3 mb-3 rounded shadow-sm">
						<div className="skeleton-loader mb-3" style={{ height: "32px", width: "200px" }} />
						<div className="skeleton-loader mb-3" style={{ height: "40px", width: "100%" }} />
						<div className="skeleton-loader mb-3" style={{ height: "40px", width: "100%" }} />
						<div className="skeleton-loader" style={{ height: "200px", width: "100%" }} />
					</div>

					{/* Gallery Skeleton */}
					<div className="bg-white p-3 mb-3 rounded shadow-sm">
						<div className="skeleton-loader mb-3" style={{ height: "32px", width: "150px" }} />
						<div className="d-flex gap-2">
							{[1, 2, 3].map((i) => (
								<div key={i} className="skeleton-loader" style={{ height: "100px", width: "100px" }} />
							))}
						</div>
					</div>

					{/* Tabs Skeleton */}
					<div className="bg-white p-3 rounded shadow-sm">
						<div className="d-flex gap-2 mb-3">
							{[1, 2, 3].map((i) => (
								<div key={i} className="skeleton-loader" style={{ height: "40px", width: "120px" }} />
							))}
						</div>
						<div className="skeleton-loader" style={{ height: "200px", width: "100%" }} />
					</div>
				</Col>

				<Col xs={12} md={4}>
					{/* Sidebar Skeletons */}
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="bg-white p-3 mb-3 rounded shadow-sm">
							<div className="skeleton-loader mb-3" style={{ height: "32px", width: "150px" }} />
							<div className="skeleton-loader" style={{ height: "100px", width: "100%" }} />
						</div>
					))}
				</Col>
			</Row>
		</div>
	)
}

export const PolicyPageLoader = () => {
	return (
		<div className="animate-pulse mt-5">
			{/* Card Skeleton */}
			<div className="bg-white rounded shadow-sm">
				{/* Card Header */}
				<div className="p-3 border-bottom">
					<div className="skeleton-loader mb-2" style={{ height: "28px", width: "200px" }} />
					<div className="skeleton-loader" style={{ height: "20px", width: "300px" }} />
				</div>

				{/* Card Body */}
				<div className="p-3">
					{/* Editor Toolbar Skeleton */}
					<div className="skeleton-loader mb-3" style={{ height: "42px", width: "100%" }} />

					{/* Editor Content Skeleton */}
					<div className="d-flex flex-column gap-2">
						<div className="skeleton-loader" style={{ height: "16px", width: "100%" }} />
						<div className="skeleton-loader" style={{ height: "16px", width: "90%" }} />
						<div className="skeleton-loader" style={{ height: "16px", width: "95%" }} />
						<div className="skeleton-loader" style={{ height: "16px", width: "85%" }} />
						<div className="skeleton-loader" style={{ height: "16px", width: "100%" }} />
					</div>

					{/* Button Skeleton */}
					<div className="text-end mt-4">
						<div className="skeleton-loader d-inline-block" style={{ height: "38px", width: "150px" }} />
					</div>
				</div>
			</div>
		</div>
	)
}
