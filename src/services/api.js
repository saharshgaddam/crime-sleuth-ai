
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});

// Add a request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Case services
export const caseService = {
  getAllCases: () => api.get('/api/cases'),
  getCase: (id) => api.get(`/api/cases/${id}`),
  createCase: (caseData) => api.post('/api/cases', caseData),
  updateCase: (id, caseData) => api.put(`/api/cases/${id}`, caseData),
  deleteCase: (id) => api.delete(`/api/cases/${id}`),
  addImageToCase: (id, imageUrl) => api.post(`/api/cases/${id}/images`, { imageUrl })
};

// Auth services
export const authService = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  googleLogin: (tokenId) => api.post('/api/auth/google', { tokenId }),
  getCurrentUser: () => api.get('/api/auth/me')
};

export default api;
