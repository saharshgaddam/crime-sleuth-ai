
import { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Send, MessageSquare, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import API from "@/services/api";
import { UploadedImage } from "@/pages/Case/hooks/useCaseFileUpload";

type ActiveTab = "sources" | "chat" | "studio";

interface ImageAnalysisPanelProps {
  activeTab: ActiveTab;
  selectedImage: UploadedImage | null;
  closeImagePreview: () => void;
  caseId?: string;
  getTotalSourceCount: () => number;
  analyzeEvidence: () => void;
  analyzing: boolean;
  connectionError: string | null;
  setConnectionError: React.Dispatch<React.SetStateAction<string | null>>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function ImageAnalysisPanel({
  activeTab,
  selectedImage,
  closeImagePreview,
  caseId,
  getTotalSourceCount,
  analyzeEvidence,
  analyzing,
  connectionError,
  setConnectionError,
  handleFileUpload
}: ImageAnalysisPanelProps) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [question, setQuestion] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const { toast } = useToast();

  // Zoom functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  useEffect(() => {
    if (selectedImage && selectedImage.id) {
      analyzeSingleImage();
    }
  }, [selectedImage]);

  // Check ML service connection on component mount
  useEffect(() => {
    checkMLServiceConnection();
  }, []);

  const checkMLServiceConnection = async () => {
    try {
      const response = await API.forensic.checkMLServiceHealth();
      if (response && response.status === 'connected') {
        setConnectionError(null);
      } else {
        setConnectionError('ML service is not available');
      }
    } catch (error) {
      console.error('Error checking ML service:', error);
      setConnectionError('Could not connect to ML service');
    }
  };

  const analyzeSingleImage = async () => {
    if (!selectedImage || !caseId) return;
    
    try {
      setLoading(true);
      
      // Convert data URL to File object
      const response = await fetch(selectedImage.src);
      const blob = await response.blob();
      const file = new File([blob], selectedImage.name, { type: blob.type });
      
      // Create FormData and append the image
      const formData = new FormData();
      formData.append('case_id', caseId);
      formData.append('image_id', selectedImage.id);
      formData.append('image', file);
      
      // Use the forensic.analyzeImage method
      const analysisResult = await API.forensic.analyzeImage(formData);
      
      // Process and display summary with proper markdown formatting
      if (analysisResult && analysisResult.summary) {
        setSummary(analysisResult.summary);
      } else {
        setSummary("No analysis results available.");
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setSummary("Error analyzing image. Please try again later.");
      
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !selectedImage || !caseId) return;
    
    toast({
      title: "Coming Soon",
      description: "The ability to ask questions about specific evidence will be available in an upcoming update.",
    });
    
    setQuestion("");
  };

  // If ML service is not connected, show reconnect option
  const renderConnectionError = () => {
    if (!connectionError) return null;
    
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="text-red-500 mb-4">
          {connectionError}
        </div>
        <p className="text-muted-foreground mb-4">
          Please make sure the ML service is running at {import.meta.env.VITE_FLASK_API_URL || 'http://127.0.0.1:8000'}
        </p>
        <Button onClick={checkMLServiceConnection}>
          Reconnect
        </Button>
      </div>
    );
  };

  // Render empty state when no image is selected
  const renderEmptyState = () => {
    if (selectedImage) return null;
    
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="p-3 bg-muted rounded-lg mb-3">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="font-medium">No evidence selected</h3>
        <p className="text-xs mt-2 text-muted-foreground">
          Select an image from the sources panel or upload a new one
        </p>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = handleFileUpload as any;
            input.click();
          }}>
            Upload Image
          </Button>
        </div>
      </div>
    );
  };

  // Main render method
  if (connectionError) {
    return (
      <div className={`flex-1 flex flex-col border-l ${activeTab === "chat" ? "block" : "hidden md:block"}`}>
        <div className="p-4 border-b font-semibold flex items-center justify-between">
          <span>Analysis</span>
        </div>
        {renderConnectionError()}
      </div>
    );
  }

  if (!selectedImage) {
    return (
      <div className={`flex-1 flex flex-col border-l ${activeTab === "chat" ? "block" : "hidden md:block"}`}>
        <div className="p-4 border-b font-semibold flex items-center justify-between">
          <span>Analysis</span>
        </div>
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col border-l ${activeTab === "chat" ? "block" : "hidden md:block"}`}>
      <div className="p-4 border-b font-semibold flex items-center justify-between">
        <span>Evidence Analysis</span>
        {selectedImage && (
          <Button variant="ghost" size="sm" onClick={closeImagePreview}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {selectedImage && (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-auto">
            <div className="relative p-4">
              <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{selectedImage.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedImage.date instanceof Date 
                        ? selectedImage.date.toLocaleString() 
                        : new Date(selectedImage.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleResetZoom}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <img 
                  src={selectedImage.src} 
                  alt={selectedImage.name} 
                  style={{ 
                    width: '100%', 
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top left',
                    transition: 'transform 0.2s ease-in-out'
                  }} 
                  className="mb-4 rounded-lg border"
                />
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Analysis Summary</h4>
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Analyzing image...</span>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="prose prose-sm max-w-none">
                      {summary ? (
                        <div dangerouslySetInnerHTML={{ __html: summary }} />
                      ) : (
                        <p>No analysis available. Click the button below to analyze this image.</p>
                      )}
                    </div>
                    {!summary && (
                      <Button 
                        className="mt-4" 
                        onClick={analyzeSingleImage}
                        disabled={loading}
                      >
                        Analyze Image
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Ask about this evidence</h4>
                <Textarea 
                  placeholder="Ask a question about this evidence..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="mb-2"
                />
                <Button 
                  onClick={handleAskQuestion}
                  className="w-full"
                  disabled={!question.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Question
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageAnalysisPanel;
