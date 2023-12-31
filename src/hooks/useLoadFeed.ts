import { toast } from "sonner";
import { FeedResItem } from "@/db";

export function loadFeed(
  feed: FeedResItem,
  requester: (feed: FeedResItem) => Promise<any>,
  success: (...args: any[]) => any,
  fail: (...args: any[]) => any
) {
  const toastId = toast("Sonner");
  toast.loading("Start reloading, Please wait...", {
    id: toastId,
  });

  requester(feed).then((res) => {
    const [uuid, [title, num, message]] = Object.entries(res)[0] as [
      string,
      [string, number, string]
    ];
    if (message) {
      toast.error(`Something wrong!`, {
        id: toastId,
        description: message,
      });
      fail();
    } else {
      success();
      toast.success(
        num > 0
          ? `We have ${num} new pieces of data from ${title}`
          : `${title} is already up to date.`,
        {
          id: toastId,
        }
      );
    }
  }).catch((e) => {
      fail();
      toast.error(`Something wrong!`, {
        id: toastId,
        description: e.message,
      });
  });
}
