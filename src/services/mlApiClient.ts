
import axios from 'axios';
import { toast } from "sonner";

// Read Flask API URL from environment variables
const FLASK_API_URL = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:8000';

// Create a separate axios instance for ML API calls with better error handling
const mlApiClient = axios.create({
  baseURL: FLASK_API_URL,
  timeout: 60000, // 60-second timeout for ML operations which might take longer
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor for ML API with improved error messages
mlApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("ML API Error:", error);
    let message = "Failed to connect to ML service";
    
    if (error.code === 'ECONNABORTED') {
      message = "ML operation timed out. The server might be processing a large request.";
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      message = `Cannot connect to ML server at ${FLASK_API_URL}. Please ensure the ML service is running.`;
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

// Check if ML API server is running
export const checkMlApiConnection = async (): Promise<boolean> => {
  try {
    await mlApiClient.get('/health', { timeout: 5000 });
    return true;
  } catch (error) {
    console.error("Cannot connect to ML API", error);
    return false;
  }
};

// Generate summary for an image
export const generateImageSummary = async (
  caseId: string, 
  imageId: string, 
  imageFile: File | Blob
): Promise<{
  summary: string;
  objects_detected: string[];
  crime_type: string;
}> => {
  try {
    // Create FormData for Flask API
    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('image_id', imageId);
    formData.append('image', imageFile);

    // Call Flask API for image analysis with improved error handling
    console.log(`Calling Flask API at ${FLASK_API_URL}/generate-summary`);
    const response = await mlApiClient.post(
      `/generate-summary`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('Flask API response:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error generating image summary:", error);
    throw error;
  }
};

// Generate case report
export const generateCaseReport = async (caseId: string): Promise<{ report: string }> => {
  try {
    // Call Flask API for case report generation
    const response = await mlApiClient.post(
      `/generate-case-report`,
      { case_id: caseId }
    );

    console.log('Flask API response for case report:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error generating case report:", error);
    throw error;
  }
};

export default mlApiClient;
