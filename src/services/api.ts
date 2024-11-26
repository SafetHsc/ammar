import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5174', // Your backend API
});

export default api;