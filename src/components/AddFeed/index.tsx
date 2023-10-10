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
import { useToast } from "@/components/ui/use-toast";
import { TooltipBox } from "../TooltipBox";
import { useBearStore } from "@/stores";
import { Kbd } from "@/components/Kbd";

export const AddFeedChannel = (props: any) => {
  const store = useBearStore((state) => ({
    initCollectionMetas: state.initCollectionMetas,
  }));
  const [showStatus, , showModal, , toggleModal] = useModal();
  const [step, setStep] = useState(1);
  const [feedUrl, setFeedUrl] = useState("");
  const [feed, setFeed] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleLoad = async () => {
    setLoading(true);

    dataAgent
      .fetchFeed(feedUrl)
      .then((res) => {
        console.log("res from rust", res);
        const [feed, message] = res;
        if (!feed) {
          console.log("%c Line:40 🥤 !feed", "color:#f5ce50", !feed);
          toast({
            variant: "destructive",
            title: "Unable to subscribe",
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
      .addChannel(feedUrl)
      .then((res) => {
        console.log("%c Line:88 🥕 res", "color:#4fff4B", res);
        if (res[1] === "") {
          store.initCollectionMetas();
          handleCancel();
        } else {
          toast({
            variant: "destructive",
            title: "Unable to subscribe",
            description: res[1],
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
      <TooltipBox content={
        <>
          Add feed <Kbd val="c" className="ml-3" />
        </>
      }>
        <DialogTrigger asChild>
          <Icon>
            <Plus size={16} />
          </Icon>
        </DialogTrigger>
      </TooltipBox>
      <DialogContent className="sm:max-w-[465px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            {step === 2 && (
              <Icon className="w-6 h-6 p-1 mr-2" onClick={() => setStep(1)}>
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
              <div className="border rounded p-3 mb-3">
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-lg overflow-hidden flex-0 w-[80px] h-[80px]">
                    <img src={feed.logo} className="" />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-bold leading-5 mb-3">
                      {feed.title}
                    </div>
                    <div className="text-sm text-stone-500 break-all">
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
