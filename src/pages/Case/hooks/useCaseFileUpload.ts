
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type UploadedImage = {
  id: string;
  src: string;
  name: string;
  date: Date;
};

interface UseCaseFileUploadProps {
  setUploadedImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  setUploadedDocs: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedImage: React.Dispatch<React.SetStateAction<UploadedImage | null>>;
}

export function useCaseFileUpload({ 
  setUploadedImages, 
  setUploadedDocs, 
  setSelectedImage 
}: UseCaseFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const docTypes = ['application/pdf', 'text/plain', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    try {
      const newImages: UploadedImage[] = [];
      const newDocs: any[] = [];
      
      for (const file of Array.from(files)) {
        if (imageTypes.includes(file.type)) {
          const result = await readFileAsDataURL(file);
          const newImage = {
            id: generateId(),
            src: result,
            name: file.name,
            date: new Date()
          };
          newImages.push(newImage);
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
        // Select the first uploaded image
        if (newImages[0]) {
          setSelectedImage(newImages[0]);
        }
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

  return {
    isUploading,
    handleFileUpload
  };
}
