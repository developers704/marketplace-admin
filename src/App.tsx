import configureFakeBackend from './common/api/fake-backend'
import { AuthProvider, ThemeProvider } from './common/context'
import AllRoutes from './routes/Routes'

import './assets/scss/app.scss'
import './assets/scss/icons.scss'
import { Suspense } from 'react'
import { SimpleLoader } from './pages/other/SimpleLoader'
import { ToastProvider } from '@/common/context/ToastProvider'
import { Provider } from 'react-redux'
import { store } from './redux/store'

configureFakeBackend()

function App() {
	return (
		<ThemeProvider>
			<ToastProvider>
				<AuthProvider>
					<Provider store={store}>
						<Suspense fallback={<SimpleLoader />}></Suspense>
						<AllRoutes />
					</Provider>
				</AuthProvider>
			</ToastProvider>
		</ThemeProvider>
	)
}

export default App
