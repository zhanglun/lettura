// import { ChannelRepository } from './repository/channel';

// const channelRepo = new ChannelRepository();

console.log('load worker');

onmessage = function (e) {
  console.log('Message received from main script');

  const workerResult = `Result: ${e}`;

  console.log('Posting message back to main script');

  postMessage(workerResult);
};
