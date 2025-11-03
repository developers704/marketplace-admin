import React, { useState } from 'react'
import { Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { FormInput, VerticalForm, PageBreadcrumb } from '@/components'
import AuthLayout from '../AuthLayout'
// import { toastService } from 'react-hot-toastService'
import { toastService } from '@/common/context/toast.service'

// Types
interface UserData {
	email: string
}

interface OTPData {
	otpCode: string
}

interface PasswordData {
	password: string
	confirmPassword: string
}

interface StepConfig {
	title: string
	helpText: string
	component: React.ReactNode
}

type StepType = 'email' | 'otp' | 'password'

// Validation schemas
const emailSchema = yup.object().shape({
	email: yup
		.string()
		.email('Please enter a valid email')
		.required('Email is required')
})

const otpSchema = yup.object().shape({
	otpCode: yup
		.string()
		.required('OTP is required')
		.matches(/^[0-9]{6}$/, 'OTP must be 6 digits')
})

const passwordSchema = yup.object().shape({
	password: yup
		.string()
		.required('Password is required')
		.min(8, 'Password must be at least 8 characters')
		.matches(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
			'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
		),
	confirmPassword: yup
		.string()
		.required('Please confirm your password')
		.oneOf([yup.ref('password')], 'Passwords must match')
})

// API service functions
const api = {
	BASE_URL: import.meta.env.VITE_BASE_API,

	async sendResetEmail(email: string) {
		const response = await fetch(`${this.BASE_URL}/api/auth/user/forgot-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email })
		})
		return this.handleResponse(response)
	},

	async verifyOTP(email: string, otpCode: string) {
		const response = await fetch(`${this.BASE_URL}/api/auth/user/verify-reset-otp`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, otpCode })
		})
		return this.handleResponse(response)
	},

	async resetPassword(email: string, newPassword: string) {
		const response = await fetch(`${this.BASE_URL}/api/auth/user/reset-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, newPassword })
		})
		return this.handleResponse(response)
	},

	async handleResponse(response: Response) {
		const data = await response.json()
		if (!response.ok) {
			throw new Error(data.message || 'Something went wrong')
		}
		return data
	}
}

// Step components
const EmailStep: React.FC<{
	onSubmit: (data: UserData) => void
	loading: boolean
}> = ({ onSubmit, loading }) => (
	<VerticalForm<UserData> onSubmit={onSubmit} resolver={yupResolver(emailSchema)}>
		<FormInput
			label="Email address"
			type="email"
			name="email"
			placeholder="Enter your email"
			containerClass="mb-3"
			required
		/>
		<Button
			variant="primary"
			className="w-100"
			type="submit"
			disabled={loading}
		>
			{loading ? (
				<span className="d-flex align-items-center justify-content-center">
					<span className="spinner-border spinner-border-sm me-2" />
					Sending...
				</span>
			) : (
				<span>Send OTP</span>
			)}
		</Button>
	</VerticalForm>
)

const OTPStep: React.FC<{
	onSubmit: (data: OTPData) => void
	loading: boolean
	onResendOTP: () => void
	resendDisabled: boolean
}> = ({ onSubmit, loading, onResendOTP, resendDisabled }) => (
	<VerticalForm<OTPData> onSubmit={onSubmit} resolver={yupResolver(otpSchema)}>
		<FormInput
			label="OTP Code"
			type="text"
			name="otpCode"
			placeholder="Enter 6-digit OTP"
			containerClass="mb-3"
			required
		/>
		<Button
			variant="primary"
			className="w-100 mb-2"
			type="submit"
			disabled={loading}
		>
			{loading ? 'Verifying...' : 'Verify OTP'}
		</Button>
		<Button
			variant="link"
			className="w-100"
			onClick={onResendOTP}
			disabled={resendDisabled}
		>
			Resend OTP
		</Button>
	</VerticalForm>
)

