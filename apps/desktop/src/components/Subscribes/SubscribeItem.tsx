import { FC, memo } from "react";
import { FeedResItem } from "@/db";
import { ItemView } from "./ItemView";

export interface CardProps {
  uuid: string;
  text: string;
  index: number;
  feed: FeedResItem;
  className?: String;
  children?: React.ReactNode;
  arrow?: React.ReactNode;
  isActive: boolean;
  isExpanded: boolean;
  level?: number;
  toggleFolder: (uuid: string) => void;
}

export const SubscribeItem: FC<CardProps> = memo(
  ({
    uuid,
    text,
    feed,
    index,
    level,
    isActive,
    isExpanded,
    toggleFolder,
    children,
  }) => {
    return (
      <div className="relative rounded-md border border-transparent">
        <ItemView
          index={index}
          uuid={feed.uuid}
          level={level}
          text={feed.title}
          feed={{ ...feed }}
          isActive={isActive}
          isExpanded={isExpanded}
          toggleFolder={toggleFolder}
        >
          {children && (
            <div
              className={`grid grid-cols-[100%] overflow-hidden transition-all ${
                isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0 ">{children}</div>
            </div>
          )}
        </ItemView>
      </div>
    );
  },
);
