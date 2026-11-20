import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "cyan" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const variants = {
      primary:
        "bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-semibold shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)] hover:shadow-[0_0_20px_-2px_rgba(16,185,129,0.6)] focus:ring-emerald-400 border border-emerald-400/30",
      secondary:
        "bg-surface-100 hover:bg-surface-50 text-slate-200 border border-slate-700/60 hover:border-slate-600 focus:ring-slate-500",
      danger:
        "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 hover:border-red-500/60 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)] focus:ring-red-400",
      cyan:
        "bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-semibold shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_-2px_rgba(6,182,212,0.6)] focus:ring-cyan-400 border border-cyan-400/30",
      ghost:
        "bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white focus:ring-slate-600",
      outline:
        "bg-transparent hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 focus:ring-emerald-400",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-6 py-2.5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

