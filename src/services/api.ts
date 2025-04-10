
import axios from 'axios';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const FLASK_API_URL = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:8000';

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

// Create a specific API instance for ML operations
// We'll use our backend proxy to forward requests to the Flask API
const mlApi = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60-second timeout for ML operations
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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
      message = `Cannot connect to ML server. Please ensure the ML service is running.`;
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

// Define TypeScript types for our Supabase data
type ForensicSummary = {
  id?: string;
  case_id: string;
  image_id: string;
  crime_type: string | null;
  objects_detected: string[] | null;
  summary: string | null;
  created_at?: string | null;
};

type ForensicReport = {
  id?: string;
  case_id: string;
  report: string | null;
  created_at?: string | null;
};

// Helper function to check if ML service is available
const checkMLServiceHealth = async () => {
  try {
    await api.get('/ml/health');
    return true;
  } catch (error) {
    console.error('ML service health check failed:', error);
    return false;
  }
};

// Forensic Flask API services with Supabase integration
export const forensicService = {
  // Check health of ML service
  checkHealth: async () => {
    try {
      const response = await api.get('/ml/health');
      return {
        isAvailable: true,
        message: response.data.status,
        details: response.data.details
      };
    } catch (error) {
      return {
        isAvailable: false,
        message: error.response?.data?.status || 'ML service is unreachable',
        details: error.response?.data?.details || 'Please ensure your Flask API is running'
      };
    }
  },
  
  // Generate summary for an image
  generateImageSummary: async (caseId: string, imageId: string, imageFile: File | Blob) => {
    try {
      console.log(`Generating summary for case ${caseId}, image ${imageId}`);
      
      // Check ML service health first
      const healthCheck = await checkMLServiceHealth();
      if (!healthCheck) {
        throw new Error('ML service is currently unavailable. Please ensure your Flask API is running.');
      }
      
      // Create FormData for API
      const formData = new FormData();
      formData.append('case_id', caseId);
      formData.append('image_id', imageId);
      formData.append('image', imageFile);

      // Call API for image analysis through our backend proxy
      console.log('Calling ML API for summary generation');
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

      // Store summary result in Supabase
      console.log('Storing summary in Supabase');
      const { data: summaryData, error: summaryError } = await supabase
        .from('forensic_summaries')
        .upsert({
          case_id: caseId,
          image_id: imageId,
          crime_type: response.data.crime_type,
          objects_detected: response.data.objects_detected,
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
      
      // Provide fallback data in case of error (temporary solution)
      const fallbackSummary = {
        crime_type: "Unknown (ML service unavailable)",
        objects_detected: ["ML service unavailable"],
        summary: "Unable to generate summary. The ML service is currently unavailable. Please ensure your Flask API is running at " + FLASK_API_URL
      };
      
      // Store fallback data in Supabase so the user still sees something
      try {
        await supabase
          .from('forensic_summaries')
          .upsert({
            case_id: caseId,
            image_id: imageId,
            crime_type: fallbackSummary.crime_type,
            objects_detected: fallbackSummary.objects_detected,
            summary: fallbackSummary.summary,
            created_at: new Date().toISOString(),
          });
      } catch (storageError) {
        console.error('Error storing fallback summary:', storageError);
      }
      
      // Rethrow with user-friendly message
      const userMessage = error.userMessage || "Failed to generate image summary. Please ensure your Flask API is running.";
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
      
      // Check ML service health first
      const healthCheck = await checkMLServiceHealth();
      if (!healthCheck) {
        throw new Error('ML service is currently unavailable. Please ensure your Flask API is running.');
      }
      
      // Call Flask API for case report generation through our backend proxy
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
      
      // Provide fallback data in case of error (temporary solution)
      const fallbackReport = {
        report: "Unable to generate case report. The ML service is currently unavailable. Please ensure your Flask API is running at " + FLASK_API_URL
      };
      
      // Store fallback data in Supabase
      try {
        await supabase
          .from('forensic_reports')
          .upsert({
            case_id: caseId,
            report: fallbackReport.report,
            created_at: new Date().toISOString(),
          });
      } catch (storageError) {
        console.error('Error storing fallback report:', storageError);
      }
      
      // Rethrow with user-friendly message
      const userMessage = error.userMessage || "Failed to generate case report. Please ensure your Flask API is running.";
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
