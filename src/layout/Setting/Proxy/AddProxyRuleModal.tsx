import { Avatar,  Button, Checkbox, Popover } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { Plus, PlusCircle } from "lucide-react";
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
  const [selectedValues, setSelectValues] = useState<FeedResItem[]>(value);

  function handleChange(values: FeedResItem[]) {
    onValueChange(values);
  }

  useEffect(() => {
    setSelectValues(value);
  }, [value])

  return (
    <Popover.Root>
      <Popover.Trigger>
        <Button variant="surface">
          <Plus size={16} /> Select subscribes
        </Button>
      </Popover.Trigger>
      <Popover.Content className="w-[462px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Searching" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {feedList.map((option) => {
                const isSelected = selectedValues.some((s) => s.feed_url === option.feed_url);
                return (
                  <CommandItem
                    key={option.id}
                    onSelect={() => {
                      let values = [];

                      if (isSelected) {
                        values = selectedValues.filter((s) => s.feed_url !== option.feed_url);
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
                      className="mr-2"
                    />
                    <span>{option.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </Popover.Content>
    </Popover.Root>
  );
};
