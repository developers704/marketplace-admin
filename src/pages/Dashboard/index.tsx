import { Col, Row, Spinner } from 'react-bootstrap'
import Statistics from './Statistics'
import WeeklySelesChart from './WeeklySelesChart'
import YearlySelesChart from './YearlySelesChart'
import Projects from './Projects'
import { PageBreadcrumb } from '@/components'
import { STATISTICS_CONFIG } from './data'
import type { DashboardStats, DashboardUser } from './data'
import { useAuthContext } from '@/common'
import { useEffect, useState } from 'react'

const buildStatisticsFromStats = (stats: DashboardStats | null) => {
  if (!stats) {
    return STATISTICS_CONFIG.map((c) => ({ ...c, stats: '—', change: '—' }))
  }

  const format = (n: number) => (n >= 0 ? n.toLocaleString() : '0')

  return STATISTICS_CONFIG.map((c) => ({
    ...c,
    stats: format(stats[c.key] ?? 0),
    change: '—',
  }))
}


const Dashboard = () => {
	const { role, user } = useAuthContext()
	const BASE_API = import.meta.env.VITE_BASE_API
	const token = user?.token
	
	const [balance, setBalance] = useState<number>(0)
	const [storeWalletBalance, setStoreWalletBalance] = useState<number>(0)
	const [stats, setStats] = useState<DashboardStats | null>(null)
	const [users, setUsers] = useState<DashboardUser[]>([])
	
	
	
	
	const [statsLoading, setStatsLoading] = useState(true)
	const [usersLoading, setUsersLoading] = useState(true)
	

	const getWarehouseWallet = async () => {
		if (!token) return
		try {
			const response = await fetch(`${BASE_API}/api/warehouses`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			})
			if (!response.ok) throw new Error('Failed to fetch warehouse')
			const data = await response.json()
			const mainWarehouse = data?.find((w :any) => (w.isMain === true))
			setBalance(mainWarehouse?.inventoryWallet?.balance ?? 0)
			setStoreWalletBalance(mainWarehouse?.suppliesWallet?.balance ?? 0)
		} catch (error) {
			console.error('Error fetching warehouse wallet:', error)
		}
	}

	const getDashboardStats = async () => {
		if (!token) return
		setStatsLoading(true)
		try {
			const res = await fetch(`${BASE_API}/api/dashboard/stats`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			const json = await res.json()

			
			if (json?.data) setStats(json.data)
		} catch (e) {
			console.error('Dashboard stats:', e)
		} finally {
			setStatsLoading(false)
		}
	}

	const getUsers = async () => {
		if (!token) return
		setUsersLoading(true)
		try {
			const res = await fetch(`${BASE_API}/api/dashboard/newusers`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			const data = await res.json()
			
			setUsers(Array.isArray(data) ? data : [])
		} catch (e) {
			console.error('Dashboard users:', e)
		} finally {
			setUsersLoading(false)
		}
	}

	useEffect(() => {
		if (token) {
			getWarehouseWallet()
			getDashboardStats()
			getUsers()
		}
	}, [token])

	const statistics = buildStatisticsFromStats(stats)
	
	return (
		<>
			<PageBreadcrumb title="Welcome!" subName="Dashboards" />
			{statsLoading ? (
				<div className="text-center py-4">
					<Spinner animation="border" />
				</div>
			) : (
				<Row>
					
					<Col xxl={3} xl={3} lg={3} md={6} sm={6}>
					<Statistics
						title="Daily Visits"
						change={"0%"}
						stats={(stats?.dailyVisits ?? 0).toString()}
						icon="ri-eye-line"
						variant="text-bg-success"
					>
						<p className="mb-0">
							<span className="badge bg-white bg-opacity-10 me-1">
								{stats?.totalVisits}
							</span>
							<span className="text-nowrap">Total visits</span>
						</p>
					</Statistics>
				    </Col>	

					{statistics.map((item, idx) => (
					<Col xxl={3} xl={3} lg={3} md={6} sm={6} key={idx}>
						<Statistics
						title={item?.title}
						stats={item?.stats}
						change={item?.change}
						icon={item?.icon}
						variant={item?.variant}
						/>
					</Col>
					))}
					<Col xxl={3} xl={3} lg={3} md={6} sm={6}>
					<Statistics
						title="Inventory Wallets"
						change={"0%"}
						stats={balance.toLocaleString()}
						icon="mdi mdi-wallet"
						variant="text-bg-success"
					>
						<p className="mb-0">
							<span className="badge bg-white bg-opacity-10 me-1">
								{storeWalletBalance}
							</span>
							<span className="text-nowrap">Supplies Wallet Balance</span>
						</p>
					</Statistics>
				    </Col>			
							
				</Row>
			)}
		

			{role !== 'Doctor' && (
				<>
					<Row>
						<Col lg={8}>
							<WeeklySelesChart />
						</Col>
						<Col lg={4}>
							<YearlySelesChart />
						</Col>
					</Row>

					<Row>
						<Col xl={8}>
							<Projects users={users} loading={usersLoading} />
						</Col>
					</Row>
				</>
			)}
		</>
	)
}

export default Dashboard
