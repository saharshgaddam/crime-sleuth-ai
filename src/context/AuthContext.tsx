
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        
        if (newSession?.user) {
          // Set user state first with minimal info
          setUser({
            _id: newSession.user.id,
            name: newSession.user.user_metadata.name || newSession.user.email?.split('@')[0] || '',
            email: newSession.user.email || '',
            role: newSession.user.user_metadata.role || 'investigator'
          });
          
          // Then fetch complete profile
          setTimeout(() => fetchUserProfile(newSession.user), 0);
        } else {
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      
      if (initialSession?.user) {
        // Set user state first with minimal info
        setUser({
          _id: initialSession.user.id,
          name: initialSession.user.user_metadata.name || initialSession.user.email?.split('@')[0] || '',
          email: initialSession.user.email || '',
          role: initialSession.user.user_metadata.role || 'investigator'
        });
        
        // Then fetch complete profile
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
        .single();
      
      if (error) {
        console.error("Error fetching user profile:", error);
        return;
      }
      
      if (data) {
        setUser({
          _id: supabaseUser.id,
          name: data.name || supabaseUser.email?.split('@')[0] || '',
          email: data.email || supabaseUser.email || '',
          role: data.role || 'investigator'
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
      
      // Update user metadata in auth
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          name: userData.name,
          role: userData.role
        }
      });
      
      if (authUpdateError) throw new Error(authUpdateError.message);
      
      // Update profile in profiles table
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          role: userData.role
        })
        .eq('id', user._id);
      
      if (profileUpdateError) throw new Error(profileUpdateError.message);
      
      // Update local state
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
        isAuthenticated: !!session
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
