import React from 'react'
import { Route, RouteProps } from 'react-router-dom'

// components
import PrivateRoute from './PrivateRoute'
import Customers from '@/pages/ui/Customers'

// lazy load all the views

// auth
const Login = React.lazy(() => import('../pages/auth/Login'))
const Register = React.lazy(() => import('../pages/auth/Register'))
const Logout = React.lazy(() => import('../pages/auth/Logout'))
const ForgotPassword = React.lazy(() => import('../pages/auth/ForgotPassword'))
const LockScreen = React.lazy(() => import('../pages/auth/LockScreen'))
const StoreLocator = React.lazy(() => import('../pages/other/settings/StoreLocator'))
// // dashboard
const Dashboard = React.lazy(() => import('../pages/Dashboard'))
const Faqs = React.lazy(() => import('../pages/customers/Faq'))
const CustomerContact = React.lazy(() => import('../pages/customers/CustomerContact'))
const WalletRequest = React.lazy(() => import("../pages/customers/WalletRequest"))
// // pages
const DoctorProfile = React.lazy(() => import('../pages/doctor/DoctorProfile'))
const DoctorSchedule = React.lazy(() => import('../pages/doctor/DoctorSchedule'))
const DoctorAppointment = React.lazy(() => import('../pages/doctor/DoctorServiceBooking'))
const Departments = React.lazy(() => import('../pages/other/settings/Departments'))

const ProfilePages = React.lazy(() => import('../pages/other/Profile/'))
// const InvoicePages = React.lazy(() => import('../pages/other/Invoice'))
// const FAQPages = React.lazy(() => import('../pages/other/FAQ'))
// const PricingPages = React.lazy(() => import('../pages/other/Pricing'))
const MaintenancePages = React.lazy(() => import('../pages/other/Maintenance'))
// const StarterPages = React.lazy(() => import('../pages/other/Starter'))
const ContactListPages = React.lazy(() => import('../pages/other/ContactList'))
const Role = React.lazy(() => import('../pages/other/Roles'))
// const TimelinePages = React.lazy(() => import('../pages/other/Timeline'))
const UsersPages = React.lazy(() => import('../pages/other/UserCreate'))
const UserUpdates = React.lazy(() => import('../pages/other/UserUpdate'))
const AllRolesUser = React.lazy(() => import('../pages/other/All_Roles'))
const RoleUpdates = React.lazy(() => import('../pages/other/RoleUpdate'))
const Categories = React.lazy(() => import('../pages/products/Categories'))
const Products = React.lazy(() => import('../pages/products/Products'))
const SubCategory = React.lazy(() => import('../pages/products/SubCategory'))
const MainServices = React.lazy(() => import('../pages/other/settings/MainServices'))
const DayCarePackages = React.lazy(() => import('../pages/other/settings/Packages'))
const EcommerceSettings = React.lazy(() => import('../pages/other/settings/EcommerceSettingsPage'))
const ServicesSettings = React.lazy(() => import('../pages/other/settings/ServiceSettingsPage'))
const GeneralSettings = React.lazy(() => import('../pages/other/settings/GeneralSettingsPage'))
const SpecialityDoctors = React.lazy(() => import('../pages/other/settings/SpecialityDoctors'))
const Hospitals = React.lazy(() => import('../pages/other/settings/Hospitals'))
const Brands = React.lazy(() => import('../pages/products/Brands'))
const CreateProduct = React.lazy(
	() => import('../pages/products/CreateProduct')
)
const SubSubCategory = React.lazy(() => import('../pages/products/SubSubCategory'))
const ProductTags = React.lazy(() => import('../pages/products/ProductTags'))

