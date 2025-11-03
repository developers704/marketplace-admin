export interface MenuItemTypes {
	key: string
	label: string
	isTitle?: boolean
	icon?: React.ComponentType | any
	url?: string
	badge?: {
		variant: string
		text: string
	}
	parentKey?: string
	target?: string
	children?: MenuItemTypes[]
}
import {
	MdApartment,
	MdCheckCircle,
	MdHotel,
	MdMap,
	MdPayment,
	MdPets,
	MdProductionQuantityLimits,
} from 'react-icons/md'
import { MdSecurity } from 'react-icons/md'
import { FaBell, FaFileSignature, FaWallet } from 'react-icons/fa6'
import { MdOutlineCategory } from 'react-icons/md'
// import { BiCategoryAlt } from 'react-icons/bi'
import { CiHospital1 } from 'react-icons/ci'
import { MdFolderSpecial } from 'react-icons/md'
import { MdOutlineRequestQuote } from 'react-icons/md'
import { FaUsers } from 'react-icons/fa6'
import { FaWarehouse } from 'react-icons/fa6'
import { HiClipboardDocumentList } from 'react-icons/hi2'
import { IoSettingsSharp } from 'react-icons/io5'
import { MdMedicalServices } from 'react-icons/md'
import { FaUniversity } from 'react-icons/fa'
import { RiAdminLine } from 'react-icons/ri'
import { GrShieldSecurity } from 'react-icons/gr'

