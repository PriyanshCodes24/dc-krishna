import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  isAdmin: boolean;
  adminPin: string;
  selectedPlot: string | null;
  setSelectedPlot: (plot: string | null) => void;
  unlockAdmin: (pin: string) => Promise<boolean>;
  lockAdmin: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  adminPin: "",
  selectedPlot: null,
  setSelectedPlot: () => {},
  unlockAdmin: async () => false,
  lockAdmin: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [adminPin, setAdminPin] = useState("");
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/+$/, "");
  fetch(`${baseUrl}/health`).catch(() => {});

  const unlockAdmin = async (pin: string): Promise<boolean> => {
    try {
      const res = await fetch(`${baseUrl}/auth/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        setAdminPin(pin);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const lockAdmin = () => setAdminPin("");

  return (
    <AuthContext.Provider
      value={{
        isAdmin: Boolean(adminPin),
        adminPin,
        selectedPlot,
        setSelectedPlot,
        unlockAdmin,
        lockAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
