import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const setBasicAuthHeader = (email: string, password: string) => {
    apiClient.defaults.headers.common['c-basic-auth'] = `${btoa(`${email}:${password}`)}`;
};

export default apiClient;
