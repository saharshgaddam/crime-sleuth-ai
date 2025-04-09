
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type SourceType = "all" | "images" | "documents";
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

export function useCaseData() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [sourceType, setSourceType] = useState<SourceType>("all");
  const { toast } = useToast();

  const handleDeleteImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
    
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

  return {
    uploadedImages,
    setUploadedImages,
    uploadedDocs,
    setUploadedDocs,
    sourceType,
    setSourceType,
    handleDeleteImage,
    handleDeleteDocument,
    filteredSources
  };
}
