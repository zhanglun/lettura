import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import * as routesConfig from './infra/constants/routes';
import { SettingModule } from './interface/modules/Settings';
import { Feed } from './interface/components/Feed';
import { ArticleList } from './interface/components/ArticleList';
import { GlobalToolbar } from './interface/components/GlobalToolbar';
import { Feed as IFeed, Article as IArticle } from './infra/types/index';
import styles from './app.module.css';

import { feedList, articleList } from './infra/mock';

function App() {
  const feeds: IFeed[] = feedList;
  const articles: IArticle[] = articleList;

  return (
    <div className={styles.container}>
      <div className={styles.feed}>
        <Feed feeds={feeds} />
      </div>

      <Router>
        <Switch>
          <Route exact path={routesConfig.HOME}>
            <div className={styles.main}>
              <GlobalToolbar />
              <div className={styles.mainInner}>
                <div className={styles.articleList}>
                  <ArticleList articleList={articles} />
                </div>
                <div className={styles.reader} />
              </div>
            </div>
          </Route>
          <Route path={routesConfig.SETTINGS}>
            <div className={styles.main}>
              <div className={styles.mainInner}>
                <SettingModule />
              </div>
            </div>
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
