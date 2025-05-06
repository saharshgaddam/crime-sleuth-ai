
import { supabase } from "@/integrations/supabase/client";

const API = {
  // Example functions that could be used in the future
};

export interface ForensicSummary {
  case_id: string;
  image_id: string;
  crime_type: string | null;
  objects_detected: string[] | null;
  summary: string | null;
}

export const forensicService = {
  async getImageSummary(caseId: string, imageId: string): Promise<ForensicSummary | null> {
    try {
      const { data, error } = await supabase
        .from('forensic_summaries')
        .select('*')
        .eq('case_id', caseId)
        .eq('image_id', imageId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching image summary:', error);
      return null;
    }
  },

  async generateImageSummary(caseId: string, imageId: string, imageFile: Blob): Promise<ForensicSummary> {
    try {
      // Check if summary already exists
      const existingSummary = await this.getImageSummary(caseId, imageId);
      if (existingSummary) {
        return existingSummary;
      }

      // For demonstration purposes - in a real app, this would call an ML service
      // Here we'll just create a dummy summary
      const summary = "This image shows potential evidence related to the case. There are visible objects and details that could be relevant to the investigation.";
      const objects = ["document", "person", "vehicle"];
      const crimeType = "Potential fraud";

      // Store the generated summary in the database
      const { data, error } = await supabase
        .from('forensic_summaries')
        .insert({
          case_id: caseId,
          image_id: imageId,
          summary: summary,
          objects_detected: objects,
          crime_type: crimeType
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating image summary:', error);
      throw new Error('Failed to generate image summary');
    }
  },

  async getCaseReport(caseId: string) {
    try {
      const { data, error } = await supabase
        .from('forensic_reports')
        .select('*')
        .eq('case_id', caseId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows returned
      
      return data;
    } catch (error) {
      console.error('Error fetching case report:', error);
      return null;
    }
  },

  async generateCaseReport(caseId: string) {
    try {
      // Check if report already exists
      const existingReport = await this.getCaseReport(caseId);
      if (existingReport) {
        return existingReport;
      }

      // For demonstration - in a real app, this would compile all evidence and analysis
      const report = "This case involves potential evidence of fraudulent activity. Multiple documents and images show patterns consistent with financial crimes. Recommend further investigation into the financial records and interviewing the persons of interest identified in the evidence.";

      // Store the generated report
      const { data, error } = await supabase
        .from('forensic_reports')
        .insert({
          case_id: caseId,
          report: report
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating case report:', error);
      throw new Error('Failed to generate case report');
    }
  }
};

export default API;
