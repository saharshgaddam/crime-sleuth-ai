
import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../hooks/use-auth';
import { Toaster } from '../components/ui/toaster';

const AuthWrapper = ({ children }) => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-client-id';
  
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default AuthWrapper;
