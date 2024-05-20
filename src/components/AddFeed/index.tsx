import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import * as dataAgent from "@/helpers/dataAgent";
import { useModal } from "../Modal/useModal";

import { Avatar, Button, Dialog, Kbd, TextField, Tooltip } from "@radix-ui/themes";
import { Icon } from "../Icon";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useBearStore } from "@/stores";

export const AddFeedChannel = (props: any) => {
  const store = useBearStore((state) => ({
    initCollectionMetas: state.initCollectionMetas,
    addNewFeed: state.addNewFeed,
  }));
  const [showStatus, , showModal, , toggleModal] = useModal();
  const [step, setStep] = useState(1);
  const [feedUrl, setFeedUrl] = useState("");
  const [feed, setFeed] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLoad = async () => {
    setLoading(true);

    dataAgent
      .fetchFeed(feedUrl)
      .then((res) => {
        console.log("res from rust", res);
        const [feed, message] = res;
        if (!feed) {
          console.log("%c Line:40 🥤 !feed", "color:#f5ce50", !feed);
          toast.error("Unable to subscribe", {
            description: message,
            duration: 2000,
          });

          return;
        }

        setFeed(feed);
        console.log("%c Line:52 🥑 feed", "color:#7f2b82", feed);
        setStep(2);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleInputChange = (value: string) => {
    setFeedUrl(value);
  };

  const handleCancel = () => {
    setLoading(false);
    setConfirming(false);
    setStep(1);
    setFeedUrl("");
    setFeed({});
    toggleModal();
  };

  const handleStatusChange = () => {
    handleCancel();
  };

  const handleSave = async () => {
    setConfirming(true);

    dataAgent
      .subscribeFeed(feedUrl)
      .then((res) => {
        console.log("%c Line:88 🥕 res", "color:#4fff4B", res);
        if (res[2] === "") {
          store.initCollectionMetas();

          res[0].children = [];
          res[0].unread = res[1];

          store.addNewFeed(res[0]);
          handleCancel();
          toast.success("Your subscribe is ready! Please enjoy it!");
        } else {
          toast.error("Unable to subscribe", {
            description: res[2],
            duration: 2000,
          });
        }
      })
      .finally(() => {
        setConfirming(false);
      });
  };

  useHotkeys("c", () => {
    showModal();
  });

  useEffect(() => {
    setTimeout(() => {
      if (showStatus && inputRef.current) {
        inputRef.current.focus();
        setFeedUrl(() => "");
      }
    }, 10);
  }, [showStatus]);

  return (
    <Dialog.Root open={showStatus} onOpenChange={handleStatusChange}>
      <Tooltip
        content={
          <>
            Create new subscribe <Kbd className="ml-3">c</Kbd>
          </>
        }
        side="right"
        className="w-full"
      >
        <Dialog.Trigger>{props.children}</Dialog.Trigger>
      </Tooltip>
      <Dialog.Content className="sm:max-w-[465px]">
        <Dialog.Title className="lex items-center" size="6" mt="2" mb="1">
          {step === 2 && (
            <Icon className="mr-2 h-6 w-6 p-1" onClick={() => setStep(1)}>
              <ArrowLeft size={16} />
            </Icon>
          )}
          Subscribe
        </Dialog.Title>
        <Dialog.Description size="2" mb="4" color="gray">
          Follow your favorite sources and never miss a story
        </Dialog.Description>
        <div className="py-3">
          {step === 1 && (
            <>
              <TextField.Root
                placeholder=""
                ref={inputRef}
                disabled={loading}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value)}
              ></TextField.Root>
              <div className="flex justify-end gap-3 mt-4">
                <Dialog.Close>
                  <Button variant="soft">Cancel</Button>
                </Dialog.Close>
                <Button onClick={handleLoad} disabled={loading} loading={loading}>
                  {loading ? "Loading" : "Load"}
                </Button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="mb-3 rounded border p-3">
                <div className="mb-4 flex items-start gap-3">
                  <Avatar fallback={feed.title.slice(0, 1)} src={feed.logo} size="6" />
                  <div className="flex-1 pt-2">
                    <div className="mb-3 text-lg font-bold leading-5">{feed.title}</div>
                    <div className="break-all text-sm text-stone-500">{feedUrl}</div>
                  </div>
                </div>
                <div>
                  <div className="text-md">{feed.description}</div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Dialog.Close>
                  <Button variant="soft">Cancel</Button>
                </Dialog.Close>
                <Button onClick={handleSave} disabled={confirming} loading={confirming}>
                  {confirming ? "Subscribing" : "Subscribe"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};
