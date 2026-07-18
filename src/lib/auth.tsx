import { createContext, useContext, type ReactNode } from "react";
import { trpc } from "@/providers/trpc";

type AuthContextType = {
  user: NonNullable<ReturnType<typeof useMeData>>["user"] | null;
  badges: string[];
  loading: boolean;
  setSession: (token: string) => void;
  logout: () => void;
  refetch: () => void;
};

function useMeData() {
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  return me.data;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  badges: [],
  loading: true,
  setSession: () => {},
  logout: () => {},
  refetch: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();

  const setSession = (token: string) => {
    localStorage.setItem("kine_token", token);
    utils.auth.me.invalidate();
  };

  const logout = () => {
    localStorage.removeItem("kine_token");
    utils.invalidate();
  };

  return (
    <AuthContext.Provider
      value={{
        user: me.data?.user ?? null,
        badges: me.data?.badges ?? [],
        loading: me.isLoading,
        setSession,
        logout,
        refetch: () => utils.auth.me.invalidate(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function formatIDR(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}
