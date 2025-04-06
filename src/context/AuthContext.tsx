import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    
    const checkSupabaseSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
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
    
    if (isSupabaseConfigured()) {
      checkSupabaseSession();
    }
    
    setLoading(false);
  }, []);

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

  const loginWithSupabase = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      toast.error("Supabase is not configured. Please connect to Supabase first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw new Error(error.message);
      
      if (data.user) {
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

  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      toast.error("Supabase is not configured. Please connect to Supabase first.");
      return;
    }

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

  const registerWithSupabase = async (email: string, password: string, name: string, role: string = 'investigator') => {
    if (!isSupabaseConfigured()) {
      toast.error("Supabase is not configured. Please connect to Supabase first.");
      return;
    }

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
      
      if (data.user) {
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

  const logout = async () => {
    try {
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

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      
      const response = await authService.updateProfile(userData);
      
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

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      
      if (import.meta.env.VITE_SUPABASE_URL) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (error) throw new Error(error.message);
      } else {
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
