
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { toast } from "sonner";
import { supabase } from '../lib/supabase';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  loginWithSupabase: (email: string, password: string) => Promise<void>;
  registerWithSupabase: (email: string, password: string, name: string, role?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Check if user is already logged in
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    
    // Also check Supabase session
    const checkSupabaseSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Get user profile from Supabase
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileData) {
          setUser({
            _id: data.session.user.id,
            name: profileData.name || data.session.user.email?.split('@')[0] || '',
            email: data.session.user.email || '',
            role: profileData.role || 'investigator'
          });
        }
      }
    };
    
    // Only check Supabase if we have credentials
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      checkSupabaseSession();
    }
    
    setLoading(false);
  }, []);

  // Original login method using Express backend
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login({ email, password });
      setUser(response.user);
      toast.success("Logged in successfully");
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
      throw new Error(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  // Supabase login method
  const loginWithSupabase = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw new Error(error.message);
      
      if (data.user) {
        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        const userData = {
          _id: data.user.id,
          name: profileData?.name || data.user.email?.split('@')[0] || '',
          email: data.user.email || '',
          role: profileData?.role || 'investigator'
        };
        
        setUser(userData);
        toast.success("Logged in successfully with Supabase");
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login with Supabase');
      toast.error(err.message || 'Failed to login with Supabase');
      throw new Error(err.message || 'Failed to login with Supabase');
    } finally {
      setLoading(false);
    }
  };
  
  // Login with Google via Supabase
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
      
      // No need to set user here as the OAuth callback will handle it
    } catch (err: any) {
      setError(err.message || 'Failed to login with Google');
      toast.error(err.message || 'Failed to login with Google');
      throw new Error(err.message || 'Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  // Original register method using Express backend
  const register = async (name: string, email: string, password: string, role: string = 'investigator') => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register({ name, email, password, role });
      setUser(response.user);
      toast.success("Account created successfully");
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register');
      throw new Error(err.response?.data?.error || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };
  
  // Supabase register method
  const registerWithSupabase = async (email: string, password: string, name: string, role: string = 'investigator') => {
    try {
      setLoading(true);
      setError(null);
      
      // Register the user
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
      
      if (data.user) {
        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ 
            id: data.user.id, 
            name, 
            email, 
            role 
          }]);
          
        if (profileError) throw new Error(profileError.message);
        
        const userData = {
          _id: data.user.id,
          name,
          email,
          role
        };
        
        setUser(userData);
        toast.success("Account created successfully with Supabase");
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register with Supabase');
      toast.error(err.message || 'Failed to register with Supabase');
      throw new Error(err.message || 'Failed to register with Supabase');
    } finally {
      setLoading(false);
    }
  };

  // Original logout method
  const logout = async () => {
    try {
      // Logout from both systems
      authService.logout();
      
      if (import.meta.env.VITE_SUPABASE_URL) {
        await supabase.auth.signOut();
      }
      
      setUser(null);
      toast.success("Logged out successfully");
      navigate('/signin');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout");
    }
  };

  // Original update profile method
  const updateProfile = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      
      // Update in Express backend
      const response = await authService.updateProfile(userData);
      
      // If using Supabase, also update there
      if (import.meta.env.VITE_SUPABASE_URL && user?._id) {
        await supabase
          .from('profiles')
          .update({
            name: userData.name,
            role: userData.role
          })
          .eq('id', user._id);
      }
      
      setUser(response.data);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
      throw new Error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Original change password method
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      
      if (import.meta.env.VITE_SUPABASE_URL) {
        // Update password via Supabase
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (error) throw new Error(error.message);
      } else {
        // Update via Express backend
        await authService.changePassword({ currentPassword, newPassword });
      }
      
      toast.success("Password changed successfully");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to change password');
      throw new Error(err.response?.data?.error || err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        error, 
        login, 
        register, 
        logout, 
        updateProfile, 
        changePassword,
        isAuthenticated: !!user,
        loginWithSupabase,
        registerWithSupabase,
        loginWithGoogle
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
