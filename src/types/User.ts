export type User = {
	is_superuser: boolean
	permissions: any
	role: string
	id: string
}

export type PermissionTypes = 'Create' | 'View' | 'Update' | 'Delete'

export type PagePermissions = {
	Create: boolean
	View: boolean
	Update: boolean
	Delete: boolean
}

export type Permission = {
	Products: PagePermissions
	Inventory: PagePermissions
	Orders: PagePermissions
	Users: PagePermissions
	Settings: PagePermissions
	Policies: PagePermissions
	Wallets: PagePermissions
}

export interface UserData {
	email: string
	password: string
}
