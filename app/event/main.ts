import { IpcMainEvent, ipcMain, remote } from 'electron';
import { SYNC_UNREAD } from './constant';

ipcMain.on('finish-sync-channel', (event: IpcMainEvent, arg) => {
  console.log(arg); // prints "ping"
  event.reply('asynchronous-reply', 'pong');
});

ipcMain.on('synchronous-message', (event: IpcMainEvent, arg) => {
  console.log(arg); // prints "ping"
  event.returnValue = 'pong';
});

remote.getCurrentWebContents().send(SYNC_UNREAD);
