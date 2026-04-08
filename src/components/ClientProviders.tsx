"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "./common/ToastProvider";
import { ThemeProvider } from "../contexts/ThemeContext";
import { LazyMotion, domAnimation } from "framer-motion";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <LazyMotion features={domAnimation}>
            <ToastProvider>{children}</ToastProvider>
          </LazyMotion>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
