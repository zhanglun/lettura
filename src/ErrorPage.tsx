import { Button, Link, Theme } from "@radix-ui/themes";
import { useNavigate, useRouteError } from "react-router-dom";
import { useBearStore } from "./stores";
import { ArrowLeftIcon, BugIcon } from "lucide-react";

export default function ErrorPage() {
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    getUserConfig: state.getUserConfig,
    updateSettingDialogStatus: state.updateSettingDialogStatus,
  }));
  const navigator = useNavigate();
  const error = useRouteError() as any;
  console.warn(typeof error.stack);

  function goBack() {
    navigator(-1);
  }

  return (
    <Theme
      className="w-[100vw] h-[100vh]"
      // @ts-ignore
      accentColor={store.userConfig.theme || "indigo"}
      panelBackground="translucent"
    >
      <div id="error-page" className="h-full w-full">
        <div className="h-full flex flex-col justify-center items-center">
          <h1 className="text-4xl font-bold font-serif mb-6">Oops!</h1>
          <p className="text-xl">Sorry, an unexpected error has occurred.</p>
          <p className="text-xl text-red-600">
            <i>{error.statusText || error.message}</i>
          </p>
          <pre className="text-sm mt-4 font-[monospace]">{error.stack}</pre>
          <div className="my-8 flex items-center gap-12">
            <Link className="flex items-center gap-1" onClick={goBack}>
              <ArrowLeftIcon size="18" strokeWidth={1.5} /> Go Back
            </Link>
            <Link href="https://github.com/zhanglun/lettura/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=" color="red" target="_blank" className="flex items-center gap-1">
              <BugIcon size="18" strokeWidth={1.5} /> Click to report bugs
            </Link>
          </div>
        </div>
      </div>
    </Theme>
  );
}
