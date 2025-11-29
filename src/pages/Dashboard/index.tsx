import { Card, Col, Row } from 'react-bootstrap'
import Statistics from './Statistics'
import WeeklySelesChart from './WeeklySelesChart'
import YearlySelesChart from './YearlySelesChart'
import Projects from './Projects'

// componets
import { PageBreadcrumb } from '@/components'

// data
import { statistics } from './data'
import { useAuthContext } from '@/common'
import { useEffect, useState } from 'react'

const Dashboard = () => {
	const { role } = useAuthContext()

	const [balance, setBalance] = useState<number>(0)
	const [storeWalletBalance, setStoreWalletBalance] = useState<number>(0)
	//   const [warehouse, setWarehouse] = useState<any>(null)

	const BASE_API = import.meta.env.VITE_BASE_API
	const { user } = useAuthContext()
	const warehouseId = '67b6c7b68958be48910ed415'

	const getWarehouseWallet = async () => {
		try {
			const response = await fetch(
				`${BASE_API}/api/warehouses/${warehouseId}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${user.token}`,
					},
				}
			)

			if (!response.ok) throw new Error('Failed to fetch warehouse')

			const data = await response.json()
			//   setWarehouse(data)
			setBalance(data.inventoryWallet?.balance || 0)
			setStoreWalletBalance(data.suppliesWallet?.balance || 0)
		} catch (error) {
			console.error('Error fetching warehouse wallet:', error)
		}
	}

	useEffect(() => {
		if (user?.token) getWarehouseWallet()
	}, [user?.token])

	return (
		<>
			<PageBreadcrumb title="Welcome!" subName="Dashboards" />
			<Row>
				{(statistics || []).map((item, idx) => {
					return (
						<Col xxl={3} xl={3} lg={3} md={6} sm={6} key={idx}>
							<Statistics
								title={item.title}
								stats={item.stats}
								change={item.change}
								icon={item.icon}
								variant={item.variant}
							/>
						</Col>
					)
				})}
			</Row>
			<Row>
				<Col xxl={3} xl={3} lg={3} md={6} sm={6}>
					<Card className={`widget-flat text-bg-success`}>
						<Card.Body>
							<div className="float-end">
								<i className={`text-bg-success widget-icon`}></i>
							</div>
							<h6 className="text-uppercase mt-0" title="Customers">
								inventory wallets
							</h6>
							<h2 className="my-2">{balance}</h2>
							<p className="mb-0">
								<span className="badge bg-white bg-opacity-10 me-1">
									{storeWalletBalance}
								</span>
								&nbsp;
								<span className="text-nowrap">Supplies Wallet Balance</span>
							</p>
						</Card.Body>
					</Card>
				</Col>
			</Row>

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
							<Projects />
						</Col>
					</Row>
				</>
			)}
		</>
	)
}

export default Dashboard
