
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
      console.log('Processing Supabase OAuth callback...');
      
      // Get the session from the URL hash params
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Supabase session error:', error);
        toast.error(error.message);
        navigate('/signin');
        return;
      }
      
      if (data.session) {
        console.log('Supabase session found:', data.session.user.id);
        
        // Fetch user profile from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error('Error fetching user profile', profileError);
        }
        
        // If profile doesn't exist, create it
        if (!profileData) {
          console.log('Creating new user profile...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: data.session.user.id,
              name: data.session.user.user_metadata.name || data.session.user.user_metadata.full_name || data.session.user.email?.split('@')[0] || '',
              email: data.session.user.email,
              role: 'investigator' // Default role
            }]);
            
          if (insertError) {
            console.error('Error creating user profile', insertError);
            toast.error('Failed to create user profile');
          }
        }
        
        toast.success('Successfully signed in with Google');
        navigate('/dashboard');
      } else {
        console.error('No Supabase session found');
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
    console.log('OAuthCallback component mounted');
    console.log('Supabase configured:', isSupabaseConfigured());
    console.log('URL hash:', window.location.hash);
    
    // First check if we're in a Supabase OAuth flow
    const isSupabaseOAuth = window.location.hash && window.location.hash.includes('access_token');
    
    if (isSupabaseOAuth && isSupabaseConfigured()) {
      console.log('Detected Supabase OAuth flow');
      handleSupabaseCallback();
      return;
    }
    
    // If not Supabase, use the traditional OAuth flow
    if (error) {
      console.error('OAuth error:', error);
      toast.error(error);
      navigate('/signin');
      return;
    }

    if (token) {
      console.log('Traditional OAuth token found');
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
      console.error('No authentication token received');
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
