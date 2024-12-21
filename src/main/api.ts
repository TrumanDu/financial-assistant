/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
// @ts-nocheck
import { ipcMain, BrowserWindow, Notification } from 'electron';
import log from 'electron-log';
import { Database } from 'sqlite3';
import Setting from './setting';
import InitCheck from './init_check';

class API {
  private setting: Setting;

  private db: Database;

  constructor(initCheck: InitCheck) {
    this.setting = new Setting(initCheck);
    this.db = new Database(initCheck.dbPath);
  }

  public listen() {
    ipcMain.on('trigger', async (event, arg) => {
      console.log(arg);
      try {
        const data = await this[arg.type](arg, event);
        event.returnValue = data;
      } catch (error) {
        log.error(error);
      }
    });
  }

  public notification(title: string, body: string) {
    const notification = new Notification({
      title,
      body,
    });
    notification.show();
  }

  public getSetting() {
    return this.setting.getSetting();
  }

  public saveSettingByKey(arg: any) {
    const { data } = arg;
    this.setting.updateByKey(data.key, data.value);
  }

  // 获取所有存款记录
  public async getSavingsRecordAll() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM savings_record ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        },
      );
    });
  }

  // 添加存款记录
  public async addSavingsRecord(arg: any) {
    const { data } = arg;
    const { record } = data;
    const { name, owner, money, rate, start_date, end_date } = record;
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO savings_record (name, owner, money, rate, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run([name, owner, money, rate, start_date, end_date], (err) => {
        if (err) reject(err);
        resolve(record);
      });
    });
  }

  // 更新存款记录
  public async editSavingsRecord(arg: any) {
    const { data } = arg;
    const { record } = data;
    const { name, owner, money, rate, start_date, end_date, id } = record;
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE savings_record
        SET name = ?, owner = ?, money = ?, rate = ?,
            start_date = ?, end_date = ?, updated_at = ?
        WHERE id = ?
      `);

      const now = Date.now();
      stmt.run(
        [name, owner, money, rate, start_date, end_date, now, id],
        (err) => {
          if (err) reject(err);
          resolve({ ...record, updated_at: now });
        },
      );
    });
  }

  // 删除存款记录
  public async deleteSavingsRecord(arg: any) {
    const { data } = arg;
    const { id } = data;
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM savings_record WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        resolve({ success: true });
      });
    });
  }

  // 获取所有理财产品
  public async getInvestmentAll() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM investment ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        },
      );
    });
  }

  // 添加理财产品
  public async addInvestment(arg: any) {
    const { data } = arg;
    const { record } = data;
    const { bank, name, owner } = record;
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO investment (bank, name, owner)
        VALUES (?, ?, ?)
      `);

      stmt.run([bank, name, owner], (err) => {
        if (err) reject(err);
        resolve(record);
      });
    });
  }

  // 更新理财产品
  public async editInvestment(arg: any) {
    const { data } = arg;
    const { record } = data;
    const { bank, name, owner, id } = record;
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE investment
        SET bank = ?, name = ?, owner = ?, updated_at = ?
        WHERE id = ?
      `);

      const now = Date.now();
      stmt.run([bank, name, owner, now, id], (err) => {
        if (err) reject(err);
        resolve({ ...record, updated_at: now });
      });
    });
  }

  // 删除理财产品
  public async deleteInvestment(arg: any) {
    const { data } = arg;
    const { id } = data;
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM investment WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        resolve({ success: true });
      });
    });
  }

  // 获取所有理财收益记录（带关联数据）
  public async getInvestmentRecordAll() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT
          ir.*,
          i.name as investment_name,
          i.bank,
          i.owner
        FROM investment_record ir
        LEFT JOIN investment i ON ir.investment_id = i.id
        ORDER BY ir.in_date DESC`,
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        },
      );
    });
  }

  // 获取所有理财产品（用于下拉选择）
  public async getInvestmentOptions() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT id, name, bank,owner FROM investment ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        },
      );
    });
  }

  // 添加理财收益记录
  public async addInvestmentRecord(arg: any) {
    const { data } = arg;
    const { record } = data;
    const { investment_id, money, in_date } = record;
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO investment_record (investment_id, money, in_date)
        VALUES (?, ?, ?)
      `);

      stmt.run([investment_id, money, in_date], (err) => {
        if (err) reject(err);
        resolve(record);
      });
    });
  }

  // 更新理财收益记录
  public async editInvestmentRecord(arg: any) {
    const { data } = arg;
    const { record } = data;
    const { investment_id, money, in_date, id } = record;
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE investment_record
        SET investment_id = ?, money = ?, in_date = ?, updated_at = ?
        WHERE id = ?
      `);

      const now = Date.now();
      stmt.run([investment_id, money, in_date, now, id], (err) => {
        if (err) reject(err);
        resolve({ ...record, updated_at: now });
      });
    });
  }

  // 删除理财收益记录
  public async deleteInvestmentRecord(arg: any) {
    const { data } = arg;
    const { id } = data;
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM investment_record WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        resolve({ success: true });
      });
    });
  }

  // 获取存款收益统计
  public async getSavingsEarnings(
    startDate: number,
    endDate: number,
    dimension: string,
  ) {
    const periodFormat =
      dimension === 'year'
        ? '%Y-%m'
        : dimension === 'month'
          ? '%Y-%m-%d'
          : '%Y-W%W';

    return new Promise((resolve, reject) => {
      this.db.all(
        `WITH RECURSIVE dates(date) AS (
          SELECT datetime(?, 'unixepoch', 'localtime')
          UNION ALL
          SELECT datetime(date, '+1 ${dimension}')
          FROM dates
          WHERE date < datetime(?, 'unixepoch', 'localtime')
        )
        SELECT
          strftime('${periodFormat}', date) as period,
          owner,
          SUM(money) as total_money,
          SUM(money * rate * (
            CASE
              WHEN start_date < strftime('%s', date) * 1000 THEN strftime('%s', date) * 1000
              ELSE start_date
            END -
            CASE
              WHEN end_date > strftime('%s', datetime(date, '+1 ${dimension}')) * 1000
              THEN strftime('%s', datetime(date, '+1 ${dimension}')) * 1000
              ELSE end_date
            END
          ) / (365 * 100 * 24 * 60 * 60 * 1000)) as earnings,
          AVG(rate) as avg_rate
        FROM dates
        LEFT JOIN savings_record ON
          start_date <= strftime('%s', datetime(date, '+1 ${dimension}')) * 1000
          AND end_date >= strftime('%s', date) * 1000
        GROUP BY period, owner
        ORDER BY period, owner`,
        [startDate / 1000, endDate / 1000],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        },
      );
    });
  }

  // 获取理财收益统计
  public async getInvestmentEarnings(
    startDate: number,
    endDate: number,
    dimension: string,
  ) {
    const periodFormat =
      dimension === 'year'
        ? '%Y-%m'
        : dimension === 'month'
          ? '%Y-%m-%d'
          : '%Y-W%W';

    return new Promise((resolve, reject) => {
      this.db.all(
        `WITH RECURSIVE dates(date) AS (
          SELECT datetime(?, 'unixepoch', 'localtime')
          UNION ALL
          SELECT datetime(date, '+1 ${dimension}')
          FROM dates
          WHERE date < datetime(?, 'unixepoch', 'localtime')
        ),
        RankedRecords AS (
          SELECT
            i.owner,
            ir.investment_id,
            ir.money,
            ir.in_date,
            LAG(ir.money) OVER (PARTITION BY ir.investment_id ORDER BY ir.in_date) as prev_money,
            LAG(ir.in_date) OVER (PARTITION BY ir.investment_id ORDER BY ir.in_date) as prev_date
          FROM investment_record ir
          JOIN investment i ON ir.investment_id = i.id
          WHERE ir.in_date <= ?
        )
        SELECT
          strftime('${periodFormat}', date) as period,
          owner,
          SUM(CASE
            WHEN prev_date >= strftime('%s', date) * 1000 THEN money - prev_money
            WHEN prev_date IS NULL THEN 0
            ELSE (money - prev_money) *
              (strftime('%s', datetime(date, '+1 ${dimension}')) * 1000 -
               MAX(prev_date, strftime('%s', date) * 1000)) / (in_date - prev_date)
          END) as earnings,
          SUM(money) as total_money,
          CASE
            WHEN SUM(money) > 0 THEN
              SUM(CASE
                WHEN prev_date >= strftime('%s', date) * 1000 THEN (money - prev_money)
                WHEN prev_date IS NULL THEN 0
                ELSE (money - prev_money) *
                  (strftime('%s', datetime(date, '+1 ${dimension}')) * 1000 -
                   MAX(prev_date, strftime('%s', date) * 1000)) / (in_date - prev_date)
              END) * 365 * 100 / (SUM(money) *
                (strftime('%s', datetime(date, '+1 ${dimension}')) - strftime('%s', date)))
              ELSE 0
          END as rate
        FROM dates
        LEFT JOIN RankedRecords ON
          in_date <= strftime('%s', datetime(date, '+1 ${dimension}')) * 1000
          AND (prev_date IS NULL OR prev_date < strftime('%s', datetime(date, '+1 ${dimension}')) * 1000)
        GROUP BY period, owner
        ORDER BY period, owner`,
        [startDate / 1000, endDate / 1000, endDate],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        },
      );
    });
  }

  // 获取财务汇总报表
  public async getFinancialSummary(arg: any) {
    const { data } = arg;
    const { startDate, endDate, dimension } = data;

    try {
      const [savingsEarnings, investmentEarnings] = await Promise.all([
        this.getSavingsEarnings(startDate, endDate, dimension),
        this.getInvestmentEarnings(startDate, endDate, dimension),
      ]);

      // 合并两种收益数据
      const summary = new Map();

      // 处理存款收益
      savingsEarnings.forEach((item: any) => {
        const key = `${item.period}-${item.owner}`;
        summary.set(key, {
          period: item.period,
          owner: item.owner,
          savings_money: item.total_money || 0,
          savings_earnings: item.earnings || 0,
          savings_rate: item.avg_rate || 0,
          investment_money: 0,
          investment_earnings: 0,
          investment_rate: 0,
        });
      });

      // 处理理财收益
      investmentEarnings.forEach((item: any) => {
        const key = `${item.period}-${item.owner}`;
        const existing = summary.get(key) || {
          period: item.period,
          owner: item.owner,
          savings_money: 0,
          savings_earnings: 0,
          savings_rate: 0,
          investment_money: 0,
          investment_earnings: 0,
          investment_rate: 0,
        };

        existing.investment_money = item.total_money || 0;
        existing.investment_earnings = item.earnings || 0;
        existing.investment_rate = item.rate || 0;

        summary.set(key, existing);
      });

      return Array.from(summary.values()).sort((a, b) => {
        const periodCompare = a.period.localeCompare(b.period);
        if (periodCompare !== 0) return periodCompare;
        return a.owner.localeCompare(b.owner);
      });
    } catch (error) {
      console.error('获取财务汇总失败:', error);
      throw error;
    }
  }
}

export default API;
