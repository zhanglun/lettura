import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import * as routesConfig from './infra/constants/routes';
import { SettingModule } from './interface/modules/Settings';
import { ChannelList } from './interface/components/ChannelList';
import { ArticleList } from './interface/components/ArticleList';
import styles from './app.module.css';

function App() {
  return (
    <div className={styles.container}>
      <div className={styles.channel}>
        <ChannelList />
      </div>

      <div className={styles.main}>
        <div className={styles.mainInner}>
          <Router>
            <Switch>
              <Route exact path={routesConfig.HOME}>
                <div className={styles.articleList}>
                  <ArticleList />
                </div>
                <div className={styles.reader} />
              </Route>
              <Route path={routesConfig.SETTINGS}>
                <SettingModule />
              </Route>
            </Switch>
          </Router>
        </div>
      </div>
    </div>
  );
}

export default App;
