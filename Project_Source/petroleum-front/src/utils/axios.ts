import axios from 'axios';
const instance = axios.create({
    baseURL: 'https://petrosite-management-system.onrender.com/api',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Add request interceptor to add auth token
instance.interceptors.request.use(
    (config) => {
        // Remove excessive logging of all requests
        // console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config);

        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('API Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token expiration
instance.interceptors.response.use(
    (response) => {
        // Remove excessive logging of all responses
        // console.log('API Response:', response);
        return response;
    },
    (error) => {
        console.error('API Response error:', error.response || error);

        // Handle token expiration - if we get 401 Unauthorized error
        if (error.response && error.response.status === 401) {
            // Clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Clear axios headers
            delete instance.defaults.headers.common['Authorization'];

            // Redirect to login page
            window.location.href = '/signin';
        }
        return Promise.reject(error);
    }
);

export default instance; 