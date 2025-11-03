import { Col, Image, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAuthContext } from '@/common'
import AuthLayout from './AuthLayout'

// images
import shield from '@/assets/images/svg/shield.gif'

const Logout = () => {
	const { removeSession } = useAuthContext()

	useEffect(() => {
		removeSession()
	}, [removeSession])

	const BottomLink = () => {
		return (
			<Row>
				<Col xs={12} className="text-center">
					<p className="text-dark-emphasis">
						Back To{' '}
						<Link
							to="/auth/login"
							className="text-dark fw-bold ms-1 link-offset-3 text-decoration-underline">
							<b>Log In</b>
						</Link>
					</p>
				</Col>
			</Row>
		)
	}

	return (
		<>
			<Helmet>
				<title>Logout</title>
			</Helmet>
			<AuthLayout
				authTitle="See You Again !"
				helpText="You are now successfully log out."
				bottomLinks={<BottomLink />}
				starterClass>
				<div className="logout-icon m-auto">
					<Image fluid src={shield} alt="" />
				</div>
				<BottomLink />
			</AuthLayout>
		</>
	)
}

export default Logout
