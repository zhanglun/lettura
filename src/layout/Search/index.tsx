import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { debounce } from "lodash";
import { useCallback } from "react";

export const SearchPage = () => {
  const debounceSearch = useCallback(debounce((query: string) => {
    console.log('query ===> ', query)
  }, 200), []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value as string;

    val && debounceSearch(val)
  };

  return (
    <div>
      <div className="p-4">
        <Input
          type="search"
          placeholder="Search..."
          onChange={handleSearch}
        />
      </div>
      <Separator />
      <h1>Search Page</h1>
      <h3>🚧🚧🚧 Work in progress.</h3>
    </div>
  );
};
