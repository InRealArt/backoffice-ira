"use client";

import { createContext, useContext, ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

interface SessionContextType {
  session: ReturnType<typeof authClient.useSession>["data"];
  isPending: boolean;
  error: ReturnType<typeof authClient.useSession>["error"];
  isLoggedIn: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, error } = authClient.useSession();
  const isLoggedIn = !!session;

  return (
    <SessionContext.Provider
      value={{
        session,
        isPending,
        error,
        isLoggedIn,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
}
