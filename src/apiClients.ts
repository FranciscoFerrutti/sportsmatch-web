import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const apiKey = localStorage.getItem('c-api-key');
if (apiKey) {
    apiClient.defaults.headers.common['c-api-key'] = apiKey;
}

export const setAuthToken = (token: string) => {
    if (token) {
        localStorage.setItem('c-api-key', token);
        apiClient.defaults.headers.common['c-api-key'] = token;
    } else {
        localStorage.removeItem('c-api-key');
        delete apiClient.defaults.headers.common['c-api-key'];
    }
};

export const setBasicAuthHeader = (email: string, password: string) => {
    apiClient.defaults.headers.common['c-basic-auth'] = `${btoa(`${email}:${password}`)}`;
};

export default apiClient;
