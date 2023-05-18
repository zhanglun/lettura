import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
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

export const AddFeedChannel = (props: any) => {
  const { showStatus, toggleModal } = useModal();
  const [step, setStep] = useState(1);
  const [feedUrl, setFeedUrl] = useState("https://feeds.appinn.com/appinns/");
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
          toast({
            variant: "destructive",
            title: "Unable to subscribe",
            description: message,
            duration: 2,
          });

          return;
        }

        setFeed(res);
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
        if (res[1] === "") {
          busChannel.emit("getChannels");
          handleCancel();
        }
      })
      .finally(() => {
        setConfirming(false);
      });
  };

  useEffect(() => {
    if (showStatus && inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showStatus]);

  return (
    <Dialog open={showStatus} onOpenChange={handleStatusChange}>
      <DialogTrigger asChild>
        <Icon>
          <Plus size={16} />
        </Icon>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
                <div>
                  <div>{feed.title}</div>
                  <div>{feedUrl}</div>
                </div>
                <div>
                  <div>{feed.description}</div>
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
