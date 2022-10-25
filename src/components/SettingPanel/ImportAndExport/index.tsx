import React, { useRef, useState } from "react";
import { Button, Radio, RadioGroup, TextArea } from "@douyinfe/semi-ui";
import styles from "../setting.module.scss";
import * as dataAgent from "../../../helpers/dataAgent";

export interface ImportItem {
  title: string,
  link: string,
  feed_url: string,
}

export const ImportAndExport = (props: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceType, setSourceType] = useState("file");
  const [file, setFile] = useState<File>();
  const [importing, setImporting] = useState(false);
  const [importedList, setImportedList] = useState<ImportItem[]>([]);

  const uploadOPMLFile = () => {
    if (fileInputRef && fileInputRef.current) {
      console.log('fileInputRef', fileInputRef)
      fileInputRef.current.click();
    }
  };

  const parserOPML = (
    source: string
  ): ImportItem[] => {
    const parser = new DOMParser();
    const resultDOM = parser.parseFromString(source, "application/xml");
    const $outlines = resultDOM.querySelectorAll("outline[xmlUrl]");

    return Array.from($outlines)
      .map(($item: Element) => {
        const title =
          $item.getAttribute("title") || $item.getAttribute("text") || "";
        const feed_url = $item.getAttribute("xmlUrl") || "";
        const link =
          $item.getAttribute("htmlUrl") || new URL(feed_url).origin || "";

        return {
          title,
          link,
          feed_url,
        };
      })
      .filter((item) => item.title && item.feed_url && item.link);
  };

  const importFromOPML = () => {
    // TODO: import
    const urlList = importedList.map(_ => _.feed_url)

    console.log("%c Line:53 🍰 urlList", "color:#4fff4B", urlList);
    setImporting(true)

    dataAgent.importChannels(urlList).then(() => {

    }).finally(() => {
      setImporting(false)
    })
  };

  const handleFileChange = (e: any) => {
    console.log('e ====>',e)
    setFile(e.target.files[0]);

    const reader = new FileReader();

    reader.onload = () => {
      const xmlString = reader.result as string;
      const list = parserOPML(xmlString);

      console.log("list", list);

      setImportedList(list);
    };

    reader.readAsText(e.target.files[0]);
  };

  const handleChangeSourceType = (e: any) => {
    console.log('text e', e)
    const type = e.target.value;
    setSourceType(type);
  };

  const handleTextSourceChange = (text: string) => {
    if (text) {
      const list = parserOPML(text);
      setImportedList(list);
    }
  };

  const exportToOPML = () => {};

  return (
    <div className={styles.panel}>
      <h1 className={styles.panelTitle}>
        导入
        <span className={styles.description}>从别处导入您的订阅源</span>
      </h1>
      <div className={styles.panelBody}>
        <div className={styles.section}>
          <p className={styles.options}>OPML 导入</p>
          <div className={styles.radios}>
            <RadioGroup
              onChange={(e) => handleChangeSourceType(e)}
              value={sourceType}
              aria-label="单选组合示例"
              name="radio-group"
            >
              <Radio value={"file"}>File</Radio>
              <Radio value={"text"}>Text</Radio>
            </RadioGroup>
          </div>
          {sourceType === "file" && (
            <div className={styles.inputField}>
              <span>{file && file.name}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".opml,.xml"
                onChange={(e) => {
                  handleFileChange(e);
                }}
              />
            </div>
          )}
          {sourceType === "text" && (
            <div className={styles.inputField}>
              <TextArea autosize onChange={(value) => handleTextSourceChange(value)} />
            </div>
          )}
          <Button theme="solid" type="primary" onClick={importFromOPML} loading={importing}>
            导入
            {/* <>{importing ? `/${importedList.length}` : ''}</> */}
          </Button>
        </div>
      </div>
      <h1 className={styles.panelTitle}>
        导出
        <span className={styles.description}>
          你可以导出订阅源以便在其他阅读器中使用
        </span>
      </h1>
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
