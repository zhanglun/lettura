import React, { useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleLineList } from "@/components/ArticleList/LineList";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const Layout2 = (): JSX.Element => {
  // @ts-ignore
  const params: { name: string } = useParams();
  const query = useQuery();
  const feedUrl = query.get("feedUrl");
  const type = query.get("type");
  const channelUuid = query.get("channelUuid");

  // TODO: reuse scroll to top

  return (
    <ArticleLineList
      feedUuid={ channelUuid }
      type={ type }
      feedUrl={ feedUrl || "" }
      title={ params.name }
    />
  );
};
