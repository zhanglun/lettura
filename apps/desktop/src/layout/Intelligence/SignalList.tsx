import { Signal } from "@/stores/createTodaySlice";
import { SignalCard } from "./SignalCard";

interface SignalListProps {
  signals: Signal[];
}

export function SignalList({ signals }: SignalListProps) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {signals.map((signal, index) => (
        <div
          key={signal.id}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
        >
          <SignalCard signal={signal} />
        </div>
      ))}
    </div>
  );
}
