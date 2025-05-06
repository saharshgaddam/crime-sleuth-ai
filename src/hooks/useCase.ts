
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    const fetchCase = async () => {
      if (!caseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('id', caseId)
          .single();
          
        if (error) throw error;
        
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
  }, [caseId, toast]);

  return { caseData, loading, error };
};
