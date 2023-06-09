import React, { useEffect, useRef, useState } from "react";
import styles from "./view.module.scss";
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
  const renderPlaceholder = () => {
    return "Please Select Some read";
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
    <div className={ `${ styles.container } ${ styles.bgDot }` }>
      {/* {loading && <Loading />} */ }
      { article ? <ArticleDetail article={ article }/> : renderPlaceholder() }
    </div>
  );
};
