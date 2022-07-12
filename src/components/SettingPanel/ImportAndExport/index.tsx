import React, { useRef, useState } from "react";
import styles from "../setting.module.css";
import { db, Channel as ChannelModel } from "../../../db";

export const ImportAndExport = (props: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceType, setSourceType] = useState("text");
  const [file, setFile] = useState<File>();
  const [importedList, setImportedList] = useState<ChannelModel[]>([]);

  const uploadOPMLFile = () => {
    if (fileInputRef && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const parserOPML = (source: string): ChannelModel[] => {
    const parser = new DOMParser();
    const resultDOM = parser.parseFromString(source, "application/xml");
    const $outlines = resultDOM.querySelectorAll("outline[xmlUrl]");

    return Array.from($outlines)
      .map(($item: Element) => {
        const title = $item.getAttribute("title") || $item.getAttribute("text") || "";
        const feedUrl = $item.getAttribute("xmlUrl") || "";
        const link = $item.getAttribute("htmlUrl") || new URL(feedUrl).origin || "";

        return {
          title,
          link,
          feedUrl,
        };
      })
      .filter((item) => item.title && item.feedUrl && item.link);
  };

  const importFromOPML = () => {
    console.log(importedList);
    db.channels.bulkAdd(importedList).then((lastkey) => {
      console.log("lastKey: ", lastkey);
    });
  };

  const handleFileChange = (e: any) => {
    setFile(e.target.files[0]);

    const reader = new FileReader();

    reader.onload = () => {
      const xmlString = reader.result as string;
      const list = parserOPML(xmlString);

      setImportedList(list);
    };

    reader.readAsText(e.target.files[0]);
  };

  const handleChangeSourceType = (type: string) => {
    setSourceType(type);
  };

  const handleTextSourceChange = (e: any) => {
    const text = e.target.value;

    if (text) {
      const list = parserOPML(text);
      console.log(list);
      setImportedList(list);
    }
  };

  const exportToOPML = () => {};

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>导入</h1>
        <p className={styles.description}>从别处导入您的订阅源</p>
      </div>
      <div className={styles.panelBody}>
        <div className={styles.section}>
          <p className={styles.options}>OPML 导入</p>
          <p>
            <label htmlFor="source-file">
              <input
                type="radio"
                id="source-file"
                checked={sourceType === "file"}
                onChange={() => handleChangeSourceType("file")}
              />
              File
            </label>
            <label htmlFor="source-text">
              <input
                type="radio"
                id="source-text"
                checked={sourceType === "text"}
                onChange={() => handleChangeSourceType("text")}
              />
              Text
            </label>
          </p>
          {sourceType === "file" && (
            <div>
              <span>{file && file.name}</span>
              <input
                className={styles.fileInput}
                ref={fileInputRef}
                type="file"
                accept=".opml,.xml"
                onChange={(e) => {
                  handleFileChange(e);
                }}
                onClick={uploadOPMLFile}
              />
            </div>
          )}
          {sourceType === "text" && (
            <div>
              <textarea
                name="input"
                cols={30}
                rows={10}
                onChange={handleTextSourceChange}
              ></textarea>
            </div>
          )}
          <button onClick={importFromOPML}>导入</button>
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
          <button onClick={exportToOPML}>导出</button>
        </div>
      </div>
    </div>
  );
};
