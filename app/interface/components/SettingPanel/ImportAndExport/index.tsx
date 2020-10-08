import React from 'react';
import styles from '../settingpanel.module.css';

// eslint-disable-next-line react/prefer-stateless-function
export class ImportAndExport extends React.Component<any, any> {
  constructor(prop: any) {
    super(prop);

    this.state = {
      file: '',
    };
  }

  uploadOPMLFile() {
    const { file } = this.state;
    console.log(file);
  }

  importFromOPML() {
    const { file } = this.state;
    console.log(file);
  }

  exportToOPML() {
    const { file } = this.state;
  }

  render(): React.ReactNode {
    const { file } = this.state;

    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h1 className={styles.panelTitle}>导入</h1>
          <p className={styles.description}>从别处导入您的订阅源</p>
        </div>
        <div className={styles.panelBody}>
          <div className={styles.section}>
            <div className={styles.options}>OPML 导入</div>
            <input
              type="file"
              value={file}
              onChange={(e) => {
                this.setState({ file: e.target.value });
              }}
            />
            <button type="button" onClick={this.uploadOPMLFile.bind(this)}>
              浏览
            </button>
            <button type="button" onClick={this.importFromOPML.bind(this)}>
              导入
            </button>
          </div>
        </div>
        <div className={styles.panelHeader}>
          <h1 className={styles.panelTitle}>导出</h1>
          <p className={styles.description}>
            你可以导出订阅源以便在其他阅读器中使用
          </p>
        </div>
        <div className={styles.panelBody}>
          <div className={styles.section}>
            <div className={styles.options}>OPML 导出</div>
            <button type="button" onClick={this.exportToOPML.bind(this)}>
              导出
            </button>
          </div>
        </div>
      </div>
    );
  }
}
