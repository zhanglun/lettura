import React, {useEffect} from "react";
import {useLiveQuery} from "dexie-react-hooks";
import { db } from '../../../db';

export const FeedManager = () => {
  const channelList = useLiveQuery(() => db.channels.toArray(), [])

  useEffect(() => {
    console.log(channelList)
  }, [channelList])

  return <div>
    <div>
      asdfsadf
    </div>
  </div>;
};
