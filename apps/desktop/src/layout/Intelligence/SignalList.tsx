import { Signal } from "@/stores/createTodaySlice";
import { SignalCard } from "./SignalCard";

interface SignalListProps {
  signals: Signal[];
  activeReadingSignalId?: number | null;
  activeReadingSourceIndex?: number;
  onInlineRead?: (articleUuid: string, feedUuid: string, articleId: number) => void;
}

export function SignalList({ signals, activeReadingSignalId, activeReadingSourceIndex, onInlineRead }: SignalListProps) {
  return (
    <div className="flex flex-col gap-3">
      {signals.map((signal, index) => {
        const isReadingSignal =
          activeReadingSignalId != null && activeReadingSignalId === signal.id;

        return (
          <div
            key={signal.id}
            data-signal-id={signal.id}
            className="animate-in fade-in slide-in-from-bottom-2 transition-opacity duration-300"
            style={{
              animationDelay: `${index * 50}ms`,
              animationFillMode: "both",
            }}
          >
            <SignalCard
              signal={signal}
              onInlineRead={onInlineRead}
              activeReadingSourceIndex={
                isReadingSignal ? activeReadingSourceIndex : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}
