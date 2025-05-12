/**
 * Format a date into a readable French format
 * @param date Date or date string to format
 * @returns Formatted date string in French locale (e.g., "12 janvier 2023 à 14:30")
 */
export const formatDate = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(dateObj);
};

/**
 * Get a relative time description (e.g., "il y a 3 jours")
 * @param date Date to compare with current time
 * @returns String with relative time description in French
 */
export const getRelativeTime = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

    const diffInMs = dateObj.getTime() - now.getTime();
    const diffInSecs = Math.round(diffInMs / 1000);
    const diffInMins = Math.round(diffInSecs / 60);
    const diffInHours = Math.round(diffInMins / 60);
    const diffInDays = Math.round(diffInHours / 24);

    if (Math.abs(diffInDays) >= 7) {
        return formatDate(dateObj);
    } else if (diffInDays > 0) {
        return rtf.format(diffInDays, 'day');
    } else if (diffInDays < 0) {
        return rtf.format(diffInDays, 'day');
    } else if (diffInHours > 0) {
        return rtf.format(diffInHours, 'hour');
    } else if (diffInHours < 0) {
        return rtf.format(diffInHours, 'hour');
    } else if (diffInMins > 0) {
        return rtf.format(diffInMins, 'minute');
    } else if (diffInMins < 0) {
        return rtf.format(diffInMins, 'minute');
    } else {
        return 'maintenant';
    }
}; 