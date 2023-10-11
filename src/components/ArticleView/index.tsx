import React, { useEffect, useRef, useState } from "react";
import styles from "./view.module.scss";
import { useBearStore } from "@/stores";
import { ArticleDetail } from "@/components/ArticleView/Detail";

type ArticleViewProps = {
  userConfig: UserConfig;
};

export const ArticleView = (props: ArticleViewProps): JSX.Element => {
  const store = useBearStore((state) => ({
    feed: state.feed,
    article: state.article,
  }));
  const renderPlaceholder = () => {
    return (
      <div className="py-10 text-xl">
        <p>Let's read something</p>
      </div>
    );
  };

  return (
    <div className=" py-1 px-10 font-[var(--reading-font-body)] min-h-full m-auto sm:px-5 sm:max-w-xl lg:px-10 lg:max-w-5xl">
      {store.article ? (
        <ArticleDetail article={store.article} />
      ) : (
        renderPlaceholder()
      )}
    </div>
  );
};
