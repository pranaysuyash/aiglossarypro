import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { IUser } from "../../../shared/types";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<IUser>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
