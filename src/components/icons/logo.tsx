import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: "w-5 h-5", box: "w-7 h-7", text: "text-sm" },
  md: { icon: "w-4 h-4", box: "w-8 h-8", text: "text-lg" },
  lg: { icon: "w-6 h-6", box: "w-10 h-10", text: "text-xl" },
};

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl text-white shadow-md shadow-primary/20",
          s.box
        )}
        style={{
          background: "linear-gradient(135deg, oklch(0.45 0.19 265), oklch(0.48 0.22 280))",
        }}
      >
        <Zap className={cn(s.icon, "drop-shadow-sm")} />
      </div>
      {showText && (
        <span className={cn("font-bold tracking-tight", s.text)}>
          SwiftReview
        </span>
      )}
    </div>
  );
}
