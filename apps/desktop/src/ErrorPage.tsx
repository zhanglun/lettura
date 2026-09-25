import { useNavigate, useRouteError } from "react-router-dom";
import { ArrowLeftIcon, BugIcon } from "lucide-react";

export default function ErrorPage() {
  const navigator = useNavigate();
  const error = useRouteError() as any;

  return (
    <div id="error-page" className="h-full w-full">
      <div className="h-full flex flex-col justify-center items-center">
        <h1 className="text-4xl font-bold font-serif mb-6">Oops!</h1>
        <p className="text-xl">Sorry, an unexpected error has occurred.</p>
        <p className="text-xl text-red-600">
          <i>{error.statusText || error.message}</i>
        </p>
        <pre className="text-sm mt-4 font-[monospace]">{error.stack}</pre>
        <div className="my-8 flex items-center gap-12">
          <a
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => navigator(-1)}
          >
            <ArrowLeftIcon size="18" strokeWidth={1.5} /> Go Back
          </a>
          <a
            href="https://github.com/zhanglun/lettura/issues/new?assignees=&labels=&projects=&template=bug_report.md&title="
            className="flex items-center gap-1 text-red-600"
            target="_blank"
          >
            <BugIcon size="18" strokeWidth={1.5} /> Click to report bugs
          </a>
        </div>
      </div>
    </div>
  );
}