const MENU_ITEMS: MenuItemTypes[] = [
	{
		key: 'Dashboard',
		label: 'Dashboard',
		isTitle: false,
		url: '/',
		icon: 'ri-dashboard-3-line',
		badge: {
			variant: 'success',
			text: '9+',
		},
	},
	{
		key: 'admin',
		label: 'Admin',
		isTitle: false,
		icon: RiAdminLine,
		children: [
			// {
			// 	key: 'View',
			// 	label: 'Activity Logs',
			// 	url: '/admin/activity-logs',
			// 	parentKey: 'admin',
			// },
			{
				key: 'View',
				label: 'Terms & Conditions',
				url: '/admin/terms-conditions',
				parentKey: 'admin',
			},
			{
				key: 'View',
				label: 'Privacy Policy',
				url: '/admin/privacy-policy-accepted',
				parentKey: 'admin',
			},
		],
	},
	{
		key: 'products',
		label: 'Products',
		isTitle: false,
		icon: MdProductionQuantityLimits,
		children: [
			{
				key: 'View',
				label: 'Items Management',
				url: '/products/all-product',
				parentKey: 'products',
			},
			{
				key: 'View',
				label: 'Categories',
				url: '/products/categories',
				parentKey: 'products',
			},
			{
				key: 'View',
				label: 'Sub-Categories',
				url: '/products/sub-category',
				parentKey: 'products',
			},
			// {
			// 	key: 'View',
			// 	label: 'Sub Sub-Category',
			// 	url: '/products/sub-sub-category',
			// 	parentKey: 'products',
			// },
			{
				key: 'View',
				label: 'Brands',
				url: '/products/brand',
				parentKey: 'products',
			},
			{
				key: 'View',
				label: 'Product Attributes',
				url: '/products/variation',
				parentKey: 'products',
			},
			{
				key: 'View',
				label: 'Product Tags',
				url: '/products/tags',
				parentKey: 'products',
			},
			{
				key: 'View',
				label: 'Product Reviews',
				url: '/products/customer-reviews',
				parentKey: 'products',
			},
			{
				key: 'View',
				label: 'Special Products',
				url: '/products/specials-products',
				parentKey: 'products',
			},
			{
				key: 'View',
				label: 'Special Categories',
				url: '/products/specials-categories',
				parentKey: 'products',
			},
		],
	},
	// {
	// 	key: 'doctor',
	// 	label: 'Doctor',
	// 	isTitle: false,
	// 	icon: FaUserDoctor,
	// 	children: [
	// 		{
	// 			key: 'View',
	// 			label: 'Profile',
	// 			url: '/doctor/profile-update',
	// 			parentKey: 'doctor',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Schedule',
	// 			url: '/doctor/self-schedule',
	// 			parentKey: 'doctor',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Service Bookings',
	// 			url: '/doctor/service-bookings-doctor',
	// 			parentKey: 'doctor',
	// 		},
	// 	],
	// },
	{
		key: 'inventory',
		label: 'Inventory',
		isTitle: false,
		icon: FaWarehouse,
		children: [
			{
				key: 'View',
				label: 'All Inventory',
				url: '/inventory/all-inventory',
				parentKey: 'inventory',
			},
		],
	},
	// {
	// 	key: 'services',
	// 	label: 'Services',
	// 	isTitle: false,
	// 	icon: MdMedicalServices,
	// 	children: [
	// 		{
	// 			key: 'View',
	// 			label: 'Grooming Service',
	// 			url: '/services/grooming-service',
	// 			parentKey: 'services',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'DayCare Service',
	// 			url: '/services/daycare-service',
	// 			parentKey: 'services',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Service Scheduler',
	// 			url: '/services/schedule-service',
	// 			parentKey: 'services',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Service Categories',
	// 			url: '/services/service-categories',
	// 			parentKey: 'services',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Service Cards',
	// 			url: '/services/service-cards',
	// 			parentKey: 'services',
	// 		},
	// 	],
	// },
	// {
	// 	key: 'discounts',
	// 	label: 'Discounts',
	// 	isTitle: false,
	// 	icon: MdOutlineDiscount,
	// 	children: [
	// 		{
	// 			key: 'View',
	// 			label: 'Coupans',
	// 			url: '/discounts/discounts-coupans',
	// 			parentKey: 'discounts',
	// 		},
	// 	],
	// },
	// {
	// 	key: 'shippings',
	// 	label: 'Shippings',
	// 	isTitle: false,
	// 	icon: MdLocalShipping,
	// 	children: [
	// 		{
	// 			key: 'View',
	// 			label: 'Shipping Methods',
	// 			url: '/shippings/shipping-methods',
	// 			parentKey: 'shippings',
	// 		},
	// 	],
	// },
	{
		key: 'orders',
		label: 'Orders',
		isTitle: false,
		icon: MdOutlineRequestQuote,

		children: [
			{
				key: 'View',
				label: 'Ecommerce Orders',
				url: '/orders/ecommerce-orders',
				parentKey: 'orders',
			},
			// {
			// 	key: 'View',
			// 	label: 'Service Bookings',
			// 	url: '/orders/service-bookings',
			// 	parentKey: 'orders',
			// },
			// {
			// 	key: 'View',
			// 	label: 'Service Orders',
			// 	url: '/orders/service-orders',
			// 	parentKey: 'orders',
			// },

			{
				key: 'View',
				label: 'Abandoned Carts',
				url: '/orders/abandoned-carts',
				parentKey: 'orders',
			},
		],
	},
	{
		key: 'users',
		label: 'User Management',
		isTitle: false,
		icon: FaUsers,
		children: [
			{
				key: 'View',
				label: 'All Users',
				url: '/user/user-all',
				parentKey: 'users',
			},
			{
				key: 'Create',
				label: 'Add New User',
				url: '/user/user-create',
				parentKey: 'users',
			},
			{
				key: 'View',
				label: 'All Roles',
				url: '/user/role-all',
				parentKey: 'users',
			},
			{
				key: 'Create',
				label: 'Add New Roles',
				url: '/user/roles',
				parentKey: 'users',
			},
		],
	},
	{
		key: 'notifications',
		label: 'Notifications',
		isTitle: false,
		icon: FaBell,
		children: [
			{
				key: 'Create',
				label: 'Add New Notification',
				url: '/notifications/notification-create',
				parentKey: 'notifications',
			},
		],
	},
	{
		key: 'wallets',
		label: 'Wallets',
		isTitle: false,
		icon: FaWallet,
		children: [
			{
				key: 'View',
				label: 'Wallet Approvals',
				url: '/customers/wallet-approvals',
				parentKey: 'wallets',
			},
			// {
			// 	key: 'View',
			// 	label: 'User Wallet',
			// 	url: '/customers/customer-wallet',
			// 	parentKey: 'customers',

			// },

			// {
			// 	key: 'View',
			// 	label: 'All Customers',
			// 	url: '/customers/all-customers',
			// 	parentKey: 'customers',
			// },
			// {
			// 	key: 'View',
			// 	label: 'Faq',
			// 	url: '/customers/customer-faq',
			// 	parentKey: 'customers',
			// },
			// {
			// 	key: 'View',
			// 	label: 'Customer Contacts',
			// 	url: '/customers/customer-contacts',
			// 	parentKey: 'customers',
			// },
		],
	},
	{
		key: 'university',
		label: 'University',
		isTitle: false,
		icon: FaUniversity,
		children: [
			{
				key: 'View',
				label: 'Courses',
				url: '/university/courses',
				parentKey: 'university',
			},
			{
				key: 'View',
				label: 'Quizes',
				url: '/university/quizes',
				parentKey: 'university',
			},
			{
				key: 'View',
				label: 'Employee Progress',
				url: '/university/employee-progress',
				parentKey: 'university',
			},
			{
				key: 'View',
				label: 'Certificates',
				url: '/university/certificates',
				parentKey: 'university',
			},
			{
				key: 'View',
				label: 'Privacy Policy',
				url: '/policies/privacy-policy',
				parentKey: 'university',
			},
			{
				key: 'View',
				label: 'About University',
				url: '/university/about-university',
				parentKey: 'university',
			},
		],
	},
	{
		key: 'settings',
		label: 'Core Settings',
		isTitle: false,
		icon: IoSettingsSharp,
		children: [
			{
				key: 'View',
				label: 'Ecommerce Settings',
				url: '/settings/ecommerce',
				parentKey: 'settings',
			},
			// {
			// 	key: 'View',
			// 	label: 'Services Settings',
			// 	url: '/settings/services',
			// 	parentKey: 'settings',
			// },
			{
				key: 'View',
				label: 'General Settings',
				url: '/settings/general',
				parentKey: 'settings',
			},
		],
	},

	{
		key: 'policies',
		label: 'Policies',
		isTitle: false,
		icon: HiClipboardDocumentList,
		children: [
			{
				key: 'View',
				label: 'Terms & Conditions',
				url: '/policies/terms-and-conditions',
				parentKey: 'policies',
			},
			// {
			// 	key: 'refund-policy',
			// 	label: 'Refund Policy',
			// 	url: '/policies/refund-policy',
			// 	parentKey: 'policies',
			// },
			// {
			// 	key: 'privacy-policy',
			// 	label: 'Privacy Policy',
			// 	url: '/policies/privacy-policy',
			// 	parentKey: 'policies',
			// },
			// {
			// 	key: 'shipping-policy',
			// 	label: 'Shipping Policy',
			// 	url: '/policies/shipping-policy',
			// 	parentKey: 'policies',
			// },
		],
	},
	// {
	// 	key: 'content',
	// 	label: 'Content Management',
	// 	isTitle: false,
	// 	icon: MdContentPasteGo,
	// 	children: [
	// 		{
	// 			key: 'View',
	// 			label: 'Scrolling Message',
	// 			url: '/content/scrolling-message',
	// 			parentKey: 'content',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Top Section',
	// 			url: '/content/top-section',
	// 			parentKey: 'content',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Main Banners',
	// 			url: '/banners/main-banners',
	// 			parentKey: 'content',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Feature Titles',
	// 			url: '/content/feature-titles',
	// 			parentKey: 'content',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Service Section',
	// 			url: '/content/mph-section',
	// 			parentKey: 'content',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Section 3',
	// 			url: '/content/section-3',
	// 			parentKey: 'content',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Section 4',
	// 			url: '/content/section-4',
	// 			parentKey: 'content',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Section 5',
	// 			url: '/content/section-5',
	// 			parentKey: 'content',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Section 7',
	// 			url: '/content/section-7',
	// 			parentKey: 'content',
	// 		},

	// 		{
	// 			key: 'View',
	// 			label: 'Section 8',
	// 			url: '/content/section-8',
	// 			parentKey: 'content',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Section 22',
	// 			url: '/content/section-22',
	// 			parentKey: 'content',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Last Banners',
	// 			url: '/banners/middle-banners',
	// 			parentKey: 'content',
	// 		},

	// 		{
	// 			key: 'View',
	// 			label: 'Feature Bar',
	// 			url: '/content/feature-bar',
	// 			parentKey: 'content',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Footer Section',
	// 			url: '/content/footer-section',
	// 			parentKey: 'content',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'Awards Section',
	// 			url: '/content/awards-section',
	// 			parentKey: 'content',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'About US Section',
	// 			url: '/content/about-us',
	// 			parentKey: 'content',
	// 		},
	// 		{
	// 			key: 'View',
	// 			label: 'About US Cards',
	// 			url: '/content/about-us-cards',
	// 			parentKey: 'content',
	// 		},
	// 	],
	// },
]

