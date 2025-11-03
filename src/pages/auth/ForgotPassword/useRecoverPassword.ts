import { useState } from 'react'

export default function useForgotPassword() {
	const [loading, setLoading] = useState(false)

	const onSubmit = async (data: any) => {
		console.log(data)
		const { email }: any = data
		setLoading(true)
		try {
			const BASE_API = import.meta.env.VITE_BASE_API
			const response = await fetch(
				`${BASE_API}/api/auth/user/forgot-password`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ email }),
				}
			)
			if (!response.ok) {
				throw new Error('Failed to send email')
			}
			console.log('sucess', response)
		} catch (error) {
			console.log('error', error)
		} finally {
			setLoading(false)
		}
	}

	return { loading, onSubmit }
}
