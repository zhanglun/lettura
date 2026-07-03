import { useTranslation } from "react-i18next";
import { Clock, X } from "lucide-react";
import type { SavedSearch } from "./types";

interface SearchSidebarProps {
  savedSearches: SavedSearch[];
  recentSearches: string[];
  onApplySearch: (text: string) => void;
  onRemoveSavedSearch: (label: string) => void;
}

export function SearchSidebar({
  savedSearches,
  recentSearches,
  onApplySearch,
  onRemoveSavedSearch,
}: SearchSidebarProps) {
  const { t } = useTranslation();

  return (
    <aside className="hidden w-[276px] shrink-0 flex-col border-r border-[var(--gray-5)] bg-[var(--gray-2)] md:flex">
      <div className="border-b border-[var(--gray-5)] p-4">
        <div className="text-sm font-semibold text-[var(--gray-12)]">
          Search
        </div>
        <div className="mt-1 text-xs leading-5 text-[var(--gray-10)]">
          {t("search.sidebar.subtitle")}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 scrollbar-gutter">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
          {t("search.sidebar.saved")}
        </div>
        <div className="grid gap-1">
          {savedSearches.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-[var(--gray-9)]">
              {t("search.sidebar.no_saved")}
            </div>
          ) : (
            savedSearches.map((item) => (
              <div key={item.label} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onApplySearch(item.label)}
                  className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-9)]" />
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-[var(--gray-9)]">
                    {item.count}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveSavedSearch(item.label)}
                  className="hidden shrink-0 rounded p-0.5 text-[var(--gray-9)] hover:text-[var(--gray-11)] group-hover:block"
                >
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
          {t("search.sidebar.recent")}
        </div>
        {recentSearches.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-[var(--gray-9)]">
            {t("search.sidebar.no_recent")}
          </div>
        ) : (
          recentSearches.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => onApplySearch(item)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
            >
              <Clock size={12} />
              {item}
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
