import { Star } from "lucide-react";

interface ReaderIconBtnProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  disabled?: boolean;
  /** Show text label next to icon */
  showLabel?: boolean;
  /** Icon size in px, defaults to 14 */
  iconSize?: number;
  onClick: () => void;
}

/**
 * Shared icon button primitive for reader toolbars.
 * Handles active/inactive/disabled states consistently across all reader contexts.
 */
export function ReaderIconBtn({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  showLabel = false,
  iconSize = 14,
  onClick,
}: ReaderIconBtnProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded transition-colors disabled:cursor-default disabled:opacity-40 ${
        showLabel ? "px-2 py-1 text-[11px]" : "p-1"
      } ${
        active
          ? "text-[var(--accent-9)]"
          : "text-[var(--gray-9)] hover:bg-[var(--gray-3)] hover:text-[var(--gray-12)]"
      }`}
    >
      <Icon
        size={iconSize}
        fill={Icon === Star && active ? "currentColor" : "none"}
      />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
