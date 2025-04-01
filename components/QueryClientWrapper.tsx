"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function QueryClientWrapper({ children }: { children: ReactNode }) {

    const queryClient = new QueryClient()

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}