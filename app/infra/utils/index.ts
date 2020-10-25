import { shell } from 'electron';

export function openBrowser(link: string) {
  shell.openExternal(link);
}
