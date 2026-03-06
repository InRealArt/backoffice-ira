'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthStateManager from "@/app/components/Auth/AuthStateManager";
import { useRouter } from "next/navigation";
import { ToastProvider, CustomToaster } from "@/app/components/Toast/ToastContext";
import { ThemeProvider } from "@/app/components/ThemeProvider/ThemeProvider";

const queryClient = new QueryClient();


export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <ThemeProvider>
                <AuthStateManager />
                {children}
                <CustomToaster />
              </ThemeProvider>
            </ToastProvider>
        </QueryClientProvider>
    
    
  );
}