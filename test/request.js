const net = require('net');

const HOST = '127.0.0.1';
const PORT = '1087';

const client = new net.Socket({});

client.connect(PORT, HOST, () => {
  console.log(`Connect to: ${HOST}:${PORT}`);
  client.write('Hello');
});

client.on('data', (data) => {
  console.log('Data:' + data);
  client.destroy();
});

client.on('close', () => {
  console.log('Connection closed');
});

const https = require('https');
const agent = new https.Agent({});

agent.createConnection = () => client;

const options = {
  url: 'https://rsshub.app/1x',
  agent: agent,
};

https.get(options, (res) => {
 console.log('res', res);
});
