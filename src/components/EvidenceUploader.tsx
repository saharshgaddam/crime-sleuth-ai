
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, File, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { v4 as uuidv4 } from 'uuid';

interface EvidenceUploaderProps {
  caseId: string;
  onUploadComplete: () => void;
}

export function EvidenceUploader({ caseId, onUploadComplete }: EvidenceUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!files.length || !user) return;
    
    setIsUploading(true);
    setProgress(0);
    
    try {
      const totalFiles = files.length;
      let completed = 0;
      
      for (const file of files) {
        // Generate a unique file name to avoid collisions
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${caseId}/${fileName}`;
        
        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('evidence')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('evidence')
          .getPublicUrl(filePath);
        
        // Store evidence metadata in the database
        const { error: dbError } = await supabase
          .from('evidence')
          .insert({
            name: file.name,
            type: file.type,
            path: filePath,
            case_id: caseId,
            user_id: user._id,
            url: publicUrl
          });
        
        if (dbError) throw dbError;
        
        // Update progress
        completed++;
        setProgress(Math.round((completed / totalFiles) * 100));
      }
      
      toast.success(`Successfully uploaded ${files.length} file${files.length !== 1 ? 's' : ''}`);
      setFiles([]);
      onUploadComplete();
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload one or more files");
    } finally {
      setIsUploading(false);
    }
  };

  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          files.length ? "border-gray-300" : "border-primary/40"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        
        <div className="flex flex-col items-center justify-center space-y-2">
          <UploadCloud className="h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-medium">Drag evidence files here</h3>
          <p className="text-sm text-muted-foreground">
            or click to browse files from your device
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Select files
          </Button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Selected files ({files.length})</h3>
            <div className="max-h-40 overflow-auto space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <div className="flex items-center space-x-2 truncate">
                    {getFileTypeIcon(file)}
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {isUploading && (
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setFiles([])}
              disabled={isUploading}
            >
              Clear all
            </Button>
            <Button onClick={uploadFiles} disabled={!files.length || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload files"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
