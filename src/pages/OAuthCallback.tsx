
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      toast.error(error);
      navigate('/signin');
      return;
    }

    if (token) {
      // Store the token and user data
      localStorage.setItem('token', token);
      
      // Get user data
      const fetchUserData = async () => {
        try {
          // You can add a call to get user profile here if needed
          toast.success('Successfully signed in with Google');
          navigate('/dashboard');
        } catch (err) {
          console.error('Error fetching user data', err);
          toast.error('Authentication successful, but failed to get user data');
          navigate('/signin');
        }
      };
      
      fetchUserData();
    } else {
      toast.error('No authentication token received');
      navigate('/signin');
    }
  }, [token, error, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="mt-4 text-lg">Processing your authentication...</p>
    </div>
  );
};

export default OAuthCallback;
