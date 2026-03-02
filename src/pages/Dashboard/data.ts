import profilePic from '@/assets/images/users/avatar-1.jpg'
import profilePic2 from '@/assets/images/users/avatar-5.jpg'

export interface Statistic {
	title: string
	stats: string
	change: string
	icon: string
	variant: string
}

export interface ProjectData {
	id: string
	projectName: string
	dueDate: string
	status: string
	variant: string
	role?: string
}

export interface DashboardUser {
	_id: string
	username?: string
	email?: string
	role?: { role_name?: string }
	createdAt?: string
	updatedAt?: string
	is_superuser?: boolean
}

export interface DashboardStats {
	totalUsers: number
	totalCustomer: number
	totalOrders: number
	totalSpoOrders: number
	productsInStock: number
	totalCourses: number
	revenue: number
	dailyVisits: number
	totalVisits: number

}

export const chatMessages = [
	{
		id: 1,
		userPic: profilePic2,
		userName: 'Geneva',
		text: 'Hello!',
		postedOn: '10:00',
	},
	{
		id: 2,
		userPic: profilePic,
		userName: 'Thomson',
		text: 'Hi, How are you? What about our next meeting?',
		postedOn: '10:01',
	},
	{
		id: 3,
		userPic: profilePic2,
		userName: 'Geneva',
		text: 'Yeah everything is fine',
		postedOn: '10:02',
	},
	{
		id: 4,
		userPic: profilePic,
		userName: 'Thomson',
		text: "Wow that's great!",
		postedOn: '10:03',
	},
	{
		id: 5,
		userPic: profilePic2,
		userName: 'Geneva',
		text: 'Cool!',
		postedOn: '10:03',
	},
]

/** Stat card config (order and display) – stats values come from API */
export const STATISTICS_CONFIG: { title: string; icon: string; variant: string; key: keyof DashboardStats }[] = [
  { title: 'Total Orders', icon: 'ri-shopping-basket-line', variant: 'text-bg-info', key: 'totalOrders' },
  { title: 'Total Customer', icon: 'ri-book-open-line', variant: 'text-bg-purple', key: 'totalCustomer' },
  { title: 'Total SPO Orders', icon: 'ri-shopping-basket-line', variant: 'text-bg-info', key: 'totalSpoOrders' },
  { title: 'Products in Stock', icon: 'ri-store-line', variant: 'text-bg-danger', key: 'productsInStock' },
  { title: 'Total Users', icon: 'ri-user-add-line', variant: 'text-bg-primary', key: 'totalUsers' },
  { title: 'Total Courses', icon: 'ri-book-open-line', variant: 'text-bg-primary', key: 'totalCourses' },
]