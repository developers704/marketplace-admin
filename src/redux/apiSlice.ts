import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Define your base URL
export const apiSlice = createApi({
	reducerPath: 'api',
	baseQuery: fetchBaseQuery({
		baseUrl: import.meta.env.VITE_BASE_API
	}),
    keepUnusedDataFor: 600,
	endpoints: (builder) => ({
		getNotifications: builder.query({
			query: ({token}) => ({
                url: '/api/admin-notifications/',
                method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
            }),
		}),
	}),
})

// Export hooks for usage in functional components
export const { useGetNotificationsQuery } = apiSlice
