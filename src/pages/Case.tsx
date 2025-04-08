
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
import { supabase } from "@/integrations/supabase/client";

type UploadedImage = {
  id: string;
  src: string;
  name: string;
  date: Date;
  type?: "image"; // Add optional type property
};

type UploadedDocument = {
  id: string;
  name: string;
  type: string;
  date: Date;
};

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
  const [caseName, setCaseName] = useState(`Case #${caseId?.replace("case-", "")}`);
  const [description, setDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("sources");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>("all");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [summary, setSummary] = useState<string | null>(null);
  const [displayedSummary, setDisplayedSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [crimeType, setCrimeType] = useState<string | null>(null);
  const { toast } = useToast();
  
  const FLASK_API_URL = import.meta.env.VITE_FLASK_API_URL || 'https://mockapi.io/api/v1';

  // Character-by-character text display effect
  useEffect(() => {
    if (summary && summary !== displayedSummary) {
      let currentIndex = 0;
      const fullText = summary;
      
      // Reset displayed summary if it's a new summary
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
      }, 10); // Speed of character display
      
      return () => clearInterval(interval);
    }
  }, [summary, displayedSummary]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const docTypes = ['application/pdf', 'text/plain', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    try {
      const newImages: UploadedImage[] = [];
      const newDocs: UploadedDocument[] = [];
      
      for (const file of Array.from(files)) {
        if (imageTypes.includes(file.type)) {
          const result = await readFileAsDataURL(file);
          newImages.push({
            id: generateId(),
            src: result,
            name: file.name,
            date: new Date()
          });
        } else if (docTypes.includes(file.type)) {
          newDocs.push({
            id: generateId(),
            name: file.name,
            type: file.type,
            date: new Date()
          });
        }
      }
      
      if (newImages.length > 0) {
        setUploadedImages(prev => [...prev, ...newImages]);
      }
      
      if (newDocs.length > 0) {
        setUploadedDocs(prev => [...prev, ...newDocs]);
      }
      
      const totalFiles = newImages.length + newDocs.length;
      if (totalFiles > 0) {
        toast({
          title: "Upload Successful",
          description: `Uploaded ${totalFiles} file${totalFiles !== 1 ? 's' : ''}.`,
        });
      } else {
        toast({
          title: "No valid files",
          description: "Please upload images or documents.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Upload Failed",
        description: "There was a problem uploading your files.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result.toString());
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleDeleteImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
    
    if (selectedImage && selectedImage.id === id) {
      setSelectedImage(null);
      setSummary(null);
      setDisplayedSummary(null);
      setDetectedObjects([]);
      setCrimeType(null);
    }
    
    toast({
      title: "Image Deleted",
      description: "The image has been removed from your case.",
    });
  };

  const handleDeleteDocument = (id: string) => {
    setUploadedDocs(prev => prev.filter(doc => doc.id !== id));
    
    toast({
      title: "Document Deleted",
      description: "The document has been removed from your case.",
    });
  };

  const handleSelectImage = (image: UploadedImage) => {
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
        setDisplayedSummary(""); // Reset for character-by-character display
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

  // Simulated data for mock response
  const mockCrimeTypes = ["Theft", "Vandalism", "Assault", "Fraud", "Breaking and Entering"];
  const mockObjects = [
    ["knife", "blood spatter", "broken window", "footprints"],
    ["graffiti", "spray paint can", "wall damage", "fingerprints"],
    ["car", "damaged bumper", "skid marks", "broken glass"],
    ["weapon", "bullet casings", "blood", "torn clothing"],
    ["computer", "documents", "signature forgery", "ID cards"]
  ];
  const mockSummaries = [
    "The image shows a potential crime scene with several key pieces of evidence. There appears to be blood spatter pattern consistent with a medium-velocity impact. The distribution suggests the victim was standing approximately 4-5 feet from the attacker. A knife is visible in the lower portion of the image, likely the weapon used in this incident. The broken window indicates a possible point of entry, and distinct footprint patterns suggest the perpetrator wore size 11 boots with a specific tread pattern that could be matched to a suspect's footwear. The scene appears to have been disturbed after the initial incident, potentially by the perpetrator searching for valuables or attempting to clean up evidence.",
    "The image displays extensive vandalism with graffiti covering approximately 70% of the visible wall. The style and tag signatures are consistent with known gang markings in the area. Spray paint analysis suggests the use of industrial-grade aerosol paint commonly available at hardware stores. Several fingerprints are visible on the adjacent surfaces, likely left when the perpetrator was unpacking or changing paint canisters. The wall damage extends beyond superficial paint and includes structural damage to the brick mortar, elevating this from simple graffiti to property destruction. The time of incident can be estimated between 8-12 hours before the image was captured based on the drying patterns of the paint.",
    "The image shows a vehicle involved in what appears to be a collision incident. The car exhibits significant damage to the front bumper consistent with a medium-velocity impact with a stationary object, possibly a pole or barrier. Broken glass fragments suggest the headlight assembly shattered on impact. The skid marks visible on the pavement indicate the driver attempted emergency braking before collision, with an estimated speed of 30-40 mph based on the length and pattern of the marks. Paint transfer visible on the damaged sections appears inconsistent with a single-vehicle accident, suggesting potential involvement of another vehicle that left the scene. The angle of impact and damage pattern is consistent with driver impairment or evasive action.",
    "The image depicts what appears to be the aftermath of a violent altercation. A weapon (likely a small-caliber handgun) is visible in the frame, alongside multiple bullet casings indicating at least 3-4 shots were fired. Blood spatter patterns suggest the victim was initially standing before falling to the ground. The torn clothing articles show signs of struggle before the shooting occurred. The evidence suggests this was not a random act but a targeted confrontation. The position of evidence items indicates the altercation moved across the room from east to west, with the victim retreating before the shooting. The perpetrator appears to have stayed at the scene for several minutes after the incident based on disturbance patterns in the blood pools.",
    "The image shows evidence of sophisticated identity fraud operations. Multiple forged identification cards are visible, showing consistent production methods indicating a single creator. The computer visible appears to be running specialized software typically used for document reproduction. The quality of the forgeries is exceptional, suggesting professional-grade equipment was used. Document examination reveals watermark attempts and holographic overlays consistent with current identity document security features. The signature forgeries show evidence of practice and refinement, suggesting the perpetrator spent considerable time perfecting their technique. The arrangement of materials indicates an organized operation rather than an opportunistic attempt."
  ];

  const generateSummary = async () => {
    if (!selectedImage || !caseId) return;
    
    setIsSummarizing(true);
    setSummary(null);
    setDisplayedSummary("Analyzing image...");
    setDetectedObjects([]);
    setCrimeType(null);
    
    try {
      console.log("Starting summary generation process...");
      
      const exists = await checkExistingSummary(selectedImage.id);
      
      if (!exists) {
        console.log("No existing summary found, generating new one...");

        // Simulate API call with a delay for realism
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate mock response
        const randomIndex = Math.floor(Math.random() * mockCrimeTypes.length);
        const mockResponse = {
          case_id: caseId,
          image_id: selectedImage.id,
          crime_type: mockCrimeTypes[randomIndex],
          objects_detected: mockObjects[randomIndex],
          summary: mockSummaries[randomIndex]
        };
        
        console.log("Summary generated successfully:", mockResponse);
        
        // Store the mock response in Supabase
        try {
          const { data: summaryData, error: summaryError } = await supabase
            .from('forensic_summaries')
            .upsert({
              case_id: caseId,
              image_id: selectedImage.id,
              crime_type: mockResponse.crime_type,
              objects_detected: mockResponse.objects_detected,
              summary: mockResponse.summary,
              created_at: new Date().toISOString(),
            })
            .select();
            
          if (summaryError) {
            console.error("Error storing mock summary in Supabase:", summaryError);
          } else {
            console.log("Successfully stored mock summary in Supabase");
          }
        } catch (dbError) {
          console.error("Failed to store mock data in Supabase:", dbError);
        }
        
        setSummary(mockResponse.summary);
        setDetectedObjects(mockResponse.objects_detected || []);
        setCrimeType(mockResponse.crime_type);
      } else {
        console.log("Using existing summary from database");
      }
      
      toast({
        title: "Summary Generated",
        description: "The image has been successfully analyzed.",
      });
    } catch (error) {
      console.error("Error in generateSummary:", error);
      toast({
        title: "Summary Failed",
        description: "There was a problem analyzing this image. Check the console for details.",
        variant: "destructive"
      });
      setSummary(`Failed to generate summary. Please ensure the Flask API server is running at ${FLASK_API_URL}`);
      setDisplayedSummary(`Failed to generate summary. Please ensure the Flask API server is running at ${FLASK_API_URL}`);
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
        // Generate mock report
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const mockReport = `# Forensic Analysis Report for Case #${caseId.replace("case-", "")}
        
## Executive Summary
This report details the forensic analysis of ${uploadedImages.length} images and ${uploadedDocs.length} documents related to case #${caseId.replace("case-", "")}. The evidence suggests a ${mockCrimeTypes[Math.floor(Math.random() * mockCrimeTypes.length)]} incident occurred with multiple pieces of supporting evidence.

## Evidence Analysis
${uploadedImages.map((img, i) => `Image ${i+1}: ${img.name} - Contains evidence of ${mockObjects[i % mockObjects.length].join(", ")}`).join("\n")}

## Conclusion
Based on the forensic analysis conducted, there is substantial evidence to support further investigation into this incident. Additional analysis may be required for conclusive determination.`;
        
        // Store mock report in Supabase
        try {
          const { data, error } = await supabase
            .from('forensic_reports')
            .upsert({
              case_id: caseId,
              report: mockReport,
              created_at: new Date().toISOString(),
            })
            .select();
            
          if (error) {
            console.error("Error storing mock report in Supabase:", error);
          } else {
            console.log("Successfully stored mock report in Supabase");
          }
        } catch (dbError) {
          console.error("Failed to store mock report in Supabase:", dbError);
        }
        
        reportData = { report: mockReport };
      }
      
      toast({
        title: "Case Report Generated",
        description: "Your complete case report has been generated successfully.",
      });
      
      console.log("Case report:", reportData.report);
    } catch (error) {
      console.error("Error generating case report:", error);
      toast({
        title: "Report Generation Failed",
        description: "There was a problem generating the case report.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeEvidence = () => {
    const totalSources = uploadedImages.length + uploadedDocs.length;
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
    if (sourceType === "images") return uploadedImages;
    if (sourceType === "documents") return uploadedDocs.map(doc => ({
      id: doc.id,
      src: "",
      name: doc.name,
      date: doc.date,
      type: "document" as const
    }));
    
    const images = uploadedImages.map(img => ({ ...img, type: "image" as const }));
    const docs = uploadedDocs.map(doc => ({ 
      id: doc.id, 
      src: "", 
      name: doc.name, 
      date: doc.date, 
      type: "document" as const
    }));
    
    return [...images, ...docs].sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const getTotalSourceCount = () => {
    return uploadedImages.length + uploadedDocs.length;
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

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </div>
          </Link>
          <h1 className="text-xl font-semibold">{caseName}</h1>
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
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
            U
          </div>
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
                    onClick={() => !isDocument && handleSelectImage(item as UploadedImage)}
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
                        isDocument ? handleDeleteDocument(item.id) : handleDeleteImage(item.id);
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
                <p className="text-xs text-muted-foreground">{uploadedImages.length} images, {uploadedDocs.length} documents</p>
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
                          Summarizing...
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="h-4 w-4" />
                          Summarize
                        </>
                      )}
                    </Button>
                  </div>
                  
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
                      <p className="text-xs mt-1">Click the Summarize button above to analyze this evidence</p>
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
