
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  Camera,
  FileText,
  Search,
  Lock,
  Database,
  Network,
  BarChart,
  Clock,
  ShieldCheck
} from "lucide-react";

const FeaturesPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 container py-12">
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-bold tracking-tight">CrimeSleuth AI Features</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform offers a comprehensive suite of AI-powered tools designed specifically for forensic investigations
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <FeatureCard 
              icon={<Camera className="h-6 w-6" />}
              title="Image Analysis"
              description="Automatically detect and identify objects, people, and potential evidence in crime scene photos using advanced computer vision."
            />
            
            <FeatureCard 
              icon={<FileText className="h-6 w-6" />}
              title="Document Processing"
              description="Extract and analyze information from reports, witness statements, and other text documents to identify key details and connections."
            />
            
            <FeatureCard 
              icon={<Search className="h-6 w-6" />}
              title="Pattern Recognition"
              description="Identify patterns and connections across multiple cases that may indicate serial crimes or related incidents."
            />
            
            <FeatureCard 
              icon={<Database className="h-6 w-6" />}
              title="Evidence Management"
              description="Securely store, organize, and manage all case evidence in a centralized digital repository with powerful search capabilities."
            />
            
            <FeatureCard 
              icon={<Network className="h-6 w-6" />}
              title="Relationship Mapping"
              description="Visualize connections between people, places, and evidence to uncover complex relationships in investigations."
            />
            
            <FeatureCard 
              icon={<BarChart className="h-6 w-6" />}
              title="Statistical Analysis"
              description="Generate statistical insights and predictions based on historical data to support investigative decision-making."
            />
            
            <FeatureCard 
              icon={<Clock className="h-6 w-6" />}
              title="Timeline Construction"
              description="Automatically generate and visualize case timelines based on evidence timestamps and witness accounts."
            />
            
            <FeatureCard 
              icon={<Lock className="h-6 w-6" />}
              title="Secure Collaboration"
              description="Collaborate securely with team members while maintaining strict access controls and detailed audit logs."
            />
            
            <FeatureCard 
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Compliance & Ethics"
              description="Built with privacy and compliance in mind, ensuring adherence to legal standards and ethical AI principles."
            />
          </div>
          
          <div className="bg-muted rounded-lg p-6 mt-10">
            <h2 className="text-2xl font-semibold mb-4">Ready to transform your investigations?</h2>
            <p className="mb-6">
              Contact our team today to schedule a demo and learn how CrimeSleuth AI can enhance your forensic capabilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/signup" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Get Started
              </Link>
              <Link to="/" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => {
  return (
    <div className="border rounded-lg p-6 space-y-3 transition-all hover:shadow-md">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="font-medium text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default FeaturesPage;
