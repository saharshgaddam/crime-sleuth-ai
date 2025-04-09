
import { useState, useCallback, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Share,
  Settings,
  Upload,
  Plus,
  LayoutGrid,
  Loader,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import API from "@/services/api";
import SourcesPanel from "@/components/case/SourcesPanel";
import ImageAnalysisPanel from "@/components/case/ImageAnalysisPanel";
import StudioPanel from "@/components/case/StudioPanel";
import MobileNavigation from "@/components/case/MobileNavigation";

type UploadedImage = {
  id: string;
  src: string;
  name: string;
  date: Date;
  type?: "image";
};

type UploadedDocument = {
  id: string;
  name: string;
  type: string;
  date: Date;
};

type SourceType = "all" | "images" | "documents";
type ActiveTab = "sources" | "chat" | "studio";

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
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { toast } = useToast();
  
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
  };

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

  const closeImagePreview = () => {
    setSelectedImage(null);
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
        <SourcesPanel 
          activeTab={activeTab}
          sourceType={sourceType}
          setSourceType={setSourceType}
          isUploading={isUploading}
          handleFileUpload={handleFileUpload}
          filteredSources={filteredSources()}
          selectedImage={selectedImage}
          handleSelectImage={handleSelectImage}
          handleDeleteImage={handleDeleteImage}
          handleDeleteDocument={handleDeleteDocument}
          getTotalSourceCount={getTotalSourceCount}
          analyzing={analyzing}
          analyzeEvidence={analyzeEvidence}
          uploadedImages={uploadedImages}
          uploadedDocs={uploadedDocs}
        />

        <ImageAnalysisPanel 
          activeTab={activeTab}
          selectedImage={selectedImage}
          closeImagePreview={closeImagePreview}
          caseId={caseId}
          getTotalSourceCount={getTotalSourceCount}
          analyzeEvidence={analyzeEvidence}
          analyzing={analyzing}
          connectionError={connectionError}
          setConnectionError={setConnectionError}
          handleFileUpload={handleFileUpload}
        />

        <StudioPanel 
          activeTab={activeTab}
          getTotalSourceCount={getTotalSourceCount}
          uploadedImages={uploadedImages.length}
          uploadedDocs={uploadedDocs.length}
          analyzing={analyzing}
          analyzeEvidence={analyzeEvidence}
        />
      </div>

      <MobileNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
