
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from './use-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get('/api/auth/me');
          setUser(response.data);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (userData) => {
    try {
      const response = await axios.post('/api/auth/login', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast({
        title: "Success!",
        description: "You have successfully logged in",
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "Authentication failed",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const googleLogin = async (tokenId) => {
    try {
      const response = await axios.post('/api/auth/google', { tokenId });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast({
        title: "Success!",
        description: "You have successfully logged in with Google",
      });
      
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "Authentication failed",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created",
      });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || "Could not create account",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
