
import axios from 'axios';
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const FLASK_API_URL = 'http://localhost:8000'; // Add Flask API URL

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
});

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = 
      error.response?.data?.error ||
      error.message ||
      'An unknown error occurred';
    
    toast.error(message);
    
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    
    return Promise.reject(error);
  }
);

// Forensic Flask API services
export const forensicService = {
  // Generate summary for an image
  generateImageSummary: async (caseId: string, imageId: string, imageFile: File | Blob) => {
    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('image_id', imageId);
    formData.append('image', imageFile);

    const response = await axios.post(
      `${FLASK_API_URL}/generate-summary`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
  
  // Generate report for entire case
  generateCaseReport: async (caseId: string) => {
    const response = await axios.post(
      `${FLASK_API_URL}/generate-case-report`,
      { case_id: caseId }
    );
    return response.data;
  }
};

// Auth services
export const authService = {
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  updateProfile: async (userData: any) => {
    const response = await api.put('/auth/updatedetails', userData);
    if (response.data.success) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  },
  changePassword: async (passwordData: { currentPassword: string; newPassword: string }) => {
    const response = await api.put('/auth/updatepassword', passwordData);
    return response.data;
  },
};

// Case services
export const caseService = {
  getCases: async (params?: any) => {
    const response = await api.get('/cases', { params });
    return response.data;
  },
  getCase: async (id: string) => {
    const response = await api.get(`/cases/${id}`);
    return response.data;
  },
  createCase: async (caseData: any) => {
    const response = await api.post('/cases', caseData);
    return response.data;
  },
  updateCase: async (id: string, caseData: any) => {
    const response = await api.put(`/cases/${id}`, caseData);
    return response.data;
  },
  deleteCase: async (id: string) => {
    const response = await api.delete(`/cases/${id}`);
    return response.data;
  },
};

// Evidence services
export const evidenceService = {
  getEvidenceForCase: async (caseId: string) => {
    const response = await api.get(`/cases/${caseId}/evidence`);
    return response.data;
  },
  getEvidenceItem: async (id: string) => {
    const response = await api.get(`/evidence/${id}`);
    return response.data;
  },
  addEvidenceItem: async (caseId: string, evidenceData: any) => {
    const response = await api.post(`/cases/${caseId}/evidence`, evidenceData);
    return response.data;
  },
  updateEvidenceItem: async (id: string, evidenceData: any) => {
    const response = await api.put(`/evidence/${id}`, evidenceData);
    return response.data;
  },
  deleteEvidenceItem: async (id: string) => {
    const response = await api.delete(`/evidence/${id}`);
    return response.data;
  },
  analyzeEvidence: async (id: string, analysisData: any) => {
    const response = await api.post(`/evidence/${id}/analyze`, analysisData);
    return response.data;
  },
};

// User services
export const userService = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  createUser: async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Export a default API object with all services
const API = {
  auth: authService,
  cases: caseService,
  evidence: evidenceService,
  users: userService,
  forensic: forensicService
};

export default API;
