
import { supabase } from '@/integrations/supabase/client';
import { ForensicSummary, ForensicReport } from './types';
import { mlApi } from './client';

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
  },
  
  // Check ML service health
  checkMLServiceHealth: async () => {
    try {
      console.log('Checking ML service health...');
      const response = await mlApi.get('/ml/health');
      return response.data;
    } catch (error) {
      console.error('Error checking ML service health:', error);
      throw error;
    }
  },
  
  // Analyze image directly (wrapper around generateImageSummary for consistency)
  analyzeImage: async (formData: FormData) => {
    try {
      const caseId = formData.get('case_id') as string;
      const imageId = formData.get('image_id') as string;
      const imageFile = formData.get('image') as File;
      
      return await forensicService.generateImageSummary(caseId, imageId, imageFile);
    } catch (error) {
      console.error('Error in analyzeImage wrapper:', error);
      throw error;
    }
  }
};

export default forensicService;
