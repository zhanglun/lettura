import React, { useState, useMemo, useCallback } from 'react';
import { Icon } from '../Icon';
import { ArticleReadStatus } from '../../../infra/constants/status';
import { Article } from '../../../infra/types';
import { openBrowser } from '../../../infra/utils';
import styles from './articleitem.css';

type ArticleItemProps = {
  article: Article;
};

export const ArticleItem = (props: ArticleItemProps) => {
  const { article } = props;
  const [expand, setExpand] = useState(false);
  const handleClick = useCallback(() => {
    setExpand(!expand);
  }, [expand]);

  const content = useMemo(() => {
    const str = article.content.replace(/(<([^>]+)>)/gi, '');
    if (str.length > 250) {
      return `${str.slice(0, 250)}...`;
    }

    return str;
  }, [article]);

  const openWebPage = useCallback(
    (e) => {
      openBrowser(article.link);
      e.stopPropagation();
    },
    [article]
  );

  return (
    <li
      className={`${styles.item} ${
        article.hasRead === ArticleReadStatus.isRead && styles.read
      } ${expand && styles.expand}`}
      onClick={handleClick}
      aria-hidden="true"
    >
      <div className={styles.header}>
        <div className={styles.title}>{article.title}</div>
        <div className={styles.actions}>
          <Icon customClass={styles.icon} name="bookmark_add" />
          <Icon customClass={styles.icon} name="favorite_border" />
          <Icon customClass={styles.icon} name="done" />
          <Icon customClass={styles.icon} name="launch" onClick={openWebPage} />
        </div>
      </div>
      {expand && <div className={styles.content}>{content}</div>}
    </li>
  );
};
