// Jest 环境下的 electron 替身：只提供主进程代码 import 时会用到的最小 API，
// 避免测试加载真实 electron 二进制，也避免任何真实的 IPC / 窗口副作用。
const os = require('os');

const noop = () => {};

module.exports = {
  app: {
    isPackaged: false,
    name: 'financial-assistant-test',
    getVersion: () => '0.0.0-test',
    getAppPath: () => process.cwd(),
    getPath: () => os.tmpdir(),
    getLocale: () => 'zh-CN',
    quit: noop,
  },
  ipcMain: { on: noop, once: noop, handle: noop, removeHandler: noop },
  ipcRenderer: {
    send: noop,
    sendSync: () => undefined,
    on: noop,
    once: noop,
    removeListener: noop,
    invoke: () => Promise.resolve(),
  },
  contextBridge: { exposeInMainWorld: noop },
  shell: { openExternal: noop, openPath: () => Promise.resolve() },
  Notification: function Notification() {
    this.show = noop;
  },
  BrowserWindow: function BrowserWindow() {
    this.loadURL = noop;
    this.on = noop;
  },
};
