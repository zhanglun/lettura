import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@douyinfe/semi-ui';
import { useEventPub } from '../../../hooks/useEventPub';
import styles from '../settingpanel.module.css';

type ImportItem = { title: string; feedUrl: string };

export const ImportAndExport = (props: any) => {
  const { eventPubEmit } = useEventPub();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [importedList, setImportedList] = useState<ImportItem[]>([]);

  const uploadOPMLFile = useCallback(() => {
    if (fileInputRef && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [fileInputRef]);

  const parserOPML = useCallback((source: string): {
    title: string;
    feedUrl: string;
  }[] => {
    const parser = new DOMParser();
    const resultDOM = parser.parseFromString(source, 'application/xml');
    const $outlines = resultDOM.querySelectorAll('outline[xmlUrl]');

    return Array.from($outlines)
      .map(($item: Element) => {
        return {
          title: $item.getAttribute('title') || '',
          feedUrl: $item.getAttribute('xmlUrl') || '',
        };
      })
      .filter((item) => item.title && item.feedUrl);
  }, []);

  const importFromOPML = useCallback(() => {
    eventPubEmit.IMPORT_OPML(importedList);
  }, [importedList]);

  const handleFileChange = useCallback(
    (e) => {
      setFile(e.target.files[0]);

      const reader = new FileReader();

      reader.onload = () => {
        const xmlString = reader.result as string;
        const list: ImportItem[] = parserOPML(xmlString);

        setImportedList(list);
      };

      reader.readAsText(e.target.files[0]);
    },
    [parserOPML]
  );

  const exportToOPML = () => {
    eventPubEmit.EXPORT_OPML();
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>导入</h1>
        <p className={styles.description}>从别处导入您的订阅源</p>
      </div>
      <div className={styles.panelBody}>
        <div className={styles.section}>
          <div className={styles.options}>OPML 导入</div>
          <span>{file && file.name}</span>
          <input
            className={styles.hideFileInput}
            ref={fileInputRef}
            type="file"
            accept=".opml,.xml"
            onChange={(e) => {
              handleFileChange(e);
            }}
          />
          <Button onClick={uploadOPMLFile}>浏览</Button>
          <Button theme="solid" type="primary" onClick={importFromOPML}>
            导入
          </Button>
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
          <Button theme="solid" type="primary" onClick={exportToOPML}>
            导出
          </Button>
        </div>
      </div>
    </div>
  );
};
