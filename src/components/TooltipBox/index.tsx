import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export const TooltipBox = (props: any) => {
  const { side = "top" } = props;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {props.children}
        </TooltipTrigger>
        <TooltipContent side={side}>
          <p className="flex items-center gap-1">{props.content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
