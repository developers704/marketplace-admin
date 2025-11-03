import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '../common/context'
import { findFirstAccessibleRoute } from '../common/menu'

const PrivateRoute = ({ children, requiredPermission, to_do }: any) => {
	const { permissions, isAuthenticated, isSuperUser } = useAuthContext()
	const location = useLocation()

	// Check if the user is authenticated
	if (!isAuthenticated) {
		return <Navigate to="/auth/login" />
	}

	// If the user is a superuser, allow access to all routes
	if (isSuperUser) {
		return children
	}

	// Check if the user has the required permission
	if (!permissions[requiredPermission] || permissions[requiredPermission][to_do] === false) {
		// Find the first accessible route for this user
		const firstAccessibleRoute = findFirstAccessibleRoute(permissions, isSuperUser)
		
		// If user has no accessible routes, redirect to no-access page
		if (!firstAccessibleRoute) {
			return <Navigate to="/no-access" />
		}
		
		// If user is trying to access dashboard but doesn't have permission, redirect to first accessible route
		if (location.pathname === '/' || location.pathname === '/dashboard') {
			return <Navigate to={firstAccessibleRoute} />
		}
		
		// For other routes, redirect to no-access page
		return <Navigate to="/no-access" />
	}

	// If everything is fine, render the children (protected component)
	return children
}

export default PrivateRoute
