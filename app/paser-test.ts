import { parseRSS } from './infra/utils';

const url = process.argv[2];

console.log('url', url);

parseRSS(url)
  .then((...args) => {
    console.log(...args);
    return args;
  })
  .catch((err) => {
    console.log('ERROR ===>');
    console.log(err);
  });
