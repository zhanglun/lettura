import { request } from "@/helpers/request";
import { Button, Dialog, TextField } from "@radix-ui/themes";
import { PlusCircle } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";

export interface ProxyModalProps {
  proxy?: LocalProxy | null;
  dialogStatus: boolean;
  trigger?: React.ReactNode;
  setDialogStatus: (status: boolean) => void;
  afterConfirm: () => void;
  afterCancel: () => void;
}

export const ProxyModal = (props: ProxyModalProps) => {
  const { proxy, dialogStatus, setDialogStatus, afterConfirm, afterCancel, trigger } = props;
  const [disabled, setDisabled] = useState(true);
  const [server, setServer] = useState("");
  const [port, setPort] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const reset = () => {
    setDisabled(true);
    setServer("");
    setPort("");
    setUsername("");
    setPassword("");
  };

  const handleCancel = () => {
    reset();
    afterCancel();
  };

  const handleSave = () => {
    const params = {
      server,
      port,
      username,
      password,
    };

    console.log("%c Line:15 🍅 params", "color:#ea7e5c", params);

    request
      .put("proxy", {
        ...params,
        // is_global: false,
        enable: false,
      })
      .then(({ data }) => {
        console.log(data);
        if (data.error) {
          toast.error(data.error);
        } else {
          setDialogStatus(false);
          reset();
          afterConfirm();
        }
      });
  };

  useEffect(() => {
    setDisabled(!(server && port));
  }, [server, port]);

  return (
    <Dialog.Root open={dialogStatus} onOpenChange={setDialogStatus}>
      <Dialog.Trigger>
        <Button variant="ghost">
          <PlusCircle />
          Add Proxy
        </Button>
      </Dialog.Trigger>
      <Dialog.Content className="sm:max-w-[425px]">
        <Dialog.Title className="lex items-center" size="6" mt="2" mb="1">
          Add Proxy
        </Dialog.Title>
        <Dialog.Description size="2" mb="4" color="gray">
          {}
        </Dialog.Description>
        <div>
          <div className="mb-1">Connection</div>
          <TextField.Root
            placeholder="Server"
            mb="2"
            value={server}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setServer(e.target.value)}
          ></TextField.Root>
          <TextField.Root
            placeholder="Port"
            mb="2"
            value={port}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPort(e.target.value)}
          ></TextField.Root>
          <div className="mb-1 mt-3">Credentials(optional)</div>
          <TextField.Root
            placeholder="Username"
            mb="2"
            value={username}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
          ></TextField.Root>
          <TextField.Root
            placeholder="Password"
            mb="2"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          ></TextField.Root>
          <div className="flex justify-end gap-3 mt-4">
            <Dialog.Close>
              <Button variant="soft" onClick={handleCancel}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleSave} disabled={disabled}>
              Save
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};
