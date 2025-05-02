
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MarkdownSummaryProps {
  summary: string | null;
  crimeType?: string | null;
  objects?: string[] | null;
  isLoading?: boolean;
}

export function MarkdownSummary({ 
  summary, 
  crimeType, 
  objects, 
  isLoading = false 
}: MarkdownSummaryProps) {
  const [displayText, setDisplayText] = useState<string>("");
  
  useEffect(() => {
    if (!summary) {
      setDisplayText("");
      return;
    }
    
    // Reset if new summary is provided
    if (displayText !== summary) {
      setDisplayText("");
      
      let index = 0;
      const fullText = summary;
      
      const interval = setInterval(() => {
        if (index < fullText.length) {
          setDisplayText(prevText => prevText + fullText.charAt(index));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 10); // Speed of typewriter effect
      
      return () => clearInterval(interval);
    }
  }, [summary]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary && !isLoading) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {crimeType && (
          <div className="mb-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
              Crime Type: {crimeType}
            </Badge>
          </div>
        )}
        
        {objects && objects.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium mb-2">Objects Detected:</h5>
            <div className="flex flex-wrap gap-1">
              {objects.map((object, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className="bg-muted"
                >
                  {object}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{displayText}</ReactMarkdown>
          {isLoading && <span className="animate-pulse">|</span>}
        </div>
      </CardContent>
    </Card>
  );
}
