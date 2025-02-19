import { Database } from 'sqlite3';
import * as fs from 'fs';
import path from 'path';

const os = require('os');

export default class InitCheck {
  public configDir: string;

  public dbPath: string;

  public settingPath: string;

  constructor() {
    const homedir = os.homedir();
    // 用户配置信息，插件，data目录
    const appDataPath = path.join(homedir, 'FinancialAssistant');
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath);
    }

    const configPath = path.join(appDataPath, 'config');
    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(configPath);
    }
    this.configDir = configPath;
    const settingPath = path.join(configPath, 'setting.json');
    if (!fs.existsSync(settingPath)) {
      fs.writeFileSync(
        settingPath,
        JSON.stringify({ sort: true, language: 'china' }),
      );
    }

    this.settingPath = settingPath;

    const dataPath = path.join(appDataPath, 'data');
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath);
    }
    const dbPath = path.join(dataPath, 'database.sqlite');
    this.dbPath = dbPath;
    InitCheck.initDatabase(dbPath);
  }

  static initDatabase(dbPath: string) {
    const db = new Database(dbPath);
    // 创建存款记录表
    db.run(`
        CREATE TABLE IF NOT EXISTS savings_record (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          owner TEXT NOT NULL,
          money DECIMAL(10,2) NOT NULL,
          rate DECIMAL(5,2) NOT NULL,
          start_date INTEGER NOT NULL,
          end_date INTEGER NOT NULL,
          created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
          updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
        )
      `);

    // 创建理财产品表
    db.run(`
      CREATE TABLE IF NOT EXISTS investment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bank TEXT NOT NULL,
        name TEXT NOT NULL,
        owner TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);

    // 创建理财收益记录表
    db.run(`
      CREATE TABLE IF NOT EXISTS investment_record (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        investment_id INTEGER NOT NULL,
        money DECIMAL(10,2) NOT NULL,
        in_date INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (investment_id) REFERENCES investment (id)
      )
    `);
    // 记录资产
    db.run(`
      CREATE TABLE IF NOT EXISTS assets_record (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT '人民币',
        date INTEGER NOT NULL,
        memo TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);
    // 资产趋势
    db.run(`
        CREATE TABLE IF NOT EXISTS assets_trend (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date INTEGER NOT NULL UNIQUE,
          amount REAL NOT NULL DEFAULT 0,
          created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
          updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
        )
      `);

    // 在 initDatabase 方法中添加新表创建语句
    db.run(`
      CREATE TABLE IF NOT EXISTS bill_record (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        month INTEGER NOT NULL,
        memo TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);

    db.close();
  }
}
