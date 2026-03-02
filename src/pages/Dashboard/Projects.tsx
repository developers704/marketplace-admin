import { Table, Spinner } from 'react-bootstrap'
import { CustomCardPortlet } from '@/components'
import type { DashboardUser } from './data'

interface ProjectsProps {
	users: DashboardUser[]
	loading?: boolean
}

const Projects = ({ users, loading }: ProjectsProps) => {
	const formatDate = (d: string | undefined) => {
		if (!d) return '—'
		try {
			const date = new Date(d)
			return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
		} catch {
			return '—'
		}
	}

	return (
		<CustomCardPortlet cardTitle="Users" titleClass="header-title">
			{loading ? (
				<div className="text-center py-4">
					<Spinner animation="border" />
				</div>
			) : (
				<Table hover responsive className="table-nowrap mb-0">
					<thead>
						<tr>
							<th>#</th>
							<th>Name</th>
							<th>Joining Date</th>
							<th>Account Status</th>
							<th>Role</th>
						</tr>
					</thead>
					<tbody>
						{(users || []).length === 0 ? (
							<tr>
								<td colSpan={5} className="text-center text-muted">
									No users found
								</td>
							</tr>
						) : (
							(users || []).map((user, idx) => (
								<tr key={user?._id}>
									<td>{idx + 1}</td>
									<td>{user?.username ?? user?.email ?? '—'}</td>
									<td>{formatDate(user?.createdAt)}</td>
									<td>
										<span
											className={`badge bg-${user.is_superuser ? 'info' : 'success'}-subtle text-${user.is_superuser ? 'info' : 'success'}`}
										>
											{user?.is_superuser ? 'Admin' : 'Active'}
										</span>
									</td>
									<td>
										{user?.role?.role_name ?? '—'}
									</td>
								</tr>
							))
						)}
					</tbody>
				</Table>
			)}
		</CustomCardPortlet>
	)
}

export default Projects
