import React, { useRef, useState } from "react";
import styles from "../setting.module.scss";
import * as dataAgent from "../../../helpers/dataAgent";
import { promisePool } from "../../../helpers/promisePool";
import { Panel, PanelSection } from "../Panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface ImportItem {
  title: string;
  link: string;
  feed_url: string;
}

export const ImportAndExport = (props: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceType, setSourceType] = useState("file");
  const [file, setFile] = useState<File>();
  const [importing, setImporting] = useState(false);
  const [importedList, setImportedList] = useState<ImportItem[]>([]);
  const [done, setDone] = useState(0);

  const uploadOPMLFile = () => {
    if (fileInputRef?.current) {
      console.log("fileInputRef", fileInputRef);
      fileInputRef.current.click();
    }
  };

  const parserOPML = (source: string): ImportItem[] => {
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

  const addChannel = (url: string) => {
    return dataAgent
      .addChannel(url)
      .then((res) => {
        return res;
      })
      .catch(() => {
        return Promise.resolve();
      })
      .finally(() => {
        setDone((done) => done + 1);
      });
  };

  const importFromOPML = () => {
    const fns = importedList.map((_) => {
      return addChannel(_.feed_url);
    });

    setImporting(true);

    const pool = promisePool({ limit: 5, fns });

    pool.run().then((res) => {
      window.setTimeout(() => {
        setImporting(false);
        setDone(0);
      }, 500);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      const reader = new FileReader();

      reader.onload = () => {
        const xmlString = reader.result as string;
        const list = parserOPML(xmlString);

        setImportedList(list);
      };

      reader.readAsText(e.target.files[0]);
    }
  };

  const exportToOPML = () => {};

  return (
    <Panel title="Import/Export">
      <PanelSection title="OPML Import">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".opml,.xml"
            onChange={(e) => {
              handleFileChange(e);
            }}
          />
          <Button onClick={importFromOPML} disabled={importing}>
            Import
            <>{importing ? `${done}/${importedList.length}` : ""}</>
          </Button>
        </div>
      </PanelSection>
      <PanelSection title="OPML Export">
        <Button onClick={exportToOPML}>Download OPML subscriptions file</Button>
      </PanelSection>
    </Panel>
  );
};
