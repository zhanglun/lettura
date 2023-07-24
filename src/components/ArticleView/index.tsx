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
    channel: state.channel,
  }));
  const { article, userConfig } = props;
  const renderPlaceholder = () => {
    return (
      <div className="py-10 text-xl">
        <p>Let's read something</p>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {article ? <ArticleDetail article={article} /> : renderPlaceholder()}
    </div>
  );
};
