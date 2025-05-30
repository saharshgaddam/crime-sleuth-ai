
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2, CheckCircle2, Key } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function VerifyOtp() {
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { verifyOtp, sendOtpForLogin } = useAuth();
  
  useEffect(() => {
    // Retrieve email from localStorage (set during login with 2FA)
    const storedEmail = localStorage.getItem("tempAuthEmail");
    console.log("Retrieved stored email for OTP verification:", storedEmail);
    
    if (!storedEmail) {
      // If no email in storage, redirect to login
      console.log("No email found in storage, redirecting to login");
      toast.error("Session expired. Please log in again.");
      navigate("/signin");
      return;
    }
    
    setEmail(storedEmail);
  }, [navigate]);

  const handleVerify = async () => {
    if (!email) {
      console.error("Cannot verify: No email available");
      toast.error("Session expired. Please log in again.");
      navigate("/signin");
      return;
    }
    
    if (verificationCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    
    try {
      setIsVerifying(true);
      console.log("Verifying OTP for email:", email);
      await verifyOtp(email, verificationCode);
      // Navigation and success handling is done in verifyOtp function
    } catch (error) {
      // Error handling is done in verifyOtp
      console.error("Failed to verify OTP:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      console.error("Cannot resend: No email available");
      toast.error("Session expired. Please log in again.");
      navigate("/signin");
      return;
    }
    
    try {
      setIsResending(true);
      console.log("Resending OTP to email:", email);
      await sendOtpForLogin(email);
      toast.success("A new verification code has been sent to your email");
    } catch (error) {
      // Error handling is done in sendOtpForLogin
      console.error("Failed to resend OTP:", error);
    } finally {
      setIsResending(false);
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
                disabled={isVerifying || isResending}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Code"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