// const Variations = React.lazy(() => import('../pages/products/Variations'))
const ProductVariations = React.lazy(
	() => import('../pages/products/ProductVariations')
)
const SpecialProducts = React.lazy(() => import('../pages/products/SpecialProducts'))
const CreateSpecialProduct = React.lazy(
	() => import('../pages/products/CreateSpecialProducts')
)
const MainBanner = React.lazy(() => import('../pages/banners/MainBanner'))
const MiddleBanner = React.lazy(() => import('../pages/banners/MiddleBanner'))
const LoyalityBanner = React.lazy(
	() => import('../pages/banners/LoyalityBanner')
)
const Cities = React.lazy(() => import('../pages/inventory/Cities'))
const Notification = React.lazy(() => import('../pages/notification/Notification'))
const NotificationCreate = React.lazy(() => import('../pages/notification/NotificationCreate'))
const StoreLocation = React.lazy(() => import('../pages/other/settings/StoreLocation'))
const PetNames = React.lazy(() => import('../pages/other/settings/PetNames'))
const Grooming = React.lazy(() => import('../pages/services/Grooming'))
const DayCare = React.lazy(() => import('../pages/services/DayCare'))
const ServiceCategories = React.lazy(() => import('../pages/services/ServicesCategories'))
const ServiceCategory = React.lazy(() => import('../pages/services/ServiceCategory'))
const ServiceSubCategory = React.lazy(() => import('../pages/services/ServiceSubCategory'))
const ServiceSubSubCategory = React.lazy(() => import('../pages/services/ServiceSubSubCategory'))
const ServiceCards = React.lazy(() => import('../pages/services/ServiceCards'))
const PaymentStatus = React.lazy(() => import('../pages/other/settings/PaymentStatus'))
const ProductReviews = React.lazy(() => import('../pages/products/ProductReviews'))
const AbondendCarts = React.lazy(() => import('../pages/orders/AbondendCarts'))
const Featurebar = React.lazy(() => import('../pages/content/FeatureBar'))
const LandingTitles = React.lazy(() => import('../pages/content/LandingTitles'))
const Section22 = React.lazy(() => import('../pages/content/Section22'))
const AwardsSection = React.lazy(() => import('../pages/content/AwardsSection'))
const MPHSection = React.lazy(() => import('../pages/content/MPHSection'))
const ShippingPolicy = React.lazy(() => import('../pages/policies/ShippingPolicy'))
const Section3 = React.lazy(() => import('../pages/content/Section3'))
const Section4 = React.lazy(() => import('../pages/content/Section4'))
const Section5 = React.lazy(() => import('../pages/content/Section5'))
const Section7 = React.lazy(() => import('../pages/content/Section7'))
const Section8 = React.lazy(() => import('../pages/content/Section8'))
const AboutUsSection = React.lazy(() => import('../pages/content/AboutUsSection'))
const AboutUsCards = React.lazy(() => import('../pages/content/AboutUsCards'))
const Courses = React.lazy(() => import('../pages/university/Courses'))
const Quizes = React.lazy(() => import('../pages/university/Quizes'))
const EmployeProgress = React.lazy(() => import('../pages/university/EmployeProgress'))
const Certificates = React.lazy(() => import('../pages/university/Certificates'))
const CreateCourse = React.lazy(() => import('../components/university/CreateCourse'))
const UpdateCourse = React.lazy(() => import('../components/university/UpdateCourse'))
const CreateQuiz = React.lazy(() => import('../components/university/CreateQuiz'))
const UpdateQuiz = React.lazy(() => import('../components/university/UpdateQuiz'))
const AboutUniversity = React.lazy(() => import('../pages/university/AboutUniversity'))
const TermsAccepted = React.lazy(() => import('../pages/admin/TermsAccepted'))
const PrivacyAccepted = React.lazy(() => import('../pages/admin/PrivacyAccepted'))
// // base ui
// const Accordions = React.lazy(() => import('../pages/ui/Accordions'))
// const Alerts = React.lazy(() => import('../pages/ui/Alerts'))
// const Avatars = React.lazy(() => import('../pages/ui/Avatars'))
// const Badges = React.lazy(() => import('../pages/ui/Badges'))
// const Breadcrumb = React.lazy(() => import('../pages/ui/Breadcrumb'))
// const Buttons = React.lazy(() => import('../pages/ui/Buttons'))
// const Cards = React.lazy(() => import('../pages/ui/Cards'))
// const Carousel = React.lazy(() => import('../pages/ui/Carousel'))
// const Collapse = React.lazy(() => import('../pages/ui/Collapse'))
// const Dropdowns = React.lazy(() => import('../pages/ui/Dropdowns'))
// const EmbedVideo = React.lazy(() => import('../pages/ui/EmbedVideo'))
// const Grid = React.lazy(() => import('../pages/ui/Grid'))
// const Links = React.lazy(() => import('../pages/ui/Links'))
// const ListGroup = React.lazy(() => import('../pages/ui/ListGroup'))
// const Modals = React.lazy(() => import('../pages/ui/Modals'))
// const Notifications = React.lazy(() => import('../pages/ui/Notifications'))
// const Offcanvas = React.lazy(() => import('../pages/ui/Offcanvas'))
// const Placeholders = React.lazy(() => import('../pages/ui/Placeholders'))
// const Pagination = React.lazy(() => import('../pages/ui/Pagination'))
// const Popovers = React.lazy(() => import('../pages/ui/Popovers'))
// const Progress = React.lazy(() => import('../pages/ui/Progress'))
// const Spinners = React.lazy(() => import('../pages/ui/Spinners'))
// const Tabs = React.lazy(() => import('../pages/ui/Tabs'))
// const Tooltips = React.lazy(() => import('../pages/ui/Tooltips'))
// const Typography = React.lazy(() => import('../pages/ui/Typography'))
// const Utilities = React.lazy(() => import('../pages/ui/Utilities'))
const IpSettings = React.lazy(
	() => import('@/pages/other/settings/BasicSetting')
)
const AdminSignature = React.lazy(
	() => import('@/pages/other/settings/AdminSignature')
)
const LoginToggle = React.lazy(
	() => import('@/pages/other/settings/LoginToggle')
)
const ServiceSchedule = React.lazy(() => import('../pages/services/ServiceShedule'))
const EcommerceOrders = React.lazy(() => import('../pages/orders/EcommerceOrder'))
const RequestedOrder = React.lazy(() => import('../pages/orders/RequestedOrder'))
const ServiceOrders = React.lazy(() => import('../pages/orders/ServiceOrder'))
const OrderStatus = React.lazy(() => import('../pages/orders/OrderStatus'))
const ServiceBookings = React.lazy(() => import('../pages/orders/ServiceBookingsOrder'))
const Warehouses = React.lazy(() => import('../pages/other/settings/Warehouses'))
const AllInventory = React.lazy(() => import('../pages/inventory/AllInventory'))
const PrivacyPolicy = React.lazy(() => import('../pages/policies/PrivacyPolicy'))
const TermsAndConditions = React.lazy(() => import('../pages/policies/TermsAndCondition'))
const RefundPolicy = React.lazy(() => import('../pages/policies/RefundPolicy'))
const ScrollingMessage = React.lazy(() => import('../pages/discounts/ScrollingMessage'))
const CustomerWallet = React.lazy(() => import('../pages/customers/CustomerWallet'))
const ShippingMethods = React.lazy(() => import('../pages/shippings/ShippingMethods'))
const TopSection = React.lazy(() => import('../pages/content/TopSection'))
const FooterSection = React.lazy(() => import('../pages/content/FooterSection'))

