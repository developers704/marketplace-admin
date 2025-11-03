import { Col, Row } from 'react-bootstrap'
import Statistics from './Statistics'
import WeeklySelesChart from './WeeklySelesChart'
import YearlySelesChart from './YearlySelesChart'
import Projects from './Projects'

// componets
import { PageBreadcrumb } from '@/components'

// data
import { statistics } from './data'
import { useAuthContext } from '@/common'

const Dashboard = () => {
	const { role } = useAuthContext()

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
			{role !== "Doctor" && (
				<>
					< Row >
						<Col lg={8}>
							<WeeklySelesChart />
						</Col>
						<Col lg={4}>
							<YearlySelesChart />
						</Col>
					</Row >

					<Row>
						<Col xl={8}>
							<Projects />
						</Col>
					</Row>
				</>

			)
			}
		</>
	)
}

export default Dashboard
