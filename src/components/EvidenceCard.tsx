
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Image, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EvidenceCardProps {
  evidence: {
    id: string;
    name: string;
    type: string;
    path: string;
    created_at: string;
    case_id: string;
    url?: string;
  };
  onDelete: (id: string) => void;
  onView: (evidence: any) => void;
}

export function EvidenceCard({ evidence, onDelete, onView }: EvidenceCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const isImage = evidence.type.startsWith("image/");
  const fileExtension = evidence.name.split(".").pop()?.toLowerCase();
  
  const handleDelete = async () => {
    try {
      setIsLoading(true);
      
      // Delete the file from Supabase Storage
      const { error: storageError } = await supabase
        .storage
        .from('evidence')
        .remove([evidence.path]);
      
      if (storageError) throw storageError;
      
      // Delete the record from the database
      const { error: dbError } = await supabase
        .from('evidence')
        .delete()
        .eq('id', evidence.id);
      
      if (dbError) throw dbError;
      
      onDelete(evidence.id);
      toast.success("Evidence deleted successfully");
    } catch (error: any) {
      console.error("Error deleting evidence:", error);
      toast.error("Failed to delete evidence");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .storage
        .from('evidence')
        .download(evidence.path);
      
      if (error) throw error;
      
      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = evidence.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Evidence downloaded successfully");
    } catch (error: any) {
      console.error("Error downloading evidence:", error);
      toast.error("Failed to download evidence");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = async () => {
    if (isImage) {
      try {
        setIsLoading(true);
        
        // Get URL for the image
        const { data: { publicUrl }, error } = supabase
          .storage
          .from('evidence')
          .getPublicUrl(evidence.path);
        
        if (error) throw error;
        
        setPreviewUrl(publicUrl);
        setIsPreviewOpen(true);
      } catch (error: any) {
        console.error("Error getting preview URL:", error);
        toast.error("Failed to preview image");
      } finally {
        setIsLoading(false);
      }
    } else {
      onView(evidence);
    }
  };

  const getFileIcon = () => {
    if (isImage) return <Image className="h-6 w-6 text-blue-500" />;
    
    switch(fileExtension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-6 w-6 text-blue-600" />;
      case 'txt':
        return <FileText className="h-6 w-6 text-gray-500" />;
      default:
        return <FileText className="h-6 w-6 text-muted-foreground" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="h-40 flex items-center justify-center bg-muted">
          {isImage ? (
            evidence.url ? (
              <img
                src={evidence.url}
                alt={evidence.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <Image className="h-16 w-16 text-muted-foreground opacity-50" />
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center">
              {getFileIcon()}
              <span className="text-xs mt-2 text-muted-foreground uppercase">
                {fileExtension}
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium truncate" title={evidence.name}>{evidence.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Added on {formatDate(evidence.created_at)}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between p-4 pt-0 gap-2">
          <Button variant="outline" size="sm" onClick={handleView} disabled={isLoading}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={handleDownload} disabled={isLoading}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleDelete} disabled={isLoading}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{evidence.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            {previewUrl && (
              <img
                src={previewUrl}
                alt={evidence.name}
                className="max-h-[70vh] max-w-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
