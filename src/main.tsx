import { Suspense } from 'react'
import App from './App'
import { createRoot } from 'react-dom/client'
import 'regenerator-runtime/runtime'
import { SimpleLoader } from './pages/other/SimpleLoader'
import { HashRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

const container = document.getElementById('root')
if (container) {
	const root = createRoot(container)
	root.render(
		// <React.StrictMode>
		<HelmetProvider>
			<HashRouter>
				<Suspense fallback={<SimpleLoader />}></Suspense>
				<App />
			</HashRouter>
		</HelmetProvider>
		// </React.StrictMode>,
	)
}
