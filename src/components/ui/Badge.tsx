import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-black border border-black",
  success: "bg-tanne text-white border border-black",
  warning: "bg-sonne text-black border border-black",
  danger: "bg-signal text-white border border-black",
  info: "bg-himmel text-white border border-black",
};

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
