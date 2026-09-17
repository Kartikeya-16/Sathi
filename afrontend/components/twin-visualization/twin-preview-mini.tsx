"use client";

import { motion } from "motion/react";

interface TwinPreviewMiniProps {
  completedSteps: number;
  totalSteps: number;
}

function getFill(progress: number) {
  if (progress < 0.4) return "var(--color-clay)";
  if (progress < 0.8) return "var(--color-marigold)";
  return "var(--color-emerald)";
}

export function TwinPreviewMini({
  completedSteps,
  totalSteps,
}: TwinPreviewMiniProps) {
  const progress = completedSteps / totalSteps;
  const center = 70;
  const orbitRadius = 46;

  const dots = Array.from({ length: totalSteps }, (_, i) => {
    const angle = (i / totalSteps) * Math.PI * 2 - Math.PI / 2;
    const x = center + orbitRadius * Math.cos(angle);
    const y = center + orbitRadius * Math.sin(angle);
    const isCompleted = i < completedSteps;

    return { x, y, isCompleted, index: i };
  });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 140 140" className="w-32 h-32 overflow-visible">
        <circle
          cx={center}
          cy={center}
          r={orbitRadius}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth={1}
          strokeDasharray="3 4"
          opacity={0.25}
        />

        {/* Central mini core with offset shadow */}
        <g>
          <circle cx={center + 3} cy={center + 3} r={24} fill="var(--color-ink)" />
          <circle
            cx={center}
            cy={center}
            r={24}
            fill={getFill(progress)}
            stroke="var(--color-ink)"
            strokeWidth={1.5}
          />
          <text
            x={center}
            y={center + 4}
            textAnchor="middle"
            className="fill-paper font-mono text-[10px] font-bold ticker-num"
          >
            {Math.round(progress * 100)}%
          </text>
        </g>

        {/* Step dots */}
        {dots.map((dot) => (
          <motion.g
            key={dot.index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: dot.index * 0.05 }}
          >
            {dot.isCompleted ? (
              <g>
                <circle cx={dot.x + 1.5} cy={dot.y + 1.5} r={5} fill="var(--color-ink)" />
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={5}
                  fill="var(--color-marigold)"
                  stroke="var(--color-ink)"
                  strokeWidth={1.2}
                />
              </g>
            ) : (
              <circle
                cx={dot.x}
                cy={dot.y}
                r={4}
                fill="var(--color-paper)"
                stroke="var(--color-ink)"
                strokeWidth={1}
                opacity={0.4}
              />
            )}
          </motion.g>
        ))}
      </svg>
      <p className="mt-2 font-mono text-[11px] text-ink/70 uppercase tracking-wider">
        Step {completedSteps} of {totalSteps} complete
      </p>
    </div>
  );
}
