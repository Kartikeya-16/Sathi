import { create } from "zustand";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface BackendStatusState {
  isConnected: boolean;
  isChecking: boolean;
  errorMessage: string | null;
  lastChecked: number | null;
  apiUrl: string;
  setConnected: (connected: boolean, error?: string | null) => void;
  checkHealth: () => Promise<boolean>;
}

export const useBackendStatus = create<BackendStatusState>((set, get) => ({
  isConnected: true,
  isChecking: false,
  errorMessage: null,
  lastChecked: null,
  apiUrl: API_BASE,

  setConnected: (connected: boolean, error: string | null = null) => {
    set({
      isConnected: connected,
      errorMessage: error,
      lastChecked: Date.now(),
    });
  },

  checkHealth: async () => {
    set({ isChecking: true });
    try {
      const res = await axios.get(`${API_BASE}/health`, { timeout: 3500 });
      if (res.status === 200) {
        set({
          isConnected: true,
          errorMessage: null,
          isChecking: false,
          lastChecked: Date.now(),
        });
        return true;
      }
      set({
        isConnected: false,
        errorMessage: `Unexpected response status ${res.status}`,
        isChecking: false,
        lastChecked: Date.now(),
      });
      return false;
    } catch (err: any) {
      const errorMsg =
        err?.code === "ERR_NETWORK" || !err?.response
          ? "Connection refused: The backend server is not running or unreachable at port 8000."
          : err?.message || "Backend health check failed";

      set({
        isConnected: false,
        errorMessage: errorMsg,
        isChecking: false,
        lastChecked: Date.now(),
      });
      return false;
    }
  },
}));
