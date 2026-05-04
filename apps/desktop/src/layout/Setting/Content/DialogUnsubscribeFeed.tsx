import React, { useState } from "react";
import { AlertDialog, Button, Flex, RadioGroup, Text } from "@radix-ui/themes";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { toast } from "sonner";
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
    afterCancel,
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
          <Text size="2" className="text-[var(--gray-11)]">
            {t("This action cannot be undone. This will permanently delete the data relates with", { title: feed?.title })}
          </Text>
          <div className="mt-4">
            <RadioGroup.Root value={deleteMode} onValueChange={(v) => setDeleteMode(v as "keep" | "delete")}>
              <Flex direction="column" gap="2">
                <Text as="label" size="2">
                  <Flex gap="2" align="center">
                    <RadioGroup.Item value="keep" />
                    <Text>{t("layout.feeds.delete.keep_articles")}</Text>
                  </Flex>
                </Text>
                <Text as="label" size="2">
                  <Flex gap="2" align="center">
                    <RadioGroup.Item value="delete" />
                    <Text>{t("layout.feeds.delete.delete_articles")}</Text>
                  </Flex>
                </Text>
              </Flex>
            </RadioGroup.Root>
          </div>
          {deleteMode === "delete" && (
            <div className="mt-3 rounded-md border border-[var(--amber-5)] bg-[var(--amber-a2)] px-3 py-2">
              <Text size="1" className="text-[var(--amber-11)]">
                {t("layout.feeds.delete.warning")}
              </Text>
            </div>
          )}
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel onClick={() => handleCancel()}>
            <Button variant="soft" color="gray">
              {t("Cancel")}
            </Button>
          </AlertDialog.Cancel>
          <Button
            variant="solid"
            color="red"
            onClick={() => confirmUnsubscribe()}
          >
            {t("Unsubscribe")}
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
});
