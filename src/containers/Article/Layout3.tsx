import React, { useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleCardList } from "@/components/ArticleList/CardList";
import { useQuery } from "@/helpers/parseXML";

export const Layout3 = (): JSX.Element => {
  // @ts-ignore
  const params: { name: string } = useParams();
  const [ feedUrl, type, channelUuid ] = useQuery();

  return (
    <ArticleCardList
      feedUuid={channelUuid}
      type={type}
      feedUrl={feedUrl || ""}
      title={params.name}
    />
  );
};
