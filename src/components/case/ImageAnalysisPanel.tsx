
import { useState, useEffect } from "react";
import { 
  BrainCircuit, 
  Loader, 
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { forensicService } from "@/services/api";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ImageAnalysisPanelProps {
  caseId: string;
  selectedImage: {
    id: string;
    src: string;
    name: string;
  } | null;
  onClose: () => void;
}

export function ImageAnalysisPanel({ 
  caseId, 
  selectedImage, 
  onClose 
}: ImageAnalysisPanelProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [displayedSummary, setDisplayedSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [crimeType, setCrimeType] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const FLASK_API_URL = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:8000';
  
  useEffect(() => {
    if (selectedImage && caseId) {
      checkExistingSummary(selectedImage.id).catch(error => {
        console.error("Error loading existing summary:", error);
      });
    }
  }, [selectedImage, caseId]);
  
  useEffect(() => {
    if (summary && summary !== displayedSummary) {
      setDisplayedSummary(summary);
    }
  }, [summary, displayedSummary]);
  
  const checkExistingSummary = async (imageId: string) => {
    if (!caseId) return null;
    
    try {
      const existingSummary = await forensicService.getImageSummary(caseId, imageId);
      if (existingSummary) {
        setSummary(existingSummary.summary);
        setDisplayedSummary(existingSummary.summary);
        setDetectedObjects(existingSummary.objects_detected || []);
        setCrimeType(existingSummary.crime_type);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking existing summary:", error);
      return false;
    }
  };
  
  const extractImageFile = async (imageSrc: string): Promise<Blob> => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error("Error converting image to blob:", error);
      throw new Error("Failed to process image file");
    }
  };
  
  const generateSummary = async () => {
    if (!selectedImage || !caseId) return;
    
    setIsSummarizing(true);
    setSummary(null);
    setDisplayedSummary("Analyzing image...");
    setDetectedObjects([]);
    setCrimeType(null);
    setConnectionError(null);
    
    try {
      console.log("Starting summary generation process...");
      
      const exists = await checkExistingSummary(selectedImage.id);
      
      if (!exists) {
        console.log("No existing summary found, generating new one...");
        
        const imageFile = await extractImageFile(selectedImage.src);
        
        const result = await forensicService.generateImageSummary(caseId, selectedImage.id, imageFile);
        
        setSummary(result.summary);
        setDisplayedSummary(result.summary);
        setDetectedObjects(result.objects_detected || []);
        setCrimeType(result.crime_type);
      } else {
        console.log("Using existing summary from database");
      }
    } catch (error) {
      console.error("Error in generateSummary:", error);
      
      const errorMessage = error.message || `Failed to generate summary. Please ensure the ML server is running at ${FLASK_API_URL}`;
      setConnectionError(errorMessage);
      setSummary(null);
      setDisplayedSummary(null);
    } finally {
      setIsSummarizing(false);
    }
  };
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };
  
  if (!selectedImage) return null;
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="border-b pb-2 mb-4 flex justify-between items-center">
        <h3 className="font-medium">{selectedImage.name}</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleResetZoom} title="Reset Zoom">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto flex items-center justify-center mb-4">
        <div className="overflow-auto max-w-full max-h-full">
          <img 
            src={selectedImage.src} 
            alt={selectedImage.name} 
            className="object-contain transition-transform"
            style={{ transform: `scale(${zoomLevel})` }}
          />
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium">Image Analysis</h4>
          <Button 
            onClick={generateSummary} 
            disabled={isSummarizing}
            className="gap-2"
          >
            {isSummarizing ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BrainCircuit className="h-4 w-4" />
                Analyze with ML
              </>
            )}
          </Button>
        </div>
        
        {connectionError && (
          <div className="mb-4 p-4 border border-red-300 bg-red-50 rounded-md text-red-800">
            <p className="flex items-center">
              <X className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{connectionError}</span>
            </p>
            <p className="text-sm mt-2">
              Check that your ML server is running at {FLASK_API_URL} and is properly configured to accept requests from this application.
            </p>
          </div>
        )}
        
        {displayedSummary ? (
          <Card className="mb-4">
            <CardContent className="pt-6">
              {crimeType && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Crime Type: {crimeType}
                  </span>
                </div>
              )}
              
              {detectedObjects && detectedObjects.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium mb-2">Objects Detected:</h5>
                  <div className="flex flex-wrap gap-1">
                    {detectedObjects.map((object, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted"
                      >
                        {object}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <MarkdownRenderer content={displayedSummary} />
              
              {isSummarizing && <span className="animate-pulse">|</span>}
            </CardContent>
          </Card>
        ) : isSummarizing ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Loader className="h-8 w-8 animate-spin mb-3" />
            <p>Generating detailed summary...</p>
            <p className="text-xs mt-1">This may take a moment</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border border-dashed rounded-lg">
            <BrainCircuit className="h-8 w-8 mb-3" />
            <p>Generate an AI-powered summary of this image</p>
            <p className="text-xs mt-1">Click the Analyze with ML button above to analyze this evidence</p>
          </div>
        )}
      </div>
    </div>
  );
}
