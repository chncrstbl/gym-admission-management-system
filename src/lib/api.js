import axios from 'axios';

const api = axios.create({
    baseURL: 'https://gym-admission-management-system.onrender.com/api',
});

api.interceptors.response.use(async (response) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return response;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;