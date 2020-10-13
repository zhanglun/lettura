import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import * as routesConfig from './infra/constants/routes';
import { SettingModule } from './interface/modules/Settings';
import { ChannelList } from './interface/components/ChannelList';
import { ArticleList } from './interface/components/ArticleList';
import { GlobalToolbar } from './interface/components/GlobalToolbar';
import { Article } from './infra/types/index';
import styles from './app.module.css';

import { articleList as mA } from './infra/mock';

function App() {
  const articleList: Article[] = mA;

  return (
    <div className={styles.container}>
      <div className={styles.channel}>
        <ChannelList />
      </div>

      <Router>
        <Switch>
          <Route exact path={routesConfig.HOME}>
            <div className={styles.main}>
              <GlobalToolbar />
              <div className={styles.mainInner}>
                <div className={styles.articleList}>
                  <ArticleList articleList={articleList} />
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