export const ECOMMERCE_SETTINGS: MenuItemTypes[] = [
	{
		key: 'store',
		label: 'Store',
		url: '/settings/stores',
		icon: FaWarehouse, // You can choose an appropriate icon
	},
	// {
	// 	key: 'locations',
	// 	label: 'Locations',
	// 	url: '/settings/store-locations',
	// 	icon: MdLocationOn, // Import from react-icons
	// },
	{
		key: 'view',
		label: 'Departments',
		url: '/settings/departments',
		icon: MdApartment, // Import from react-icons
	},
	{
		key: 'order-status',
		label: 'Order Status',
		url: '/settings/order-status',
		icon: MdCheckCircle, // Import from react-icons
	},
	{
		key: 'payment-status',
		label: 'Payment Status',
		url: '/settings/payment-status',
		icon: MdPayment, // Import from react-icons
	},
]

export const SERVICES_SETTINGS: MenuItemTypes[] = [
	{
		key: 'pet-names',
		label: 'Pet Names',
		url: '/settings/pet-names',
		icon: MdPets, // Import from react-icons
	},
	{
		key: 'main-services',
		label: 'Main Services',
		url: '/settings/main-services',
		icon: MdMedicalServices,
	},
	{
		key: 'daycare-packages',
		label: 'DayCare Packages',
		url: '/settings/daycare-packages',
		icon: MdHotel, // Import from react-icons
	},
	{
		key: 'store-locator',
		label: 'Store Locator',
		url: '/settings/store-locator',
		icon: MdMap, // Import from react-icons
	},
	{
		key: 'View',
		label: 'Speciality Doctors',
		url: '/settings/speciality-doctors',
		icon: MdFolderSpecial, // Import from react-icons
	},
	{
		key: 'View',
		label: 'Hospitals',
		url: '/settings/hospitals',
		icon: CiHospital1, // Import from react-icons
	},
]

