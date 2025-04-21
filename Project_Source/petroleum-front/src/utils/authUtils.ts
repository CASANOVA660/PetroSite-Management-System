import { logoutUser } from '../store/slices/authSlice';
import { store } from '../store';
import { AnyAction } from '@reduxjs/toolkit';

/**
 * Checks if the stored JWT token is expired
 * @returns boolean - true if token is expired or invalid, false otherwise
 */
export const isTokenExpired = (): boolean => {
    const token = localStorage.getItem('token');

    // If no token exists, it's expired
    if (!token) {
        return true;
    }

    try {
        // JWT tokens have 3 parts separated by dots
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            return true;
        }

        // Decode the payload (middle part)
        const payload = JSON.parse(atob(tokenParts[1]));

        // Check if exp (expiration timestamp) exists
        if (!payload.exp) {
            return true;
        }

        // Convert exp to milliseconds (JWT exp is in seconds)
        const expiration = payload.exp * 1000;

        // Compare with current time
        return Date.now() >= expiration;
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true;
    }
};

/**
 * Verifies token and logs out if expired
 * @returns boolean - true if token is valid, false if expired
 */
export const verifyTokenOrLogout = (): boolean => {
    // Skip token verification completely for activation page
    if (window.location.pathname === '/activate' || window.location.pathname.includes('activate')) {
        console.log('Skipping token verification for activation page');
        return true;
    }

    if (isTokenExpired()) {
        // Dispatch logout action
        console.log('Token expired, logging out');
        store.dispatch(logoutUser() as unknown as AnyAction);

        // If not already on login page, redirect
        // But skip the redirect for activation page
        if (window.location.pathname !== '/signin' &&
            !window.location.pathname.startsWith('/activate')) {
            window.location.href = '/signin';
        }

        return false;
    }

    return true;
};

/**
 * Setup periodic token verification
 * Checks token validity every minute
 */
export const setupTokenExpirationChecker = (): void => {
    // Clear any existing interval
    if ((window as any).tokenCheckInterval) {
        clearInterval((window as any).tokenCheckInterval);
    }

    // First check immediately
    verifyTokenOrLogout();

    // Then check periodically (every minute)
    (window as any).tokenCheckInterval = setInterval(() => {
        verifyTokenOrLogout();
    }, 60 * 1000); // 60 seconds
}; 