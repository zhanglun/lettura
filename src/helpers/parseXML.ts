import { fetch } from "@tauri-apps/api/http";
import { Channel as ChannelModel, Article as ArticleModel } from "../db";

type ChannelRes = Omit<ChannelModel, "feedUrl">;
type ArticleRes = Omit<ArticleModel, "feedUrl" | "unread">;

export const parseRssFeed = (url: string, content: any) => {
  console.log('parseRssFeed', url, content)
}

export const parseAtomFeed = (url:string, content: any) => {
  console.log('parseAtomFeed', content)
}

export const parseFeed = (url: string, content: any) => {
  if (typeof content === 'string') {
    content = (new DOMParser()).parseFromString(content, 'text/xml');
  }
  if (content.children.length !== 1) {
    throw new Error('Unknown document type: should be contains one child element');
  }

  const rootTagName = content.children[0].tagName;

  if (rootTagName === 'rss') {
    return parseRssFeed(url, content);
  } else if (rootTagName === 'feed') {
    return parseAtomFeed(url, content);
  }

  throw new Error('Unknown document type: root element should be one of [rss, feed]');
}

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
    const items = doc.querySelectorAll("item, article");
    console.log("items --->", items);
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
      ...parseChannel(dom.querySelector("channel, feed"))
    };
  }

  if (dom.querySelector("item, article")) {
    items = parseItems(dom);
  }

  return {
    channel,
    items
  };
};

export const extendFeedItems = (
  items: Omit<ArticleModel, "feedUrl" | "unread">[],
  data: any
) => {
  return items.map((item) => {
    return {
      ...item,
      ...data
    };
  });
};

export const extendChannel = (
  channel: Omit<ChannelModel, "feedUrl">,
  data: any
) => {
  return {
    ...channel,
    ...data
  };
};

export const requestFeed = (
  url: string
): Promise<{ channel: ChannelModel; items: ArticleModel[] } | any> => {
  return fetch(url, {
    method: "GET",
    responseType: 2
  })
    .then(({ status, data }: any): Promise<any> => {
      if (status === 200) {
        console.log('----> data', data)

        parseFeed(url, data);

        const { channel, items } = parseFeedXML(data);
        return getBestImages(extendFeedItems(items, { feedUrl: url, unread: 1 })).then((res) => {
          return {
            channel: extendChannel(channel, { feedUrl: url }),
            items: res
          };
        }).catch(() => {
          return {
            channel: extendChannel(channel, { feedUrl: url }),
            items: extendFeedItems(items, { feedUrl: url, unread: 1 })
          };
        });
      } else {
        console.log("-=--> http request Error", status, data);
        return Promise.resolve({
          status,
          data
        });
      }
    }).then((result) => {
      return result;
    });
};

export const getBestImages = (articles: ArticleModel[]): Promise<ArticleModel[]> => {
  return Promise.all(articles.map((article: ArticleModel) => {
    console.log('article', article)

    if (article.image && /^https?:\/\/[^\/]+\/vi\/[-_A-Za-z0-9]+\/[^\/]*default\.jpg$/.test(article.image)) {
      const maxResUrl_1 = article.image.replace(/^(https?:\/\/[^\/]+\/vi\/[-_A-Za-z0-9]+\/)[^\/]*(default\.jpg)$/, "$1maxres$2");
      return fetch(maxResUrl_1, { method: "HEAD" }).then(function(response) {
        if (response.status === 200) {
          article.image = maxResUrl_1;
        }
        return article;
      }).catch(function() {
        return article;
      });
    } else if (article.link && !article.image) {
      return fetch(article.link, {
        method: "GET",
        responseType: 2
      }).then((response: any) => {
        const { status, data } = response;

        if (status === 200) {
          const dom = (new DOMParser()).parseFromString(data, "text/html");
          const metaImage = dom.querySelector("head meta[property=\"og:image\"]");

          if (metaImage) {
            let base = dom.querySelector("head base");

            if (!base) {
              base = dom.createElement("base");
              base.setAttribute("href", response.url);
              dom.getElementsByTagName("head")[0].appendChild(base);
            }

            const a: HTMLAnchorElement = dom.createElement("a");

            a.href = metaImage.getAttribute("content") || "";
            article.image = a.href;
          }

          return article;
        }

        return article;
      }).catch(function(err) {
        console.error(err)
        return article;
      });
    }
    return article;
  }));
};
export const getFavico = (url: string) => {
  const hostname = url ? new URL(url).hostname : "";

  return "https://icons.duckduckgo.com/ip3/" + hostname + ".ico";
};
