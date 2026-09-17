"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { TRANSITION } from "@/lib/motion";
import { Check } from "lucide-react";

interface StepWizardProps {
  steps: string[];
  currentStep: number;
}

export function StepWizard({ steps, currentStep }: StepWizardProps) {
  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((label, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            {/* Dot */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.15 : 1,
                  backgroundColor: isCompleted
                    ? "var(--indigo)"
                    : isActive
                      ? "var(--marigold)"
                      : "var(--border)",
                }}
                transition={TRANSITION.micro}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                  isCompleted
                    ? "text-paper"
                    : isActive
                      ? "text-ink"
                      : "text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </motion.div>
              <span
                className={cn(
                  "text-[10px] leading-tight text-center max-w-[64px] hidden sm:block",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>

            {/* Connecting line */}
            {i < steps.length - 1 && (
              <div className="flex-1 mx-1.5 h-0.5 rounded-full bg-border relative overflow-hidden self-start mt-4">
                <motion.div
                  initial={false}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={TRANSITION.component}
                  className="absolute inset-0 bg-indigo origin-left"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
