
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Share, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import API from "@/services/api";
import SourcesPanel from "@/components/case/SourcesPanel";
import ImageAnalysisPanel from "@/components/case/ImageAnalysisPanel";
import StudioPanel from "@/components/case/StudioPanel";
import MobileNavigation from "@/components/case/MobileNavigation";
import { useCaseData } from "./hooks/useCaseData";
import { useCaseAnalytics } from "./hooks/useCaseAnalytics";
import { useCaseFileUpload } from "./hooks/useCaseFileUpload";

export default function Case() {
  const { caseId } = useParams();
  const [caseName, setCaseName] = useState(`Case #${caseId?.replace("case-", "")}`);
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState("sources");
  const [selectedImage, setSelectedImage] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const { 
    uploadedImages, 
    uploadedDocs, 
    handleDeleteImage, 
    handleDeleteDocument,
    filteredSources,
    sourceType,
    setSourceType
  } = useCaseData();

  const {
    analyzing,
    setAnalyzing,
    generateCaseReport
  } = useCaseAnalytics(caseId);

  const {
    isUploading,
    handleFileUpload
  } = useCaseFileUpload(setSelectedImage);

  const getTotalSourceCount = () => {
    return uploadedImages.length + uploadedDocs.length;
  };

  const handleSelectImage = (image) => {
    setSelectedImage(image);
    setActiveTab("chat");
  };

  const closeImagePreview = () => {
    setSelectedImage(null);
  };

  const analyzeEvidence = () => {
    const totalSources = getTotalSourceCount();
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
          filteredSources={filteredSources}
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
