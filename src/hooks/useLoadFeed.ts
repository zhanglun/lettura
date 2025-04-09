import { toast } from "sonner";
import { FeedResItem } from "@/db";
import i18next from "i18next";

export function loadFeed(
  feed: FeedResItem,
  requester: (feed: FeedResItem) => Promise<any>,
  success: (...args: any[]) => any,
  fail: (...args: any[]) => any
) {
  const toastId = toast("Sonner");
  toast.loading(i18next.t("Start reloading, Please wait..."), {
    id: toastId,
  });

  requester(feed).then((res) => {
    const [uuid, [title, num, message]] = Object.entries(res)[0] as [
      string,
      [string, number, string]
    ];
    if (message) {
      toast.error(i18next.t(`Ops! Something wrong~`), {
        id: toastId,
        description: message,
      });
      fail();
    } else {
      success();
      toast.success(
        num > 0
          ? i18next.t('We have {{num}} new pieces of data from {{title}}', { num, title })
          : i18next.t('{{title}} is already up to date, no new content found', { title }),
        {
          id: toastId,
        }
      );
    }
  }).catch((e) => {
      fail();
      toast.error(i18next.t(`Ops! Something wrong~`), {
        id: toastId,
        description: i18next.t(e.message),
      });
  });
}
