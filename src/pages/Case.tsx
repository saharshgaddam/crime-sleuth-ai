import { useState, useCallback, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Image,
  FileText,
  Save,
  Microscope,
  Fingerprint,
  Trash2,
  Camera,
  BarChart3,
  PanelLeft,
  Eye,
  Share,
  Settings,
  UploadCloud,
  Plus,
  FileUp,
  ChevronRight,
  MessageSquare,
  Book,
  Scroll,
  LayoutGrid,
  Info,
  Check,
  Loader,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BrainCircuit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import API, { forensicService } from "@/services/api";
import { useCase } from "@/hooks/useCase";
import { useEvidence, UploadedFile } from "@/hooks/useEvidence";
import { useProfile } from "@/hooks/useProfile";

type SourceType = "all" | "images" | "documents";
type ActiveTab = "sources" | "chat" | "studio";

type ForensicSummary = {
  case_id: string;
  image_id: string;
  crime_type: string | null;
  objects_detected: string[] | null;
  summary: string | null;
  created_at?: string;
};

type ForensicReport = {
  case_id: string;
  report: string | null;
  created_at?: string;
};

export default function Case() {
  const { caseId } = useParams();
  const { caseData, loading: caseLoading } = useCase(caseId);
  const { uploadedFiles, loading: evidenceLoading, uploading: isUploading, uploadFile, deleteEvidence } = useEvidence(caseId);
  const { profile } = useProfile();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>("sources");
  const [analyzing, setAnalyzing] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>("all");
  const [selectedImage, setSelectedImage] = useState<UploadedFile | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [summary, setSummary] = useState<string | null>(null);
  const [displayedSummary, setDisplayedSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [crimeType, setCrimeType] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const FLASK_API_URL = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        await fetch(`${FLASK_API_URL}/health`, { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        setConnectionError(null);
      } catch (error) {
        console.error("Cannot connect to ML API", error);
        setConnectionError("Cannot connect to ML service. Please ensure it's running and accessible.");
      }
    };
    
    checkApiConnection();
  }, [FLASK_API_URL]);

  useEffect(() => {
    if (summary && summary !== displayedSummary) {
      let currentIndex = 0;
      const fullText = summary;
      
      if (!displayedSummary || displayedSummary.endsWith("...")) {
        setDisplayedSummary("");
      }
      
      const interval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setDisplayedSummary(prevText => 
            prevText + fullText.charAt(currentIndex)
          );
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 10);
      
      return () => clearInterval(interval);
    }
  }, [summary, displayedSummary]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !caseId) return;

    try {
      for (const file of Array.from(files)) {
        const name = file.name;
        await uploadFile(file, name);
      }
      
      if (e.target) {
        e.target.value = '';
      }
    } catch (error: any) {
      console.error("Error uploading files:", error);
      toast({
        title: "Upload Failed",
        description: "There was a problem uploading your files.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (selectedImage && selectedImage.id === id) {
      setSelectedImage(null);
      setSummary(null);
      setDisplayedSummary(null);
      setDetectedObjects([]);
      setCrimeType(null);
    }
    
    await deleteEvidence(id);
  };

  const handleSelectImage = (image: UploadedFile) => {
    setSelectedImage(image);
    setActiveTab("chat");
    setZoomLevel(1);
    
    if (caseId) {
      checkExistingSummary(image.id).catch(error => {
        console.error("Error loading existing summary:", error);
      });
    } else {
      setSummary(null);
      setDisplayedSummary(null);
      setDetectedObjects([]);
      setCrimeType(null);
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

  const checkExistingSummary = async (imageId: string) => {
    if (!caseId) return null;
    
    try {
      const existingSummary = await forensicService.getImageSummary(caseId, imageId);
      if (existingSummary) {
        setSummary(existingSummary.summary);
        setDisplayedSummary("");
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
        
        if (!selectedImage.src) {
          throw new Error("No image source available for analysis");
        }
        
        const imageFile = await extractImageFile(selectedImage.src);
        
        const result = await forensicService.generateImageSummary(caseId, selectedImage.id, imageFile);
        
        setSummary(result.summary);
        setDetectedObjects(result.objects_detected || []);
        setCrimeType(result.crime_type);
      } else {
        console.log("Using existing summary from database");
      }
      
      toast({
        title: "Summary Generated",
        description: "The image has been successfully analyzed.",
      });
    } catch (error: any) {
      console.error("Error in generateSummary:", error);
      
      const errorMessage = error.message || `Failed to generate summary. Please ensure the ML server is running at ${FLASK_API_URL}`;
      setConnectionError(errorMessage);
      setSummary(null);
      setDisplayedSummary(null);
      
      toast({
        title: "Summary Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const generateCaseReport = async () => {
    if (!caseId) return;
    
    try {
      setAnalyzing(true);
      
      const existingReport = await forensicService.getCaseReport(caseId);
      
      let reportData;
      if (existingReport) {
        reportData = { report: existingReport.report };
      } else {
        reportData = await forensicService.generateCaseReport(caseId);
      }
      
      toast({
        title: "Case Report Generated",
        description: "Your complete case report has been generated successfully.",
      });
      
      console.log("Case report:", reportData.report);
    } catch (error: any) {
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

  const analyzeEvidence = () => {
    const totalSources = uploadedFiles.length;
    if (totalSources === 0) {
      toast({
        title: "No Evidence to Analyze",
        description: "Please upload at least one source before analysis.",
        variant: "destructive"
      });
      return;
    }
    
    generateCaseReport();
  };

  const filteredSources = () => {
    if (sourceType === "images") return uploadedFiles.filter(file => file.type === "image");
    if (sourceType === "documents") return uploadedFiles.filter(file => file.type === "document");
    return uploadedFiles;
  };

  const getTotalSourceCount = () => {
    return uploadedFiles.length;
  };

  const getImagesCount = () => {
    return uploadedFiles.filter(file => file.type === "image").length;
  };

  const getDocsCount = () => {
    return uploadedFiles.filter(file => file.type === "document").length;
  };

  const form = useForm({
    defaultValues: {
      notes: "",
    },
  });

  const onSubmitNotes = (data: { notes: string }) => {
    toast({
      title: "Notes Saved",
      description: "Your notes have been saved successfully.",
    });
    form.reset();
  };

  const closeImagePreview = () => {
    setSelectedImage(null);
    setSummary(null);
    setDisplayedSummary(null);
    setDetectedObjects([]);
    setCrimeType(null);
  };

  const loading = caseLoading || evidenceLoading;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </div>
          </Link>
          {loading ? (
            <div className="h-7 w-40 bg-muted animate-pulse rounded"></div>
          ) : (
            <h1 className="text-xl font-semibold">{caseData?.title || "Loading case..."}</h1>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          {profile ? (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              U
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className={`w-96 border-r overflow-y-auto flex flex-col ${activeTab === "sources" ? "block" : "hidden md:block"}`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Sources</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSourceType("all")} 
                className={sourceType === "all" ? "bg-accent" : ""}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSourceType("images")}
                className={sourceType === "images" ? "bg-accent" : ""}>
                <Image className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSourceType("documents")}
                className={sourceType === "documents" ? "bg-accent" : ""}>
                <FileText className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-3">
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
              multiple
              onChange={handleFileUpload}
            />
            <label htmlFor="file-upload">
              <Button className="w-full justify-center" size="sm" asChild disabled={isUploading}>
                <span>
                  {isUploading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add source
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
          
          {getTotalSourceCount() === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-muted-foreground">
              <div className="p-3 bg-muted rounded-lg mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="font-medium">Saved sources will appear here</h3>
              <p className="text-sm mt-2 max-w-xs">
                Click Add source above to add images, PDFs, videos, or other evidence files.
              </p>
              
              <div className="mt-8">
                <Input
                  id="empty-file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleFileUpload}
                />
                <label htmlFor="empty-file-upload">
                  <Button variant="outline" className="gap-1" asChild>
                    <span>
                      <UploadCloud className="h-4 w-4 mr-1" />
                      Upload a source
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredSources().map((item) => {
                const isDocument = !item.src || item.type === "document";
                
                return (
                  <div 
                    key={item.id} 
                    className={`relative group rounded-md border overflow-hidden flex items-center p-2 hover:bg-accent cursor-pointer ${selectedImage && selectedImage.id === item.id ? 'bg-accent' : ''}`}
                    onClick={() => !isDocument && handleSelectImage(item as UploadedFile)}
                  >
                    <div className="h-12 w-12 rounded overflow-hidden mr-3 flex-shrink-0 bg-muted flex items-center justify-center">
                      {isDocument ? (
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <img
                          src={item.src}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isDocument ? "Document" : "Image"} • Added {item.date.toLocaleDateString()}
                      </p>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(item.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              
              <div className="pt-3">
                {getTotalSourceCount() > 0 && (
                  <Button 
                    className="w-full" 
                    onClick={analyzeEvidence}
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Generating Case Report...
                      </>
                    ) : (
                      <>
                        <Microscope className="h-4 w-4 mr-2" />
                        Generate Case Report
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center bg-muted/80 rounded-lg p-3">
              <div className="flex-1">
                <p className="text-sm">
                  {getTotalSourceCount() === 0 
                    ? "Upload a source to get started" 
                    : `${getTotalSourceCount()} source${getTotalSourceCount() !== 1 ? 's' : ''} added`
                  }
                </p>
                <p className="text-xs text-muted-foreground">{getImagesCount()} images, {getDocsCount()} documents</p>
              </div>
              <Button size="sm" className="rounded-full w-8 h-8 p-0 flex-shrink-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${activeTab === "chat" ? "block" : "hidden md:block"}`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Chat</h2>
          </div>
          
          <div className="flex-1 flex flex-col p-4 overflow-auto">
            {selectedImage ? (
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
                    <Button variant="ghost" size="icon" onClick={closeImagePreview} title="Close">
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
                        
                        <div className="prose prose-sm">
                          {displayedSummary.split('\n').map((paragraph, i) => (
                            <p key={i} className={i > 0 ? "mt-2" : ""}>{paragraph}</p>
                          ))}
                          {isSummarizing && <span className="animate-pulse">|</span>}
                        </div>
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
            ) : getTotalSourceCount() === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <UploadCloud className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">Add a source to get started</h3>
                <p className="text-sm max-w-md mb-8">
                  Upload evidence images or documents to analyze or generate forensic reports
                </p>
                <Input
                  id="chat-file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleFileUpload}
                />
                <label htmlFor="chat-file-upload">
                  <Button className="gap-1" asChild>
                    <span>
                      <UploadCloud className="h-4 w-4 mr-1" />
                      Upload a source
                    </span>
                  </Button>
                </label>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Ask questions about your evidence</h3>
                <p className="text-sm mt-2 max-w-md">
                  Your evidence has been uploaded. Select an image to analyze it, or generate a full case report.
                </p>
                
                <Button
                  className="mt-8"
                  onClick={analyzeEvidence}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Microscope className="h-4 w-4 mr-2" />
                      Generate Case Report
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className={`w-96 border-l overflow-y-auto flex flex-col ${activeTab === "studio" ? "block" : "hidden md:block"}`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Studio</h2>
            <Button variant="ghost" size="icon">
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="p-4">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center">
                  Forensic Overview
                  <Button variant="ghost" size="icon" className="ml-1 h-6 w-6">
                    <Info className="w-3 h-3" />
                  </Button>
                </h3>
              </div>
              
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Microscope className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Crime Scene Analysis</h4>
                    <p className="text-xs text-muted-foreground">
                      {getTotalSourceCount()} source{getTotalSourceCount() !== 1 ? "s" : ""} uploaded
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button className="justify-start" variant="outline" size="sm">
                    <Customize className="w-4 h-4 mr-2" />
                    Customize
                  </Button>
                  <Button className="justify-start" size="sm" onClick={analyzeEvidence} disabled={analyzing}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Forensic Tools</h3>
              </div>
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-left" size="sm">
                  <Fingerprint className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Fingerprint Analysis</span>
                </Button>
                <Button variant="outline" className="w-full justify-start text-left" size="sm">
                  <Camera className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Image Enhancement</span>
                </Button>
                <Button variant="outline" className="w-full justify-start text-left" size="sm">
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Evidence Report</span>
                </Button>
                <Button variant="outline" className="w-full justify-start text-left" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Pattern Recognition</span>
                </Button>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Notes</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Add note
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Note</DialogTitle>
                      <DialogDescription>
                        Create a new note for this case.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitNotes)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter your notes here..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit">Save Note</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Button variant="outline" className="justify-start text-left" size="sm">
                  <Book className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Evidence guide</span>
                </Button>
                <Button variant="outline" className="justify-start text-left" size="sm">
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Case report</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start text-left" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Key findings</span>
                </Button>
                <Button variant="outline" className="justify-start text-left" size="sm">
                  <Scroll className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Timeline</span>
                </Button>
              </div>

              <div className="mt-12 flex flex-col items-center justify-center p-6 text-center border rounded-lg">
                <div className="p-3 bg-muted rounded-lg mb-3">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="font-medium">Saved notes will appear here</h3>
                <p className="text-xs mt-2 text-muted-foreground">
                  Save a note or insight to create a new note, or click Add note above
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden border-t">
        <div className="grid grid-cols-3 divide-x">
          <button
            className={`flex flex-col items-center py-3 ${activeTab === "sources" ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("sources")}
          >
            <Image className="h-5 w-5 mb-1" />
            <span className="text-xs">Sources</span>
          </button>
          <button
            className={`flex flex-col items-center py-3 ${activeTab === "chat" ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare className="h-5 w-5 mb-1" />
            <span className="text-xs">Chat</span>
          </button>
          <button
            className={`flex flex-col items-center py-3 ${activeTab === "studio" ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("studio")}
          >
            <Microscope className="h-5 w-5 mb-1" />
            <span className="text-xs">Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Customize({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2H2v10h10V2z" />
      <path d="M22 12h-10v10h10V12z" />
      <path d="M12 12H2v10h10V12z" />
      <path d="M22 2h-10v10h10V2z" />
    </svg>
  );
}
