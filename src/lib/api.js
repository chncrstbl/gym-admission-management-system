import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.MODE === 'development'
        ? 'http://localhost:5000/api'
        : 'https://gym-admission-management-system.onrender.com/api',
    withCredentials: true,
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