/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { app } from 'electron';
import * as fs from 'fs';

const os = require('os');

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export function getAssetPath(...paths: string[]): string {
  return path.join(RESOURCES_PATH, ...paths);
}

export function getAppDir(): string {
  const homedir = os.homedir();
  // 用户配置信息，插件，data目录
  const appDataPath = path.join(homedir, 'FinancialAssistant');
  return app.isPackaged ? appDataPath : app.getAppPath();
}

export function deleteFolder(filePath: string) {
  if (fs.existsSync(filePath)) {
    const files = fs.readdirSync(filePath);
    files.forEach((file) => {
      const nextFilePath = `${filePath}/${file}`;
      const states = fs.statSync(nextFilePath);
      if (states.isDirectory()) {
        deleteFolder(nextFilePath);
      } else {
        fs.unlinkSync(nextFilePath);
      }
    });
    fs.rmdirSync(filePath);
  }
}

export function readJsonObjFromFile(filePath: string) {
  let json = {};
  if (fs.existsSync(filePath)) {
    const p = fs.readFileSync(filePath, 'utf8');
    json = JSON.parse(p);
  }
  return json;
}
