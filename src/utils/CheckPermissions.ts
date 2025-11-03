interface UserSession {
	is_superuser: boolean
	permissions: {
		[key: string]: {
			[action: string]: boolean
		}
	}
}

export const checkPermissions = (resource: string, action: string): boolean => {
	const userSession = JSON.parse(
		localStorage.getItem('userSession') || '{}'
	) as UserSession

	// If user is a superuser (admin), allow all actions
	if (userSession.is_superuser) {
		return true
	}

	// Check specific permissions for regular users
	return userSession.permissions?.[resource]?.[action] ?? false
}

// Helper function to check multiple permissions at once
export const checkMultiplePermissions = (
	permissions: Array<[string, string]>
): boolean => {
	return permissions.every(([resource, action]) =>
		checkPermissions(resource, action)
	)
}

// Example usage:
// const canCreateUser = checkPermissions('User', 'create');
// const canEditAndDeletePost = checkMultiplePermissions([['Post', 'edit'], ['Post', 'delete']]);