const PasswordStep: React.FC<{
	onSubmit: (data: PasswordData) => void
	loading: boolean
}> = ({ onSubmit, loading }) => (
	<VerticalForm<PasswordData> onSubmit={onSubmit} resolver={yupResolver(passwordSchema)}>
		<FormInput
			label="New Password"
			type="password"
			name="password"
			placeholder="Enter new password"
			containerClass="mb-3"
			required
		/>
		<FormInput
			label="Confirm Password"
			type="password"
			name="confirmPassword"
			placeholder="Confirm new password"
			containerClass="mb-3"
			required
		/>
		<Button
			variant="primary"
			className="w-100"
			type="submit"
			disabled={loading}
		>
			{loading ? 'Resetting...' : 'Reset Password'}
		</Button>
	</VerticalForm>
)


// Main component
const ForgotPassword: React.FC = () => {
	const navigate = useNavigate()
	const [currentStep, setCurrentStep] = useState<StepType>('email')
	const [loading, setLoading] = useState(false)
	const [email, setEmail] = useState('')
	const [resendDisabled, setResendDisabled] = useState(false)
	const [resendTimer, setResendTimer] = useState(0)

	const startResendTimer = () => {
		setResendDisabled(true)
		setResendTimer(30)
		const timer = setInterval(() => {
			setResendTimer((prev) => {
				if (prev <= 1) {
					clearInterval(timer)
					setResendDisabled(false)
					return 0
				}
				return prev - 1
			})
		}, 1000)
	}

	const handleEmailSubmit = async (data: UserData) => {
		setLoading(true)
		try {
			await api.sendResetEmail(data.email)
			setEmail(data.email)
			setCurrentStep('otp')
			startResendTimer()
			toastService.success('OTP sent successfully')
		} catch (error: any) {
			toastService.error(error.message)
		} finally {
			setLoading(false)
		}
	}

	const handleOTPSubmit = async (data: OTPData) => {
		setLoading(true)
		try {
			await api.verifyOTP(email, data.otpCode)
			setCurrentStep('password')
			toastService.success('OTP verified successfully')
		} catch (error: any) {
			toastService.error(error.message)
		} finally {
			setLoading(false)
		}
	}

	const handlePasswordSubmit = async (data: PasswordData) => {
		setLoading(true)
		try {
			await api.resetPassword(email, data.password)
			toastService.success('Password reset successfully')
			navigate('/auth/login')
		} catch (error: any) {
			toastService.error(error.message)
		} finally {
			setLoading(false)
		}
	}

	const handleResendOTP = async () => {
		try {
			await api.sendResetEmail(email)
			startResendTimer()
			toastService.success('OTP resent successfully')
		} catch (error: any) {
			toastService.error(error.message)
		}
	}

	const steps: Record<StepType, StepConfig> = {
		email: {
			title: 'Forgot Password?',
			helpText: "Enter your email address and we'll send you an OTP to reset your password.",
			component: <EmailStep onSubmit={handleEmailSubmit} loading={loading} />
		},
		otp: {
			title: 'Enter OTP',
			helpText: `Enter the 6-digit OTP sent to ${email}${resendTimer ? ` (Resend available in ${resendTimer}s)` : ''}`,
			component: (
				<OTPStep
					onSubmit={handleOTPSubmit}
					loading={loading}
					onResendOTP={handleResendOTP}
					resendDisabled={resendDisabled}
				/>
			)
		},
		password: {
			title: 'Reset Password',
			helpText: 'Enter your new password',
			component: <PasswordStep onSubmit={handlePasswordSubmit} loading={loading} />
		}
	}

	return (
		<div>
			<PageBreadcrumb title="Reset Password" />
			<AuthLayout
				authTitle={steps[currentStep].title}
				helpText={steps[currentStep].helpText}
				bottomLinks={
					<div className="text-center mt-3">
						<Link to="/auth/login" className="text-dark fw-bold">
							Back to Login
						</Link>
					</div>
				}
			>
				{steps[currentStep].component}
			</AuthLayout>
		</div>
	)
}

export default ForgotPassword