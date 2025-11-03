// Create a separate utility file for date functions
export const formatDateForInput = (dateString: string): string => {
    if (!dateString) return ''
    try {
        const date = new Date(dateString)
        return date.toISOString().split('T')[0]
    } catch (error) {
        console.error('Error formatting date for input:', error)
        return ''
    }
}

export const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return 'No date set'
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    } catch (error) {
        console.error('Error formatting date for display:', error)
        return 'Invalid date'
    }
}

export const formatDateTimeForDisplay = (dateString: string): string => {
    if (!dateString) return 'No date set'
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch (error) {
        console.error('Error formatting datetime for display:', error)
        return 'Invalid date'
    }
}