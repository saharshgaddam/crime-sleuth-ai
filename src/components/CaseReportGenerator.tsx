
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import html2pdf from "html2pdf.js";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

interface CaseReportGeneratorProps {
  caseId: string;
  caseTitle: string;
}

export function CaseReportGenerator({ caseId, caseTitle }: CaseReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      // First check if a report already exists
      const { data: existingReport, error: fetchError } = await supabase
        .from('forensic_reports')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (existingReport?.report) {
        toast.success("Found existing case report");
        return existingReport.report;
      }
      
      // If no report exists, get all summaries for this case
      const { data: summaries, error: summariesError } = await supabase
        .from('forensic_summaries')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });
      
      if (summariesError) throw summariesError;
      
      if (!summaries || summaries.length === 0) {
        toast.error("No evidence analyses found for this case");
        return null;
      }
      
      // Combine summaries into a full report
      let fullReport = `# Forensic Analysis Report: ${caseTitle}\n\n`;
      fullReport += `**Generated on:** ${format(new Date(), 'PPP')}\n\n`;
      fullReport += `**Case ID:** ${caseId}\n\n`;
      fullReport += `## Evidence Summary\n\n`;
      fullReport += `This report contains analysis of ${summaries.length} piece(s) of evidence.\n\n`;
      
      // Group by crime type
      const crimeTypes = new Set(summaries.map(s => s.crime_type).filter(Boolean));
      if (crimeTypes.size > 0) {
        fullReport += `**Identified Crime Types:** ${Array.from(crimeTypes).join(', ')}\n\n`;
      }
      
      // Add each evidence summary
      summaries.forEach((summary, index) => {
        fullReport += `## Evidence Item ${index + 1}\n\n`;
        
        if (summary.crime_type) {
          fullReport += `**Crime Type:** ${summary.crime_type}\n\n`;
        }
        
        if (summary.objects_detected && summary.objects_detected.length > 0) {
          fullReport += `**Objects Detected:** ${summary.objects_detected.join(', ')}\n\n`;
        }
        
        fullReport += `${summary.summary || 'No analysis available'}\n\n`;
        
        if (index < summaries.length - 1) {
          fullReport += `---\n\n`;
        }
      });
      
      // Add conclusions section
      fullReport += `## Investigation Conclusions\n\n`;
      fullReport += `This is an AI-generated report based on the evidence analysis. The findings should be reviewed by a human investigator before making final conclusions.\n\n`;
      
      // Store this report in the database
      const { error: insertError } = await supabase
        .from('forensic_reports')
        .insert({
          case_id: caseId,
          report: fullReport
        });
      
      if (insertError) throw insertError;
      
      toast.success("Case report generated successfully");
      return fullReport;
      
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate case report");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async () => {
    try {
      setIsDownloading(true);
      
      // Generate or fetch the report
      const reportContent = await generateReport();
      if (!reportContent) return;
      
      // Create HTML content from markdown
      const reportElement = document.createElement('div');
      reportElement.className = 'report-container';
      reportElement.style.padding = '40px';
      reportElement.style.maxWidth = '800px';
      reportElement.style.margin = '0 auto';
      reportElement.style.fontFamily = 'Arial, sans-serif';
      
      // Add report content
      const contentDiv = document.createElement('div');
      contentDiv.className = 'markdown-content';
      contentDiv.innerHTML = `<div id="report-markdown"></div>`;
      reportElement.appendChild(contentDiv);
      
      // Temporarily add to document to render markdown
      document.body.appendChild(reportElement);
      
      const reportMarkdownElement = document.getElementById('report-markdown');
      if (reportMarkdownElement) {
        // Use ReactDOM to render the markdown component to the div
        const ReactDOM = await import('react-dom');
        ReactDOM.render(
          <ReactMarkdown>{reportContent}</ReactMarkdown>,
          reportMarkdownElement
        );
      }
      
      // Use html2pdf to generate PDF
      const pdfOptions = {
        margin: 10,
        filename: `${caseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Generate and download PDF
      await html2pdf().from(reportElement).set(pdfOptions).save();
      
      // Clean up
      document.body.removeChild(reportElement);
      
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <Button 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2"
        disabled={isGenerating || isDownloading}
        onClick={downloadReport}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating report...
          </>
        ) : isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Downloading PDF...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Generate & Download Case Report
          </>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Creates a comprehensive PDF report from all evidence analyses
      </p>
    </div>
  );
}
