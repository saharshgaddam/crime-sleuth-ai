
import axios from 'axios';
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API client setup
export const createAPIClient = () => {
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

  return api;
};

// Create a separate axios instance for ML API calls with better error handling
export const createMLClient = () => {
  const mlApi = axios.create({
    baseURL: API_URL,  // Use backend proxy, not direct to ML API
    timeout: 30000, // 30-second timeout for ML operations which might take longer
    headers: {
      'Content-Type': 'application/json',
    }
  });

  // Add response interceptor for ML API with improved error messages
  mlApi.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      console.error("ML API Error:", error);
      let message = "Failed to connect to ML service";
      
      if (error.code === 'ECONNABORTED') {
        message = "ML operation timed out. The server might be processing a large request.";
      } else if (error.code === 'ERR_NETWORK' || !error.response) {
        message = `Cannot connect to ML service. Please ensure the ML service is running.`;
      } else if (error.response) {
        message = error.response.data?.error || `ML service error: ${error.response.status}`;
      }
      
      toast.error(message);
      return Promise.reject({
        ...error,
        userMessage: message
      });
    }
  );

  return mlApi;
};

export const api = createAPIClient();
export const mlApi = createMLClient();
