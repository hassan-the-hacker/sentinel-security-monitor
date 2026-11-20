import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { SecurityGrade, SeverityLevel } from "@/types/scanner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGradeBadgeColor(grade: SecurityGrade): {
  bg: string;
  text: string;
  border: string;
  glow: string;
} {
  switch (grade) {
    case "A+":
    case "A":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        glow: "shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]",
      };
    case "B":
      return {
        bg: "bg-cyan-500/10",
        text: "text-cyan-400",
        border: "border-cyan-500/30",
        glow: "shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]",
      };
    case "C":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
        glow: "shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]",
      };
    case "D":
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        border: "border-orange-500/30",
        glow: "shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)]",
      };
    case "F":
    default:
      return {
        bg: "bg-red-500/10",
        text: "text-red-400",
        border: "border-red-500/30",
        glow: "shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]",
      };
  }
}

export function getSeverityBadge(severity: SeverityLevel): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (severity) {
    case "critical":
      return {
        label: "Critical",
        badgeClass: "bg-red-500/15 text-red-400 border border-red-500/30",
        dotClass: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
      };
    case "high":
      return {
        label: "High",
        badgeClass: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
        dotClass: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]",
      };
    case "medium":
      return {
        label: "Medium",
        badgeClass: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
        dotClass: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
      };
    case "low":
      return {
        label: "Low",
        badgeClass: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
        dotClass: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]",
      };
    case "safe":
      return {
        label: "Passed",
        badgeClass: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        dotClass: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
      };
    case "info":
    default:
      return {
        label: "Info",
        badgeClass: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
        dotClass: "bg-slate-400",
      };
  }
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

