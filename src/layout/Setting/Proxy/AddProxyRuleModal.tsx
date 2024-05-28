import { request } from "@/helpers/request";
import { Avatar, Badge, Button, Checkbox, Dialog, Popover, Separator, TextField } from "@radix-ui/themes";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { FeedResItem } from "@/db";
import { getChannelFavicon } from "@/helpers/parseXML";

export interface AddProxyRuleModalProps {
  feedList: FeedResItem[];
  value: FeedResItem[];
  onValueChange: (values: FeedResItem[]) => void;
}

export const AddProxyRuleModal = (props: AddProxyRuleModalProps) => {
  const { feedList, value, onValueChange } = props;
  const [selectedValues, setSelectValues] = useState<FeedResItem[]>([]);

  // const handleSave = () => {
  //   const params = {
  //
  //   };
  //
  //   console.log("%c Line:15 🍅 params", "color:#ea7e5c", params);
  //   let fn = proxy
  //     ? request.post("proxy", {
  //         id: `socks5://${proxy.server}:${proxy.port}`,
  //         data: {
  //           ...params,
  //           enable: proxy.enable,
  //         },
  //       })
  //     : request.put("proxy", {
  //         ...params,
  //         enable: false,
  //       });
  //
  //   fn.then(({ data }) => {
  //     console.log(data);
  //     if (data.error) {
  //       toast.error(data.error);
  //    } else {
  //     }
  //   });
  // };

  function handleChange(values: FeedResItem[]) {
    onValueChange(values);
  }

  return (
    <Popover.Root>
      <Popover.Trigger>
        <Button variant="outline">
          <PlusCircle size={16} />
        </Button>
      </Popover.Trigger>
      <Popover.Content className="w-[462px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Searching" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {feedList.map((option) => {
                const isSelected = selectedValues.some((s) => s.link === option.link);
                return (
                  <CommandItem
                    key={option.id}
                    onSelect={() => {
                      let values = [];

                      if (isSelected) {
                        values = selectedValues.filter((s) => s.link !== option.link);
                      } else {
                        values = [...selectedValues, option];
                      }

                      setSelectValues(values);
                      handleChange(values);
                    }}
                  >
                    <Checkbox checked={isSelected} className="mr-2" />
                    <Avatar
                      src={getChannelFavicon(option.link)}
                      fallback={option.title.slice(0, 1)}
                      alt={option.title}
                      size="1"
                    />
                    <span>{option.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => {}} className="justify-center text-center">
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </Popover.Content>
    </Popover.Root>
  );
};
