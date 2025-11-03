// src/services/toast.service.ts
import toast, { Toast } from 'react-hot-toast'

// Correct type for toast options that matches react-hot-toast's types
type ToastPromiseOption = Partial<
	Pick<
		Toast,
		| 'style'
		| 'className'
		| 'id'
		| 'icon'
		| 'duration'
		| 'ariaProps'
		| 'position'
		| 'iconTheme'
	>
>

// Update the ToastService interface
interface ToastService {
	success: (message: string, options?: ToastPromiseOption) => void
	error: (
		message: string | { status?: number; message?: string },
		options?: ToastPromiseOption
	) => void
	warning: (message: string, options?: ToastPromiseOption) => void
	info: (message: string, options?: ToastPromiseOption) => void
	dismiss: (toastId?: string) => void
	dismissAll: () => void
}

const HTTP_ERROR_MESSAGES: Record<number, string> = {
	400: 'Invalid request. Please check your data.',
	401: 'Unauthorized. Please login again.',
	403: 'You do not have permission to perform this action.',
	404: 'The requested resource or API endpoint was not found.',
	500: 'Internal server error. Please try again later.',
	502: 'Bad gateway. Please try again later.',
	503: 'Service unavailable. Please try again later.',
}

// Add this helper function to the service
const handleHttpError = (status: number, defaultMessage: string) => {
	return HTTP_ERROR_MESSAGES[status] || defaultMessage
}
export const toastService: ToastService = {
	success: (message: string, options?: ToastPromiseOption) => {
		toast.success(message, {
			duration: 4000,
			...options,
			className: `toast-success ${options?.className || ''}`.trim(),
		})
	},

	error: (
		message: string | { status?: number; message?: string },
		options?: ToastPromiseOption
	) => {
		let errorMessage =
			typeof message === 'string'
				? message
				: handleHttpError(
						message.status || 500,
						message.message || 'Something went wrong'
				  )

		toast.error(errorMessage, {
			duration: 4000,
			...options,
			className: `toast-error ${options?.className || ''}`.trim(),
		})
	},
	warning: (message: string, options?: ToastPromiseOption) => {
		toast(message, {
			duration: 4000,
			...options,
			icon: '⚠️',
			className: `toast-warning ${options?.className || ''}`.trim(),
		})
	},

	info: (message: string, options?: ToastPromiseOption) => {
		toast(message, {
			duration: 4000,
			...options,
			icon: 'ℹ️',
			className: `toast-info ${options?.className || ''}`.trim(),
		})
	},

	dismiss: toast.dismiss,
	dismissAll: () => toast.dismiss(),
}

// Type-safe function to create toast messages
export function createToast(
	type: keyof ToastService,
	message: string,
	options?: ToastPromiseOption
) {
	if (type in toastService) {
		return toastService[type](message, options)
	}
}
