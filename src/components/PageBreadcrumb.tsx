import { ReactNode } from 'react'
import { Breadcrumb, Col, Row } from 'react-bootstrap'
import { Helmet } from 'react-helmet'
import { Link, useNavigate } from 'react-router-dom'

interface PageTitleProps {
	subName?: string
	title: string
	allowNavigateBack?: boolean
	addedChild?: ReactNode
}
const PageBreadcrumb = ({ subName, title, addedChild, allowNavigateBack }: PageTitleProps) => {
	const navigate = useNavigate()

	const handleClick = () => {
		if (allowNavigateBack) {
			navigate(-1)
		}
	}
	return (
		<>
			{/* @ts-ignore */}
			<Helmet>
				<title>{title} | 3pl</title>
			</Helmet>
			{subName && (
				<Row>
					<Col xs={12}>
						<div className="page-title-box">
							<div className="page-title-right">
								<ol className="breadcrumb m-0">
									<Link
										to="/"
										style={{ color: '#6C757D' }}
										className="breadcrumb-item">
										3pl
									</Link>
									<Breadcrumb.Item onClick={handleClick}
										style={{ cursor: allowNavigateBack ? 'pointer' : 'default' }}>{subName}</Breadcrumb.Item>
									<Breadcrumb.Item active>{title}</Breadcrumb.Item>
								</ol>
							</div>
							<h4 className="page-title">{title}</h4>
							{addedChild}
						</div>
					</Col>
				</Row>
			)}
		</>
	)
}

export default PageBreadcrumb
