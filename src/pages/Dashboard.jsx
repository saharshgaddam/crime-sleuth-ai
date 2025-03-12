
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Fingerprint,
  FolderPlus,
  Search,
  FileText,
  Clock,
  Filter,
  ArrowUp,
  ArrowDown,
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

// Sample case data
const sampleCases = [
  {
    id: "case-001",
    title: "Downtown Robbery Investigation",
    date: "2023-09-15",
    status: "In Progress",
    type: "Robbery",
    lastUpdated: "2023-09-20",
  },
  {
    id: "case-002",
    title: "Westside Home Invasion",
    date: "2023-08-22",
    status: "Completed",
    type: "Burglary",
    lastUpdated: "2023-09-01",
  },
  {
    id: "case-003",
    title: "River Park Homicide",
    date: "2023-07-30",
    status: "In Progress",
    type: "Homicide",
    lastUpdated: "2023-09-18",
  },
];

export default function Dashboard() {
  const [cases, setCases] = useState(sampleCases);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [newCaseType, setNewCaseType] = useState("");
  const [sortField, setSortField] = useState("lastUpdated");
  const [sortDirection, setSortDirection] = useState("desc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredCases = cases.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedCases = [...filteredCases].sort((a, b) => {
    if (sortDirection === "asc") {
      return a[sortField] > b[sortField] ? 1 : -1;
    } else {
      return a[sortField] < b[sortField] ? 1 : -1;
    }
  });

  const handleCreateCase = () => {
    if (!newCaseTitle) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a title for the case.",
      });
      return;
    }

    const newCase = {
      id: `case-${String(cases.length + 1).padStart(3, "0")}`,
      title: newCaseTitle,
      date: new Date().toISOString().split("T")[0],
      status: "New",
      type: newCaseType || "Unspecified",
      lastUpdated: new Date().toISOString().split("T")[0],
    };

    setCases([newCase, ...cases]);
    setNewCaseTitle("");
    setNewCaseType("");
    setIsDialogOpen(false);

    toast({
      title: "Case Created",
      description: "Your new case has been created successfully.",
    });
  };

  const toggleSort = (field) => {
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
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Case Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your forensic investigation cases
            </p>
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
          
          {sortedCases.length === 0 ? (
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
              {sortedCases.map((c) => (
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

function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {children}
    </label>
  );
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}
