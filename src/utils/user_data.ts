// Remove unused import

// export const UserData = async () => {
// 	const { user } = useAuthContext()
// 	try {
// 		const BASE_API = import.meta.env.VITE_BASE_API
// 		const yourAuthToken = user.token
// 		const response = await fetch(`${BASE_API}/api/users`, {
// 			method: 'GET',
// 			headers: {
// 				'Content-Type': 'application/json',
// 				Authorization: `Bearer ${yourAuthToken}`,
// 			},
// 		})
// 		if (!response.ok) {
// 			throw new Error('User Get failed')
// 		}
// 		return await response.json()
// 	} catch (error: any) {
// 		console.error('Error getting User details:', error)
// 		throw error
// 	}
// }
// if (!checkPermissions('Users', 'Create')) {
//     setToastMessage('You do not have permission to create users')
//     setToastVariant('danger')
//     setShowToast(true)
//     return
// }
// setLoading(true)

// setLoading(false)
// setToastMessage('User created successfully!')
// setToastVariant('success')
// setShowToast(true)
// reset()

// setToastMessage(error.message || 'User creation failed')
// setShowToast(true)
// setToastVariant('danger')
// setLoading(false)

export const handleEdit = (user: any) => {
	// Logic to handle editing, e.g., open a modal or navigate to an edit page
	console.log('Editing user:', user)
}

export const handleDelete = (id: string) => {
	// Logic to handle deletion, e.g., confirm and call the delete API
	console.log('Deleting user with ID:', id)
}
