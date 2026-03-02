/**
 * Shared menu and additional permissions for Create/Update Role.
 * Update page uses this full list so all menus always show when editing.
 */

export const MENU_PERMISSIONS: Record<string, string> = {
	Dashboard: 'Dashboard',
	Products: 'Products',
	Inventory: 'Inventory',
	Orders: 'Orders',
	Users: 'Users',
	Notifications: 'Notifications',
	Wallets: 'Wallets',
	University: 'University',
	Settings: 'Settings',
	Policies: 'Policies',
}

export const ADDITIONAL_PERMISSIONS: Record<string, string> = {
	Home: 'Home',
	'Valliani University': 'Valliani University',
	Inventory: 'Inventory Order',
	Marketing: 'Marketing',
	Supplies: 'Supplies',
	'Tool Finding': 'Tool Finding',
	GWP: 'GWP',
	'Add to Cart': 'Cart',
	'Special Order': 'Special Order',
	'My inventory': 'My inventory',
	'Request order': 'Request order',
}

const CRUD_KEYS = ['Create', 'View', 'Update', 'Delete'] as const

export type PermissionState = Record<string, { Create: boolean; View: boolean; Update: boolean; Delete: boolean }>

/** Build full default permission object (all keys, all false) for Create role. */
export function getDefaultPermissions(): PermissionState {
	const state: PermissionState = {}
	Object.values(MENU_PERMISSIONS).forEach((key) => {
		state[key] = { Create: false, View: false, Update: false, Delete: false }
	})
	Object.values(ADDITIONAL_PERMISSIONS).forEach((key) => {
		state[key] = { Create: false, View: false, Update: false, Delete: false }
	})
	return state
}

/** Merge API permissions into full default. Used on Update so all menus show; API values override. */
export function mergeApiPermissions(apiPermissions: Record<string, any> | undefined): PermissionState {
	const full = getDefaultPermissions()
	if (!apiPermissions || typeof apiPermissions !== 'object') return full
	Object.keys(apiPermissions).forEach((pageKey) => {
		const apiPage = apiPermissions[pageKey]
		if (!apiPage || typeof apiPage !== 'object') return
		if (!full[pageKey]) full[pageKey] = { Create: false, View: false, Update: false, Delete: false }
		full[pageKey] = {
			Create: !!apiPage.Create,
			View: !!apiPage.View,
			Update: !!apiPage.Update,
			Delete: !!apiPage.Delete,
		}
	})
	return full
}

export { CRUD_KEYS }
