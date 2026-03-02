import { useEffect, useState } from 'react'
import { Card, Col, Row, Spinner } from 'react-bootstrap'
import { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { CustomCardPortlet } from '@/components'
import { useAuthContext } from '@/common'

const BASE_API = import.meta.env.VITE_BASE_API

interface YearlyData {
	year: number
	categories: string[]
	revenueSeries: number[]
	ordersSeries: number[]
	totalRevenue: number
	totalOrders: number
}

const YearlySelesChart = () => {
	const { user } = useAuthContext()
	const token = user?.token
	const [data, setData] = useState<YearlyData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchYearly = async () => {
			if (!token) return
			try {
				const res = await fetch(`${BASE_API}/api/dashboard/yearly-sales`, {
					headers: { Authorization: `Bearer ${token}` },
				})
				const json = await res.json()
				if (json?.data) setData(json.data)
			} catch (e) {
				console.error('Yearly sales:', e)
			} finally {
				setLoading(false)
			}
		}
		fetchYearly()
	}, [token])

	const categories = data?.categories ?? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	const revenueSeries = data?.revenueSeries ?? Array(12).fill(0)
	const ordersSeries = data?.ordersSeries ?? Array(12).fill(0)
	const totalRevenue = data?.totalRevenue ?? 0
	const totalOrders = data?.totalOrders ?? 0
	const year = data?.year ?? new Date().getFullYear()

	const yearlyChartOpts: ApexOptions = {
		series: [
			{ name: 'Revenue', data: revenueSeries },
			{ name: 'Orders', data: ordersSeries },
		],
		chart: {
			height: 250,
			type: 'line',
			toolbar: { show: false },
		},
		colors: ['#3bc0c3', '#1a2942'],
		stroke: { curve: 'smooth', width: [3, 3] },
		markers: { size: 3 },
		xaxis: { categories },
		legend: { show: false },
	}

	const q1 = revenueSeries.slice(0, 3).reduce((a, b) => a + b, 0)
	const q2 = revenueSeries.slice(3, 6).reduce((a, b) => a + b, 0)

	return (
		<>
			<CustomCardPortlet cardTitle={`Yearly Sales Report (${year})`} titleClass="header-title">
				{loading ? (
					<div className="text-center py-5">
						<Spinner animation="border" />
					</div>
				) : (
					<>
						<div dir="ltr">
							<ReactApexChart
								height={250}
								options={yearlyChartOpts}
								series={yearlyChartOpts.series as ApexAxisChartSeries}
								type="line"
								className="apex-charts"
							/>
						</div>
						<Row className="text-center">
							<Col>
								<p className="text-muted mt-3 mb-2">Quarter 1</p>
								<h4 className="mb-0">$ {q1.toLocaleString()}</h4>
							</Col>
							<Col>
								<p className="text-muted mt-3 mb-2">Quarter 2</p>
								<h4 className="mb-0">$ {q2.toLocaleString()}</h4>
							</Col>
							<Col>
								<p className="text-muted mt-3 mb-2">All Time ({year})</p>
								<h4 className="mb-0">$ {totalRevenue.toLocaleString()}</h4>
							</Col>
						</Row>
					</>
				)}
			</CustomCardPortlet>

			<Card>
				<Card.Body>
					<div className="d-flex align-items-center">
						<div className="flex-grow-1 overflow-hidden">
							<h4 className="fs-22 fw-semibold">{totalOrders}</h4>
							<p className="text-uppercase fw-medium text-muted text-truncate mb-0">
								Total Orders ({year})
							</p>
						</div>
					</div>
				</Card.Body>
			</Card>
		</>
	)
}

export default YearlySelesChart
