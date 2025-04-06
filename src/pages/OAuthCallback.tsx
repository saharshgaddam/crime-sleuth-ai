
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  // Function to handle Supabase OAuth callback
  const handleSupabaseCallback = async () => {
    try {
      // Get the session from the URL hash params
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        toast.error(error.message);
        navigate('/signin');
        return;
      }
      
      if (data.session) {
        // Fetch user profile from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error fetching user profile', profileError);
        }
        
        // If profile doesn't exist, create it
        if (!profileData) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: data.session.user.id,
              name: data.session.user.user_metadata.name || data.session.user.email?.split('@')[0] || '',
              email: data.session.user.email,
              role: 'investigator' // Default role
            }]);
            
          if (insertError) {
            console.error('Error creating user profile', insertError);
          }
        }
        
        toast.success('Successfully signed in with Google');
        navigate('/dashboard');
      } else {
        toast.error('No session found');
        navigate('/signin');
      }
    } catch (err) {
      console.error('Error in Supabase OAuth callback', err);
      toast.error('Authentication failed');
      navigate('/signin');
    }
  };

  useEffect(() => {
    // First check if we're in a Supabase OAuth flow
    const isSupabaseOAuth = window.location.hash && window.location.hash.includes('access_token');
    
    if (isSupabaseOAuth && isSupabaseConfigured()) {
      handleSupabaseCallback();
      return;
    }
    
    // If not Supabase, use the traditional OAuth flow
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
    } else if (!isSupabaseOAuth) {
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
