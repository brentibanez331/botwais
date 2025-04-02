"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { SupabaseClient } from "@supabase/supabase-js";
import { Document } from "@/utils/types";

const queryClient = new QueryClient();

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
  
        return data as Document[];
      }
    })
  }

export default function QueryClientContextProvider({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}