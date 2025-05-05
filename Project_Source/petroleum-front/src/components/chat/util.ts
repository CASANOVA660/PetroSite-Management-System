/**
 * Gets a profile picture URL from a user object
 * 
 * @param userData User data which may contain profilePicture object
 * @returns URL to user's profile picture or null if not available
 */
export const getUserAvatar = (userData: any): string | null => {
    if (!userData) return null;

    // Check if user has a profilePicture object with url property
    if (userData.profilePicture?.url) {
        return userData.profilePicture.url;
    }

    // Fallback to avatar if it exists
    if (userData.avatar) {
        return userData.avatar;
    }

    // Return null if no avatar is found
    return null;
};

/**
 * Gets a formatted name from a user object
 * 
 * @param userData User data which may contain nom and prenom properties
 * @returns Formatted name string
 */
export const getUserName = (userData: any): string => {
    if (!userData) return 'User';

    const firstName = userData.prenom || '';
    const lastName = userData.nom || '';

    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'User';
};

/**
 * Formats user data for display in chat components
 * 
 * @param userData User data object 
 * @param isCurrentUser Whether this is the current user
 * @returns Formatted user data for chat display
 */
export const formatUserForChat = (userData: any, isCurrentUser: boolean = false) => {
    const name = getUserName(userData);
    const avatar = getUserAvatar(userData) || '/avatar-placeholder.jpg';

    return {
        id: userData?._id || 'unknown',
        name: isCurrentUser ? `${name} (You)` : name,
        avatar,
        email: userData?.email || '',
        isOnline: true // Could be dynamic based on online status
    };
}; 