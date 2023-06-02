import React, { useEffect, useRef, useState } from "react";
import Dayjs from "dayjs";
import classnames from "classnames";
import styles from "./view.module.scss";
import { getChannelFavicon } from "@/helpers/parseXML";
import * as dataAgent from "@/helpers/dataAgent";
import { useBearStore } from "@/hooks/useBearStore";
import { ArticleDetail } from "@/components/ArticleView/Detail";

type ArticleViewProps = {
  article: any | null;
  userConfig: UserConfig;
};

export const ArticleView = (props: ArticleViewProps): JSX.Element => {
  const store = useBearStore((state) => ({
    channel: state.channel
  }));
  const { article, userConfig } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const helpBarRef = useRef<HTMLDivElement>(null);

  const renderPlaceholder = () => {
    return "Please Select Some read";
  };

  useEffect(() => {
    if (!containerRef?.current) {
      return;
    }

    const handleScroll = () => {
      if (
        containerRef.current &&
        helpBarRef.current &&
        containerRef.current?.scrollTop > 300
      ) {
        console.log("111");
      }
    };

    containerRef.current.addEventListener("scroll", handleScroll);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
    <div className={ `${ styles.container } ${ styles.bgDot }` }>
      {/* {loading && <Loading />} */ }
      { article ? <ArticleDetail article={ article }/> : renderPlaceholder() }
    </div>
  );
};
