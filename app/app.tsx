import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import * as routesConfig from './infra/constants/routes';
import { SettingModule } from './interface/modules/Settings';
import { Channel } from './interface/components/Channel';
import { ArticleList } from './interface/components/ArticleList';
import { GlobalToolbar } from './interface/components/GlobalToolbar';
import { Channel as IChannel, Article as IArticle } from './infra/types/index';
import styles from './app.module.css';

import { channelList, articleList } from './infra/mock';

function App() {
  const channels: IChannel[] = channelList;
  const articles: IArticle[] = articleList;

  return (
    <div className={styles.container}>
      <div className={styles.channel}>
        <Channel channels={channels} />
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
