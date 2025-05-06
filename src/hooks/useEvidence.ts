
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

export interface Evidence {
  id: string;
  case_id: string;
  user_id: string;
  name: string;
  type: string;
  description: string | null;
  file_path: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  src?: string;
  type: "image" | "document";
  date: Date;
}

export const useEvidence = (caseId: string | undefined) => {
  const [evidenceItems, setEvidenceItems] = useState<Evidence[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Fetch evidence from Supabase when caseId changes
  useEffect(() => {
    const fetchEvidence = async () => {
      if (!caseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('evidence')
          .select('*')
          .eq('case_id', caseId);
          
        if (error) throw error;
        
        setEvidenceItems(data || []);
        
        // Transform evidence items to uploadedFiles format
        const files = await Promise.all((data || []).map(async (item) => {
          // For images, fetch the actual file from storage
          if (item.type.startsWith('image/') && item.file_path) {
            try {
              // Get the public URL for display
              const { data: urlData } = await supabase.storage
                .from('evidence')
                .getPublicUrl(item.file_path);
                
              return {
                id: item.id,
                name: item.name,
                src: urlData.publicUrl,
                type: "image" as const,
                date: new Date(item.created_at)
              };
            } catch (err) {
              console.error(`Error fetching image ${item.id}:`, err);
              return null;
            }
          } else {
            // For documents
            return {
              id: item.id,
              name: item.name,
              type: "document" as const,
              date: new Date(item.created_at)
            };
          }
        }));
        
        setUploadedFiles(files.filter(Boolean) as UploadedFile[]);
      } catch (err: any) {
        console.error("Error fetching evidence:", err);
        toast({
          variant: "destructive",
          title: "Error loading evidence",
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvidence();
  }, [caseId, toast]);

  const uploadFile = async (file: File, name: string, description: string | null = null) => {
    if (!caseId) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "No case selected for upload",
      });
      return null;
    }

    try {
      setUploading(true);
      
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${caseId}/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL for the uploaded file
      const { data: urlData } = await supabase.storage
        .from('evidence')
        .getPublicUrl(filePath);
      
      // Create evidence record in the database
      const { data: evidence, error: insertError } = await supabase
        .from('evidence')
        .insert({
          case_id: caseId,
          name: name,
          description: description,
          type: file.type,
          file_path: filePath,
          url: urlData.publicUrl
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Add to local state
      if (evidence) {
        setEvidenceItems(prev => [...prev, evidence]);
        
        const newFile: UploadedFile = {
          id: evidence.id,
          name: evidence.name,
          type: file.type.startsWith('image/') ? "image" : "document",
          date: new Date()
        };
        
        if (newFile.type === "image") {
          newFile.src = urlData.publicUrl;
        }
        
        setUploadedFiles(prev => [...prev, newFile]);
      }
      
      toast({
        title: "Evidence Uploaded",
        description: "File has been successfully uploaded.",
      });
      
      return evidence;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload evidence",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteEvidence = async (id: string) => {
    try {
      // Find the evidence item to delete
      const itemToDelete = evidenceItems.find(item => item.id === id);
      
      if (!itemToDelete) {
        throw new Error("Evidence item not found");
      }
      
      // If there's a file path, delete from storage
      if (itemToDelete.file_path) {
        const { error: storageError } = await supabase.storage
          .from('evidence')
          .remove([itemToDelete.file_path]);
          
        if (storageError) {
          console.error("Error deleting from storage:", storageError);
          // Continue with deletion anyway
        }
      }
      
      // Delete the evidence record
      const { error } = await supabase
        .from('evidence')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setEvidenceItems(prev => prev.filter(item => item.id !== id));
      setUploadedFiles(prev => prev.filter(file => file.id !== id));
      
      toast({
        title: "Evidence Deleted",
        description: "The evidence has been removed from your case.",
      });
      
      return true;
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete evidence",
      });
      return false;
    }
  };

  return { 
    evidenceItems, 
    uploadedFiles, 
    loading, 
    uploading, 
    uploadFile,
    deleteEvidence
  };
};
