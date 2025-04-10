import { Link } from "react-router-dom";
import { Fingerprint, Twitter, Facebook, Instagram, Github, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Fingerprint className="h-6 w-6 text-forensic" />
              <span className="font-bold text-xl">CrimeSleuth AI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Advanced AI-powered forensic analysis for modern law enforcement. Enhancing investigations through cutting-edge technology.
            </p>
            <div className="flex gap-3">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-base">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/features" className="text-muted-foreground hover:text-foreground">Features</Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">Testimonials</Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">Pricing</Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">FAQs</Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-base">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">Documentation</Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">Blog</Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">Support</Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">Training</Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">Case Studies</Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-base">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">Terms of Service</Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">Cookie Policy</Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">Security</Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">Compliance</Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-sm text-muted-foreground">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <p>© 2025 CrimeSleuth AI. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/" className="hover:text-foreground">Privacy</Link>
              <Link to="/" className="hover:text-foreground">Terms</Link>
              <Link to="/" className="hover:text-foreground">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
