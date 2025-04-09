
import { useState } from "react";
import API from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export function useCaseAnalytics(caseId?: string) {
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const generateCaseReport = async () => {
    if (!caseId) return;
    
    try {
      setAnalyzing(true);
      const reportData = await API.forensic.generateCaseReport(caseId);
      
      toast({
        title: "Case Report Generated",
        description: "Your complete case report has been generated successfully.",
      });
      
      console.log("Case report:", reportData.report);
    } catch (error) {
      console.error("Error generating case report:", error);
      
      const errorMessage = error.message || "There was a problem generating the case report.";
      
      toast({
        title: "Report Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    analyzing,
    setAnalyzing,
    generateCaseReport
  };
}
