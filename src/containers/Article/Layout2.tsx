import React from "react";
import { useParams } from "react-router-dom";
import { ArticleLineList } from "@/components/ArticleList/LineList";
import { useQuery } from "@/helpers/parseXML";

export const Layout2 = (): JSX.Element => {
  // @ts-ignore
  const params: { name: string } = useParams();
  const [ feedUrl, type, channelUuid ] = useQuery();

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
