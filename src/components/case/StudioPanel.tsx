
import { LayoutGrid, Microscope, Fingerprint, Camera, FileText, BarChart3, MessageSquare, Scroll, Book, Customize, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

type ActiveTab = "sources" | "chat" | "studio";

interface StudioPanelProps {
  activeTab: ActiveTab;
  getTotalSourceCount: () => number;
  uploadedImages: number;
  uploadedDocs: number;
  analyzing: boolean;
  analyzeEvidence: () => void;
}

export default function StudioPanel({ 
  activeTab, 
  getTotalSourceCount,
  uploadedImages,
  uploadedDocs,
  analyzing,
  analyzeEvidence
}: StudioPanelProps) {
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: {
      notes: "",
    },
  });

  const onSubmitNotes = (data: { notes: string }) => {
    toast({
      title: "Notes Saved",
      description: "Your notes have been saved successfully.",
    });
    form.reset();
  };

  return (
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
                  {getTotalSourceCount()} source{getTotalSourceCount() !== 1 ? "s" : ""} uploaded
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button className="justify-start" variant="outline" size="sm">
                <Customize className="w-4 h-4 mr-2" />
                Customize
              </Button>
              <Button className="justify-start" size="sm" onClick={analyzeEvidence} disabled={analyzing}>
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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add note
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Note</DialogTitle>
                  <DialogDescription>
                    Create a new note for this case.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitNotes)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter your notes here..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">Save Note</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
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
  );
}

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
