import {
	HORIZONTAL_MENU_ITEMS,
	MENU_ITEMS,
	MenuItemTypes,
} from '@/constants/menu'

const getMenuItems = (
	permissions: any,
	isSuperUser?: boolean,
	notifications?: any
) => {
	// If permissions are not available or incomplete, return an empty array or the default menu items
	if (!permissions) {
		console.error('Permissions are missing')
		return MENU_ITEMS // You can also return an empty array [] if you want the menu hidden completely
	}

	const unreadOrderCount =
		notifications?.filter((n: any) => !n.read && n.type === 'ORDER').length || 0
	const unreadWalletCount =
		notifications?.filter((n: any) => !n.read && n.type === 'WALLET_REQUEST')
			.length || 0
	const unreadCertificateCount =
		notifications?.filter((n: any) => !n.read && n.type === 'CERTIFICATE')
			.length || 0

	const menuItemsWithNotifications = MENU_ITEMS.map((item) => {
		if (item.key === 'orders') {
			return {
				...item,
				badge:
					unreadOrderCount > 0
						? {
								variant: 'danger',
								text: unreadOrderCount.toString(),
						  }
						: undefined,
			}
		}
		if (item.key === 'university') {
			return {
				...item,
				badge:
					unreadCertificateCount > 0
						? {
								variant: 'danger',
								text: unreadCertificateCount.toString(),
						  }
						: undefined,
			}
		}
		if (item.key === 'wallets') {
			return {
				...item,
				badge:
					unreadWalletCount > 0
						? {
								variant: 'danger',
								text: unreadWalletCount.toString(),
						  }
						: undefined,
			}
		}
		return item
	})

	// Use menuItemsWithNotifications instead of MENU_ITEMS in the existing filtering logic
	if (isSuperUser) {
		return menuItemsWithNotifications.filter((item) => item.key !== 'doctor')
	}
	// Filter menu items based on user permissions
	return menuItemsWithNotifications.filter((item) => {
		if (item.isTitle) return true

		// Check Dashboard permission
		if (
			item.key === 'Dashboard' &&
			(!permissions.Dashboard || !permissions.Dashboard.View)
		)
			return false

		if (
			item.key === 'products' &&
			(!permissions.Products || !permissions.Products.View)
		)
			return false
		if (item.key === 'admin' && !isSuperUser) return false
		if (
			item.key === 'doctor' &&
			(!permissions.Doctor || !permissions.Doctor.View)
		)
			return false
		if (
			item.key === 'inventory' &&
			(!permissions.Inventory || !permissions.Inventory.View)
		)
			return false
		if (
			item.key === 'shippings' &&
			(!permissions.Shipings || !permissions.Shippings.View)
		)
			return false
		if (
			item.key === 'orders' &&
			(!permissions.Orders || !permissions.Orders.View)
		)
			return false
		if (
			item.key === 'university' &&
			(!permissions.University || !permissions.University.View)
		)
			return false
		if (item.key === 'users' && (!permissions.Users || !permissions.Users.View))
			return false
		if (
			item.key === 'wallets' &&
			(!permissions.Wallets || !permissions.Wallets.View)
		)
			return false
		if (
			item.key === 'notifications' &&
			(!permissions.Notifications || !permissions.Notifications.View)
		)
			return false
		if (
			item.key === 'settings' &&
			(!permissions.Settings || !permissions.Settings.View)
		)
			return false
		if (
			item.key === 'policies' &&
			(!permissions.Policies || !permissions.Policies.View)
		)
			return false

		if (
			item.key === 'customers' &&
			(!permissions.Customers || !permissions.Customers.View)
		)
			return false

		// If the item has children, filter children based on user permissions
		if (item.children) {
			item.children = item.children.filter((child) => {
				console.log('checking child', child)

				const permissionKey =
					item.key.charAt(0).toUpperCase() + item.key.slice(1)
				console.log('checking ', permissionKey)

				return permissions[permissionKey]?.[child.key]
			})
		}

		// Return true if item is visible based on permissions
		return true
	})
}

const getHorizontalMenuItems = () => {
	// NOTE - You can fetch from server and return here as well
	return HORIZONTAL_MENU_ITEMS
}

const findAllParent = (
	menuItems: MenuItemTypes[],
	menuItem: MenuItemTypes
): string[] => {
	let parents: string[] = []
	const parent = findMenuItem(menuItems, menuItem.parentKey)

	if (parent) {
		parents.push(parent.key)
		if (parent.parentKey) {
			parents = [...parents, ...findAllParent(menuItems, parent)]
		}
	}
	return parents
}

const findMenuItem = (
	menuItems: MenuItemTypes[] | undefined,
	menuItemKey: MenuItemTypes['key'] | undefined
): MenuItemTypes | null => {
	if (menuItems && menuItemKey) {
		for (let i = 0; i < menuItems.length; i++) {
			if (menuItems[i].key === menuItemKey) {
				return menuItems[i]
			}
			let found = findMenuItem(menuItems[i].children, menuItemKey)
			if (found) return found
		}
	}
	return null
}

// Function to find the first accessible route for a user
const findFirstAccessibleRoute = (permissions: any, isSuperUser?: boolean): string | null => {
	if (!permissions) return null

	// If super user, always redirect to dashboard first
	if (isSuperUser) {
		return '/'
	}

	// Check Dashboard first
	if (permissions.Dashboard?.View) {
		return '/'
	}

	// Check other main sections in order
	const sections = [
		{ key: 'Products', path: '/products/all-product' },
		{ key: 'Inventory', path: '/inventory/all-inventory' },
		{ key: 'Orders', path: '/orders/ecommerce-orders' },
		{ key: 'Users', path: '/user/user-all' },
		{ key: 'Notifications', path: '/notifications/notification-create' },
		{ key: 'Wallets', path: '/customers/wallet-approvals' },
		{ key: 'University', path: '/university/courses' },
		{ key: 'Settings', path: '/settings/ecommerce' },
		{ key: 'Policies', path: '/policies/terms-and-conditions' },
	]

	for (const section of sections) {
		if (permissions[section.key]?.View) {
			return section.path
		}
	}

	return null
}

export { findAllParent, findMenuItem, getMenuItems, getHorizontalMenuItems, findFirstAccessibleRoute }
