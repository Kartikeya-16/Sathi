"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useTwinStore } from "@/store/twin-store";
import { pageVariants, fadeInUp, staggerContainer } from "@/lib/motion";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Plus,
  Loader2,
  PiggyBank,
  Lock,
  TrendingUp,
  Home,
  Car,
  Coins,
  Wallet,
  Scale,
  CreditCard,
  GraduationCap,
  UserCheck,
  Utensils,
  Zap,
  HeartPulse,
  Film,
  ShoppingBag,
  ShieldCheck,
  Receipt,
  Briefcase,
  Building2,
  Award,
  ShieldAlert,
  Target,
  User,
  ArrowUpRight,
  Info,
  Sparkles,
  Plane,
  Heart,
  Sunset,
  DollarSign,
  Building,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import {
  OccupationType,
  EducationLevel,
  FrequencyType,
  ExpenseCategory,
  AssetType,
  LiabilityType,
  GoalType,
  GoalPriority,
  GoalStatus,
} from "@/lib/types";
import {
  addIncome,
  addExpense,
  addAsset,
  addLiability,
  addGoal,
} from "@/lib/api/twin";
import { useTranslation } from "@/lib/i18n";

function enumToLabel(val: string) {
  if (!val) return "";
  return val
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Icon Resolution Helpers ── */

function getAssetIcon(type: AssetType | string) {
  switch (type) {
    case AssetType.SAVINGS:
      return PiggyBank;
    case AssetType.FIXED_DEPOSIT:
      return Lock;
    case AssetType.STOCKS:
    case AssetType.MUTUAL_FUNDS:
      return TrendingUp;
    case AssetType.REAL_ESTATE:
      return Home;
    case AssetType.VEHICLE:
      return Car;
    case AssetType.GOLD:
      return Coins;
    default:
      return Wallet;
  }
}

function getLiabilityIcon(type: LiabilityType | string) {
  switch (type) {
    case LiabilityType.HOME_LOAN:
      return Home;
    case LiabilityType.CAR_LOAN:
      return Car;
    case LiabilityType.EDUCATION_LOAN:
      return GraduationCap;
    case LiabilityType.CREDIT_CARD:
      return CreditCard;
    case LiabilityType.PERSONAL_LOAN:
      return UserCheck;
    default:
      return Scale;
  }
}

function getExpenseIcon(cat: ExpenseCategory | string) {
  switch (cat) {
    case ExpenseCategory.FOOD:
      return Utensils;
    case ExpenseCategory.HOUSING:
      return Home;
    case ExpenseCategory.TRANSPORT:
      return Car;
    case ExpenseCategory.UTILITIES:
      return Zap;
    case ExpenseCategory.HEALTHCARE:
      return HeartPulse;
    case ExpenseCategory.EDUCATION:
      return GraduationCap;
    case ExpenseCategory.ENTERTAINMENT:
      return Film;
    case ExpenseCategory.CLOTHING:
      return ShoppingBag;
    case ExpenseCategory.INSURANCE:
      return ShieldCheck;
    default:
      return Receipt;
  }
}

function getIncomeIcon(source: string) {
  const s = source.toLowerCase();
  if (s.includes("salary") || s.includes("job") || s.includes("wages")) return Briefcase;
  if (s.includes("business") || s.includes("enterprise") || s.includes("shop")) return Building2;
  if (s.includes("invest") || s.includes("dividend") || s.includes("stock")) return TrendingUp;
  if (s.includes("rent") || s.includes("lease")) return Home;
  if (s.includes("pension") || s.includes("annuity")) return Award;
  return Coins;
}

function getGoalIcon(type: GoalType | string) {
  switch (type) {
    case GoalType.EMERGENCY_FUND:
      return ShieldAlert;
    case GoalType.HOME_PURCHASE:
      return Home;
    case GoalType.VEHICLE_PURCHASE:
      return Car;
    case GoalType.EDUCATION:
      return GraduationCap;
    case GoalType.RETIREMENT:
      return Sunset;
    case GoalType.TRAVEL:
      return Plane;
    case GoalType.WEDDING:
      return Heart;
    default:
      return Target;
  }
}

type TabKey = "profile" | "income" | "expenses" | "assets" | "liabilities" | "goals";

export default function TwinPage() {
  const {
    profile,
    incomeSources,
    expenses,
    assets,
    liabilities,
    goals,
    isLoading,
    fetchAllTwinData,
  } = useTwinStore();

  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [savedName, setSavedName] = useState<string>("");
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("arthsaathi_user_demographics");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.full_name) setSavedName(parsed.full_name);
        }
      } catch {}
    }
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-8">
        <Skeleton className="h-10 w-72 bg-ink/10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 bg-ink/10" />
          <Skeleton className="h-28 bg-ink/10" />
          <Skeleton className="h-28 bg-ink/10" />
          <Skeleton className="h-28 bg-ink/10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Skeleton className="h-96 md:col-span-3 bg-ink/10" />
          <Skeleton className="h-96 md:col-span-9 bg-ink/10" />
        </div>
      </div>
    );
  }

  /* ── Financial Computations ── */
  const totalAssets = assets.reduce((sum, a) => sum + Number(a.current_value || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.outstanding_amount || 0), 0);
  const totalMonthlyEMI = liabilities.reduce((sum, l) => sum + Number(l.emi_amount || 0), 0);

  // Normalize monthly income
  const totalMonthlyIncome =
    incomeSources.length > 0
      ? incomeSources.reduce((sum, inc) => {
          const amt = Number(inc.amount || 0);
          switch (inc.frequency) {
            case FrequencyType.ANNUAL:
              return sum + amt / 12;
            case FrequencyType.WEEKLY:
              return sum + amt * 4.33;
            case FrequencyType.ONE_TIME:
              return sum;
            default:
              return sum + amt;
          }
        }, 0)
      : Number(profile?.monthly_income || 0);

  // Normalize monthly expenses
  const totalMonthlyExpenses = expenses.reduce((sum, exp) => {
    const amt = Number(exp.amount || 0);
    switch (exp.frequency) {
      case FrequencyType.ANNUAL:
        return sum + amt / 12;
      case FrequencyType.WEEKLY:
        return sum + amt * 4.33;
      case FrequencyType.ONE_TIME:
        return sum;
      default:
        return sum + amt;
    }
  }, 0);

  const netWorth = totalAssets - totalLiabilities;
  const monthlyCashFlow = totalMonthlyIncome - totalMonthlyExpenses - totalMonthlyEMI;
  const savingsRate = totalMonthlyIncome > 0 ? (monthlyCashFlow / totalMonthlyIncome) * 100 : 0;

  const tabsConfig: {
    key: TabKey;
    label: string;
    icon: any;
    count?: number;
    summary: string;
  }[] = [
    {
      key: "profile",
      label: t("twin.tab.profile", "Profile"),
      icon: User,
      summary: profile?.occupation ? `${profile.occupation}` : t("twin.tab.profile", "Demographics"),
    },
    {
      key: "income",
      label: t("twin.tab.income", "Income"),
      icon: Briefcase,
      count: incomeSources.length,
      summary: `${formatINR(totalMonthlyIncome)}/mo`,
    },
    {
      key: "expenses",
      label: t("twin.tab.expenses", "Expenses"),
      icon: Receipt,
      count: expenses.length,
      summary: `${formatINR(totalMonthlyExpenses)}/mo`,
    },
    {
      key: "assets",
      label: t("twin.tab.assets", "Assets"),
      icon: PiggyBank,
      count: assets.length,
      summary: formatINR(totalAssets),
    },
    {
      key: "liabilities",
      label: t("twin.tab.liabilities", "Liabilities"),
      icon: Scale,
      count: liabilities.length,
      summary: formatINR(totalLiabilities),
    },
    {
      key: "goals",
      label: t("twin.tab.goals", "Goals"),
      icon: Target,
      count: goals.length,
      summary: `${goals.filter((g) => g.status === "ACTIVE").length} active`,
    },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-7xl mx-auto space-y-6 pb-12"
    >
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-[1.5px] border-ink pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              {savedName ? `${savedName}'s ${t("nav.twin", "Financial Twin")}` : t("nav.twin", "Financial Twin")}
            </h1>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-ink bg-marigold text-ink shadow-[1px_1px_0_0_var(--color-ink)]">
              Digital Replica
            </span>
          </div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink/70 mt-1">
            {profile?.occupation ? `${profile.occupation} · ` : ""}
            {profile?.city ? `${profile.city}, ${profile.state || "India"} · ` : ""}
            Profile Mapped & Syncing
          </p>
        </div>
      </div>

      {/* 4 Summary Stat Cards (Health Score Weight & Treatment) */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Total Assets */}
        <motion.div variants={fadeInUp} className="paper-card p-5 space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-ink/65 tracking-wider">
              {t("metric.total_assets", "Total Assets")}
            </span>
            <PiggyBank className="w-4 h-4 text-emerald" />
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-ink ticker-num tracking-tight">
            {formatINR(totalAssets)}
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono text-ink/70 pt-1 border-t border-ink/15">
            <span>{assets.length} active holdings</span>
            <span className="text-emerald font-semibold">
              {assets.length > 0 ? enumToLabel(assets[0].asset_type) : "No assets"}
            </span>
          </div>
        </motion.div>

        {/* Card 2: Total Liabilities */}
        <motion.div variants={fadeInUp} className="paper-card p-5 space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-ink/65 tracking-wider">
              {t("metric.total_liabilities", "Total Liabilities")}
            </span>
            <Scale className="w-4 h-4 text-clay" />
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-ink ticker-num tracking-tight">
            {formatINR(totalLiabilities)}
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono text-ink/70 pt-1 border-t border-ink/15">
            <span>{liabilities.length} recorded debt obligations</span>
            <span className={cn("font-semibold", totalMonthlyEMI > 0 ? "text-clay" : "text-ink/60")}>
              {formatINR(totalMonthlyEMI)}/mo EMI
            </span>
          </div>
        </motion.div>

        {/* Card 3: Estimated Net Worth */}
        <motion.div variants={fadeInUp} className="paper-card p-5 space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-ink/65 tracking-wider">
              {t("metric.net_worth", "Estimated Net Worth")}
            </span>
            <TrendingUp className={cn("w-4 h-4", netWorth >= 0 ? "text-emerald" : "text-clay")} />
          </div>
          <p className={cn("font-mono text-2xl sm:text-3xl font-bold ticker-num tracking-tight", netWorth >= 0 ? "text-ink" : "text-clay")}>
            {netWorth < 0 ? "-" : ""}
            {formatINR(Math.abs(netWorth))}
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono text-ink/70 pt-1 border-t border-ink/15">
            <span>Solvency Ratio</span>
            <span className={cn("font-bold", netWorth >= 0 ? "text-emerald" : "text-clay")}>
              {totalLiabilities > 0
                ? `${((totalAssets / totalLiabilities) * 100).toFixed(0)}% Coverage`
                : "100% Debt-Free"}
            </span>
          </div>
        </motion.div>

        {/* Card 4: Monthly Cash Flow */}
        <motion.div variants={fadeInUp} className="paper-card p-5 space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-ink/65 tracking-wider">
              {t("metric.monthly_cashflow", "Monthly Cash Flow")}
            </span>
            <ArrowUpRight className={cn("w-4 h-4", monthlyCashFlow >= 0 ? "text-emerald" : "text-clay")} />
          </div>
          <p className={cn("font-mono text-2xl sm:text-3xl font-bold ticker-num tracking-tight", monthlyCashFlow >= 0 ? "text-emerald" : "text-clay")}>
            {monthlyCashFlow >= 0 ? "+" : ""}
            {formatINR(monthlyCashFlow)}
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono text-ink/70 pt-1 border-t border-ink/15">
            <span>Net Monthly Surplus</span>
            <span className="font-bold text-ink">
              {savingsRate > 0 ? `${savingsRate.toFixed(0)}% ${t("metric.savings_rate", "Savings Rate")}` : "Deficit / Tight"}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Two-Column Layout: Left Navigation Rail + Right Content Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Persistent Navigation Rail */}
        <div className="md:col-span-4 lg:col-span-3 space-y-2">
          <div className="paper-card p-3 space-y-1.5">
            <div className="px-3 py-2 border-b border-ink/15 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60 font-bold">
                Financial Modules
              </span>
            </div>

            {tabsConfig.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "w-full text-left flex items-center justify-between px-3.5 py-3 rounded transition-all border-[1.5px] select-none",
                    isActive
                      ? "bg-ink text-paper border-ink shadow-[2px_2px_0_0_var(--color-ink)] font-semibold"
                      : "border-transparent text-ink/75 hover:text-ink hover:bg-ink/5 hover:border-ink/20"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-marigold" : "text-ink/60"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-sans truncate leading-tight font-medium">
                        {tab.label}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] font-mono truncate mt-0.5",
                          isActive ? "text-paper/70" : "text-ink/55"
                        )}
                      >
                        {tab.summary}
                      </p>
                    </div>
                  </div>

                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ml-2 shrink-0 border",
                        isActive
                          ? "bg-marigold text-ink border-marigold"
                          : "bg-paper text-ink border-ink/20 shadow-[1px_1px_0_0_var(--color-ink)]"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Context Summary Tip */}
          <div className="p-4 rounded border border-ink/25 bg-paper/60 space-y-1.5 text-xs text-ink/75 font-sans">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-ink uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-marigold" /> Real-time Simulation
            </div>
            <p className="leading-relaxed text-[11px] text-ink/70">
              Every asset, loan, or expense updated here automatically recalculates your Financial Health Score, Scam Risk Tolerance, and Scheme Eligibility across the platform.
            </p>
          </div>
        </div>

        {/* Right Full-Width Content Panel */}
        <div className="md:col-span-8 lg:col-span-9 min-w-0">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="paper-card p-6 sm:p-7 space-y-6"
          >
            {/* Tab: Profile */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-4">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                      Personal & Career Demographics
                    </h2>
                    <p className="font-mono text-[11px] text-ink/65 uppercase tracking-wider mt-0.5">
                      Core parameters establishing your financial baseline
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs border-ink bg-paper shadow-[1px_1px_0_0_var(--color-ink)]">
                    Profile Mapped
                  </Badge>
                </div>

                {profile ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {[
                      ["Age", `${profile.age} years`, "Personal", User],
                      ["Location", `${profile.city}, ${profile.state}`, "Geography", Home],
                      ["Occupation", profile.occupation, "Career", Briefcase],
                      ["Employment Type", enumToLabel(profile.occupation_type), "Career", Building2],
                      ["Stated Monthly Income", formatINR(Number(profile.monthly_income)), "Cashflow", DollarSign],
                      ["Education Level", enumToLabel(profile.education_level), "Education", GraduationCap],
                      ["Marital Status", enumToLabel(profile.marital_status), "Family", Heart],
                      ["Dependents", profile.dependents_count === 0 ? "None (0)" : `${profile.dependents_count} dependents`, "Family", UserCheck],
                      ["Risk Appetite", enumToLabel(profile.risk_appetite), "Portfolio", ShieldCheck],
                    ].map(([label, value, tag, Icon]: any) => (
                      <div
                        key={String(label)}
                        className="p-4 rounded border border-ink/25 bg-paper hover:border-ink hover:shadow-[2px_2px_0_0_var(--color-ink)] transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/60">
                            {String(label)}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-ink/20 bg-ink/5 text-ink">
                            {String(tag)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Icon className="w-4 h-4 text-marigold shrink-0" />
                          <p className="font-serif text-base font-bold text-ink truncate">
                            {String(value)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-ink/60 font-sans text-sm">
                    No profile recorded yet.
                  </div>
                )}
              </div>
            )}

            {/* Tab: Income */}
            {activeTab === "income" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-4">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                      Income Streams & Inflows
                    </h2>
                    <p className="font-mono text-[11px] text-ink/65 uppercase tracking-wider mt-0.5">
                      {incomeSources.length} source{incomeSources.length !== 1 ? "s" : ""} totaling {formatINR(totalMonthlyIncome)}/month
                    </p>
                  </div>
                  <AddIncomeDialog onSuccess={fetchAllTwinData} />
                </div>

                {incomeSources.length > 0 ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded border-[1.5px] border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b-[1.5px] border-ink bg-ink/5">
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Income Stream
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Amount
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Frequency
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider">
                              Normalized Monthly
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink/15">
                          {incomeSources.map((inc) => {
                            const Icon = getIncomeIcon(inc.source);
                            const amt = Number(inc.amount);
                            const monthlyAmt =
                              inc.frequency === FrequencyType.ANNUAL
                                ? amt / 12
                                : inc.frequency === FrequencyType.WEEKLY
                                ? amt * 4.33
                                : amt;

                            return (
                              <tr key={inc.id} className="hover:bg-marigold/10 transition-colors">
                                <td className="p-3 text-ink font-medium border-r last:border-r-0 border-ink/15">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded border border-ink/25 bg-paper flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_var(--color-ink)]">
                                      <Icon className="w-3.5 h-3.5 text-ink" />
                                    </div>
                                    <span className="font-semibold text-ink text-sm">{inc.source}</span>
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-sm font-bold text-ink ticker-num border-r last:border-r-0 border-ink/15">
                                  {formatINR(amt)}
                                </td>
                                <td className="p-3 border-r last:border-r-0 border-ink/15">
                                  <span className="font-mono text-[11px] uppercase font-semibold px-2 py-0.5 rounded border border-ink/20 bg-paper">
                                    {enumToLabel(inc.frequency)}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-sm text-emerald font-bold ticker-num">
                                  {formatINR(monthlyAmt)}/mo
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Sparse state prompt when 1 income source */}
                    {incomeSources.length === 1 && (
                      <div className="p-4 rounded border-2 border-dashed border-ink/30 bg-ink/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-serif text-sm font-bold text-ink flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-marigold" /> Add Secondary Income Stream
                          </p>
                          <p className="font-sans text-xs text-ink/75 leading-relaxed">
                            Have freelance earnings, rental income, or investments? Recording all streams improves your debt capacity and loan qualification calculations.
                          </p>
                        </div>
                        <AddIncomeDialog
                          onSuccess={fetchAllTwinData}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 border-ink bg-paper text-ink font-mono text-xs font-bold uppercase shadow-[1.5px_1.5px_0_0_var(--color-ink)] hover:bg-marigold"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Add Income
                            </Button>
                          }
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="paper-card p-10 text-center space-y-3">
                    <Briefcase className="w-10 h-10 mx-auto text-ink/40" />
                    <h3 className="font-serif text-lg font-bold text-ink">No Income Streams Added</h3>
                    <p className="font-sans text-xs text-ink/70 max-w-md mx-auto leading-relaxed">
                      Add your salary, business revenue, or freelance income to track monthly cashflow and unlock accurate savings recommendations.
                    </p>
                    <div className="pt-2">
                      <AddIncomeDialog onSuccess={fetchAllTwinData} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Expenses */}
            {activeTab === "expenses" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-4">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                      Monthly Expenses & Outflows
                    </h2>
                    <p className="font-mono text-[11px] text-ink/65 uppercase tracking-wider mt-0.5">
                      {expenses.length} categor{expenses.length !== 1 ? "ies" : "y"} totaling {formatINR(totalMonthlyExpenses)}/month
                    </p>
                  </div>
                  <AddExpenseDialog onSuccess={fetchAllTwinData} />
                </div>

                {expenses.length > 0 ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded border-[1.5px] border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b-[1.5px] border-ink bg-ink/5">
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Expense Category
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Amount
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Frequency
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider">
                              % of Income
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink/15">
                          {expenses.map((exp) => {
                            const Icon = getExpenseIcon(exp.category);
                            const amt = Number(exp.amount);
                            const ratio = totalMonthlyIncome > 0 ? (amt / totalMonthlyIncome) * 100 : 0;

                            return (
                              <tr key={exp.id} className="hover:bg-marigold/10 transition-colors">
                                <td className="p-3 text-ink font-medium border-r last:border-r-0 border-ink/15">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded border border-ink/25 bg-paper flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_var(--color-ink)]">
                                      <Icon className="w-3.5 h-3.5 text-ink" />
                                    </div>
                                    <span className="font-semibold text-ink text-sm">
                                      {enumToLabel(exp.category)}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-sm font-bold text-ink ticker-num border-r last:border-r-0 border-ink/15">
                                  {formatINR(amt)}
                                </td>
                                <td className="p-3 border-r last:border-r-0 border-ink/15">
                                  <span className="font-mono text-[11px] uppercase font-semibold px-2 py-0.5 rounded border border-ink/20 bg-paper">
                                    {enumToLabel(exp.frequency)}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-xs text-ink/75 font-bold">
                                  {totalMonthlyIncome > 0 ? `${ratio.toFixed(1)}%` : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Sparse state prompt when 1 expense */}
                    {expenses.length === 1 && (
                      <div className="p-4 rounded border-2 border-dashed border-ink/30 bg-ink/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-serif text-sm font-bold text-ink flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-marigold" /> Track Housing, Utilities & Food
                          </p>
                          <p className="font-sans text-xs text-ink/75 leading-relaxed">
                            A complete expense profile separates essential fixed needs from discretionary spends, helping your Twin detect runaway costs early.
                          </p>
                        </div>
                        <AddExpenseDialog
                          onSuccess={fetchAllTwinData}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 border-ink bg-paper text-ink font-mono text-xs font-bold uppercase shadow-[1.5px_1.5px_0_0_var(--color-ink)] hover:bg-marigold"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Add Expense
                            </Button>
                          }
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="paper-card p-10 text-center space-y-3">
                    <Receipt className="w-10 h-10 mx-auto text-ink/40" />
                    <h3 className="font-serif text-lg font-bold text-ink">No Expenses Recorded</h3>
                    <p className="font-sans text-xs text-ink/70 max-w-md mx-auto leading-relaxed">
                      Add monthly groceries, rent, utilities, or insurance to establish your essential living costs.
                    </p>
                    <div className="pt-2">
                      <AddExpenseDialog onSuccess={fetchAllTwinData} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Assets */}
            {activeTab === "assets" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-4">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                      Registered Assets & Wealth
                    </h2>
                    <p className="font-mono text-[11px] text-ink/65 uppercase tracking-wider mt-0.5">
                      {assets.length} registered asset{assets.length !== 1 ? "s" : ""} totaling {formatINR(totalAssets)}
                    </p>
                  </div>
                  <AddAssetDialog onSuccess={fetchAllTwinData} />
                </div>

                {assets.length > 0 ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded border-[1.5px] border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b-[1.5px] border-ink bg-ink/5">
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Asset Type
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Asset / Holding Name
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Current Value
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider">
                              Portfolio Share
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink/15">
                          {assets.map((a) => {
                            const Icon = getAssetIcon(a.asset_type);
                            const val = Number(a.current_value);
                            const share = totalAssets > 0 ? (val / totalAssets) * 100 : 0;

                            return (
                              <tr key={a.id} className="hover:bg-marigold/10 transition-colors">
                                <td className="p-3 text-ink border-r last:border-r-0 border-ink/15">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded border border-ink/25 bg-paper flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_var(--color-ink)]">
                                      <Icon className="w-3.5 h-3.5 text-ink" />
                                    </div>
                                    <span className="font-mono text-[11px] uppercase font-bold px-2 py-0.5 rounded border border-ink/20 bg-paper">
                                      {enumToLabel(a.asset_type)}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 font-semibold text-ink text-sm border-r last:border-r-0 border-ink/15">
                                  {a.name}
                                </td>
                                <td className="p-3 font-mono text-sm font-bold text-ink ticker-num border-r last:border-r-0 border-ink/15">
                                  {formatINR(val)}
                                </td>
                                <td className="p-3 font-mono text-xs text-ink/75 font-semibold">
                                  {totalAssets > 0 ? `${share.toFixed(1)}%` : "100%"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Sparse state prompt when 0 or 1 item */}
                    {assets.length <= 1 && (
                      <div className="p-4 rounded border-2 border-dashed border-ink/30 bg-ink/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-serif text-sm font-bold text-ink flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-marigold" /> Build a Resilient Asset Foundation
                          </p>
                          <p className="font-sans text-xs text-ink/75 leading-relaxed">
                            Most balanced portfolios in India combine liquid Savings with Mutual Funds, Fixed Deposits, Gold, or Real Estate. Registering other assets increases your digital twin's financial strength score.
                          </p>
                        </div>
                        <AddAssetDialog
                          onSuccess={fetchAllTwinData}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 border-ink bg-paper text-ink font-mono text-xs font-bold uppercase shadow-[1.5px_1.5px_0_0_var(--color-ink)] hover:bg-marigold"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Add Another Asset
                            </Button>
                          }
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="paper-card p-10 text-center space-y-3">
                    <PiggyBank className="w-10 h-10 mx-auto text-ink/40" />
                    <h3 className="font-serif text-lg font-bold text-ink">No Assets Added Yet</h3>
                    <p className="font-sans text-xs text-ink/70 max-w-md mx-auto leading-relaxed">
                      Track your bank balances, fixed deposits, mutual funds, gold, or property to calculate your true net worth.
                    </p>
                    <div className="pt-2">
                      <AddAssetDialog onSuccess={fetchAllTwinData} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Liabilities */}
            {activeTab === "liabilities" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-4">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                      Liabilities, Loans & Debt
                    </h2>
                    <p className="font-mono text-[11px] text-ink/65 uppercase tracking-wider mt-0.5">
                      {liabilities.length} active loan{liabilities.length !== 1 ? "s" : ""} totaling {formatINR(totalLiabilities)}
                    </p>
                  </div>
                  <AddLiabilityDialog onSuccess={fetchAllTwinData} />
                </div>

                {liabilities.length > 0 ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded border-[1.5px] border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b-[1.5px] border-ink bg-ink/5">
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Debt Type
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Lender / Loan Name
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Outstanding Amount
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Monthly EMI
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider">
                              Interest Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink/15">
                          {liabilities.map((l) => {
                            const Icon = getLiabilityIcon(l.liability_type);
                            const outAmt = Number(l.outstanding_amount);
                            const emiAmt = l.emi_amount ? Number(l.emi_amount) : 0;

                            return (
                              <tr key={l.id} className="hover:bg-marigold/10 transition-colors">
                                <td className="p-3 text-ink border-r last:border-r-0 border-ink/15">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded border border-ink/25 bg-paper flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_var(--color-ink)]">
                                      <Icon className="w-3.5 h-3.5 text-clay" />
                                    </div>
                                    <span className="font-mono text-[11px] uppercase font-bold px-2 py-0.5 rounded border border-ink/20 bg-paper">
                                      {enumToLabel(l.liability_type)}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 font-semibold text-ink text-sm border-r last:border-r-0 border-ink/15">
                                  {l.name}
                                </td>
                                <td className="p-3 font-mono text-sm font-bold text-clay ticker-num border-r last:border-r-0 border-ink/15">
                                  {formatINR(outAmt)}
                                </td>
                                <td className="p-3 font-mono text-sm font-semibold text-ink ticker-num border-r last:border-r-0 border-ink/15">
                                  {emiAmt > 0 ? formatINR(emiAmt) : "—"}
                                </td>
                                <td className="p-3 font-mono text-xs text-ink/80 font-bold">
                                  {l.interest_rate ? `${l.interest_rate}% p.a.` : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Sparse state prompt when 1 liability */}
                    {liabilities.length === 1 && (
                      <div className="p-4 rounded border-2 border-dashed border-ink/30 bg-ink/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-serif text-sm font-bold text-ink flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-clay" /> Debt Consolidation & Prepayment Optimization
                          </p>
                          <p className="font-sans text-xs text-ink/75 leading-relaxed">
                            Have education loans, credit card balances, or personal lines of credit? Mapping all debts enables the Smart Planner to suggest high-impact debt payoff strategies.
                          </p>
                        </div>
                        <AddLiabilityDialog
                          onSuccess={fetchAllTwinData}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 border-ink bg-paper text-ink font-mono text-xs font-bold uppercase shadow-[1.5px_1.5px_0_0_var(--color-ink)] hover:bg-marigold"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Add Liability
                            </Button>
                          }
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="paper-card p-10 text-center space-y-3 bg-emerald/5 border-emerald">
                    <ShieldCheck className="w-10 h-10 mx-auto text-emerald" />
                    <h3 className="font-serif text-lg font-bold text-ink">Debt Free · Zero Liabilities</h3>
                    <p className="font-sans text-xs text-ink/70 max-w-md mx-auto leading-relaxed">
                      You have zero outstanding loans or credit card obligations recorded. This gives you maximum savings capacity and prime borrowing rates.
                    </p>
                    <div className="pt-2">
                      <AddLiabilityDialog onSuccess={fetchAllTwinData} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Goals */}
            {activeTab === "goals" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-4">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                      Active Financial Goals
                    </h2>
                    <p className="font-mono text-[11px] text-ink/65 uppercase tracking-wider mt-0.5">
                      {goals.length} target{goals.length !== 1 ? "s" : ""} · {goals.filter((g) => g.status === "ACTIVE").length} in progress
                    </p>
                  </div>
                  <AddGoalDialog onSuccess={fetchAllTwinData} />
                </div>

                {goals.length > 0 ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded border-[1.5px] border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b-[1.5px] border-ink bg-ink/5">
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Goal & Category
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Target Amount
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Saved So Far
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Progress
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider border-r last:border-r-0 border-ink/20">
                              Priority
                            </th>
                            <th className="p-3 font-mono text-[11px] uppercase font-bold text-ink tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink/15">
                          {goals.map((g) => {
                            const Icon = getGoalIcon(g.goal_type);
                            const target = Number(g.target_amount);
                            const saved = Number(g.current_savings);
                            const progress = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

                            return (
                              <tr key={g.id} className="hover:bg-marigold/10 transition-colors">
                                <td className="p-3 text-ink border-r last:border-r-0 border-ink/15">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded border border-ink/25 bg-paper flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_var(--color-ink)]">
                                      <Icon className="w-3.5 h-3.5 text-marigold" />
                                    </div>
                                    <div>
                                      <span className="font-semibold text-ink text-sm block">{g.title}</span>
                                      <span className="font-mono text-[10px] text-ink/60 uppercase">
                                        {enumToLabel(g.goal_type)}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-sm font-bold text-ink ticker-num border-r last:border-r-0 border-ink/15">
                                  {formatINR(target)}
                                </td>
                                <td className="p-3 font-mono text-sm font-semibold text-emerald ticker-num border-r last:border-r-0 border-ink/15">
                                  {formatINR(saved)}
                                </td>
                                <td className="p-3 border-r last:border-r-0 border-ink/15 min-w-[140px]">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[10px] font-mono">
                                      <span className="font-bold text-ink">{progress}%</span>
                                      <span className="text-ink/60">{formatINR(Math.max(0, target - saved))} left</span>
                                    </div>
                                    <div className="w-full bg-ink/10 h-2 rounded-full overflow-hidden border border-ink/20">
                                      <div
                                        className="bg-emerald h-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 border-r last:border-r-0 border-ink/15">
                                  <span
                                    className={cn(
                                      "font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border",
                                      g.priority === GoalPriority.HIGH
                                        ? "bg-marigold text-ink border-ink"
                                        : "bg-paper text-ink/80 border-ink/20"
                                    )}
                                  >
                                    {g.priority}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-ink/30 bg-paper">
                                    {g.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Sparse state prompt when 0 or 1 goal */}
                    {goals.length <= 1 && (
                      <div className="p-4 rounded border-2 border-dashed border-ink/30 bg-ink/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-serif text-sm font-bold text-ink flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-marigold" /> Establish Milestones: Emergency Fund, Home & Retirement
                          </p>
                          <p className="font-sans text-xs text-ink/75 leading-relaxed">
                            Creating clear financial targets feeds into the Smart Planner simulation, computing the exact monthly savings needed to reach your life goals.
                          </p>
                        </div>
                        <AddGoalDialog
                          onSuccess={fetchAllTwinData}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 border-ink bg-paper text-ink font-mono text-xs font-bold uppercase shadow-[1.5px_1.5px_0_0_var(--color-ink)] hover:bg-marigold"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Add Another Goal
                            </Button>
                          }
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="paper-card p-10 text-center space-y-3">
                    <Target className="w-10 h-10 mx-auto text-ink/40" />
                    <h3 className="font-serif text-lg font-bold text-ink">No Financial Goals Created Yet</h3>
                    <p className="font-sans text-xs text-ink/70 max-w-md mx-auto leading-relaxed">
                      Define a 6-month emergency fund, a property down payment, or a retirement corpus to track your goal trajectory.
                    </p>
                    <div className="pt-2">
                      <AddGoalDialog onSuccess={fetchAllTwinData} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Consolidated & Styled Add Dialogs ── */

function AddIncomeDialog({
  onSuccess,
  trigger,
}: {
  onSuccess: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<FrequencyType>(FrequencyType.MONTHLY);

  async function handleSubmit() {
    setLoading(true);
    try {
      await addIncome({ source, amount: parseFloat(amount), frequency });
      toast.success("Income source added to Financial Twin");
      setOpen(false);
      setSource("");
      setAmount("");
      onSuccess();
    } catch {
      toast.error("Failed to add income");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <Button
            size="sm"
            className="border border-ink bg-paper text-ink font-mono text-xs font-bold uppercase shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-marigold transition-all"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Income
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="paper-card max-w-md bg-paper border-[1.5px] border-ink p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-bold text-ink">
            Add Income Stream
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="font-mono text-xs uppercase font-bold text-ink">Income Source</Label>
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Full-time Salary, Consultancy, Rental"
              className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-sans text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-xs uppercase font-bold text-ink">Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="85000"
              className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-xs uppercase font-bold text-ink">Payment Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as FrequencyType)}>
              <SelectTrigger className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]">
                {Object.values(FrequencyType).map((v) => (
                  <SelectItem key={v} value={v} className="font-mono text-xs">
                    {enumToLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading || !source || !amount}
            className="w-full border-[1.5px] border-ink bg-ink text-paper font-mono text-xs font-bold uppercase shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-marigold hover:text-ink transition-all mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Add Income Source
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddExpenseDialog({
  onSuccess,
  trigger,
}: {
  onSuccess: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.FOOD);
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<FrequencyType>(FrequencyType.MONTHLY);

  async function handleSubmit() {
    setLoading(true);
    try {
      await addExpense({ category, amount: parseFloat(amount), frequency });
      toast.success("Expense recorded");
      setOpen(false);
      setAmount("");
      onSuccess();
    } catch {
      toast.error("Failed to add expense");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <Button
            size="sm"
            className="border border-ink bg-paper text-ink font-mono text-xs font-bold uppercase shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-marigold transition-all"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="paper-card max-w-md bg-paper border-[1.5px] border-ink p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-bold text-ink">
            Record Monthly Expense
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="font-mono text-xs uppercase font-bold text-ink">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]">
                {Object.values(ExpenseCategory).map((v) => (
                  <SelectItem key={v} value={v} className="font-mono text-xs">
                    {enumToLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-xs uppercase font-bold text-ink">Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="15000"
              className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-xs uppercase font-bold text-ink">Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as FrequencyType)}>
              <SelectTrigger className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]">
                {Object.values(FrequencyType).map((v) => (
                  <SelectItem key={v} value={v} className="font-mono text-xs">
                    {enumToLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading || !amount}
            className="w-full border-[1.5px] border-ink bg-ink text-paper font-mono text-xs font-bold uppercase shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-marigold hover:text-ink transition-all mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Record Expense
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddAssetDialog({
  onSuccess,
  trigger,
}: {
  onSuccess: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assetType, setAssetType] = useState<AssetType>(AssetType.SAVINGS);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");

  async function handleSubmit() {
    setLoading(true);
    try {
      await addAsset({ asset_type: assetType, name, current_value: parseFloat(value) });
      toast.success("Asset recorded in portfolio");
      setOpen(false);
      setName("");
      setValue("");
      onSuccess();
    } catch {
      toast.error("Failed to add asset");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <Button
            size="sm"
            className="border border-ink bg-paper text-ink font-mono text-xs font-bold uppercase shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-marigold transition-all"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Asset
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="paper-card max-w-md bg-paper border-[1.5px] border-ink p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-bold text-ink">
            Register Asset
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="font-mono text-xs uppercase font-bold text-ink">Asset Type</Label>
            <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
              <SelectTrigger className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]">
                {Object.values(AssetType).map((v) => (
                  <SelectItem key={v} value={v} className="font-mono text-xs">
                    {enumToLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-xs uppercase font-bold text-ink">Asset / Holding Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HDFC Liquid Savings, Nifty 50 Index Fund, SBI FD"
              className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-sans text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-xs uppercase font-bold text-ink">Current Valuation (₹)</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="150000"
              className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-sm"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading || !name || !value}
            className="w-full border-[1.5px] border-ink bg-ink text-paper font-mono text-xs font-bold uppercase shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-marigold hover:text-ink transition-all mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Register Asset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddLiabilityDialog({
  onSuccess,
  trigger,
}: {
  onSuccess: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [liabilityType, setLiabilityType] = useState<LiabilityType>(LiabilityType.PERSONAL_LOAN);
  const [name, setName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [outstanding, setOutstanding] = useState("");
  const [emi, setEmi] = useState("");
  const [rate, setRate] = useState("");

  async function handleSubmit() {
    setLoading(true);
    try {
      await addLiability({
        liability_type: liabilityType,
        name,
        principal_amount: parseFloat(principal),
        outstanding_amount: parseFloat(outstanding),
        emi_amount: emi ? parseFloat(emi) : undefined,
        interest_rate: rate ? parseFloat(rate) : undefined,
      });
      toast.success("Liability added");
      setOpen(false);
      setName("");
      setPrincipal("");
      setOutstanding("");
      setEmi("");
      setRate("");
      onSuccess();
    } catch {
      toast.error("Failed to add liability");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <Button
            size="sm"
            className="border border-ink bg-paper text-ink font-mono text-xs font-bold uppercase shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-marigold transition-all"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Liability
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="paper-card max-w-md bg-paper border-[1.5px] border-ink p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-bold text-ink">
            Add Loan or Liability
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="font-mono text-xs uppercase font-bold text-ink">Liability Type</Label>
            <Select value={liabilityType} onValueChange={(v) => setLiabilityType(v as LiabilityType)}>
              <SelectTrigger className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]">
                {Object.values(LiabilityType).map((v) => (
                  <SelectItem key={v} value={v} className="font-mono text-xs">
                    {enumToLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-xs uppercase font-bold text-ink">Lender / Loan Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SBI Home Loan, ICICI Car Loan"
              className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-sans text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase font-bold text-ink">Principal (₹)</Label>
              <Input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="2500000"
                className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase font-bold text-ink">Outstanding (₹)</Label>
              <Input
                type="number"
                value={outstanding}
                onChange={(e) => setOutstanding(e.target.value)}
                placeholder="1950000"
                className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase font-bold text-ink">Monthly EMI (₹)</Label>
              <Input
                type="number"
                value={emi}
                onChange={(e) => setEmi(e.target.value)}
                placeholder="24500"
                className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase font-bold text-ink">Rate (% p.a.)</Label>
              <Input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="8.75"
                className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-sm"
              />
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading || !name || !principal || !outstanding}
            className="w-full border-[1.5px] border-ink bg-ink text-paper font-mono text-xs font-bold uppercase shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-marigold hover:text-ink transition-all mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Record Liability
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddGoalDialog({
  onSuccess,
  trigger,
}: {
  onSuccess: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState<GoalType>(GoalType.EMERGENCY_FUND);
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("0");
  const [priority, setPriority] = useState<GoalPriority>(GoalPriority.MEDIUM);
  const [targetDate, setTargetDate] = useState("");

  async function handleSubmit() {
    setLoading(true);
    try {
      await addGoal({
        title,
        goal_type: goalType,
        target_amount: parseFloat(target),
        current_savings: parseFloat(saved),
        priority,
        status: GoalStatus.ACTIVE,
        target_date: targetDate || undefined,
      });
      toast.success("Financial goal created");
      setOpen(false);
      setTitle("");
      setTarget("");
      setSaved("0");
      setTargetDate("");
      onSuccess();
    } catch {
      toast.error("Failed to add goal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <Button
            size="sm"
            className="border border-ink bg-paper text-ink font-mono text-xs font-bold uppercase shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-marigold transition-all"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="paper-card max-w-md bg-paper border-[1.5px] border-ink p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-bold text-ink">
            Create Financial Goal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="font-mono text-xs uppercase font-bold text-ink">Goal Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 6-Month Emergency Fund, House Down Payment"
              className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-sans text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-xs uppercase font-bold text-ink">Category</Label>
            <Select value={goalType} onValueChange={(v) => setGoalType(v as GoalType)}>
              <SelectTrigger className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]">
                {Object.values(GoalType).map((v) => (
                  <SelectItem key={v} value={v} className="font-mono text-xs">
                    {enumToLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase font-bold text-ink">Target Amount (₹)</Label>
              <Input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="500000"
                className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase font-bold text-ink">Saved So Far (₹)</Label>
              <Input
                type="number"
                value={saved}
                onChange={(e) => setSaved(e.target.value)}
                placeholder="100000"
                className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase font-bold text-ink">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as GoalPriority)}>
                <SelectTrigger className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]">
                  {Object.values(GoalPriority).map((v) => (
                    <SelectItem key={v} value={v} className="font-mono text-xs">
                      {enumToLabel(v)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase font-bold text-ink">Target Completion Date</Label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-mono text-xs"
              />
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading || !title || !target}
            className="w-full border-[1.5px] border-ink bg-ink text-paper font-mono text-xs font-bold uppercase shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-marigold hover:text-ink transition-all mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Create Goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
