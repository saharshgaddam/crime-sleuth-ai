
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Fingerprint,
  FolderPlus,
  Search,
  FileText,
  Clock,
  Filter,
  ArrowUp,
  ArrowDown,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UserDropdown } from "@/components/UserDropdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

// Define the case type
interface Case {
  id: string;
  title: string;
  date: string;
  status: string;
  type: string;
  lastUpdated: string;
}

export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [newCaseType, setNewCaseType] = useState("");
  const [sortField, setSortField] = useState("lastUpdated");
  const [sortDirection, setSortDirection] = useState("desc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
  }, [user]);

  const fetchCases = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('cases')
        .select('*')
        .eq('user_id', user.id);
      
      if (sortField === 'lastUpdated') {
        query = query.order('updated_at', { ascending: sortDirection === 'asc' });
      } else if (sortField === 'date') {
        query = query.order('created_at', { ascending: sortDirection === 'asc' });
      } else {
        query = query.order(sortField, { ascending: sortDirection === 'asc' });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        const formattedCases = data.map(caseItem => ({
          id: caseItem.id,
          title: caseItem.title,
          date: caseItem.created_at,
          status: caseItem.status || 'New',
          type: caseItem.description || 'Unspecified',
          lastUpdated: caseItem.updated_at
        }));
        
        setCases(formattedCases);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching cases",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCases = cases.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCase = async () => {
    if (!newCaseTitle) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a title for the case.",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to create a case.",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cases')
        .insert({
          title: newCaseTitle,
          description: newCaseType || "Unspecified",
          status: "open", // This matches the enum values in the Case schema
          user_id: user.id
        })
        .select();
        
      if (error) {
        console.error("Error creating case:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error("No data returned from case creation");
      }
      
      const newCase = {
        id: data[0].id,
        title: data[0].title,
        date: data[0].created_at,
        status: data[0].status || 'open',
        type: data[0].description || 'Unspecified',
        lastUpdated: data[0].updated_at
      };
      
      setCases([newCase, ...cases]);
      setNewCaseTitle("");
      setNewCaseType("");
      setIsDialogOpen(false);

      toast({
        title: "Case Created",
        description: "Your new case has been created successfully.",
      });
      
      // Navigate to the new case
      navigate(`/case/${newCase.id}`);
    } catch (error: any) {
      console.error("Full error details:", error);
      toast({
        variant: "destructive",
        title: "Error creating case",
        description: error.message,
      });
    }
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <div className="flex-1 container py-8">
        <div className="flex flex-col gap-8">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold">Case Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your forensic investigation cases
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => navigate('/profile')}
                className="hidden sm:flex"
              >
                <User className="mr-2 h-4 w-4" />
                My Profile
              </Button>
              <UserDropdown />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search cases..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <Filter className="h-4 w-4" />
                    Sort
                    {sortDirection === "asc" ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => toggleSort("title")}>
                    Title
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("date")}>
                    Creation Date
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("lastUpdated")}>
                    Last Updated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("type")}>
                    Case Type
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1">
                    <FolderPlus className="h-4 w-4" />
                    New Case
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Case</DialogTitle>
                    <DialogDescription>
                      Enter the details for your new investigation case.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="case-title">Case Title</Label>
                      <Input
                        id="case-title"
                        placeholder="Enter case title"
                        value={newCaseTitle}
                        onChange={(e) => setNewCaseTitle(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="case-type">Case Type</Label>
                      <Input
                        id="case-type"
                        placeholder="E.g., Homicide, Robbery, Burglary"
                        value={newCaseType}
                        onChange={(e) => setNewCaseType(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCase}>Create Case</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-1">No cases found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No cases match your search query"
                  : "Create your first case to get started"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  variant="outline"
                  className="gap-1"
                >
                  <FolderPlus className="h-4 w-4" />
                  Create a case
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCases.map((c) => (
                <Link to={`/case/${c.id}`} key={c.id}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-start">
                        <span className="line-clamp-2">{c.title}</span>
                        <span className="text-xs font-normal px-2 py-1 rounded-full bg-forensic bg-opacity-10 text-forensic">
                          {c.status}
                        </span>
                      </CardTitle>
                      <CardDescription>{c.type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <FileText className="h-4 w-4 mr-1" />
                        Created on {formatDate(c.date)}
                      </div>
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground flex justify-end">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Updated {formatDate(c.lastUpdated)}
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {children}
    </label>
  );
}

function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}
