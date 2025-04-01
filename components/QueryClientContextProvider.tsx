"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { SupabaseClient } from "@supabase/supabase-js";

const queryClient = new QueryClient(
    {
        defaultOptions: {
            queries: {
                gcTime: 1000 * 60 * 60 * 24
            }
        }
    }
);

export function useFiles(supabase: SupabaseClient) {
    return useQuery({
      queryKey: ['files'],
      queryFn: async () => {
        const { data, error } = await supabase.from('documents_with_storage_path').select();
  
        if (error) {
          toast({
            variant: 'destructive',
            description: 'Failed to fetch documents'
          })
          throw error;
        }
  
        return data;
      }
    })
  }

export default function QueryClientContextProvider({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}