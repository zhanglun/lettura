import { PartyPopper } from "lucide-react";
import { Button } from "../ui/button";
import bg from "./bg.svg";
import { useNavigate } from "react-router-dom";
import { RouteConfig } from "@/config";

export const WelcomePage = () => {
  const navigate = useNavigate();

  const goToLocal = () => {
    navigate(RouteConfig.LOCAL_TODAY)
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-[40%] max-w-[500px]">
        <img src={bg} className="w-full" />
      </div>
      <div>
        <Button onClick={goToLocal}>
          <div className="flex items-center gap-2">
            <span className="text-lg">Start your journal</span>
            <PartyPopper size={20} />
          </div>
        </Button>
      </div>
    </div>
  );
};
