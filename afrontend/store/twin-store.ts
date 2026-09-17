import { create } from "zustand";
import type {
  FinancialTwinResponse,
  IncomeResponse,
  ExpenseResponse,
  AssetResponse,
  LiabilityResponse,
  FinancialGoalResponse,
  HealthCategory,
} from "@/lib/types";
import * as twinApi from "@/lib/api/twin";
import { getHealthScore } from "@/lib/api/planner";
import { useBackendStatus } from "./backend-status-store";

export interface FinancialTwinState {
  profile: FinancialTwinResponse | null;
  incomeSources: IncomeResponse[];
  expenses: ExpenseResponse[];
  assets: AssetResponse[];
  liabilities: LiabilityResponse[];
  goals: FinancialGoalResponse[];
  healthScore: {
    score: number;
    category: HealthCategory;
    insights: string[];
    feature_importance: Record<string, number>;
  } | null;
  isLoading: boolean;
  isInitialized: boolean;
  hasOnboarded: boolean;
  isDemoData: boolean;

  /* Actions */
  setTwin: (data: Partial<FinancialTwinState>) => void;
  fetchAllTwinData: () => Promise<void>;
  refreshHealthScore: () => Promise<void>;
  clearData: () => void;
}

const HEALTH_SCORE_STORAGE_KEY = "arthsaathi_cached_health_score";

function getCachedHealthScore() {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(HEALTH_SCORE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
  }
  return null;
}

let isRefreshingScorePromise: Promise<void> | null = null;

export const useTwinStore = create<FinancialTwinState>((set, get) => ({
  profile: null,
  incomeSources: [],
  expenses: [],
  assets: [],
  liabilities: [],
  goals: [],
  healthScore: getCachedHealthScore(),
  isLoading: true,
  isInitialized: false,
  hasOnboarded: false,
  isDemoData: false,

  setTwin: (data) => set(data),

  clearData: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(HEALTH_SCORE_STORAGE_KEY);
      } catch {}
    }
    set({
      profile: null,
      incomeSources: [],
      expenses: [],
      assets: [],
      liabilities: [],
      goals: [],
      healthScore: null,
      hasOnboarded: false,
      isDemoData: false,
      isLoading: false,
      isInitialized: true,
    });
  },

  fetchAllTwinData: async () => {
    set({ isLoading: true });
    try {
      const [profile, incomeSources, expenses, assets, liabilities, goals] =
        await Promise.all([
          twinApi.getFinancialTwin().catch((err) => {
            if (err?.code === "ERR_NETWORK" || !err?.response) {
              useBackendStatus.getState().setConnected(false, "Backend unreachable");
            }
            return null;
          }),
          twinApi.getIncomes().catch(() => []),
          twinApi.getExpenses().catch(() => []),
          twinApi.getAssets().catch(() => []),
          twinApi.getLiabilities().catch(() => []),
          twinApi.getGoals().catch(() => []),
        ]);

      if (profile) {
        useBackendStatus.getState().setConnected(true);
        let finalGoals = goals;
        if ((!finalGoals || finalGoals.length === 0) && typeof window !== "undefined") {
          const cached = localStorage.getItem("arthsaathi_saved_goals");
          if (cached) {
            try {
              finalGoals = JSON.parse(cached);
            } catch {}
          }
        }
        set({
          profile,
          incomeSources,
          expenses,
          assets,
          liabilities,
          goals: finalGoals,
          hasOnboarded: true,
          isDemoData: false,
        });

        // Await the genuine ML model health score inference before concluding loading state!
        try {
          await get().refreshHealthScore();
        } catch {}

        set({
          isLoading: false,
          isInitialized: true,
        });
      } else {
        // User has not onboarded yet
        set({
          profile: null,
          incomeSources: [],
          expenses: [],
          assets: [],
          liabilities: [],
          goals: [],
          healthScore: null,
          hasOnboarded: false,
          isDemoData: false,
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch (err: any) {
      if (err?.code === "ERR_NETWORK" || !err?.response) {
        useBackendStatus.getState().setConnected(false, "Backend unreachable");
      }
      set({
        profile: null,
        incomeSources: [],
        expenses: [],
        assets: [],
        liabilities: [],
        goals: [],
        healthScore: null,
        hasOnboarded: false,
        isDemoData: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  refreshHealthScore: async () => {
    // If a calculation request is already in progress, reuse the active promise to prevent duplicate requests
    if (isRefreshingScorePromise) {
      return isRefreshingScorePromise;
    }

    isRefreshingScorePromise = (async () => {
      const state = get();
      if (!state.profile) return;

      const totalMonthlyIncome = Number(state.profile.monthly_income) || 0;
      const totalMonthlyExpenses = state.expenses.reduce(
        (sum, e) => sum + Number(e.amount || 0),
        0
      );
      const totalMonthlyEMIs = state.liabilities.reduce(
        (sum, l) => sum + Number(l.emi_amount || 0),
        0
      );
      const totalAssets = state.assets.reduce(
        (sum, a) => sum + Number(a.current_value || 0),
        0
      );
      const totalLiabilities = state.liabilities.reduce(
        (sum, l) => sum + Number(l.outstanding_amount || 0),
        0
      );

      // Filter liquid / accessible financial assets (Savings, Deposits, Mutual Funds, Cash)
      const categorizedLiquid = state.assets
        .filter((a) => {
          const t = String(a.asset_type || "").toUpperCase();
          return (
            t.includes("SAVING") ||
            t.includes("DEPOSIT") ||
            t.includes("MUTUAL") ||
            t.includes("CASH") ||
            t.includes("BANK") ||
            t.includes("LIQUID")
          );
        })
        .reduce((sum, a) => sum + Number(a.current_value || 0), 0);

      // If no asset was specifically tagged as liquid, assume emergency liquidity from totalAssets up to 6 months expenses
      const liquidSavings =
        categorizedLiquid > 0
          ? categorizedLiquid
          : Math.min(totalAssets, Math.max(totalMonthlyExpenses * 3, totalMonthlyIncome * 2));

      try {
        const result = await getHealthScore({
          monthly_income: totalMonthlyIncome,
          total_monthly_emis: totalMonthlyEMIs,
          total_monthly_expenses: totalMonthlyExpenses,
          liquid_savings: liquidSavings,
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          goals: state.goals.map((g) => ({
            target_amount: Number(g.target_amount || 0),
            current_savings: Number(g.current_savings || 0),
          })),
        });

        const scoreObj = {
          score: result.health_score,
          category: result.category,
          insights: result.insights,
          feature_importance: result.feature_importance as unknown as Record<string, number>,
        };

        set({ healthScore: scoreObj });

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(HEALTH_SCORE_STORAGE_KEY, JSON.stringify(scoreObj));
          } catch {}
        }
      } catch {
        // Keep existing cached score if network fails
      } finally {
        isRefreshingScorePromise = null;
      }
    })();

    return isRefreshingScorePromise;
  },
}));
