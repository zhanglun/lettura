import { makeAutoObservable } from 'mobx';

export class ChannelStore {
  feedUrl = '';

  currentChannel = '';

  constructor() {
    makeAutoObservable(this);
  }

  add(url: string) {
    this.feedUrl = url;
    console.log(url);
  }

  setCurrentChannel(id: string) {
    this.currentChannel = id;
  }
}
