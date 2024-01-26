import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import * as dataAgent from "@/helpers/dataAgent";
import { useModal } from "../Modal/useModal";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Icon } from "../Icon";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { TooltipBox } from "../TooltipBox";
import { useBearStore } from "@/stores";
import { Kbd } from "@/components/Kbd";

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
    <Dialog open={showStatus} onOpenChange={handleStatusChange}>
      <TooltipBox
        content={
          <>
            Create new subscribe <Kbd val="c" className="ml-3" />
          </>
        }
        side="right"
        className="w-full"
      >
        <DialogTrigger asChild>{props.children}</DialogTrigger>
      </TooltipBox>
      <DialogContent className="sm:max-w-[465px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            {step === 2 && (
              <Icon className="mr-2 h-6 w-6 p-1" onClick={() => setStep(1)}>
                <ArrowLeft size={16} />
              </Icon>
            )}
            Subscribe
          </DialogTitle>
          <DialogDescription>
            Follow your favorite sources and never miss a story
          </DialogDescription>
        </DialogHeader>
        <div className="pb-5">
          {step === 1 && (
            <div>
              <div className="mb-3">
                <Input
                  type="text"
                  placeholder={""}
                  ref={inputRef}
                  disabled={loading}
                  value={feedUrl}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(e.target.value)
                  }
                />
              </div>
              <div>
                <Button
                  className="w-full"
                  onClick={handleLoad}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    "Load"
                  )}
                </Button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <div className="mb-3 rounded border p-3">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex-0 h-[80px] w-[80px] overflow-hidden rounded-lg">
                    <img src={feed.logo} className="" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-3 text-lg font-bold leading-5">
                      {feed.title}
                    </div>
                    <div className="break-all text-sm text-stone-500">
                      {feedUrl}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-md">{feed.description}</div>
                </div>
              </div>
              <div>
                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={confirming}
                >
                  {confirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subscribing
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
