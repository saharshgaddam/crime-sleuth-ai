
import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface UserProfile {
  name?: string;
  email?: string;
  two_factor_enabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  sendOtpForLogin: (email: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (userData: { name?: string; email?: string }) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session);
        setSession(session);
        setUser(session?.user ? session.user : null);
        
        // Handle email confirmation
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          console.log("User signed in with confirmed email");
          toast.success("Welcome! You're now signed in.");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // First check if the user has 2FA enabled before authenticating
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('two_factor_enabled')
        .eq('email', email)
        .maybeSingle();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error checking 2FA status:", profileError);
      }
      
      // If 2FA is enabled, handle separately
      if (profileData?.two_factor_enabled) {
        console.log("2FA is enabled for this user, sending OTP code");
        
        // Store the email for the OTP verification step
        localStorage.setItem('tempAuthEmail', email);
        localStorage.setItem('tempAuthPassword', password);
        
        // Send OTP
        await sendOtpForLogin(email);
        
        // Redirect to OTP verification page
        navigate('/verify-otp');
        return;
      }
      
      // If 2FA is not enabled, complete the login
      console.log("2FA is not enabled, completing normal login");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Check if email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        toast.info("Please check your email and click the confirmation link to complete your account setup.");
        return;
      }
      
      toast.success("Signed in successfully");
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/oauth-callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const loginWithOtp = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) throw error;
      
      toast.success("Verification code sent to your email");
      
      // Store email temporarily for verification
      localStorage.setItem('tempAuthEmail', email);
      
      // Redirect to OTP verification page
      navigate('/verify-otp');
    } catch (error: any) {
      console.error('OTP login error:', error);
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const sendOtpForLogin = async (email: string) => {
    try {
      console.log("Sending OTP to email:", email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) throw error;
      
      toast.success("Verification code sent to your email");
    } catch (error: any) {
      console.error('OTP send error:', error);
      toast.error(error.message || 'Failed to send verification code');
      throw error;
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      setLoading(true);
      
      // For 2FA login, we need to complete the password auth first
      const tempPassword = localStorage.getItem('tempAuthPassword');
      
      if (tempPassword) {
        // This is a 2FA login - verify OTP first, then complete password auth
        const { error: otpError } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email',
        });

        if (otpError) throw otpError;
        
        // Now complete the password authentication
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password: tempPassword,
        });
        
        if (authError) throw authError;
        
        // Clean up temporary storage
        localStorage.removeItem('tempAuthEmail');
        localStorage.removeItem('tempAuthPassword');
      } else {
        // Regular OTP verification
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email',
        });

        if (error) throw error;
        
        localStorage.removeItem('tempAuthEmail');
      }
      
      toast.success("Verified successfully");
      navigate('/dashboard');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'Failed to verify code');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      console.log("Starting signup process for:", email);
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'investigator'
          },
        },
      });

      if (error) throw error;
      
      console.log("Signup response:", data);
      
      // Check if user needs to confirm email
      if (data?.user && !data?.session) {
        toast.info("Please check your email for the confirmation link to complete your account setup.");
        console.log("Email confirmation required - user created but no session");
        navigate('/signin');
      } else if (data?.user && data?.session) {
        toast.success("Account created successfully! Welcome!");
        console.log("Account created and automatically signed in");
        navigate('/dashboard');
      } else {
        toast.error("Something went wrong during signup. Please try again.");
        console.error("Unexpected signup response:", data);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific signup errors
      if (error.message?.includes('User already registered')) {
        toast.error("An account with this email already exists. Please sign in instead.");
      } else if (error.message?.includes('Password should be at least')) {
        toast.error("Password must be at least 6 characters long.");
      } else if (error.message?.includes('Invalid email')) {
        toast.error("Please enter a valid email address.");
      } else {
        toast.error(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      
      // Clear any local storage related to auth
      localStorage.removeItem('tempAuthEmail');
      localStorage.removeItem('tempAuthPassword');
      
      navigate('/');
      toast.success("Signed out successfully");
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (userData: { name?: string; email?: string }) => {
    try {
      setLoading(true);
      
      if (!user) throw new Error("User not authenticated");
      
      // Update auth email if provided
      if (userData.email && userData.email !== user.email) {
        const { error: updateError } = await supabase.auth.updateUser({
          email: userData.email,
        });
        
        if (updateError) throw updateError;
      }
      
      // Update profile data
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: userData.name, 
          email: userData.email 
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      
      toast.success("Password updated successfully");
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    login,
    loginWithGoogle,
    loginWithOtp,
    verifyOtp,
    sendOtpForLogin,
    signup,
    logout,
    updateUserProfile,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
