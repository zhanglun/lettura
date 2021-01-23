import { remote } from 'electron';
import React, { useCallback, useState } from 'react';
import { EXPORT_OPML } from '../../../../event/constant';
import styles from '../settingpanel.module.css';

export const ImportAndExport = (props: any) => {
  const [file, setFile] = useState('');

  const uploadOPMLFile = () => {
    console.log(file);
  };

  const importFromOPML = () => {
    console.log(file);
  };

  const exportToOPML = useCallback(() => {
    remote.getCurrentWebContents().send(EXPORT_OPML);
  }, []);

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
              setFile(e.target.value);
            }}
          />
          <button
            type="button"
            className="button--secondary"
            onClick={uploadOPMLFile}
          >
            浏览
          </button>
          <button
            type="button"
            className="button--secondary"
            onClick={importFromOPML}
          >
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
          <button
            type="button"
            className="button--secondary"
            onClick={exportToOPML}
          >
            导出
          </button>
        </div>
      </div>
    </div>
  );
};
