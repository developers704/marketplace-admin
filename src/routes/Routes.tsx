import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

// All layouts containers
import DefaultLayout from '../Layouts/Default'
import VerticalLayout from '../Layouts/Vertical'
import HorizontalLayout from '../Layouts/Horizontal'

import {
	authProtectedFlattenRoutes,
	publicProtectedFlattenRoutes,
} from './index'
import {
	ThemeSettings,
	useAuthContext,
	useThemeContext,
} from '../common/context'
import PermissionRedirect from '../components/PermissionRedirect'

interface IRoutesProps {}

const AllRoutes = (props: IRoutesProps) => {
	const { settings } = useThemeContext()

	const Layout =
		settings.layout.type === ThemeSettings.layout.type.vertical
			? VerticalLayout
			: HorizontalLayout

	const { isAuthenticated } = useAuthContext()

	return (
		<React.Fragment>
			<Suspense fallback={<div>Loading...</div>}>
				<Routes>
					{/* Public Routes */}
					{publicProtectedFlattenRoutes.map((route, idx) => (
						<Route
							path={route.path}
							element={
								<DefaultLayout {...props}>{route.element}</DefaultLayout>
							}
							key={idx}
						/>
					))}

					{/* Auth Protected Routes */}
					{authProtectedFlattenRoutes.map((route, idx) => (
						<Route
							path={route.path}
							element={
								isAuthenticated === false ? (
									<Navigate
										to={{
											pathname: '/auth/login',
											search: 'next=' + route.path,
										}}
									/>
								) : (
									<PermissionRedirect>
										<Layout {...props}>{route.element}</Layout>
									</PermissionRedirect>
								)
							}
							key={idx}
						/>
					))}
				</Routes>
			</Suspense>
		</React.Fragment>
	)
}

export default AllRoutes
