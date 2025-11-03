import React, { ReactNode, useEffect } from 'react'

//images
import authImg from '@/assets/images/auth-img.png'
import logo from '@/assets/images/logo.png'

import { Card, Col, Container, Image, Row } from 'react-bootstrap'
// import { Link } from 'react-router-dom'

interface AccountLayoutProps {
	pageImage?: string
	authTitle?: string
	helpText?: string
	bottomLinks?: ReactNode
	isCombineForm?: boolean
	children?: ReactNode
	hasForm?: boolean
	hasThirdPartyLogin?: boolean
	userImage?: string
	starterClass?: boolean
}

const AuthLayout = ({
	authTitle,
	helpText,
	bottomLinks,
	children,
	hasThirdPartyLogin,
	userImage,
	starterClass,
}: AccountLayoutProps) => {
	useEffect(() => {
		if (document.body) {
			document.body.classList.add('authentication-bg', 'position-relative')
		}

		return () => {
			if (document.body) {
				document.body.classList.remove('authentication-bg', 'position-relative')
			}
		}
	}, [])

	return (
		<div className="authentication-bg position-relative">
			<div className="account-pages pt-2 pt-sm-5 pb-4 pb-sm-5 position-relative">
				<Container>
					<Row className="justify-content-center">
						<Col xxl={8} lg={10}>
							<Card className="overflow-hidden">
								<Row className="g-0">
									<Col lg={6} className="d-none d-lg-block p-2">
										<Image
											src={authImg}
											style={{
												height: '550px',
												objectFit: 'cover',
												width: '100%',
											}}
											alt=""
											className="img-fluid rounded"
										/>
									</Col>
									<Col lg={6}>
										<div className="d-flex flex-column h-60">
											<div className="auth-brand p-4">
												<a href="" className="logo-light">
													<Image src={logo} alt="logo" height="22" />
												</a>
												<a href="" className="logo-dark">
													<Image src={logo} alt="dark logo" height="50" />
												</a>
											</div>
											<div
												className={`p-4 my-auto ${starterClass ? 'text-center' : ''
													}`}>
												{userImage ? (
													<div className="text-center w-75 m-auto">
														<Image
															src={userImage}
															height={64}
															alt="user-image"
															className="rounded-circle img-fluid img-thumbnail avatar-xl"
														/>
														<h4 className="text-center mt-3 fw-bold fs-20">
															{authTitle}{' '}
														</h4>
														<p className="text-muted mb-4">{helpText}</p>
													</div>
												) : (
													<React.Fragment>
														<h4 className="fs-20">{authTitle}</h4>
														<p className="text-muted mb-3">{helpText}</p>
													</React.Fragment>
												)}

												{children}
											</div>
										</div>
									</Col>
								</Row>
							</Card>
						</Col>
					</Row>
					{/* {bottomLinks}  sing_up Options */}
				</Container>
			</div>
		</div>
	)
}

export default AuthLayout
