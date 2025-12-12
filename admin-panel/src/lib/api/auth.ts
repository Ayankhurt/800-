import apiClient from './client';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
}

export const authAPI = {
    login: async (credentials: LoginCredentials) => {
        const response = await apiClient.post('/auth/login', credentials);
        if (response.success && response.data.token) {
            localStorage.setItem('admin_token', response.data.token);
            localStorage.setItem('admin_user', JSON.stringify(response.data.user));
        }
        return response;
    },

    register: async (data: RegisterData) => {
        const response = await apiClient.post('/auth/register', data);
        return response;
    },

    logout: () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
    },

    getMe: async () => {
        const response = await apiClient.get('/auth/me');
        return response;
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('admin_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('admin_token');
    },

    isAdmin: () => {
        const user = authAPI.getCurrentUser();
        return user?.role === 'admin';
    },
};
