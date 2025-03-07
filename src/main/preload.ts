/* eslint-disable @typescript-eslint/no-unused-vars */
// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent, shell } from 'electron';

const appInstallDir = ipcRenderer.sendSync('get-app-install-dir');

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: string, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: string, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: string, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    ipcSendSync(type: any, data: any) {
      const returnValue = ipcRenderer.sendSync('trigger', {
        type,
        data,
      });
      if (returnValue instanceof Error) throw returnValue;
      return returnValue;
    },
    ipcSend(type: any, data: any) {
      ipcRenderer.send('trigger', {
        type,
        data,
      });
    },
  },
};


contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
