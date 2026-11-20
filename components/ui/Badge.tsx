import React from "react";
import { cn } from "@/lib/utils";
import { SeverityLevel, SecurityGrade } from "@/types/scanner";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "solid";
  severity?: SeverityLevel;
  grade?: SecurityGrade;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  severity,
  grade,
  dot = false,
  children,
  ...props
}) => {
  let badgeStyles = "bg-slate-800 text-slate-300 border-slate-700";
  let dotStyles = "bg-slate-400";

  if (severity) {
    switch (severity) {
      case "critical":
        badgeStyles = "bg-rose-500/10 text-rose-400 border-rose-500/20";
        dotStyles = "bg-rose-400";
        break;
      case "high":
        badgeStyles = "bg-orange-500/10 text-orange-400 border-orange-500/20";
        dotStyles = "bg-orange-400";
        break;
      case "medium":
        badgeStyles = "bg-amber-500/10 text-amber-400 border-amber-500/20";
        dotStyles = "bg-amber-400";
        break;
      case "low":
        badgeStyles = "bg-blue-500/10 text-blue-400 border-blue-500/20";
        dotStyles = "bg-blue-400";
        break;
      case "safe":
        badgeStyles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        dotStyles = "bg-emerald-400";
        break;
      case "info":
      default:
        badgeStyles = "bg-slate-500/10 text-slate-400 border-slate-500/20";
        dotStyles = "bg-slate-400";
        break;
    }
  } else if (grade) {
    switch (grade) {
      case "A+":
      case "A":
        badgeStyles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        dotStyles = "bg-emerald-400";
        break;
      case "B":
        badgeStyles = "bg-blue-500/10 text-blue-400 border-blue-500/20";
        dotStyles = "bg-blue-400";
        break;
      case "C":
        badgeStyles = "bg-amber-500/10 text-amber-400 border-amber-500/20";
        dotStyles = "bg-amber-400";
        break;
      case "D":
        badgeStyles = "bg-orange-500/10 text-orange-400 border-orange-500/20";
        dotStyles = "bg-orange-400";
        break;
      case "F":
      default:
        badgeStyles = "bg-rose-500/10 text-rose-400 border-rose-500/20";
        dotStyles = "bg-rose-400";
        break;
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide",
        badgeStyles,
        className
      )}
      {...props}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dotStyles)} />}
      {children}
    </span>
  );
};

