import { dialog, Menu, Tray, app, shell, BrowserWindow } from 'electron';
import pkg from '../../package.json';
import { getAppDir, getAssetPath } from './util';
import API from './api';

function createTray(dashboard: BrowserWindow, api: API): Promise<Tray> {
  return new Promise((resolve) => {
    const iconPath = getAssetPath('icons/16x16.png');

    const appTray = new Tray(iconPath);

    const openInstallDirectory = () => {
      const directoryPath = getAppDir();
      shell.openPath(directoryPath);
    };

    const createContextMenu = () =>
      Menu.buildFromTemplate([
        {
          type: 'normal',
          label: '        显示        ',
          click() {
            dashboard.show();
          },
        },
        { type: 'separator' },
        {
          label: '       打开安装目录       ',
          click() {
            openInstallDirectory();
          },
        },
        { type: 'separator' },
        {
          label: '        帮助文档        ',
          click: () => {
            process.nextTick(() => {
              shell.openExternal('https://github.com/TrumanDu/toolkit');
            });
          },
        },
        {
          label: '        意见反馈        ',
          click: () => {
            process.nextTick(() => {
              shell.openExternal('https://github.com/TrumanDu/toolkit/issues');
            });
          },
        },

        { type: 'separator' },
        {
          label: '        关于        ',
          click() {
            dialog.showMessageBox({
              title: 'FinancialAssistant',
              icon: iconPath,
              message: '家庭理财助手！',
              detail: `Version: ${pkg.version}\nAuthor: TrumanDu`,
            });
          },
        },
        { type: 'separator' },
        {
          label: '        退出        ',
          click() {
            app.exit();
          },
        },
      ]);
    appTray.on('right-click', () => {
      appTray.setContextMenu(createContextMenu());
      appTray.popUpContextMenu();
    });
    // appTray.setContextMenu(createContextMenu());

    appTray.on('click', () => {
      if (dashboard) {
        if (dashboard.isVisible()) {
          dashboard.hide();
        } else {
          dashboard.show();
          dashboard.focus();
        }
      }
    });

    resolve(appTray);
  });
}
export default createTray;
