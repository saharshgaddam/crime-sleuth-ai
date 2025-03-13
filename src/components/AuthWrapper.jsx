
import React from 'react';
import { AuthProvider } from '../hooks/use-auth';
import { Toaster } from '../components/ui/toaster';

const AuthWrapper = ({ children }) => {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
};

export default AuthWrapper;