const CoupanDiscount = React.lazy(() => import('../pages/discount/Coupan'))
// // extended ui
// const Portlets = React.lazy(() => import('../pages/extended/Portlets'))
// const RangeSlider = React.lazy(() => import('../pages/extended/RangeSlider'))
// const Scrollbar = React.lazy(() => import('../pages/extended/ScrollBar'))

// // // icons
// const RemixIcons = React.lazy(() => import('../pages/ui/icons/RemixIcons'))
// const BootstrapIcons = React.lazy(
// 	() => import('../pages/ui/icons/BootstrapIcons')
// )
// const MaterialIcons = React.lazy(
// 	() => import('../pages/ui/icons/MaterialIcons')
// )

// // charts
// const ApexCharts = React.lazy(() => import('../pages/charts/ApexCharts'))
// const SparklineCharts = React.lazy(
// 	() => import('../pages/charts/SparklinesCharts')
// )
// const ChartJs = React.lazy(() => import('../pages/charts/ChartJsCharts'))

// // // forms
// const BasicElements = React.lazy(
// 	() => import('../pages/ui/forms/BasicElements')
// )
// const FormAdvanced = React.lazy(() => import('../pages/ui/forms/FormAdvanced'))
// const Validation = React.lazy(() => import('../pages/ui/forms/Validation'))
// const Wizard = React.lazy(() => import('../pages/ui/forms/Wizard'))
// const FileUploads = React.lazy(() => import('../pages/ui/forms/FileUploads'))
// const Editors = React.lazy(() => import('../pages/ui/forms/Editors'))
// const ImageCrop = React.lazy(() => import('../pages/ui/forms/ImageCrop'))
// const Editable = React.lazy(() => import('../pages/ui/forms/Editable'))

// // // tables
// const BasicTables = React.lazy(() => import('../pages/ui/tables/BasicTables'))
// const DataTables = React.lazy(() => import('../pages/ui/tables/DataTables'))

// // // maps
// const GoogleMaps = React.lazy(() => import('../pages/ui/maps/GoogleMaps'))
// const VectorMaps = React.lazy(() => import('../pages/ui/maps/VectorMaps'))

// // // error
const Error404 = React.lazy(() => import('../pages/error/Error404'))
// const Error404Alt = React.lazy(() => import('../pages/error/Error404Alt'))
const Error500 = React.lazy(() => import('../pages/error/Error500'))
const NoAccess = React.lazy(() => import('../pages/error/NoAccess'))

