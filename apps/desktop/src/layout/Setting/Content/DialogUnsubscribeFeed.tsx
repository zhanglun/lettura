import React, { useState } from "react";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Button } from "@astryxdesign/core/Button";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { Text } from "@astryxdesign/core/Text";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { toast } from "@/helpers/toast";
import { useTranslation } from "react-i18next";

export interface DialogProps {
  feed: FeedResItem | null;
  dialogStatus: boolean;
  trigger?: React.ReactNode;
  setDialogStatus: (status: boolean) => void;
  afterConfirm: () => void;
  afterCancel: () => void;
}

export const DialogUnsubscribeFeed = React.memo((props: DialogProps) => {
  const { t } = useTranslation();
  const {
    feed,
    dialogStatus,
    setDialogStatus,
    afterConfirm,
    trigger,
  } = props;
  const [loading, setLoading] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"keep" | "delete">("keep");

  React.useEffect(() => {
    if (dialogStatus) {
      setDeleteMode("keep");
    }
  }, [dialogStatus]);

  const confirmUnsubscribe = () => {
    if (feed?.uuid) {
      setLoading(true);
      dataAgent
        .deleteChannel(feed.uuid, deleteMode === "delete")
        .then(() => {
          busChannel.emit("getChannels");
          afterConfirm();
          setDialogStatus(false);
        })
        .catch((err) => {
          toast.error(t(err.message) || t("Ops! Something wrong~"));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return (
    <>
      {trigger}
      <Dialog
        isOpen={dialogStatus}
        onOpenChange={setDialogStatus}
        width={440}
      >
        <DialogHeader title={t("Are you absolutely sure?")} />
        <div className="flex flex-col gap-4 py-2">
          <Text size="sm" color="secondary">
            {t(
              "This action cannot be undone. This will permanently delete the data relates with",
              { title: feed?.title },
            )}
          </Text>
          <RadioList
            label={t("Article handling")}
            isLabelHidden
            value={deleteMode}
            onChange={(v) => setDeleteMode(v as "keep" | "delete")}
          >
            <RadioListItem
              value="keep"
              label={t("layout.feeds.delete.keep_articles")}
            />
            <RadioListItem
              value="delete"
              label={t("layout.feeds.delete.delete_articles")}
            />
          </RadioList>
          {deleteMode === "delete" && (
            <div className="rounded-md border border-[var(--color-border-orange)] bg-[var(--color-background-orange)] px-3 py-2">
              <Text size="xsm" color="secondary">
                {t("layout.feeds.delete.warning")}
              </Text>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              label={t("Cancel")}
              onClick={() => setDialogStatus(false)}
            />
            <Button
              variant="destructive"
              onClick={confirmUnsubscribe}
              isLoading={loading}
              label={t("Unsubscribe")}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
});
