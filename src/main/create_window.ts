import path from 'path';
import { app, BrowserWindow, shell } from 'electron';
import { resolveHtmlPath, getAssetPath } from './util';

const createWindow = async () => {
  const newWindow = new BrowserWindow({
    show: false,
    center: true,
    autoHideMenuBar: true,
    width: 1560,
    height: 900,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false,
      navigateOnDragDrop: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  if (process.platform === 'darwin') {
    app.dock.setIcon(getAssetPath('icon.png'));
    app.dock.bounce();
  }

  newWindow.loadURL(resolveHtmlPath('index.html'));
  newWindow.on('close', (event) => {
    newWindow.hide();
    event.preventDefault();
  });
  // 当窗口准备好时，最大化窗口
  newWindow.webContents.on('did-finish-load', () => {
    newWindow.show();
  });
  newWindow.webContents.setWindowOpenHandler((data: { url: string }) => {
    shell.openExternal(data.url);
    return { action: 'deny' };
  });
  newWindow.webContents.on('will-navigate', (event, url) => {
    // 判断链接是否为本地文件
    if (!url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url); // 打开默认浏览器并跳转到该链接
    }
  });
  return newWindow;
};

export default createWindow;
