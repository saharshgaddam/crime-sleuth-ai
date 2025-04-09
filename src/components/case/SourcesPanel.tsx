
import { LayoutGrid, Image, FileText, Trash2, Plus, Loader, ChevronRight, UploadCloud, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UploadedImage = {
  id: string;
  src: string;
  name: string;
  date: Date;
  type?: "image";
};

type SourceType = "all" | "images" | "documents";
type ActiveTab = "sources" | "chat" | "studio";

interface SourcesPanelProps {
  activeTab: ActiveTab;
  sourceType: SourceType;
  setSourceType: (type: SourceType) => void;
  isUploading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filteredSources: any[];
  selectedImage: UploadedImage | null;
  handleSelectImage: (image: UploadedImage) => void;
  handleDeleteImage: (id: string) => void;
  handleDeleteDocument: (id: string) => void;
  getTotalSourceCount: () => number;
  analyzing: boolean;
  analyzeEvidence: () => void;
  uploadedImages: UploadedImage[];
  uploadedDocs: any[];
}

export default function SourcesPanel({
  activeTab,
  sourceType,
  setSourceType,
  isUploading,
  handleFileUpload,
  filteredSources,
  selectedImage,
  handleSelectImage,
  handleDeleteImage,
  handleDeleteDocument,
  getTotalSourceCount,
  analyzing,
  analyzeEvidence,
  uploadedImages,
  uploadedDocs
}: SourcesPanelProps) {
  return (
    <div className={`w-96 border-r overflow-y-auto flex flex-col ${activeTab === "sources" ? "block" : "hidden md:block"}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">Sources</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSourceType("all")} 
            className={sourceType === "all" ? "bg-accent" : ""}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSourceType("images")}
            className={sourceType === "images" ? "bg-accent" : ""}>
            <Image className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSourceType("documents")}
            className={sourceType === "documents" ? "bg-accent" : ""}>
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-3">
        <Input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
          multiple
          onChange={handleFileUpload}
        />
        <label htmlFor="file-upload">
          <Button className="w-full justify-center" size="sm" asChild disabled={isUploading}>
            <span>
              {isUploading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add source
                </>
              )}
            </span>
          </Button>
        </label>
      </div>
      
      {getTotalSourceCount() === 0 ? (
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
              id="empty-file-upload"
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
              multiple
              onChange={handleFileUpload}
            />
            <label htmlFor="empty-file-upload">
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
          {filteredSources.map((item) => {
            const isDocument = !item.src || item.type === "document";
            
            return (
              <div 
                key={item.id} 
                className={`relative group rounded-md border overflow-hidden flex items-center p-2 hover:bg-accent cursor-pointer ${selectedImage && selectedImage.id === item.id ? 'bg-accent' : ''}`}
                onClick={() => !isDocument && handleSelectImage(item as UploadedImage)}
              >
                <div className="h-12 w-12 rounded overflow-hidden mr-3 flex-shrink-0 bg-muted flex items-center justify-center">
                  {isDocument ? (
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <img
                      src={item.src}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {isDocument ? "Document" : "Image"} • Added {item.date.toLocaleDateString()}
                  </p>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    isDocument ? handleDeleteDocument(item.id) : handleDeleteImage(item.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          
          <div className="pt-3">
            {getTotalSourceCount() > 0 && (
              <Button 
                className="w-full" 
                onClick={analyzeEvidence}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Generating Case Report...
                  </>
                ) : (
                  <>
                    <Microscope className="h-4 w-4 mr-2" />
                    Generate Case Report
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-auto p-4 border-t">
        <div className="flex items-center bg-muted/80 rounded-lg p-3">
          <div className="flex-1">
            <p className="text-sm">
              {getTotalSourceCount() === 0 
                ? "Upload a source to get started" 
                : `${getTotalSourceCount()} source${getTotalSourceCount() !== 1 ? 's' : ''} added`
              }
            </p>
            <p className="text-xs text-muted-foreground">{uploadedImages.length} images, {uploadedDocs.length} documents</p>
          </div>
          <Button size="sm" className="rounded-full w-8 h-8 p-0 flex-shrink-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
