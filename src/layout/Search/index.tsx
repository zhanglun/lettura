import { useCallback, useEffect, useState } from "react";
import { debounce } from "lodash";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { request } from "@/helpers/request";
import { ArticleResItem } from "@/db";
import { AxiosResponse } from "axios";
import { SearchResult } from "./Result";

export const SearchPage = () => {
  const [resultList, setResultList] = useState<ArticleResItem[]>([]);
  const debounceSearch = useCallback(
    debounce((query: string) => {
      console.log("query ===> ", query);
      request
        .get("/search", {
          params: {
            query: query.trim(),
          },
        })
        .then((res: AxiosResponse<ArticleResItem[]>) => {
          console.log("%c Line:15 🍎 res", "color:#ed9ec7", res);
          setResultList(res.data);
        });
    }, 200),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value as string;

    val && debounceSearch(val);
  };

  useEffect(() => {}, []);

  return (
    <div className="max-h-full overflow-auto">
      <div className="p-4">
        <Input type="search" placeholder="Search..." onChange={handleSearch} />
      </div>
      <Separator />
      <div>
        <SearchResult resultList={resultList} />
      </div>
      <div></div>
    </div>
  );
};
