import { Card, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const NoAccess = () => {
	return (
		<>
			<div className="account-pages pt-2 pt-sm-5 pb-4 pb-sm-5">
				<div className="container">
					<Row className="justify-content-center">
						<Col md={8} lg={6} xl={5} xxl={4}>
							<Card>
								<Card.Body className="p-4">
									<div className="text-center">
										<div className="auth-logo">
											<Link to="/" className="logo logo-dark">
												<span className="logo-lg">
													<img src="/images/logo-dark.png" alt="" height="22" />
												</span>
											</Link>

											<Link to="/" className="logo logo-light">
												<span className="logo-lg">
													<img src="/images/logo-white.png" alt="" height="22" />
												</span>
											</Link>
										</div>
									</div>

									<div className="text-center">
										<div className="mb-4">
											<i className="ri-error-warning-line text-warning" style={{ fontSize: '4rem' }}></i>
										</div>
										<h4 className="text-uppercase mt-3">Access Denied</h4>
										<p className="text-muted">
											You don't have permission to access any part of this application. 
											Please contact your administrator to get the necessary permissions.
										</p>
										<Link to="/auth/logout" className="btn btn-primary">
											Logout
										</Link>
									</div>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</div>
			</div>
		</>
	)
}

export default NoAccess
