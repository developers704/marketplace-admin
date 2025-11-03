import profilePic from '@/assets/images/users/avatar-1.jpg'
import profilePic2 from '@/assets/images/users/avatar-5.jpg'

interface Statistic {
	title: string
	stats: string
	change: string
	icon: string
	variant: string
}

interface ProjectData {
	id: number
	projectName: string
	dueDate: string
	status: string
	variant: string
}
export const statistics: Statistic[] = [
	{
		title: 'Daily Visits',
		stats: '12,450',
		change: '5.30%',
		icon: 'ri-eye-line',
		variant: 'text-bg-pink',
	},
	{
		title: 'Courses',
		stats: '325',
		change: '10.20%',
		icon: 'ri-calendar-check-line',
		variant: 'text-bg-success',
	},

	{
		title: 'Revenue',
		stats: '$  15,320.75',
		change: '12.45%',
		icon: 'ri-wallet-2-line',
		variant: 'text-bg-purple',
	},
	{
		title: 'Total Orders',
		stats: '1,145',
		change: '3.75%',
		icon: 'ri-shopping-basket-line',
		variant: 'text-bg-info',
	},

	{
		title: 'Returning Customers',
		stats: '712',
		change: '6.15%',
		icon: 'ri-user-heart-line',
		variant: 'text-bg-warning',
	},
	{
		title: 'Products in Stock',
		stats: '2,345',
		change: '-2.25%',
		icon: 'ri-store-line',
		variant: 'text-bg-danger',
	},
	{
		title: 'New Users',
		stats: '185',
		change: '15.30%',
		icon: 'ri-user-add-line',
		variant: 'text-bg-primary',
	},
	{
		title: 'Departments',
		stats: '15',
		change: '-1.80%',
		icon: 'ri-close-circle-line',
		variant: 'text-bg-secondary',
	},
]

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

export const projects: ProjectData[] = [
	{
		id: 1,
		projectName: 'Asad Iqbal',
		dueDate: '26/04/2015',
		status: 'Active',
		variant: 'info',
	},
	{
		id: 2,
		projectName: 'Waqas Ali',
		dueDate: '26/04/2015',
		status: 'Active',
		variant: 'info',
	},
	{
		id: 3,
		projectName: 'Usman Shekh',
		dueDate: '26/04/2015',
		status: 'Active',
		variant: 'info',
	},
	{
		id: 4,
		projectName: 'Hassan Ali',
		dueDate: '31/05/2015',
		status: 'De-active',
		variant: 'danger',
	},
	{
		id: 5,
		projectName: 'Hamza ',
		dueDate: '31/05/2015',
		status: 'Active',
		variant: 'info',
	},
	{
		id: 6,
		projectName: 'Ali',
		dueDate: '31/05/2015',
		status: 'Active',
		variant: 'info',
	},
	{
		id: 7,
		projectName: 'Azeem',
		dueDate: '31/05/2015',
		status: 'De-Active',
		variant: 'danger',
	},
]
