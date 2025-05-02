
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Image, FileText, Eye, Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MarkdownSummary } from "./MarkdownSummary";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface EvidenceCardProps {
  evidence: {
    id: string;
    name: string;
    type: string;
    description?: string | null;
    file_path?: string | null;
    url?: string | null;
    created_at: string;
    case_id: string;
  };
  onDelete: (id: string) => void;
  summary?: {
    image_id: string;
    summary: string | null;
    crime_type: string | null;
    objects_detected: string[] | null;
  } | null;
}

export function EvidenceCard({ evidence, onDelete, summary }: EvidenceCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // First delete the file from storage if it exists
      if (evidence.file_path) {
        const { error: storageError } = await supabase.storage
          .from('evidence')
          .remove([evidence.file_path]);
        
        if (storageError) throw storageError;
      }
      
      // Then delete the evidence record
      onDelete(evidence.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete evidence');
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!evidence.file_path) {
      toast.error('No file available to download');
      return;
    }
    
    try {
      setIsDownloading(true);
      
      const { data, error } = await supabase.storage
        .from('evidence')
        .download(evidence.file_path);
      
      if (error) throw error;
      
      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = evidence.name;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('File downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewImage = async () => {
    if (!evidence.file_path || !evidence.type.startsWith('image/')) {
      toast.error('No image available to view');
      return;
    }
    
    try {
      // Get public URL for image
      const { data, error } = await supabase.storage
        .from('evidence')
        .createSignedUrl(evidence.file_path, 3600); // 1 hour expiry
      
      if (error) throw error;
      
      setImageUrl(data.signedUrl);
      setIsDialogOpen(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load image');
    }
  };

  const isImage = evidence.type.startsWith('image/');
  const timeAgo = formatDistanceToNow(new Date(evidence.created_at), { addSuffix: true });

  return (
    <>
      <Card className="w-full h-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="truncate">{evidence.name}</CardTitle>
            <Badge variant="outline">{isImage ? 'Image' : 'Document'}</Badge>
          </div>
          {evidence.description && (
            <CardDescription className="line-clamp-2">{evidence.description}</CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isImage && evidence.url && (
            <div 
              className="relative aspect-video bg-muted rounded-md overflow-hidden"
              onClick={handleViewImage}
            >
              <img 
                src={evidence.url} 
                alt={evidence.name}
                className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
              />
              <Eye className="absolute bottom-2 right-2 h-5 w-5 text-white bg-black/50 p-1 rounded-full" />
            </div>
          )}
          
          {!isImage && (
            <div className="flex items-center justify-center h-32 bg-muted rounded-md">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          {summary && (
            <div className="mt-4">
              <MarkdownSummary 
                summary={summary.summary} 
                crimeType={summary.crime_type}
                objects={summary.objects_detected}
              />
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Added {timeAgo}</span>
          
          <div className="flex gap-2">
            {evidence.file_path && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{evidence.name}</DialogTitle>
          </DialogHeader>
          
          {imageUrl && (
            <div className="flex justify-center">
              <img 
                src={imageUrl} 
                alt={evidence.name}
                className="max-h-[70vh] object-contain rounded-md"
              />
            </div>
          )}
          
          {summary && (
            <div className="mt-4">
              <MarkdownSummary 
                summary={summary.summary} 
                crimeType={summary.crime_type}
                objects={summary.objects_detected}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
