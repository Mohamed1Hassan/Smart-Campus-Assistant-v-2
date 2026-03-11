import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export function useLogout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { logout: authLogout } = useAuth();

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use the AuthContext logout function which properly clears state
      await authLogout();

      // Navigate to login page
      router.replace("/login");

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Logout failed";
      setError(errorMessage);
      console.error("Logout error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    logout,
    isLoading,
    error,
  };
}
