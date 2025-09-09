"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect } from "react";
import { signOut } from "next-auth/react";

export function useAuthenticatedFetch() {
  const { data: session, status } = useSession();

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (status === "loading") {
        throw new Error("Session is still loading");
      }

      if (!session?.accessToken) {
        throw new Error("No access token available");
      }

      // Check if session has an error (e.g., refresh failed)
      if (session.error === "RefreshAccessTokenError") {
        // Force sign out if refresh failed
        await signOut({ callbackUrl: "/login" });
        throw new Error("Session expired. Please login again.");
      }

      // Add authorization header
      const headers = {
        ...options.headers,
        Authorization: `Bearer ${session.accessToken}`,
      };

      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        // If we get a 401, the token might be expired and refresh might have failed
        if (response.status === 401) {
          // Try to refresh the session
          const refreshResponse = await fetch("/api/auth/session", {
            method: "GET",
          });

          if (!refreshResponse.ok) {
            // Session refresh failed, force logout
            await signOut({ callbackUrl: "/login" });
            throw new Error("Session expired. Please login again.");
          }

          const refreshedSession = await refreshResponse.json();

          // If still no valid token, logout
          if (!refreshedSession?.accessToken) {
            await signOut({ callbackUrl: "/login" });
            throw new Error("Session expired. Please login again.");
          }

          // Retry the original request with the new token
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${refreshedSession.accessToken}`,
            },
          });
        }

        return response;
      } catch (error) {
        console.error("Authenticated fetch error:", error);
        throw error;
      }
    },
    [session, status]
  );

  return {
    authenticatedFetch,
    isAuthenticated: status === "authenticated" && !!session?.accessToken,
    isLoading: status === "loading",
    session,
  };
}

// Hook for automatic logout when session expires
export function useSessionValidation() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      // Automatically sign out when refresh fails
      signOut({ callbackUrl: "/login" });
    }
  }, [session?.error]);
}
