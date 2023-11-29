import { useCallback, useEffect, useState } from "react";
import { debounce } from "lodash";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SearchResult } from "./Result";
import { useSearchListHook } from "./hooks";

export const SearchPage = () => {
  const { query, setQuery } = useSearchListHook();
  const debounceSearch = useCallback(
    debounce((query: string) => {
      setQuery(query);
    }, 200),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value as string;

    val && debounceSearch(val);
  };

  return (
    <div className="h-[100vh] flex flex-col">
      <div className="p-4 bg-background">
        <Input type="search" placeholder="Search..." onChange={handleSearch} />
      </div>
      <Separator />
      <SearchResult query={query} className="flex-1"/>
      <div className="p-4">

      </div>
    </div>
  );
};