export interface RoutesProps {
	path: RouteProps['path']
	name?: string
	element?: RouteProps['element']
	route?: any
	exact?: boolean
	icon?: string
	header?: string
	roles?: string[]
	children?: RoutesProps[]
}

// dashboards
const dashboardRoutes: RoutesProps = {
	path: '/admin',
	name: 'Dashboards',
	icon: 'home',
	header: 'Navigation',
	children: [
		{
			path: '/',
			name: 'Root',
			element: (
				<PrivateRoute requiredPermission="Dashboard" to_do="View">
					<Dashboard />
				</PrivateRoute>
			),
			route: PrivateRoute,
		},
		{
			path: '/dashboard',
			name: 'Dashboard',
			element: (
				<PrivateRoute requiredPermission="Dashboard" to_do="View">
					<Dashboard />
				</PrivateRoute>
			),
			route: PrivateRoute,
		},
	],
}

// pages
const customPagesRoutes = {
	path: '/pages',
	name: 'Pages',
	icon: 'pages',
	header: 'Custom',
	children: [
		{
			path: '/pages/profile/',
			name: 'Profile',
			element: <ProfilePages />,
			route: PrivateRoute,
		},
		{
			path: '/user/user-all',
			name: 'Contact List',
			element: (
				<PrivateRoute requiredPermission="Users" to_do="View">
					<ContactListPages />
				</PrivateRoute>
			),
		},
		{
			path: '/user/user-create',
			name: 'Create User',
			element: (
				<PrivateRoute requiredPermission="Users" to_do="Create">
					<UsersPages />
				</PrivateRoute>
			),
		},
		{
			path: '/user/update/:id',
			name: 'User Update',
			element: (
				<PrivateRoute requiredPermission="Users" to_do="Update">
					<UserUpdates />
				</PrivateRoute>
			),
		},
		{
			path: '/user/roles/',
			name: 'Roles',
			element: (
				<PrivateRoute requiredPermission="Users" to_do="Create">
					<Role />
				</PrivateRoute>
			),
		},
		{
			path: '/user/role-all/',
			name: 'All Roles',
			element: (
				<PrivateRoute requiredPermission="Users" to_do="View">
					<AllRolesUser />
				</PrivateRoute>
			),
		},
		{
			path: '/user/update/role/:id',
			name: 'Role Update',
			element: (
				<PrivateRoute requiredPermission="Users" to_do="Update">
					<RoleUpdates />
				</PrivateRoute>
			),
		},
		// *********** Doctor Pages *********************
		{
			path: '/doctor/profile-update',
			name: 'Doctor Profile',
			element: (
				<PrivateRoute requiredPermission="Doctor" to_do="View">
					<DoctorProfile />
				</PrivateRoute>
			)
		},
		{
			path: '/doctor/self-schedule',
			name: 'Doctor Schedule',
			element: (
				<PrivateRoute requiredPermission="Doctor" to_do="View">
					<DoctorSchedule />
				</PrivateRoute>
			)
		},
		{
			path: '/doctor/service-bookings-doctor',
			name: 'Doctor Appointment',
			element: (
				<PrivateRoute requiredPermission="Doctor" to_do="View">
					<DoctorAppointment />
				</PrivateRoute>
			)
		},

		// ************ Products Pages *********************
		{
			path: '/products/all-product',
			name: 'All Products',
			element: (
				<PrivateRoute requiredPermission="Products">
					<Products />
				</PrivateRoute>
			),
		},
		{
			path: '/products/add-product',
			name: 'Add Product',
			element: (
				<PrivateRoute requiredPermission="Products" to_do="Create">
					<CreateProduct />
					{/* <StarterPages /> */}
				</PrivateRoute>
			),
		},
		{
			path: '/products/categories',
			name: 'Products Categories',
			element: (
				<PrivateRoute requiredPermission="Products" to_do="View">
					<Categories />
				</PrivateRoute>
			),
		},
		{
			path: 'products/sub-category',
			name: 'Products Sub Categories',
			element: (
				<PrivateRoute requiredPermission="Products" to_do="View">
					<SubCategory />
				</PrivateRoute>
			),
		},
		{
			path: 'products/sub-sub-category',
			name: 'Products Sub Sub-Category',
			element: (
				<PrivateRoute requiredPermission="Products" to_do="View">
					<SubSubCategory />
				</PrivateRoute>
			),
		},
		{
			path: '/products/brand',
			name: 'Products Brands',
			element: (
				<PrivateRoute requiredPermission="Products" to_do="View">
					<Brands />
				</PrivateRoute>
			),
		},
		{
			path: '/products/variation',
			name: 'Product Variation',
			element: (
				<PrivateRoute requiredPermission="Products" to_do="View">
					<ProductVariations />
				</PrivateRoute>
			),
		},
		{
			path: '/products/tags',
			name: 'Add Product Tags',
			element: (
				<PrivateRoute requiredPermission="Products" to_do="View">
					<ProductTags />
				</PrivateRoute>
			),
		},
		{
			path: '/products/customer-reviews',
			name: 'Add Product Tags',
			element: (
				<PrivateRoute requiredPermission="Products" to_do="View">
					<ProductReviews />
				</PrivateRoute>
			),
		},
		{
			path: '/products/specials-categories',
			name: 'Special Categories',
			element: (
				<PrivateRoute requiredPermission="Products" to_do="View">
					<ServiceCategories />
				</PrivateRoute>
			),
		},
		{
			path: '/products/specials-products',
			name: 'Special Products',
			element: (
				<PrivateRoute requiredPermission="Products" to_do="View">
					<SpecialProducts />
				</PrivateRoute>
			),
		},
		{
			path: '/products/add-special-product',
			name: 'Create Special Products',
			element: (
				<PrivateRoute requiredPermission="Products" to_do="View">
					<CreateSpecialProduct />
				</PrivateRoute>
			),
		},
		// ***************** Service Pages *********************
		{
			path: '/services/grooming-service',
			name: 'Grooming',
			element: (
				<PrivateRoute requiredPermission="Services" to_do="View">
					<Grooming />
				</PrivateRoute>
			),
		},
		{
			path: '/services/daycare-service',
			name: 'Day Care',
			element: (
				<PrivateRoute requiredPermission="Services" to_do="View">
					<DayCare />
				</PrivateRoute>
			),
		},
		{
			path: '/services/schedule-service',
			name: 'Spa',
			element: (
				<PrivateRoute requiredPermission="Services" to_do="View">
					<ServiceSchedule />
				</PrivateRoute>
			),
		},
		{
			path: '/services/service-cards',
			name: 'Spa',
			element: (
				<PrivateRoute requiredPermission="Services" to_do="View">
					<ServiceCards />
				</PrivateRoute>
			),
		},
		// ************** Customer Pagess *********************
		{
			path: '/customers/all-customers',
			name: 'All Customers',
			element: (
				<PrivateRoute requiredPermission="Customers" to_do="View">
					<Customers />
				</PrivateRoute>
			),
		},
		{
			path: '/customers/customer-wallet',
			name: 'Customer Wallet',
			element: (
				<PrivateRoute requiredPermission="Customers" to_do="View">
					<CustomerWallet />
				</PrivateRoute>
			),
		},
		{
			path: '/customers/customer-faq',
			name: 'Customer Faq',
			element: (
				<PrivateRoute requiredPermission="Customers" to_do="View">
					<Faqs />
				</PrivateRoute>
			),
		},
		{
			path: '/customers/customer-contacts',
			name: 'Customer Contact',
			element: (
				<PrivateRoute requiredPermission="Customers" to_do="View">
					<CustomerContact />
				</PrivateRoute>
			),
		},
		{
			path: '/customers/wallet-approvals',
			name: 'Customer Approvals',
			element: (
				<PrivateRoute requiredPermission="Customers" to_do="View">
					<WalletRequest />
				</PrivateRoute>
			),
		},
		// ************** Banner Pages ****************************
		{
			path: '/banners/main-banners',
			name: 'Main Banners',
			element: (
				<PrivateRoute requiredPermission="Banners" to_do="View">
					<MainBanner />
				</PrivateRoute>
			),
		},
		{
			path: '/banners/middle-banners',
			name: 'Middle Banners',
			element: (
				<PrivateRoute requiredPermission="Banners" to_do="View">
					<MiddleBanner />
				</PrivateRoute>
			),
		},
		{
			path: '/banners/loyality-banners',
			name: 'Loyality Banners',
			element: (
				<PrivateRoute requiredPermission="Banners" to_do="View">
					<LoyalityBanner />
				</PrivateRoute>
			),
		},
		// ****************** shippings Methods **********************
		{
			path: '/shippings/shipping-methods',
			name: 'Shipping Methods',
			element: (
				<PrivateRoute requiredPermission="Shippings" to_do="View">
					<ShippingMethods />
				</PrivateRoute>
			),
		},
		// ******************* Discount Pages ************************

		{
			path: '/discounts/discounts-coupans',
			name: 'Coupans Discounts',
			element: (
				<PrivateRoute requiredPermission="Discounts" to_do="View">
					<CoupanDiscount />
				</PrivateRoute>
			),
		},
		// *************** Inventory Pages ****************************

		{
			path: '/inventory/all-inventory',
			name: 'All Inventory',
			element: (
				<PrivateRoute requiredPermission="Inventory" to_do="View">
					<AllInventory />
				</PrivateRoute>
			),
		},
		// ****************** Orders Pages ****************************
		{
			path: '/orders/ecommerce-orders',
			name: 'Ecommerce Orders',
			element: (
				<PrivateRoute requiredPermission="Orders" to_do="View">
					<EcommerceOrders />
				</PrivateRoute>
			),
		},
		{
			path: '/orders/requested-orders',
			name: 'Ecommerce Orders',
			element: (
				<PrivateRoute requiredPermission="Orders" to_do="View">
					<RequestedOrder />
				</PrivateRoute>
			),
		},
		{
			path: '/orders/service-bookings',
			name: 'Service Bookings',
			element: (
				<PrivateRoute requiredPermission="Orders" to_do="View">
					<ServiceBookings />
				</PrivateRoute>
			),
		},
		{
			path: '/orders/service-orders',
			name: 'Service Orders',
			element: (
				<PrivateRoute requiredPermission="Orders" to_do="View">
					<ServiceOrders />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/order-status',
			name: 'Order Status',
			element: (
				<PrivateRoute requiredPermission="Orders" to_do="View">
					<OrderStatus />
				</PrivateRoute>
			),
		},
		{
			path: '/orders/abandoned-carts',
			name: 'Abondend Carts',
			element: (
				<PrivateRoute requiredPermission="Orders" to_do="View">
					<AbondendCarts />
				</PrivateRoute>
			),
		},
		// ***************** Settings Pages ****************************

		{
			path: '/admin/terms-conditions',
			name: 'Terms & Conditions',
			element: (
				<PrivateRoute requiredPermission="admin" to_do="View">
					<TermsAccepted />
				</PrivateRoute>
			),
		},
		{
			path: '/admin/privacy-policy-accepted',
			name: 'Privacy Policy',
			element: (
				<PrivateRoute requiredPermission="admin" to_do="View">
					<PrivacyAccepted />
				</PrivateRoute>
			),
		},
		// ***************** Settings Pages ****************************

		{
			path: '/settings/admin-signature',
			name: 'Admin Signature',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="Update">
					<AdminSignature />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/loggin-toggle',
			name: 'Login Toggle',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="Update">
					<LoginToggle />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/ip-and-2fa-settings',
			name: 'IP & 2FA Settings',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="Update">
					<IpSettings />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/ecommerce',
			name: 'Ecommerce Settings',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<EcommerceSettings />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/services',
			name: 'Service Settings',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<ServicesSettings />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/general',
			name: 'General Settings',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<GeneralSettings />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/speciality-doctors',
			name: 'Speciality Settings',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<SpecialityDoctors />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/hospitals',
			name: 'Hospitals Settings',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<Hospitals />
				</PrivateRoute>
			),
		},

		{
			path: '/specials/special-category',
			name: 'Service Category',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<ServiceCategory />
				</PrivateRoute>
			),
		},
		{
			path: '/specials/special-sub-category',
			name: 'Service Sub Category',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<ServiceSubCategory />
				</PrivateRoute>
			),
		},
		{
			path: '/specials/special-sub-sub-category',
			name: 'Service Sub Sub Category',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<ServiceSubSubCategory />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/pet-names',
			name: 'Advanced Settings',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<PetNames />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/store-locator',
			name: 'Advanced Settings',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<StoreLocator />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/store-locations',
			name: 'Advanced Settings',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<StoreLocation />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/stores',
			name: 'WareHouse Settings',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<Warehouses />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/main-services',
			name: 'Main Services',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<MainServices />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/daycare-packages',
			name: 'Day Care Packages',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<DayCarePackages />
				</PrivateRoute>
			),
		},
		{
			path: "/settings/payment-status",
			name: "Payment Status",
			element: <PrivateRoute requiredPermission="Settings" to_do="View">
				<PaymentStatus />
			</PrivateRoute>
		},
		{
			path: '/inventory/cities',
			name: 'All Inventory',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<Cities />
				</PrivateRoute>
			),
		},
		{
			path: '/settings/departments',
			name: 'Departments',
			element: (
				<PrivateRoute requiredPermission="Settings" to_do="View">
					<Departments />
				</PrivateRoute>
			),
		},
		//  *********************************  Policies **************************
		{
			path: '/policies/terms-and-conditions',
			name: 'Terms & Conditions',
			element: (
				<PrivateRoute requiredPermission="Policies" to_do="View">
					<TermsAndConditions />
				</PrivateRoute>
			),
		},
		{
			path: '/policies/refund-policy',
			name: 'Refund Policy',
			element: (
				<PrivateRoute requiredPermission="Policies" to_do="View">
					<RefundPolicy />
				</PrivateRoute>
			),
		},
		{
			path: '/policies/privacy-policy',
			name: 'Privacy Policy',
			element: (
				<PrivateRoute requiredPermission="University" to_do="View">
					<PrivacyPolicy />
				</PrivateRoute>
			),
		},
		{
			path: '/policies/shipping-policy',
			name: 'Shipping Policy',
			element: (
				<PrivateRoute requiredPermission="Policies" to_do="View">
					<ShippingPolicy />
				</PrivateRoute>
			),
		},
		// **************************** Content management ****************************
		{
			path: '/content/scrolling-message',
			name: 'Scrolling Message',
			element: (
				<PrivateRoute requiredPermission="Content Management" to_do="View">
					<ScrollingMessage />
				</PrivateRoute>
			),
		},
		{
			path: '/content/feature-bar',
			name: 'Feature Bar',
			element: (
				<PrivateRoute requiredPermission="Content Management"
					to_do="View">
					<Featurebar />
				</PrivateRoute>
			)
		},
		{
			path: '/content/feature-titles',
			name: 'Feature Title',
			element: (
				<PrivateRoute requiredPermission="Content Management"
					to_do="View">
					<LandingTitles />
				</PrivateRoute>
			)
		},
		{
			path: '/content/top-section',
			name: 'Top Section',
			element: (
				<PrivateRoute requiredPermission="Content Management"
					to_do="View">
					<TopSection />
				</PrivateRoute>
			)
		},
		{
			path: '/content/footer-section',
			name: 'Footer Section',
			element: (
				<PrivateRoute requiredPermission="Content Management"
					to_do="View">
					<FooterSection />
				</PrivateRoute>
			)
		},
		{
			path: '/content/section-22',
			name: 'Section 22',
			element: (
				<PrivateRoute requiredPermission="Content Management"
					to_do="View">
					<Section22 />
				</PrivateRoute>
			)
		},
		{
			path: '/content/awards-section',
			name: 'Awards Section',
			element: (
				<PrivateRoute requiredPermission="Content Management"
					to_do="View">
					<AwardsSection />
				</PrivateRoute>
			)
		},
		{
			path: '/content/mph-section',
			name: 'MPH Section',
			element: (
				<PrivateRoute requiredPermission="Content Management"
					to_do="View">
					<MPHSection />
				</PrivateRoute>
			)
		},
		{
			path: '/content/section-3',
			name: 'Section 3',
			element: (
				<PrivateRoute requiredPermission="Content Management"
					to_do="View">
					<Section3 />
				</PrivateRoute>
			)
		},
		{
			path: '/content/section-4',
			name: 'Section 4',
			element: (
				<PrivateRoute requiredPermission="Content Management"
					to_do="View">
					<Section4 />
				</PrivateRoute>
			)
		},
		{
			path: '/content/section-5',
			name: 'Section 5',
			element: (
				<PrivateRoute requiredPermission="Content Management"
					to_do="View">
					<Section5 />
				</PrivateRoute>
			)
		},
		{
			path: '/content/section-7',
			name: 'Section 7',
			element: (
				<PrivateRoute requiredPermission="Content Management"
					to_do="View">
					<Section7 />
				</PrivateRoute>
			)
		},
		{
			path: '/content/section-8',
			name: 'Section 8',
			element: (
				<PrivateRoute requiredPermission="Content Management"
					to_do="View">
					<Section8 />
				</PrivateRoute>
			)
		},
		{
			path: '/content/about-us',
			name: 'About Us Section',
			element: (
				<PrivateRoute requiredPermission="Content Management"
					to_do="View">
					<AboutUsSection />
				</PrivateRoute>
			)
		},
		{
			path: '/content/about-us-cards',
			name: 'About Us Cards',
			element: (
				<PrivateRoute requiredPermission="Content Management"
					to_do="View">
					<AboutUsCards />
				</PrivateRoute>
			)
		},
		// ************************* Admin Routes ****************************
		{
			path: '/notifications/all',
			name: 'Notification',
			element: (
				<PrivateRoute requiredPermission="Notifications"
					to_do="View">
					<Notification />
				</PrivateRoute>
			)
		},
		{
			path: '/notifications/notification-create',
			name: 'Create Notification',
			element: (
				<PrivateRoute requiredPermission="Notifications"
					to_do="Create">
					<NotificationCreate />
				</PrivateRoute>
			)
		},
		// ************************* University Routes ****************************
		{
			path: '/university/courses',
			name: 'University Courses',
			element: (
				<PrivateRoute requiredPermission="University"
					to_do="View">
					<Courses />
				</PrivateRoute>
			)
		},
		{
			path: '/university/quizes',
			name: 'University Quizes',
			element: (
				<PrivateRoute requiredPermission="University"
					to_do="View">
					<Quizes />
				</PrivateRoute>
			)
		},
		{
			path: '/university/create-quiz',
			name: 'University Create Quiz',
			element: (
				<PrivateRoute requiredPermission="University"
					to_do="View">
					<CreateQuiz />
				</PrivateRoute>
			)
		},
		{
			path: '/university/update-quiz/:id',
			name: 'University Update Quiz',
			element: (
				<PrivateRoute requiredPermission="University"
					to_do="View">
					<UpdateQuiz />
				</PrivateRoute>
			)
		},
		{
			path: '/university/certificates',
			name: 'University Certificates',
			element: (
				<PrivateRoute requiredPermission="University"
					to_do="View">
					<Certificates />
				</PrivateRoute>
			)
		},
		{
			path: '/university/create-course',
			name: 'University Create Course',
			element: (
				<PrivateRoute requiredPermission="University"
					to_do="View">
					<CreateCourse />
				</PrivateRoute>
			)
		},
		{
			path: '/university/update-course/:id',
			name: 'University Update Course',
			element: (
				<PrivateRoute requiredPermission="University"
					to_do="View">
					<UpdateCourse />
				</PrivateRoute>
			)
		},
		{
			path: '/university/employee-progress',
			name: 'Employee Progress',
			element: (
				<PrivateRoute requiredPermission="University"
					to_do="View">
					<EmployeProgress />
				</PrivateRoute>
			)
		},
		{
			path: '/university/about-university',
			name: 'About University',
			element: (
				<PrivateRoute requiredPermission="University"
					to_do="View">
					<AboutUniversity />
				</PrivateRoute>
			)
		},
	],
}

