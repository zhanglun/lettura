import React, {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Toast } from "@douyinfe/semi-ui";
import * as dataAgent from "../../helpers/dataAgent";
import { busChannel } from "../../helpers/busChannel";
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
import { ArrowLeft, Plus } from "lucide-react";

export const AddFeedChannel = (props: any) => {
  const { showStatus, toggleModal } = useModal();
  const [step, setStep] = useState(1);
  const [feedUrl, setFeedUrl] = useState("https://feeds.appinn.com/appinns/");
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
        if (!res) {
          Toast.error({
            content: "Cant find any feed, please check url",
            duration: 2,
            theme: "light",
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
  }

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
        <span className="w-8 h-8 flex items-center justify-center rounded">
          <Plus size={16} />
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            {step === 2 && <span
              className="flex items-center justify-center rounded p-1 mr-2 hover:bg-icon-hover"
              onClick={() => setStep(1)}
            >
              <ArrowLeft size={16} />
            </span>}
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
                <Button className="w-full" onClick={handleLoad}>
                  {loading ? "Loading" : "Load"}
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
                <Button className="w-full" onClick={handleSave}>
                  Subscribe
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
