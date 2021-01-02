import { parseRSS } from './infra/utils';

const url = 'https://github.com/zhanglun';

parseRSS(url)
  .then((...args) => {
    console.log(...args);
    return args;
  })
  .catch((err) => {
    console.log('ERROR ===>');
    console.log(err);
  });
