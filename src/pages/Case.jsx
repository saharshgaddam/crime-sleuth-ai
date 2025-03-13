
import React, { useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Image,
  FileText,
  Microscope,
  Fingerprint,
  Trash2,
  Camera,
  BarChart3,
  Eye,
  Share,
  Settings,
  UploadCloud,
  Plus,
  ChevronRight,
  MessageSquare,
  Book,
  Scroll,
  LayoutGrid,
  Info,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";

export default function Case() {
  const { caseId } = useParams();
  const [caseName, setCaseName] = useState(`Case #${caseId?.replace("case-", "")}`);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState("sources");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result.toString());
            
            // If this is the last file, update state
            if (newImages.length === files.length) {
              setUploadedImages([...uploadedImages, ...newImages]);
              toast({
                title: "Upload Successful",
                description: `Uploaded ${files.length} image${files.length !== 1 ? "s" : ""}.`,
              });
            }
          }
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Only image files are supported at this time.",
          variant: "destructive",
        });
      }
    });
    
    // Clear the input value to allow uploading the same file again
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleDeleteImage = (index) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
    
    toast({
      title: "Image Deleted",
      description: "The image has been removed from your case.",
    });
    
    if (selectedImage === uploadedImages[index]) {
      setSelectedImage(null);
    }
  };

  const analyzeEvidence = () => {
    setIsAnalyzing(true);
    toast({
      title: "Analysis Started",
      description: "Your evidence is being analyzed. This may take a moment.",
    });
    
    // Simulate analysis time
    setTimeout(() => {
      setIsAnalyzing(false);
      if (!isMobile) {
        setActiveTab("studio");
      }
      toast({
        title: "Analysis Complete",
        description: "Your evidence has been analyzed. View the results in the Studio tab.",
      });
    }, 2000);
  };

  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">{caseName}</h1>
            <Button variant="ghost" size="sm" className="ml-2" onClick={() => {
              const newName = prompt("Enter new case name:", caseName);
              if (newName) setCaseName(newName);
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share this case</DialogTitle>
                <DialogDescription>
                  Invite others to collaborate on this forensic investigation.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Input placeholder="Enter email address" />
                  <Button size="sm" className="w-full">Send invitation</Button>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Share link</p>
                  <div className="flex items-center gap-2">
                    <Input value={window.location.href} readOnly />
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({
                        title: "Link copied",
                        description: "Case link copied to clipboard.",
                      });
                    }}>
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sources Panel */}
        <div className={`w-96 border-r overflow-y-auto flex flex-col ${activeTab === "sources" ? "block" : "hidden md:block"}`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Evidence Images</h2>
            <Button variant="ghost" size="icon">
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="p-3">
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button 
              className="w-full justify-center" 
              size="sm"
              onClick={triggerFileUpload}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add images
            </Button>
          </div>
          
          {uploadedImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-muted-foreground">
              <div className="p-6 bg-muted/50 rounded-lg mb-6">
                <FileUp className="w-12 h-12" />
              </div>
              <h3 className="font-medium text-lg">Upload evidence images</h3>
              <p className="text-sm mt-2 max-w-xs mb-8">
                Upload images from the crime scene or other evidence to analyze patterns and generate insights.
              </p>
              
              <Button variant="default" className="gap-1" onClick={triggerFileUpload}>
                <UploadCloud className="h-4 w-4 mr-1" />
                Upload images
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {uploadedImages.map((src, index) => (
                <div 
                  key={index} 
                  className={`relative group rounded-md border overflow-hidden flex items-center p-2 hover:bg-accent cursor-pointer ${selectedImage === src ? 'bg-accent/60' : ''}`}
                  onClick={() => handleImageClick(src)}
                >
                  <div className="h-16 w-16 rounded overflow-hidden mr-3 flex-shrink-0">
                    <img
                      src={src}
                      alt={`Evidence ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">Evidence image {index + 1}</p>
                    <p className="text-xs text-muted-foreground">Image • Added {new Date().toLocaleDateString()}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(index);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="pt-3">
                {uploadedImages.length > 0 && (
                  <Button 
                    className="w-full" 
                    onClick={analyzeEvidence}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Microscope className="h-4 w-4 mr-2" />
                        Analyze Evidence
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Upload button at the bottom */}
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center bg-muted/50 rounded-lg p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">Evidence summary</p>
                <p className="text-xs text-muted-foreground">{uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''}</p>
              </div>
              <Button size="sm" className="rounded-full w-8 h-8 p-0 flex-shrink-0" onClick={triggerFileUpload}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat/Middle Panel */}
        <div className={`flex-1 flex flex-col ${activeTab === "chat" ? "block" : "hidden md:block"}`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Image Preview</h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-card/40">
            {uploadedImages.length === 0 ? (
              <div className="text-center max-w-md">
                <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No images to display</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Upload evidence images from the Sources panel to view and analyze them here.
                </p>
                <Button onClick={triggerFileUpload}>
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Upload images
                </Button>
              </div>
            ) : selectedImage ? (
              <div className="flex flex-col w-full max-w-3xl h-full">
                <div className="relative flex-1 flex items-center justify-center bg-black/5 rounded-lg overflow-hidden">
                  <img 
                    src={selectedImage} 
                    alt="Selected evidence" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                
                <div className="mt-4 flex justify-between">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate report
                  </Button>
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Enhance image
                  </Button>
                  <Button variant="default" size="sm" onClick={analyzeEvidence} disabled={isAnalyzing}>
                    {isAnalyzing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Microscope className="h-4 w-4 mr-2" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Select an image to analyze</h3>
                <p className="text-sm mt-2 max-w-md text-muted-foreground">
                  Click on any image in the Evidence Images panel to view and analyze it.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Studio/Tools Panel */}
        <div className={`w-96 border-l overflow-y-auto flex flex-col ${activeTab === "studio" ? "block" : "hidden md:block"}`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Forensic Tools</h2>
            <Button variant="ghost" size="icon">
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="p-4">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center">
                  Image Analysis
                  <Button variant="ghost" size="icon" className="ml-1 h-6 w-6">
                    <Info className="w-3 h-3" />
                  </Button>
                </h3>
              </div>
              
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Microscope className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Crime Scene Analysis</h4>
                      <p className="text-xs text-muted-foreground">
                        {uploadedImages.length} image{uploadedImages.length !== 1 ? "s" : ""} available
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="justify-start" variant="outline" size="sm">
                      <Customize className="w-4 h-4 mr-2" />
                      Options
                    </Button>
                    <Button className="justify-start" size="sm" disabled={uploadedImages.length === 0 || isAnalyzing} onClick={analyzeEvidence}>
                      {isAnalyzing ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analyze
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Tools</h3>
              </div>
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-left" size="sm" disabled={uploadedImages.length === 0}>
                  <Fingerprint className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Fingerprint Detection</span>
                </Button>
                <Button variant="outline" className="w-full justify-start text-left" size="sm" disabled={uploadedImages.length === 0}>
                  <Camera className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Image Enhancement</span>
                </Button>
                <Button variant="outline" className="w-full justify-start text-left" size="sm" disabled={uploadedImages.length === 0}>
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Evidence Report</span>
                </Button>
                <Button variant="outline" className="w-full justify-start text-left" size="sm" disabled={uploadedImages.length === 0}>
                  <BarChart3 className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Pattern Recognition</span>
                </Button>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Analysis Notes</h3>
                <Button variant="ghost" size="sm" className="h-7 gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add note
                </Button>
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
            </div>
            
            <div className="mt-12 flex flex-col items-center justify-center p-6 text-center border rounded-lg">
              <div className="p-3 bg-muted rounded-lg mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="font-medium">Analysis results will appear here</h3>
              <p className="text-xs mt-2 text-muted-foreground">
                Click "Analyze" on an evidence image to generate insights and analysis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t">
        <div className="grid grid-cols-3 divide-x">
          <button
            className={`flex flex-col items-center py-3 ${activeTab === "sources" ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("sources")}
          >
            <Image className="h-5 w-5 mb-1" />
            <span className="text-xs">Images</span>
          </button>
          <button
            className={`flex flex-col items-center py-3 ${activeTab === "chat" ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("chat")}
          >
            <Eye className="h-5 w-5 mb-1" />
            <span className="text-xs">Preview</span>
          </button>
          <button
            className={`flex flex-col items-center py-3 ${activeTab === "studio" ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("studio")}
          >
            <Microscope className="h-5 w-5 mb-1" />
            <span className="text-xs">Tools</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Component for the Customize button
function Customize({ className }) {
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
