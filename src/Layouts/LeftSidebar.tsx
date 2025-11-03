import { Link } from 'react-router-dom'

//images
import logo from '@/assets/images/logo-dark.png'
import logoSm from '@/assets/images/logo-sm.png'
import { getMenuItems, useAuthContext } from '@/common'
import AppMenu from './Menu'
import SimpleBar from 'simplebar-react'
import { useGetNotificationsQuery } from '@/redux/apiSlice'

/* Sidebar content */
const SideBarContent = () => {
	const { permissions, isSuperUser, user } = useAuthContext()
	const { data: notifications } = useGetNotificationsQuery({
		token: user?.token,
	});
	return (
		<>
			<AppMenu menuItems={getMenuItems(permissions, isSuperUser, notifications)} />
			<div className="clearfix" />
		</>
	)
}
const LeftSidebar = () => {
	return (
		<>
			<div className="leftside-menu">
				{/* Brand Logo Light */}
				<Link to="/" className="logo logo-light">
					<span className="logo-lg">
						<img src={logo} alt="logo" />
					</span>
					<span className="logo-sm">
						<img src={logoSm} alt="small logo" />
					</span>
				</Link>
				{/* Sidebar -left */}
				<SimpleBar
					className="h-100"
					id="leftside-menu-container"
					data-simplebar="">
					{/*- Sidemenu */}
					<SideBarContent />
					{/*- End Sidemenu */}
					<div className="clearfix" />
				</SimpleBar>
			</div>
		</>
	)
}

export default LeftSidebar
