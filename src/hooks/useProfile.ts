
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
          
        if (error) throw error;
        
        setProfile(data);
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        toast({
          variant: "destructive",
          title: "Error loading profile",
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to update your profile",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      return true;
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update profile",
      });
      return false;
    }
  };

  const toggleTwoFactor = async (enabled: boolean) => {
    return await updateProfile({ two_factor_enabled: enabled });
  };

  return { profile, loading, updateProfile, toggleTwoFactor };
};
