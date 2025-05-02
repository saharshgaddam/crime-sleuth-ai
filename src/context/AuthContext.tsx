
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  two_factor_enabled?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  loginWithSupabase: (email: string, password: string) => Promise<void>;
  registerWithSupabase: (email: string, password: string, name: string, role?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<UserProfile>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  requestPasswordReset: (email: string) => Promise<void>;
  sendOtpForLogin: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        
        if (newSession?.user) {
          setUser({
            _id: newSession.user.id,
            name: newSession.user.user_metadata.name || newSession.user.user_metadata.full_name || newSession.user.email?.split('@')[0] || '',
            email: newSession.user.email || '',
            role: newSession.user.user_metadata.role || 'investigator'
          });
          
          setTimeout(() => fetchUserProfile(newSession.user), 0);
        } else {
          setUser(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      
      if (initialSession?.user) {
        setUser({
          _id: initialSession.user.id,
          name: initialSession.user.user_metadata.name || initialSession.user.user_metadata.full_name || initialSession.user.email?.split('@')[0] || '',
          email: initialSession.user.email || '',
          role: initialSession.user.user_metadata.role || 'investigator'
        });
        
        setTimeout(() => fetchUserProfile(initialSession.user), 0);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (supabaseUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching user profile:", error);
        return;
      }
      
      if (data) {
        setUser({
          _id: supabaseUser.id,
          name: data.name || supabaseUser.user_metadata.name || supabaseUser.user_metadata.full_name || supabaseUser.email?.split('@')[0] || '',
          email: data.email || supabaseUser.email || '',
          role: data.role || 'investigator',
          two_factor_enabled: data.two_factor_enabled || false
        });
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const loginWithSupabase = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user has 2FA enabled
      const { data: profileData } = await supabase
        .from('profiles')
        .select('two_factor_enabled')
        .eq('email', email)
        .maybeSingle();
      
      if (profileData?.two_factor_enabled) {
        // First authenticate with password
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (authError) throw new Error(authError.message);
        
        // If password is correct, send OTP
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email
        });
        
        if (otpError) throw new Error(otpError.message);
        
        // Store email for 2FA verification
        localStorage.setItem("tempAuthEmail", email);
        
        // Redirect to 2FA verification page
        navigate('/verify-otp');
        
        toast.success("Verification code sent to your email");
        return;
      }
      
      // Regular login without 2FA
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw new Error(error.message);
      
      toast.success("Logged in successfully");
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login with Supabase');
      throw new Error(err.message || 'Failed to login with Supabase');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/oauth-callback`
        }
      });
      
      if (error) throw new Error(error.message);
      
    } catch (err: any) {
      setError(err.message || 'Failed to login with Google');
      toast.error(err.message || 'Failed to login with Google');
      throw new Error(err.message || 'Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  const registerWithSupabase = async (email: string, password: string, name: string, role: string = 'investigator') => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });
      
      if (error) throw new Error(error.message);
      
      toast.success("Account created successfully");
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register with Supabase');
      toast.error(err.message || 'Failed to register with Supabase');
      throw new Error(err.message || 'Failed to register with Supabase');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      toast.success("Logged out successfully");
      navigate('/signin');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout");
    }
  };

  const updateProfile = async (userData: Partial<UserProfile>) => {
    try {
      setLoading(true);
      
      if (!user?._id) {
        throw new Error('User not authenticated');
      }
      
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          name: userData.name,
          role: userData.role
        }
      });
      
      if (authUpdateError) throw new Error(authUpdateError.message);
      
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          role: userData.role,
          two_factor_enabled: userData.two_factor_enabled
        })
        .eq('id', user._id);
      
      if (profileUpdateError) throw new Error(profileUpdateError.message);
      
      setUser({
        ...user,
        ...userData
      });
      
      toast.success("Profile updated successfully");
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      throw new Error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw new Error(error.message);
      
      toast.success("Password changed successfully");
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      throw new Error(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };
  
  const requestPasswordReset = async (email: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) throw new Error(error.message);
      
      toast.success("Password reset link sent to your email");
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset link');
      throw new Error(err.message || 'Failed to send password reset link');
    } finally {
      setLoading(false);
    }
  };
  
  const sendOtpForLogin = async (email: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOtp({
        email
      });
      
      if (error) throw new Error(error.message);
      
      toast.success("Verification code sent to your email");
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      throw new Error(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };
  
  const verifyOtp = async (email: string, token: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });
      
      if (error) throw new Error(error.message);
      
      toast.success("Verification successful");
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
      throw new Error(err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session,
        loading, 
        error, 
        loginWithSupabase, 
        registerWithSupabase,
        loginWithGoogle,
        logout, 
        updateProfile, 
        changePassword,
        isAuthenticated: !!session,
        requestPasswordReset,
        sendOtpForLogin,
        verifyOtp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
