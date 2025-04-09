import React, { useState } from "react";
import { AlertDialog, Button, Flex } from "@radix-ui/themes";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { toast } from "sonner";
import { useTranslation, Trans } from "react-i18next";

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
  const { feed, dialogStatus, setDialogStatus, afterConfirm, afterCancel, trigger } = props;
  const [loading, setLoading] = useState(false);

  const confirmUnsubscribe = () => {
    if (feed?.uuid) {
      setLoading(true);
      dataAgent
        .deleteChannel(feed.uuid)
        .then(() => {
          busChannel.emit("getChannels");
          afterConfirm();
          setDialogStatus(false);
        })
        .catch((err) => {
          toast.error(t("Ops! Something wrong~"), {
            description: t(err.message),
            duration: 2000,
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleCancel = () => {
    afterCancel();
  };

  return (
    <AlertDialog.Root open={dialogStatus} onOpenChange={setDialogStatus}>
      {trigger && <AlertDialog.Trigger>{trigger}</AlertDialog.Trigger>}
      <AlertDialog.Content>
        <AlertDialog.Title>{t("Are you absolutely sure?")}</AlertDialog.Title>
        <AlertDialog.Description>
          <Trans
            i18nKey={"This action cannot be undone. This will permanently delete the data relates with"}
            components={{ bold: <strong /> }}
            values={{
              title: feed?.title,
            }}
            shouldUnescape={true}
          ></Trans>
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel onClick={() => handleCancel()}>
            <Button variant="soft" color="gray">
              {t("Cancel")}
            </Button>
          </AlertDialog.Cancel>
          <Button variant="solid" color="red" onClick={() => confirmUnsubscribe()}>
            {t("Unsubscribe")}
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
});
