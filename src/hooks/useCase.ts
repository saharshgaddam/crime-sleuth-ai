
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export interface Case {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useCase = (caseId: string | undefined) => {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCase = async () => {
      if (!caseId || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('id', caseId)
          .maybeSingle();
          
        if (error) throw error;
        
        if (!data) {
          throw new Error("Case not found or you don't have permission to access it");
        }
        
        // Check if case belongs to the current user
        if (data.user_id !== user.id) {
          throw new Error("You don't have permission to access this case");
        }
        
        setCaseData(data);
      } catch (err: any) {
        console.error("Error fetching case:", err);
        setError(err);
        toast({
          variant: "destructive",
          title: "Error loading case",
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [caseId, toast, user]);

  return { caseData, loading, error };
};
