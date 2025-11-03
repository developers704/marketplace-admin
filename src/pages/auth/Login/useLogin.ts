import { useAuthContext } from '@/common'
import { UserData } from '@/types'
import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { findFirstAccessibleRoute } from '@/common/menu'

export default function useLogin() {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [ipAddress, setIpAddress] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [dynamicRedirectUrl, setDynamicRedirectUrl] = useState<string>('/')
	const location = useLocation()

	const { isAuthenticated, saveSession } = useAuthContext()

	const redirectUrl = useMemo(
		() => {
			// If there's a specific redirect from location state, use it
			if (location.state && location.state.from) {
				return location.state.from.pathname
			}
			
			// Otherwise, use the dynamic redirect URL determined after login
			return dynamicRedirectUrl
		},
		[location.state, dynamicRedirectUrl]
	)

	const login = async ({ email, password }: UserData) => {
		setError(null)
		setIpAddress(null)
		setLoading(true)
		try {
			const BASE_API = import.meta.env.VITE_BASE_API
			const response = await fetch(`${BASE_API}/api/auth/admin/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			})

			if (!response.ok) {
				const errorData = await response.json()
				// Check if the error includes the actualIP field (IP restriction error)
				if (errorData.actualIP) {
					setIpAddress(errorData.actualIP)
				}
				throw new Error(errorData.message || 'Login failed')
			}

			const data = await response.json()
			console.log('response of api is ', data)

			if (data.token) {
				setSuccess(true)
				console.log(' before sace session ')

				const userSession = {
					is_superuser: data.user.is_superuser ?? null, // Default to null if undefined
					permissions: data.user.role.permissions ?? null,
					token: data.token ?? null,
					username: data.user.username ?? null,
					role: data.user.role.role_name ?? null,
					id: data.user.id ?? null,
				}
				console.log(
					' data saving in local before in uselogin page',
					userSession
				)

				// Determine the appropriate redirect URL based on user permissions
				const firstAccessibleRoute = findFirstAccessibleRoute(
					userSession.permissions, 
					userSession.is_superuser
				)
				
				if (firstAccessibleRoute) {
					setDynamicRedirectUrl(firstAccessibleRoute)
				} else {
					// If user has no accessible routes, redirect to no-access page
					setDynamicRedirectUrl('/no-access')
				}

				saveSession(userSession)
				return { success: true, message: 'Login successful' }
			}
		} catch (error: any) {
			console.log('error ', error)

			setError(error.message)
			return { success: false, message: error.message }
		} finally {
			setLoading(false)
		}
	}
	return { loading, login, redirectUrl, isAuthenticated, error, ipAddress, success }
}