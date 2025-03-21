
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useAuth } from '../hooks/use-auth';
import { Microscope, FileText, BarChart3, Plus } from 'lucide-react';
import axios from 'axios';
import { toast } from '../hooks/use-toast';

const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin');
    }
  }, [user, loading, navigate]);
  
  useEffect(() => {
    // Fetch cases when user is authenticated
    const fetchCases = async () => {
      if (user) {
        try {
          setLoadingCases(true);
          const response = await axios.get('/api/cases');
          setCases(response.data);
        } catch (error) {
          console.error('Error fetching cases:', error);
          toast({
            title: "Error",
            description: "Failed to load your cases",
            variant: "destructive",
          });
        } finally {
          setLoadingCases(false);
        }
      }
    };
    
    fetchCases();
  }, [user]);

  const handleCreateNewCase = async () => {
    try {
      const response = await axios.post('/api/cases', {
        title: `New Case #${cases.length + 1}`,
        status: 'New'
      });
      
      const newCase = response.data;
      setCases([...cases, newCase]);
      navigate(`/case/${newCase._id}`);
    } catch (error) {
      console.error('Error creating case:', error);
      toast({
        title: "Error",
        description: "Failed to create a new case",
        variant: "destructive",
      });
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => {
          logout();
          navigate('/');
        }} variant="outline">
          Logout
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Welcome Back!</CardTitle>
          <CardDescription>
            Here's your personal dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Your Cases</h2>
        <Button onClick={handleCreateNewCase}>
          <Plus className="mr-2 h-4 w-4" /> Create New Case
        </Button>
      </div>

      {loadingCases ? (
        <div className="text-center py-8">
          <p>Loading your cases...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border">
          <p className="mb-4">You don't have any cases yet.</p>
          <Button onClick={handleCreateNewCase}>
            <Plus className="mr-2 h-4 w-4" /> Create your first case
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((caseItem) => (
            <Link key={caseItem._id} to={`/case/${caseItem._id}`}>
              <Card className="cursor-pointer transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle>{caseItem.title}</CardTitle>
                  <CardDescription>Created: {new Date(caseItem.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      caseItem.status === 'Active' ? 'bg-green-100 text-green-800' : 
                      caseItem.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {caseItem.status}
                    </span>
                    <div className="flex space-x-2">
                      <Microscope className="h-4 w-4" />
                      <FileText className="h-4 w-4" />
                      <BarChart3 className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
