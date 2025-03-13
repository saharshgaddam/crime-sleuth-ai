
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '../hooks/use-auth';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const { user, loading, login, googleLogin, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isRegistering) {
      const success = await register({ name, email, password });
      if (success) {
        setIsRegistering(false);
      }
    } else {
      const success = await login({ email, password });
      if (success) {
        navigate('/dashboard');
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('Google login success:', credentialResponse);
    const success = await googleLogin(credentialResponse.credential);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleGoogleError = () => {
    console.error('Google Sign In was unsuccessful');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {isRegistering ? 'Create your account' : 'Sign in to your account'}
          </CardTitle>
          <CardDescription className="text-center">
            {isRegistering ? 'Enter your details below to create your account' : 'Enter your credentials below to access your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="youremail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {isRegistering ? 'Register' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-center">
            <span className="text-sm">Or continue with</span>
          </div>
          <div className="mt-4 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              shape="rectangular"
              theme="filled_blue"
              text="signin_with"
              size="large"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm"
          >
            {isRegistering
              ? 'Already have an account? Sign in'
              : "Don't have an account? Register"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignIn;
