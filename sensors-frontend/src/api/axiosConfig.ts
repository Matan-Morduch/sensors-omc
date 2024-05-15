import axios from 'axios';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export default axiosInstance;
