
import axios from 'axios';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const FLASK_API_URL = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:8000';

// Define TypeScript types for our data
export type ForensicSummary = {
  id?: string;
  case_id: string;
  image_id: string;
  crime_type: string | null;
  objects_detected: string[] | null;
  summary: string | null;
  created_at?: string | null;
};

export type ForensicReport = {
  id?: string;
  case_id: string;
  report: string | null;
  created_at?: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type CaseData = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  assigned_to: string[];
};

export type EvidenceItem = {
  id: string;
  case_id: string;
  name: string;
  type: string;
  description: string;
  created_at: string;
  updated_at: string;
  file_url?: string;
};

// API client setup
const createAPIClient = () => {
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
const createMLClient = () => {
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

const api = createAPIClient();
const mlApi = createMLClient();

// Forensic service implementation
const forensicService = {
  // Generate summary for an image
  generateImageSummary: async (caseId: string, imageId: string, imageFile: File | Blob) => {
    try {
      console.log(`Generating summary for case ${caseId}, image ${imageId}`);
      
      // Create FormData for API
      const formData = new FormData();
      formData.append('case_id', caseId);
      formData.append('image_id', imageId);
      formData.append('image', imageFile);

      // Call backend proxy API for image analysis with improved error handling
      console.log('Calling ML API via backend proxy');
      const response = await mlApi.post(
        '/ml/generate-summary',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('ML API response:', response.data);

      if (!response.data.summary) {
        console.warn('Warning: Received empty summary from API');
        response.data.summary = "No detailed analysis available for this image.";
      }

      // Store summary result in Supabase
      console.log('Storing summary in Supabase');
      const { data: summaryData, error: summaryError } = await supabase
        .from('forensic_summaries')
        .upsert({
          case_id: caseId,
          image_id: imageId,
          crime_type: response.data.crime_type || "Unknown",
          objects_detected: response.data.objects_detected || [],
          summary: response.data.summary,
          created_at: new Date().toISOString(),
        })
        .select();

      if (summaryError) {
        console.error('Error storing summary in Supabase:', summaryError);
        throw summaryError;
      }

      return response.data;
    } catch (error) {
      console.error('Error generating summary:', error);
      
      // Rethrow with user-friendly message
      const userMessage = error.userMessage || "Failed to generate image summary. Please try again later.";
      throw new Error(userMessage);
    }
  },
  
  // Get summary for an image from Supabase
  getImageSummary: async (caseId: string, imageId: string) => {
    console.log(`Getting summary for case ${caseId}, image ${imageId}`);
    try {
      const { data, error } = await supabase
        .from('forensic_summaries')
        .select('*')
        .eq('case_id', caseId)
        .eq('image_id', imageId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching summary from Supabase:', error);
        throw error;
      }

      // Make sure we don't return null values for important fields
      if (data) {
        return {
          ...data,
          summary: data.summary || "No detailed analysis available for this image.",
          objects_detected: data.objects_detected || [],
          crime_type: data.crime_type || "Unknown"
        } as ForensicSummary;
      }
      
      return data as unknown as ForensicSummary;
    } catch (error) {
      console.error('Error getting image summary:', error);
      throw error;
    }
  },
  
  // Generate report for entire case
  generateCaseReport: async (caseId: string) => {
    try {
      console.log(`Generating case report for case ${caseId}`);
      
      // Call backend proxy API for case report generation with improved error handling
      const response = await mlApi.post(
        '/ml/generate-case-report',
        { case_id: caseId }
      );

      console.log('ML API response for case report:', response.data);

      // Store report in Supabase
      const { data: reportData, error: reportError } = await supabase
        .from('forensic_reports')
        .upsert({
          case_id: caseId,
          report: response.data.report,
          created_at: new Date().toISOString(),
        })
        .select();

      if (reportError) {
        console.error('Error storing report in Supabase:', reportError);
        throw reportError;
      }

      return response.data;
    } catch (error) {
      console.error('Error generating case report:', error);
      
      // Rethrow with user-friendly message
      const userMessage = error.userMessage || "Failed to generate case report. Please try again later.";
      throw new Error(userMessage);
    }
  },
  
  // Get all summaries for a case from Supabase
  getCaseSummaries: async (caseId: string) => {
    console.log(`Getting all summaries for case ${caseId}`);
    try {
      const { data, error } = await supabase
        .from('forensic_summaries')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching case summaries from Supabase:', error);
        throw error;
      }

      return (data || []) as unknown as ForensicSummary[];
    } catch (error) {
      console.error('Error getting case summaries:', error);
      throw error;
    }
  },
  
  // Get case report from Supabase
  getCaseReport: async (caseId: string) => {
    console.log(`Getting case report for case ${caseId}`);
    try {
      const { data, error } = await supabase
        .from('forensic_reports')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching case report from Supabase:', error);
        throw error;
      }

      return data as unknown as ForensicReport;
    } catch (error) {
      console.error('Error getting case report:', error);
      throw error;
    }
  }
};

// Auth services
const authService = {
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
const caseService = {
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
const evidenceService = {
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
const userService = {
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
