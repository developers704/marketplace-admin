import { useEffect, useState } from 'react'
import { Col, Row, Spinner } from 'react-bootstrap'
import { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { CustomCardPortlet } from '@/components'
import { useAuthContext } from '@/common'

const BASE_API = import.meta.env.VITE_BASE_API

interface WeeklyData {
	categories: string[]
	revenueSeries: number[]
	ordersSeries: number[]
}

const WeeklySelesChart = () => {
	const { user } = useAuthContext()
	const token = user?.token
	const [data, setData] = useState<WeeklyData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchWeekly = async () => {
			if (!token) return
			try {
				const res = await fetch(`${BASE_API}/api/dashboard/weekly-sales`, {
					headers: { Authorization: `Bearer ${token}` },
				})
				const json = await res.json()
				if (json?.data) setData(json.data)
			} catch (e) {
				console.error('Weekly sales:', e)
			} finally {
				setLoading(false)
			}
		}
		fetchWeekly()
	}, [token])

	const categories = data?.categories ?? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
	const revenueSeries = data?.revenueSeries ?? [0, 0, 0, 0, 0, 0, 0]
	const ordersSeries = data?.ordersSeries ?? [0, 0, 0, 0, 0, 0, 0]

	const weeklyChartOpts: ApexOptions = {
		series: [
			{ name: 'Revenue', data: revenueSeries },
			{ name: 'Orders', data: ordersSeries },
		],
		chart: {
			height: 377,
			type: 'bar',
			toolbar: { show: false },
		},
		plotOptions: { bar: { columnWidth: '60%' } },
		stroke: { show: true, width: 2, colors: ['transparent'] },
		dataLabels: { enabled: false },
		colors: ['#3bc0c3', '#1a2942'],
		xaxis: { categories },
		yaxis: { title: { text: 'Value' } },
		legend: { offsetY: 7 },
		grid: { padding: { bottom: 20 } },
		fill: { opacity: 1 },
		tooltip: {
			y: {
				formatter: (val: number) => (val != null ? String(val) : '0'),
			},
		},
	}

	const currentWeekTotal = revenueSeries.reduce((a, b) => a + b, 0)
	const previousWeekTotal = 0
	const conversion = previousWeekTotal ? (((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100).toFixed(2) : '0'

	return (
		<CustomCardPortlet cardTitle="Weekly Sales Report" titleClass="header-title">
			{loading ? (
				<div className="text-center py-5">
					<Spinner animation="border" />
				</div>
			) : (
				<>
					<div dir="ltr">
						<ReactApexChart
							height={377}
							options={weeklyChartOpts}
							series={weeklyChartOpts?.series as ApexAxisChartSeries}
							type="bar"
							className="apex-charts"
						/>
					</div>
					<Row className="text-center">
						<Col>
							<p className="text-muted mt-3">Current Week (Revenue)</p>
							<h3 className="mb-0">$ {currentWeekTotal?.toLocaleString()}</h3>
						</Col>
						<Col>
							<p className="text-muted mt-3">Previous Week</p>
							<h3 className="mb-0">$ {previousWeekTotal?.toLocaleString()}</h3>
						</Col>
						<Col>
							<p className="text-muted mt-3">Change</p>
							<h3 className="mb-0">{conversion}%</h3>
						</Col>
						<Col>
							<p className="text-muted mt-3">Orders (7 days)</p>
							<h3 className="mb-0">{ordersSeries.reduce((a, b) => a + b, 0)}</h3>
						</Col>
					</Row>
				</>
			)}
		</CustomCardPortlet>
	)
}

export default WeeklySelesChart
