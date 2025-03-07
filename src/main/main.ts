/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';

import log from 'electron-log';
import { getAppDir } from './util';
import createTray from './tray';
import API from './api';
import AppUpdater from './app_updater';
import InitCheck from './init_check';
import createMainWindow from './create_window';

const { baiduAnalyticsMain } = require('@nostar/baidu-analytics-electron');
// IMPORTANT: to fix file save problem in excalidraw: The request is not allowed by the user agent or the platform in the current context
app.commandLine.appendSwitch('enable-experimental-web-platform-features');
app.setAppUserModelId('top.trumandu.app.FinancialAssistant');

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
if (isDebug) {
  require('electron-debug')();
}
const initCheck = new InitCheck();

baiduAnalyticsMain(ipcMain);

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    // await installExtensions();
  }

  // eslint-disable-next-line no-new
  new AppUpdater();
  mainWindow = await createMainWindow();
  const api = new API(initCheck);
  api.listen();
  // 创建系统托盘图标
  createTray(mainWindow, api);
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) {
        createWindow();
      } else {
        mainWindow.focus();
      }
    });
  })
  .catch(console.log);

// 拦截系统默认的 Quit 行为
app.on('before-quit', (event) => {
  event.preventDefault(); // 阻止默认退出
  // 强制退出
  app.exit();
});

app.on('ready', () => {
  const appInstallDir = getAppDir();
  // 将应用程序安装目录发送给渲染进程
  ipcMain.on('get-app-install-dir', (event) => {
    event.returnValue = appInstallDir;
  });
});
