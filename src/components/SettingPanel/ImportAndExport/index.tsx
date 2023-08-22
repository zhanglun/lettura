import React, { useRef, useState } from "react";
import * as dataAgent from "@/helpers/dataAgent";
import { promisePool } from "@/helpers/promisePool";
import { Panel, PanelSection } from "../Panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Channel } from "@/db";
import { writeTextFile } from "@tauri-apps/api/fs";
import { save } from "@tauri-apps/api/dialog";
import { busChannel } from "@/helpers/busChannel";

export interface ImportItem {
  title: string;
  link: string;
  feed_url: string;
}

export const ImportAndExport = (props: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
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
        busChannel.emit("getChannels");
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

  const createOPMLObj = (feeds: Channel[]) => {
    const xmlDoc = document.implementation.createDocument(null, "opml");
    const root = xmlDoc.getElementsByTagName("opml")[0];

    root.setAttribute("version", "1.0");
    root.innerHTML = "<head><title>Subscriptions in Lettura</title></head>";

    const createOutline = (data: Channel) => {
      const outline = document.createElement("outline");

      outline.setAttribute("text", data.title);
      outline.setAttribute("title", data.title);

      if (data.item_type === "channel") {
        outline.setAttributeNS(null, "xmlUrl", data.feed_url);
        outline.setAttributeNS(null, "htmlUrl", data.link);
      }

      if (data.children) {
        const fragment = document.createDocumentFragment();

        data.children.forEach((child: Channel) => {
          fragment.appendChild(createOutline(child));
        });

        outline.appendChild(fragment);
      }

      return outline;
    };

    const body = document.createElement("body");

    feeds.forEach((feed) => {
      body.appendChild(createOutline(feed));
    });

    root.appendChild(body);

    return xmlDoc;
  };

  const exportToOPML = () => {
    setExporting(true);
    dataAgent
      .getFeeds()
      .then((feeds) => {
        const doc = createOPMLObj(feeds);
        const serializer = new XMLSerializer();
        const xmlString = serializer.serializeToString(doc);

        return xmlString;
      })
      .then((result) => {
        return save({
          filters: [
            {
              name: "Opml",
              extensions: ["opml"],
            },
          ],
        }).then((dir) => {
          return [result, dir];
        });
      })
      .then(([str, filePath]) => {
        console.log("%c Line:163 🍞 dir", "color:#f5ce50", filePath);

        if (str && filePath) {
          return writeTextFile(filePath, str);
        }
      })
      .finally(() => {
        setExporting(false);
      });
  };

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
          <Button onClick={importFromOPML} disabled={importing || !file}>
            Import
            <>{importing ? `${done}/${importedList.length}` : ""}</>
          </Button>
        </div>
      </PanelSection>
      <PanelSection title="OPML Export">
        <Button onClick={exportToOPML}>
          {exporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting
            </>
          ) : (
            <>Download OPML subscriptions file</>
          )}
        </Button>
      </PanelSection>
    </Panel>
  );
};
