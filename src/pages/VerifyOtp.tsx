
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2, CheckCircle2, Key } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function VerifyOtp() {
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { verifyOtp, sendOtpForLogin } = useAuth();
  
  useEffect(() => {
    // Retrieve email from localStorage (set during login with 2FA)
    const storedEmail = localStorage.getItem("tempAuthEmail");
    if (!storedEmail) {
      // If no email in storage, redirect to login
      toast.error("Session expired. Please log in again.");
      navigate("/signin");
      return;
    }
    
    setEmail(storedEmail);
  }, [navigate]);

  const handleVerify = async () => {
    if (!email) return;
    
    setIsVerifying(true);
    try {
      await verifyOtp(email, verificationCode);
      // Remove the temporary email from storage
      localStorage.removeItem("tempAuthEmail");
    } catch (error) {
      // Error handling is done in verifyOtp
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    
    try {
      await sendOtpForLogin(email);
      toast.success("A new verification code has been sent to your email");
    } catch (error) {
      // Error handling is done in sendOtpForLogin
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <div className="flex-1 container flex flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Fingerprint className="h-8 w-8 text-forensic" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Two-Factor Authentication</h1>
            <p className="text-sm text-muted-foreground">
              Enter the verification code sent to your email
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="flex flex-col items-center space-y-2">
              <Key className="h-12 w-12 text-forensic" />
              <p className="text-center text-sm text-muted-foreground">
                We've sent a verification code to{" "}
                <span className="font-medium">{email?.replace(/(.{2})(.*)(.{2}@.*)/, "$1•••$3")}</span>.
                <br />Please check your inbox and enter the code below.
              </p>
            </div>
            
            <InputOTP
              maxLength={6}
              value={verificationCode}
              onChange={(value) => setVerificationCode(value)}
              disabled={isVerifying}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            
            <div className="flex flex-col w-full space-y-2">
              <Button 
                onClick={handleVerify} 
                disabled={verificationCode.length < 6 || isVerifying}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Verify Code
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={handleResendCode}
                className="w-full"
                disabled={isVerifying}
              >
                Resend Code
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
