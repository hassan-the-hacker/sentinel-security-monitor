import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "emerald" | "cyan" | "red" | "none";
}

export const Card: React.FC<CardProps> = ({
  className,
  glow = "none",
  children,
  ...props
}) => {
  const glowStyles = {
    emerald: "border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_25px_-5px_rgba(16,185,129,0.15)]",
    cyan: "border-cyan-500/30 hover:border-cyan-500/60 shadow-[0_0_25px_-5px_rgba(6,182,212,0.15)]",
    red: "border-red-500/30 hover:border-red-500/60 shadow-[0_0_25px_-5px_rgba(239,68,68,0.15)]",
    none: "border-slate-800/80 hover:border-slate-700/80",
  };

  return (
    <div
      className={cn(
        "bg-surface-200/90 backdrop-blur-md rounded-xl border p-5 transition-all duration-200",
        glowStyles[glow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn("flex items-center justify-between pb-4 mb-4 border-b border-slate-800/60", className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={cn("text-base font-semibold text-slate-100 flex items-center gap-2", className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn("text-xs text-slate-400 mt-1", className)} {...props}>
    {children}
  </p>
);

