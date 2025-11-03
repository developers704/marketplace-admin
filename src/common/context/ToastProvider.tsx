// src/providers/ToastProvider.tsx
import React from 'react'
import { Toaster, ToasterProps } from 'react-hot-toast'

const toastConfig: ToasterProps = {
    position: 'top-center',
    toastOptions: {
        // Default options for all toasts
        duration: 4000,
        style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '350px',
            textAlign: 'center' as const,
        },
        // Custom options for success toasts
        success: {
            style: {
                backgroundColor: '#f0fdf4',
                borderLeft: '4px solid #22c55e',
            },
            iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
            },
        },
        // Custom options for error toasts
        error: {
            style: {
                backgroundColor: '#fef2f2',
                borderLeft: '4px solid #ef4444',
            },
            iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
            },
        },
    },
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <>
            {children}
            <Toaster {...toastConfig} />
        </>
    )
}