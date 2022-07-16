import React, { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Channel, db } from "../../../db";

export const FeedManager = () => {
  const channelList = useLiveQuery(() => db.channels.toArray(), []);

  useEffect(() => {
    console.log(channelList);
  }, [channelList]);

  return <div>
    <div>
      <ul>
        {(channelList || []).map((channel: Channel) => {
          return <li key={channel.id}>{channel.title}</li>;
        })}
      </ul>
    </div>
  </div>;
};