export const GENERAL_SETTINGS: MenuItemTypes[] = [
	// {
	// 	key: 'cities',
	// 	label: 'Cities',
	// 	url: '/inventory/cities',
	// 	icon: MdLocationCity, // Import from react-icons
	// },
	{
		key: 'View',
		label: 'IP and 2FA Settings',
		url: '/settings/ip-and-2fa-settings',
		icon: MdSecurity,
	},
	{
		key: 'View',
		label: 'Admin Signature',
		url: '/settings/admin-signature',
		icon: FaFileSignature,
	},
	{
		key: 'View',
		label: 'Login Toggle',
		url: '/settings/loggin-toggle',
		icon: GrShieldSecurity,
	},
]

export const SERVICES_CATEGORIES: MenuItemTypes[] = [
	{
		key: 'View',
		label: 'Special Categories',
		url: '/specials/special-category',
		icon: MdOutlineCategory,
	},
	// {
	// 	key: 'View',
	// 	label: 'Special Sub Categories',
	// 	url: '/specials/special-sub-category',
	// 	icon: MdOutlineDiscount,
	// },
	// {
	// 	key: 'View',
	// 	label: 'Special Sub Sub Categories',
	// 	url: '/specials/special-sub-sub-category',
	// 	icon: BiCategoryAlt,
	// },
]

const HORIZONTAL_MENU_ITEMS: Array<any> = []
export { MENU_ITEMS, HORIZONTAL_MENU_ITEMS }
