import { Signal } from "@/stores/createTodaySlice";
import { SignalCard } from "./SignalCard";

interface SignalListProps {
  signals: Signal[];
  activeReadingSignalId?: number | null;
  onInlineRead?: (articleUuid: string, feedUuid: string, articleId: number) => void;
}

export function SignalList({ signals, activeReadingSignalId, onInlineRead }: SignalListProps) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {signals.map((signal, index) => {
        const isActive = activeReadingSignalId != null && activeReadingSignalId === signal.id;
        const isDimmed = activeReadingSignalId != null && !isActive;

        return (
          <div
            key={signal.id}
            className="animate-in fade-in slide-in-from-bottom-2 transition-opacity duration-300"
            style={{
              animationDelay: `${index * 50}ms`,
              animationFillMode: "both",
              opacity: isDimmed ? 0.6 : 1,
            }}
          >
            <SignalCard
              signal={signal}
              isActive={isActive}
              onInlineRead={onInlineRead}
            />
          </div>
        );
      })}
    </div>
  );
}
