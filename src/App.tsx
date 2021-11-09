import React from 'react';
import {
  HashRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom';
import * as routesConfig from './infra/constants/routes';
import { SettingModule } from './view/modules/Settings';
import { ArticleModule } from './view/modules/Articles';
import { ChannelModule } from './view/modules/Channels';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.container}>
      <Router>
        <ChannelModule />
        <div className={styles.main} id="appMain">
          <Switch>
            <Route
              exact
              path="/"
              render={() => {
                return <Redirect to="/all" />;
              }}
            />
            <Route exact path={routesConfig.SETTINGS}>
              <SettingModule />
            </Route>
            <Route exact path={routesConfig.CHANNEL}>
              <ArticleModule />
            </Route>
          </Switch>
        </div>
      </Router>
    </div>
  );
}

export default App;
