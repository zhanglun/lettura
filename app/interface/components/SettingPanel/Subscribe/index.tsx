import React, { Component } from 'react';
import styles from '../settingpanel.module.css';

// eslint-disable-next-line react/prefer-stateless-function
export class SettingSubscribe extends Component<any, any> {
  constructor(prop: any) {
    super(prop);

    this.state = {
      feedUrl: '',
    };
  }

  addFeedChannel() {
    const { feedUrl } = this.state;
    console.log(feedUrl);
  }

  render(): React.ReactNode {
    const { feedUrl } = this.state;

    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h1 className={styles.panelTitle}>添加 RSS 源</h1>
        </div>
        <div className={styles.panelBody}>
          <input
            type="text"
            value={feedUrl}
            onChange={(e) => {
              this.setState({ feedUrl: e.target.value });
            }}
          />
          <button type="button" onClick={this.addFeedChannel.bind(this)}>
            添加
          </button>
        </div>
      </div>
    );
  }
}
