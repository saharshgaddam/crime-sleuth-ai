
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const AboutPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 container py-12">
        <div className="space-y-8 max-w-3xl mx-auto">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">About CrimeSleuth AI</h1>
            <p className="text-muted-foreground">
              Revolutionizing forensic investigations with cutting-edge AI technology
            </p>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p>
              CrimeSleuth AI is dedicated to empowering law enforcement agencies and forensic investigators with state-of-the-art artificial intelligence tools that accelerate investigations, increase accuracy, and help bring justice to victims.
            </p>
            
            <p>
              Our platform combines advanced computer vision, natural language processing, and machine learning algorithms to analyze evidence, detect patterns, and generate insights that might otherwise be missed using traditional methods.
            </p>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Our Team</h2>
            <p>
              Founded by a team of forensic experts, data scientists, and software engineers, CrimeSleuth AI brings together decades of experience in criminal investigations and cutting-edge AI research.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="border rounded-lg p-6 space-y-3">
                <h3 className="font-medium text-lg">Dr. Sarah Chen</h3>
                <p className="text-sm text-muted-foreground">Chief Forensic Officer</p>
                <p className="text-sm">
                  Former FBI forensic specialist with 15 years of experience in evidence analysis and crime scene investigation.
                </p>
              </div>
              
              <div className="border rounded-lg p-6 space-y-3">
                <h3 className="font-medium text-lg">James Rodriguez</h3>
                <p className="text-sm text-muted-foreground">Chief Technology Officer</p>
                <p className="text-sm">
                  AI researcher and computer vision expert who previously led development at a major tech company's research lab.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Our Commitment</h2>
            <p>
              We are committed to responsible AI development and ethical use of technology in law enforcement. CrimeSleuth AI adheres to strict privacy standards and transparency principles.
            </p>
            
            <p>
              Our systems are designed to assist human investigators, not replace them. We believe in augmenting human expertise with AI capabilities to achieve the best possible outcomes in criminal investigations.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AboutPage;
