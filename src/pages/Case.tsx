
import { useState } from "react";
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

export default function Case() {
  const { caseId } = useParams();
  const [caseName, setCaseName] = useState(`Case #${caseId?.replace("case-", "")}`);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"sources" | "chat" | "studio">("sources");
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    
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
      }
    });
  };

  const handleDeleteImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
    
    toast({
      title: "Image Deleted",
      description: "The image has been removed from your case.",
    });
  };

  const analyzeEvidence = () => {
    toast({
      title: "Analysis Started",
      description: "Your evidence is being analyzed. This may take a moment.",
    });
    
    // Simulate analysis time
    setTimeout(() => {
      setActiveTab("studio");
      toast({
        title: "Analysis Complete",
        description: "Your evidence has been analyzed. View the results in the Studio tab.",
      });
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Microscope className="w-5 h-5 text-primary" />
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

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sources Panel */}
        <div className={`w-96 border-r overflow-y-auto flex flex-col ${activeTab === "sources" ? "block" : "hidden md:block"}`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Sources</h2>
            <Button variant="ghost" size="icon">
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="p-3">
            <Button className="w-full justify-center" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add source
            </Button>
          </div>
          
          {uploadedImages.length === 0 ? (
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
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload">
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
              {uploadedImages.map((src, index) => (
                <div 
                  key={index} 
                  className="relative group rounded-md border overflow-hidden flex items-center p-2 hover:bg-accent cursor-pointer"
                  onClick={() => {/* Preview image logic */}}
                >
                  <div className="h-12 w-12 rounded overflow-hidden mr-3 flex-shrink-0">
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
                  >
                    <Microscope className="h-4 w-4 mr-2" />
                    Analyze Evidence
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Upload button at the bottom */}
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center bg-muted/80 rounded-lg p-3">
              <div className="flex-1">
                <p className="text-sm">Upload a source to get started</p>
                <p className="text-xs text-muted-foreground">0 sources</p>
              </div>
              <Button size="sm" className="rounded-full w-8 h-8 p-0 flex-shrink-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat/Middle Panel */}
        <div className={`flex-1 flex flex-col ${activeTab === "chat" ? "block" : "hidden md:block"}`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Chat</h2>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            {uploadedImages.length === 0 ? (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <UploadCloud className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">Add a source to get started</h3>
                <p className="text-sm max-w-md mb-8">
                  Upload evidence images to analyze or generate forensic reports
                </p>
                <Input
                  id="chat-file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
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
              </>
            ) : (
              <>
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Ask questions about your evidence</h3>
                <p className="text-sm mt-2 max-w-md">
                  Your evidence has been uploaded. Click "Analyze Evidence" to generate insights or ask specific questions.
                </p>
                
                <Button
                  className="mt-8"
                  onClick={analyzeEvidence}
                >
                  <Microscope className="h-4 w-4 mr-2" />
                  Analyze Evidence
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Studio/Tools Panel */}
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
                      {uploadedImages.length} image{uploadedImages.length !== 1 ? "s" : ""} uploaded
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button className="justify-start" variant="outline" size="sm">
                    <Customize className="w-4 h-4 mr-2" />
                    Customize
                  </Button>
                  <Button className="justify-start" size="sm">
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
              <h3 className="font-medium">Saved notes will appear here</h3>
              <p className="text-xs mt-2 text-muted-foreground">
                Save a note or insight to create a new note, or click Add note above
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

// Component for the Customize button
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
