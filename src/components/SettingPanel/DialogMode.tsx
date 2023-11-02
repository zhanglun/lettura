import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SettingPanel } from "./index";
import { useNavigate } from "react-router-dom";
import { useBearStore } from "@/stores";

export const SettingDialog = () => {
  const store = useBearStore((state) => ({
    lastViewRouteBeforeSetting: state.lastViewRouteBeforeSetting,
  }));
  const navigate = useNavigate();

  const handleStatusChange = (status: boolean) => {
    console.log("%c Line:20 🍬 status", "color:#2eafb0", status);
    console.log("%c Line:23 🥃 store.lastViewRouteBeforeSetting", "color:#93c0a4", store.lastViewRouteBeforeSetting);
    if (!status) {
      if (store.lastViewRouteBeforeSetting) {
        const { pathname, search, hash } = store.lastViewRouteBeforeSetting;
        navigate(`${pathname}${search}${hash}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleStatusChange}>
      <DialogContent className="min-w-[90%] min-h-[90%]">
        <SettingPanel />
      </DialogContent>
    </Dialog>
  );
};
