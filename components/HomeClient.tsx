"use client";

import { ReactNode } from "react";
import QueryClientContextProvider from "@/components/QueryClientContextProvider";

export default function HomeClient({ children }: { children: ReactNode }) {
  return <QueryClientContextProvider>{children}</QueryClientContextProvider>;
}