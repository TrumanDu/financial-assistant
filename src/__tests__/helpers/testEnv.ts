import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Database, OPEN_READONLY } from 'sqlite3';
import API from '../../main/api';
import InitCheck from '../../main/init_check';

// 测试专用数据库只能放在测试目录下，绝不碰用户的真实数据
const TMP_ROOT = path.resolve(__dirname, '..', '.tmp');
const REAL_DB_PATH = path.resolve(
  os.homedir(),
  'FinancialAssistant',
  'data',
  'database.sqlite',
);

const REQUIRED_TABLES = [
  'assets_record',
  'assets_trend',
  'bill_record',
  'investment_record',
];

export interface TestEnv {
  api: API;
  dir: string;
  dbPath: string;
  settingPath: string;
  /** 清空所有业务表，供 beforeEach 使用 */
  reset(): Promise<void>;
  /** 关闭连接并删除临时目录 */
  destroy(): Promise<void>;
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

// 只读打开并读取表名。库文件还没建好时 sqlite3 会走 'error' 事件而不是回调，
// 所以这里同时监听事件、回调，并加一个兜底超时，保证一定能 settle。
function readTables(dbPath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let db: Database;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settle = <T>(fn: (value: T) => void, value: T) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    timer = setTimeout(
      () => settle(reject, new Error('read schema timeout')),
      500,
    );

    try {
      db = new Database(dbPath, OPEN_READONLY);
    } catch (error) {
      settle(reject, error);
      return;
    }

    db.on('error', (error) => settle(reject, error));
    db.all(
      `SELECT name FROM sqlite_master WHERE type = 'table'`,
      (err, rows) => {
        db.close();
        if (err) settle(reject, err);
        else
          settle(
            resolve,
            (rows as { name: string }[]).map((r) => r.name),
          );
      },
    );
  });
}

// InitCheck.initDatabase 是异步建库建表，这里轮询等到建完再往下走
async function waitForTables(dbPath: string): Promise<void> {
  let lastError: unknown;

  for (let i = 0; i < 300 && !fs.existsSync(dbPath); i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(10);
  }
  if (!fs.existsSync(dbPath)) {
    throw new Error(`database file was never created: ${dbPath}`);
  }

  for (let i = 0; i < 100; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const tables = await readTables(dbPath);
      if (REQUIRED_TABLES.every((t) => tables.includes(t))) return;
      lastError = new Error(`tables missing: ${tables.join(',')}`);
    } catch (error) {
      lastError = error;
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(20);
  }
  throw new Error(`schema not ready under ${dbPath}: ${String(lastError)}`);
}

export async function createTestEnv(name: string): Promise<TestEnv> {
  const dir = path.resolve(TMP_ROOT, name);
  const dbPath = path.join(dir, 'test.sqlite');
  const settingPath = path.join(dir, 'setting.json');

  // 护栏 1：临时目录必须落在测试目录内
  if (!dir.startsWith(`${TMP_ROOT}${path.sep}`)) {
    throw new Error(`refusing to use test dir outside ${TMP_ROOT}: ${dir}`);
  }
  // 护栏 2：绝不能指向应用真实数据库或其所在的数据目录
  const realDataDir = path.dirname(REAL_DB_PATH);
  if (
    path.resolve(dbPath) === REAL_DB_PATH ||
    path.resolve(dbPath).startsWith(`${realDataDir}${path.sep}`)
  ) {
    throw new Error(`refusing to open the real database: ${dbPath}`);
  }

  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    settingPath,
    JSON.stringify({ sort: true, language: 'china' }),
  );

  InitCheck.initDatabase(dbPath);
  await waitForTables(dbPath);

  const api = new API({ dbPath, settingPath } as unknown as InitCheck);
  const { db } = api as unknown as { db: Database };

  const closeDb = () =>
    new Promise<void>((resolve, reject) => {
      db.close((err) => (err ? reject(err) : resolve()));
    });

  return {
    api,
    dir,
    dbPath,
    settingPath,
    reset: async () => {
      const tables = [
        'assets_record',
        'assets_trend',
        'bill_record',
        'investment_record',
      ];
      await Promise.all(
        tables.map(
          (t) =>
            new Promise<void>((resolve, reject) => {
              db.run(`DELETE FROM ${t}`, (err) =>
                err ? reject(err) : resolve(),
              );
            }),
        ),
      );
    },
    destroy: async () => {
      await closeDb();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}
