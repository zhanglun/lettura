import React, { useRef, useState } from "react";
import * as dataAgent from "@/helpers/dataAgent";
import { promisePool } from "@/helpers/promisePool";
import { Panel, PanelSection } from "../Panel";
import { Loader2 } from "lucide-react";
import { Channel, FeedResItem } from "@/db";
import { writeTextFile } from "@tauri-apps/api/fs";
import { save } from "@tauri-apps/api/dialog";
import { busChannel } from "@/helpers/busChannel";
import { Button, Progress } from "@radix-ui/themes";
import { toast } from "sonner";
import { t } from "i18next";
import { useTranslation } from "react-i18next";

export interface ImportItem {
  title: string;
  link: string;
  feed_url: string;
  loading: boolean;
  import_status: string;
}

/**
 * ImportAndExport component provides functionality to import and export
 * feed subscriptions using OPML files. It allows users to upload an OPML file
 * to import feeds into the application and export current subscriptions as
 * an OPML file for backup or sharing.
 *
 * Props:
 * - `props`: any - Additional properties to pass to the component.
 *
 * State:
 * - `file`: File | undefined - The selected file for import.
 * - `importing`: boolean - A flag indicating if import operation is in progress.
 * - `exporting`: boolean - A flag indicating if export operation is in progress.
 * - `importedList`: ImportItem[] - List of imported feed items from OPML.
 * - `done`: number - Counter for completed import tasks.
 *
 * Methods:
 * - `parserOPML(source: string): ImportItem[]`: Parses OPML XML string and
 *   returns an array of feed import items.
 * - `addFeed(url: string)`: Adds a feed by URL and updates progress.
 * - `importFromOPML()`: Initiates import process for feeds from the imported list.
 * - `handleFileChange(e: React.ChangeEvent<HTMLInputElement>)`: Handles file
 *   selection and reads the file content for import.
 * - `createOPMLObj(feeds: FeedResItem[])`: Creates an OPML document from
 *   current subscriptions.
 * - `exportToOPML()`: Exports current subscriptions to an OPML file.
 */

export const ImportAndExport = (props: any) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importedList, setImportedList] = useState<ImportItem[]>([]);
  const [done, setDone] = useState(0);

  const parserOPML = (source: string): ImportItem[] => {
    const parser = new DOMParser();
    const resultDOM = parser.parseFromString(source, "application/xml");
    const $outlines = resultDOM.querySelectorAll("outline[xmlUrl]");

    return Array.from($outlines)
      .map(($item: Element) => {
        const title = $item.getAttribute("title") || $item.getAttribute("text") || "";
        const feed_url = $item.getAttribute("xmlUrl") || "";
        const link = $item.getAttribute("htmlUrl") || new URL(feed_url).origin || "";

        return {
          title,
          link,
          feed_url,
          loading: false,
          import_status: "not_started",
        };
      })
      .filter((item) => item.title && item.feed_url && item.link);
  };

  const addFeed = (url: string, item: ImportItem) => {
    return dataAgent
      .subscribeFeed(url)
      .then((res) => {
        busChannel.emit("getChannels");
        item.import_status = "success";
        return res;
      })
      .catch((e) => {
        console.error(e);
        item.import_status = "failed";
        return Promise.resolve();
      })
      .finally(() => {
        setDone((done) => done + 1);
      });
  };

  const importFromOPML = () => {
    const fns = importedList.map((_) => {
      return addFeed(_.feed_url, _);
    });

    setImporting(true);

    const pool = promisePool({ limit: 10, fns });

    pool.run().then((res) => {
      window.setTimeout(() => {
        setImporting(false);
        setDone(0);
        setFile(undefined);
        const fileInput = document.getElementById("uploadInput") as HTMLInputElement;
        fileInput.value = "";
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

        setImportedList(
          list.map((item) => {
            return {
              ...item,
              loading: false,
              import_status: "not_started",
            };
          })
        );
      };

      reader.readAsText(e.target.files[0]);
    }
  };

  const createOPMLObj = (feeds: FeedResItem[]) => {
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
      .getSubscribes()
      .then(({ data: feeds }) => {
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
    <Panel title={t("Import/Export")}>
      <PanelSection title={t("OPML Import")}>
        <div className="flex w-full items-center space-x-2">
          <div className="border-dashed border-3 rounded relative min-w-[360px] h-[34px] transition-all hover:border-[var(--gray-10)]">
            <label htmlFor="uploadInput" className="block text-center leading-7 text-sm font-medium cursor-pointer">
              {file ? file.name : t("Browse file")}
            </label>
            <input
              id="uploadInput"
              hidden
              ref={fileInputRef}
              type="file"
              accept=".opml,.xml"
              onChange={(e) => {
                handleFileChange(e);
              }}
            />
          </div>
          <Button onClick={importFromOPML} disabled={importing || !file} loading={importing}>
            {t("Import")}
          </Button>
        </div>
        <div className="my-2">
          {importing && <Progress value={importing ? (done / importedList.length) * 100 : 0} />}
        </div>
      </PanelSection>
      <PanelSection title={t("OPML Export")}>
        <Button onClick={exportToOPML}>
          {exporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("Exporting")}
            </>
          ) : (
            <>{t("Download OPML subscriptions file")}</>
          )}
        </Button>
      </PanelSection>
    </Panel>
  );
};
