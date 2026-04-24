"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "./common/ToastProvider";
import { ThemeProvider } from "../contexts/ThemeContext";
import { InitialLoader } from "./common/InitialLoader";
import { LazyMotion, domAnimation } from "framer-motion";
import { ThemeTransitionOverlay } from "./common/ThemeTransitionOverlay";
import { FeedbackProvider } from "../contexts/FeedbackContext";

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
          <FeedbackProvider>
            <LazyMotion features={domAnimation}>
              <InitialLoader />
              <ThemeTransitionOverlay />
              <ToastProvider>{children}</ToastProvider>
            </LazyMotion>
          </FeedbackProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
