import { http } from "@tauri-apps/api";
import { Channel as ChannelModel, Article as ArticleModel } from "../db";

type ChannelRes = Omit<ChannelModel, "feedUrl">;
type ArticleRes = Omit<ArticleModel, "feedUrl" | "unread">;

export const parseFeedXML = (
  xml: string
): {
  channel: ChannelRes;
  items: ArticleRes[];
} => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(xml, "application/xml");

  const parseChannel = (dom: any) => {
    const res = {} as Omit<ChannelModel, "feedUrl">;
    let child = dom.firstChild;

    while (true) {
      if (!child) {
        break;
      }

      switch (child.nodeName) {
        case "title":
          res.title = child.textContent.trim();
          break;
        case "link":
          res.link = child.textContent.trim();
          break;
        case "description":
          res.description = child.textContent.trim();
          break;
        case "lastBuildDate":
        case "pubDate":
          res.pubDate = child.textContent.trim();
          break;
        default:
          break;
      }

      child = child.nextElementSibling;
    }

    return res;
  };

  const parseItems = (doc: any) => {
    const items = doc.querySelectorAll("item, entry");
    console.log('items --->', items)
    const res = [];

    for (let item of items) {
      const feed: any = {};
      let child = item.firstChild;

      while (true) {
        if (!child) {
          break;
        }

        const content = child.textContent.trim();

        switch (child.nodeName) {
          case "title":
            feed.title = content;
            break;
          case "link":
            feed.link = content;
            break;
          case "description":
            feed.description = content;
            break;
          case "content":
          case "content:encoded":
            feed.content = content;
            break;
          case "author":
          case "dc:creator":
            feed.author = content;
            break;
          case "pubDate":
            feed.pubDate = content;
            break;
          default:
            break;
        }

        child = child.nextElementSibling;
      }

      res.push(feed);
    }

    return res;
  };

  let channel = {} as Omit<ChannelModel, "feedUrl">;
  let items = [] as Omit<ArticleModel, "feedUrl" | "unread">[];

  if (dom.querySelector("channel, feed")) {
    channel = {
      ...parseChannel(dom.querySelector("channel, feed")),
    };
  }

  if (dom.querySelector("item, entry")) {
    items = parseItems(dom);
  }

  return {
    channel,
    items,
  };
};

export const extendFeedItems = (
  items: Omit<ArticleModel, "feedUrl" | "unread">[],
  data: any
) => {
  return items.map((item) => {
    return {
      ...item,
      ...data,
    };
  });
};

export const extendChannel = (
  channel: Omit<ChannelModel, "feedUrl">,
  data: any
) => {
  return {
    ...channel,
    ...data,
  };
};

export const requestFeed = (
  url: string
): Promise<{ channel: ChannelModel; items: ArticleModel[] } | any> => {
  return http
    .fetch(url, {
      method: "GET",
      responseType: 2,
    })
    .then(({ status, data }: any) => {
      if (status === 200) {
        const { channel, items } = parseFeedXML(data);

        return {
          channel: extendChannel(channel, { feedUrl: url }),
          items: extendFeedItems(items, { feedUrl: url, unread: 1 }),
        };
      } else {
        console.log("-=--> http request Error", status, data);
        return {
          status,
          data,
        }
      }
    });
};

export const getFavico = (url: string) => {
  const hostname = url ? new URL(url).hostname : "";

  return "https://icons.duckduckgo.com/ip3/" + hostname + ".ico";
};
