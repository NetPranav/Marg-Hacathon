import { Route } from "lucide-react";
import { clsx } from "clsx";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <Route className="w-6 h-6" strokeWidth={2.5} />
      <span className="font-bold text-xl tracking-tight">
        Marg
      </span>
    </div>
  );
}
