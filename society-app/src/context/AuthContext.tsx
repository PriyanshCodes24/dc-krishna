import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

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
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");

  useEffect(() => {
    fetch(`${baseUrl}/health`).catch(() => {});
  }, [baseUrl]);

  const unlockAdmin = async (pin: string): Promise<boolean> => {
    const cleanPin = pin.trim();
    try {
      const res = await fetch(`${baseUrl}/auth/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: cleanPin }),
      });

      if (res.ok) {
        setAdminPin(cleanPin);
        return true;
      }
      return false;
    } catch (err) {
      console.error("PIN verify network error:", err);
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