// ui
const uiRoutes: RoutesProps = {
	path: '/ui',
	name: 'Components',
	icon: 'pocket',
	header: 'UI Elements',
	children: [
		{
			path: '/ui/base',
			name: 'Base UI',
			children: [],
		},
	],
}

// auth
const authRoutes: RoutesProps[] = [
	{
		path: '/auth/login',
		name: 'Login',
		element: <Login />,
		route: Route,
	},
	{
		path: '/auth/register',
		name: 'Register',
		element: <Register />,
		route: Route,
	},
	{
		path: '/auth/logout',
		name: 'Logout',
		element: <Logout />,
		route: Route,
	},
	{
		path: '/auth/forgot-password',
		name: 'Forgot Password',
		element: <ForgotPassword />,
		route: Route,
	},
	{
		path: '/auth/lock-screen',
		name: 'Lock Screen',
		element: <LockScreen />,
		route: Route,
	},
]

// public routes
const otherPublicRoutes = [
	{
		path: '/no-access',
		name: 'No Access',
		element: <NoAccess />,
		route: Route,
	},
	{
		path: '*',
		name: 'Error - 404',
		element: <Error404 />,
		route: Route,
	},
	{
		path: 'pages/error-404',
		name: 'Error - 404',
		element: <Error404 />,
		route: Route,
	},
	{
		path: 'pages/error-500',
		name: 'Error - 500',
		element: <Error500 />,
		route: Route,
	},
	{
		path: '/pages/maintenance',
		name: 'Maintenance',
		element: <MaintenancePages />,
		route: Route,
	},
]

// flatten the list of all nested routes
const flattenRoutes = (routes: RoutesProps[]) => {
	let flatRoutes: RoutesProps[] = []

	routes = routes || []
	routes.forEach((item: RoutesProps) => {
		flatRoutes.push(item)
		if (typeof item.children !== 'undefined') {
			flatRoutes = [...flatRoutes, ...flattenRoutes(item.children)]
		}
	})
	return flatRoutes
}

// All routes
const authProtectedRoutes = [dashboardRoutes, customPagesRoutes, uiRoutes]
const publicRoutes = [...authRoutes, ...otherPublicRoutes]

const authProtectedFlattenRoutes = flattenRoutes([...authProtectedRoutes])
const publicProtectedFlattenRoutes = flattenRoutes([...publicRoutes])
export {
	publicRoutes,
	authProtectedRoutes,
	authProtectedFlattenRoutes,
	publicProtectedFlattenRoutes,
}
