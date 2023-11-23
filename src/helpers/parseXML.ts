import { useLocation } from "react-router-dom";
import {ArticleResItem, FeedResItem} from "@/db";
import {getPageSources} from "@/helpers/dataAgent";

export const getChannelFavicon = (url: string) => {
  try {
    const hostname = url ? new URL(url).hostname : "";

    return hostname ? `https://icons.duckduckgo.com/ip3/${hostname}.ico` : "";
  } catch (err) {
    console.log("error url", url);
    console.error(err);
    return "";
  }
};

export const useQuery = () => {
  const query = new URLSearchParams(useLocation().search);
  const feedUrl = query.get("feedUrl");
  const type = query.get("type");
  const feedUuid = query.get("feedUuid");

  return [feedUrl, type, feedUuid];
};

export function getBestImages(entries: ArticleResItem[]) {
  return Promise.all(entries.map(function (entry) {
    if (entry.image && /^https?:\/\/[^\/]+\/vi\/[-_A-Za-z0-9]+\/[^\/]*default\.jpg$/.test(entry.image)) {
      var maxResUrl_1 = entry.image.replace(/^(https?:\/\/[^\/]+\/vi\/[-_A-Za-z0-9]+\/)[^\/]*(default\.jpg)$/, '$1maxres$2');
      return fetch(maxResUrl_1, { method: 'HEAD' }).then(function (response) {
        if (response.status === 200) {
          entry.image = maxResUrl_1;
        }
        return entry;
      }).catch(function () {
        return entry;
      });
    }
    else if (entry.link && !entry.image) {
      return getPageSources(entry.link).then(function (response) {
        if (response.status === 200) {
          const { data: text } = response;
          var dom = (new DOMParser()).parseFromString(text, 'text/html');
          var metaImage = dom.querySelector('head meta[property="og:image"]');

          console.log('metaImage', metaImage);

          if (metaImage) {
            const a = dom.createElement('a');

            a.href = metaImage.getAttribute('content') || '';

            entry.image = a.href;
          }
          return entry;
        }

        return entry;
      }).catch(function () {
        return entry;
      });
    }
    return entry;
  }));
}
