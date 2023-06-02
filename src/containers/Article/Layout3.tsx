import React, { useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleCardList } from "@/components/ArticleList/CardList";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const Layout3 = (): JSX.Element => {
  // @ts-ignore
  const params: { name: string } = useParams();
  const query = useQuery();
  const feedUrl = query.get("feedUrl");
  const type = query.get("type");
  const channelUuid = query.get("channelUuid");
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <div className="overflow-y-auto h-[100vh] pt-[var(--app-toolbar-height)]" ref={listRef}>
      <ArticleCardList
        feedUuid={ channelUuid }
        type={ type }
        feedUrl={ feedUrl || "" }
        title={ params.name }
      />
    </div>
  );
};
