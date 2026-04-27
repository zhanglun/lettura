import { type LucideIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tooltip } from "@radix-ui/themes";
import { cn } from "@/helpers/cn";
import { useCallback } from "react";

interface RailItemProps {
  icon: LucideIcon;
  label: string;
  to?: string;
  onClick?: () => void;
  active?: boolean;
}

export function RailItem({ icon: Icon, label, to, onClick, active }: RailItemProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = active ?? (to ? location.pathname === to : false);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    }
  }, [onClick, to, navigate]);

  const button = (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-colors duration-150",
        isActive
          ? "bg-accent-9 text-white"
          : "bg-transparent text-gray-9 hover:bg-gray-4 hover:text-gray-12"
      )}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <Tooltip content={label} side="right">
      {button}
    </Tooltip>
  );
}
