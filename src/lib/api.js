import axios from 'axios';

const api = axios.create({
    // Keep local development pointed at the local API, but use Vercel's
    // same-origin /api proxy in production so browser session cookies work
    // even when third-party cookies are restricted.
    baseURL: import.meta.env.MODE === 'development'
        ? 'http://localhost:5000/api'
        : '/api',
    withCredentials: true,
    // Custom header forces browser preflight and helps block simple-form CSRF requests.
    headers: {
        'X-Requested-With': 'XMLHttpRequest'
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/login');

        // Only redirect on 401 if it's NOT the login request itself
        if (error.response?.status === 401 && !isLoginRequest) {
            localStorage.removeItem('user');
            localStorage.removeItem('userType');
            window.location.href = '/';
        }

        return Promise.reject(error);
    }
);

export default api;
