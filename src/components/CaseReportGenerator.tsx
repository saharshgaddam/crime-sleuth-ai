
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

interface CaseReportGeneratorProps {
  caseId: string;
  caseName: string;
}

export function CaseReportGenerator({ caseId, caseName }: CaseReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const fetchSummaries = async () => {
    try {
      const { data, error } = await supabase
        .from('forensic_summaries')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching summaries:', error);
      throw error;
    }
  };

  const fetchExistingReport = async () => {
    try {
      const { data, error } = await supabase
        .from('forensic_reports')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching existing report:', error);
      return null;
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      // First check if a report already exists
      const existingReport = await fetchExistingReport();
      
      if (existingReport && existingReport.report) {
        setReport(existingReport.report);
        toast.success('Report loaded successfully');
        return;
      }
      
      // Fetch all summaries for this case
      const summaries = await fetchSummaries();
      
      if (!summaries || summaries.length === 0) {
        toast.error('No evidence summaries found for this case');
        return;
      }
      
      // Generate a full report by combining all summaries
      const reportContent = `
# Forensic Report: ${caseName}
*Generated on ${new Date().toLocaleString()}*

## Case Overview
Case ID: ${caseId}

## Evidence Analysis

${summaries.map((item, index) => `
### Evidence Item ${index + 1}${item.crime_type ? `: ${item.crime_type}` : ''}

${item.summary || 'No analysis available for this item.'}

${item.objects_detected && item.objects_detected.length > 0 
  ? `**Objects Detected**: ${item.objects_detected.join(', ')}` 
  : ''}

---
`).join('\n')}

## Conclusion
This report presents a comprehensive analysis of the evidence collected in case "${caseName}". The findings are based on AI-assisted image analysis and should be verified by authorized forensic experts.
`;
      
      // Save the report to the database
      const { error } = await supabase
        .from('forensic_reports')
        .insert({
          case_id: caseId,
          report: reportContent,
        });
        
      if (error) throw error;
      
      setReport(reportContent);
      toast.success('Report generated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
      console.error('Report generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async () => {
    if (!report) {
      toast.error('No report available to download');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Create a styled HTML document for the report
      const reportHtml = `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 2cm;
              }
              h1 {
                color: #333;
                border-bottom: 1px solid #ccc;
                padding-bottom: 10px;
              }
              h2, h3 {
                color: #444;
                margin-top: 20px;
              }
              .date {
                color: #666;
                font-style: italic;
              }
              hr {
                border: none;
                border-top: 1px solid #eee;
                margin: 20px 0;
              }
              .evidence-item {
                background-color: #f9f9f9;
                padding: 15px;
                margin: 15px 0;
                border-left: 4px solid #666;
              }
              .objects {
                font-weight: bold;
                margin-top: 10px;
              }
              .conclusion {
                margin-top: 30px;
                font-style: italic;
              }
              p {
                margin-bottom: 1em;
              }
            </style>
          </head>
          <body>
            <div id="report">
              ${report.replace(/^#\s/gm, '<h1>')
                .replace(/^##\s/gm, '<h2>')
                .replace(/^###\s/gm, '<h3>')
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/---/g, '<hr>')
                .replace(/<h3>([^<]+)<\/h3>/g, '<div class="evidence-item"><h3>$1</h3>')
                .replace(/(?:---|$)(?!\n)/g, '</div>')
                .replace(/<p><\/p>/g, '')}
            </div>
          </body>
        </html>
      `;
      
      // Configure html2pdf options
      const options = {
        margin: 10,
        filename: `forensic-report-${caseName.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Create a temporary div to render the HTML
      const element = document.createElement('div');
      element.innerHTML = reportHtml;
      document.body.appendChild(element);
      
      // Generate and download PDF
      await html2pdf().from(element).set(options).save();
      
      // Clean up
      document.body.removeChild(element);
      
      toast.success('Report downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download report');
      console.error('Report download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Report</CardTitle>
        <CardDescription>
          Generate a comprehensive report of all evidence analyses
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {report ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              Generate a comprehensive report that combines all evidence analyses for this case.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        {report ? (
          <>
            <Button 
              variant="outline" 
              onClick={generateReport} 
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                'Refresh Report'
              )}
            </Button>
            <Button 
              onClick={downloadReport}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download PDF
            </Button>
          </>
        ) : (
          <Button 
            onClick={generateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Report'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
