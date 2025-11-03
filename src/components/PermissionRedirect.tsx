import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/common/context'
import { findFirstAccessibleRoute } from '@/common/menu'

interface PermissionRedirectProps {
	children: React.ReactNode
}

const PermissionRedirect: React.FC<PermissionRedirectProps> = ({ children }) => {
	const { permissions, isAuthenticated, isSuperUser } = useAuthContext()
	const location = useLocation()

	useEffect(() => {
		// This effect will run after the component mounts and user data is loaded
	}, [permissions, isAuthenticated])

	// If not authenticated, don't redirect (let login handle it)
	if (!isAuthenticated) {
		return <>{children}</>
	}

	// If super user, allow access to all routes
	if (isSuperUser) {
		return <>{children}</>
	}

	// If user is on the root path or dashboard and doesn't have dashboard permission
	if ((location.pathname === '/' || location.pathname === '/dashboard') && 
		(!permissions?.Dashboard?.View)) {
		
		// Find the first accessible route
		const firstAccessibleRoute = findFirstAccessibleRoute(permissions, isSuperUser)
		
		if (firstAccessibleRoute) {
			return <Navigate to={firstAccessibleRoute} replace />
		} else {
			// If no accessible routes, redirect to no-access page
			return <Navigate to="/no-access" replace />
		}
	}

	// If user has no permissions at all and is not on no-access page
	if (!permissions || Object.keys(permissions).length === 0) {
		if (location.pathname !== '/no-access') {
			return <Navigate to="/no-access" replace />
		}
	}

	return <>{children}</>
}

export default PermissionRedirect
