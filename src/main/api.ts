/* eslint-disable camelcase */
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

  private generateTimePeriods(
    startDate: number,
    endDate: number,
    dimension: string,
  ): { start: number; end: number; period: string }[] {
    const periods: { start: number; end: number; period: string }[] = [];
    const now = Date.now();
    const effectiveEndDate = Math.min(endDate, now);

    let currentDate = new Date(startDate);
    const endDateTime = new Date(effectiveEndDate);

    while (currentDate < endDateTime) {
      let nextDate = new Date(currentDate);
      let period: string;

      switch (dimension) {
        case 'year':
          period = currentDate.getFullYear().toString();
          nextDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        case 'month':
          period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
          nextDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'week':
          const monday = new Date(currentDate);
          const dayOfWeek = monday.getDay() || 7;
          monday.setDate(monday.getDate() - dayOfWeek + 1);

          nextDate = new Date(monday);
          nextDate.setDate(monday.getDate() + 7);

          const firstDayOfYear = new Date(monday.getFullYear(), 0, 1);
          const weekNum = Math.ceil(
            ((monday.getTime() - firstDayOfYear.getTime()) / 86400000 + 1) / 7,
          );

          period = `${monday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
          break;
        default:
          throw new Error(`Unsupported dimension: ${dimension}`);
      }

      periods.push({
        start: currentDate.getTime(),
        end: Math.min(nextDate.getTime(), effectiveEndDate),
        period,
      });

      currentDate = nextDate;
    }

    return periods;
  }

  public async getSavingsEarnings(
    startDate: number,
    endDate: number,
    dimension: string,
  ) {
    const periods = this.generateTimePeriods(startDate, endDate, dimension);

    // 一次性查询所有数据
    const allRecords = await new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM savings_record
        WHERE start_date < ? AND end_date > ?`,
        [
          Math.max(...periods.map((p) => p.end)),
          Math.min(...periods.map((p) => p.start)),
        ],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows || []);
        },
      );
    });

    // 在内存中处理每个时间段的统计
    const results = periods
      .flatMap((period) => {
        // 按 owner 分组计算
        const ownerStats = new Map<
          string,
          {
            total_money: number;
            earnings: number;
            rates: number[];
          }
        >();

        (allRecords as any[]).forEach((record) => {
          if (
            record.start_date < period.end &&
            record.end_date > period.start
          ) {
            const { owner } = record;
            if (!ownerStats.has(owner)) {
              ownerStats.set(owner, {
                total_money: 0,
                earnings: 0,
                rates: [],
              });
            }

            const stats = ownerStats.get(owner)!;
            stats.total_money += record.money;
            stats.rates.push(record.rate);

            const effectiveStartDate = Math.max(
              record.start_date,
              period.start,
            );
            const effectiveEndDate = Math.min(record.end_date, period.end);
            const daysInPeriod =
              (effectiveEndDate - effectiveStartDate) / (24 * 60 * 60 * 1000);

            stats.earnings +=
              (record.money * record.rate * daysInPeriod) / (365 * 100);
          }
        });

        // 只返回有数据的期间
        if (ownerStats.size === 0) {
          return [];
        }

        return Array.from(ownerStats.entries()).map(([owner, stats]) => ({
          period: period.period,
          owner,
          total_money: stats.total_money,
          earnings: stats.earnings,
          avg_rate: stats.rates.reduce((a, b) => a + b, 0) / stats.rates.length,
        }));
      })
      // 过滤掉空数组（没有数据的期间）
      .filter((result) => result.total_money > 0);

    // 按期间和所有者排序
    return results.sort((a, b) => {
      const periodCompare = a.period.localeCompare(b.period);
      if (periodCompare !== 0) return periodCompare;
      return a.owner.localeCompare(b.owner);
    });
  }

  // 获取理财收益统计
  public async getInvestmentEarnings(
    startDate: number,
    endDate: number,
    dimension: string,
  ) {
    const periods = this.generateTimePeriods(startDate, endDate, dimension);

    // 一次性查询所有数据
    const allRecords = await new Promise((resolve, reject) => {
      this.db.all(
        `SELECT
          i.owner,
          ir.investment_id,
          ir.money,
          ir.in_date,
          LAG(ir.money) OVER (PARTITION BY ir.investment_id ORDER BY ir.in_date) as prev_money,
          LAG(ir.in_date) OVER (PARTITION BY ir.investment_id ORDER BY ir.in_date) as prev_date
        FROM investment_record ir
        JOIN investment i ON ir.investment_id = i.id
        WHERE ir.in_date <= ?
        ORDER BY ir.investment_id, ir.in_date`,
        [Math.max(...periods.map((p) => p.end))],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows || []);
        },
      );
    });

    // 在内存中处理每个时间段的统计
    const results = periods
      .flatMap((period) => {
        const ownerStats = new Map<
          string,
          {
            total_money: number;
            earnings: number;
          }
        >();

        (allRecords as any[]).forEach((record) => {
          if (record.in_date <= period.end) {
            const { owner } = record;
            if (!ownerStats.has(owner)) {
              ownerStats.set(owner, {
                total_money: 0,
                earnings: 0,
              });
            }

            const stats = ownerStats.get(owner)!;

            // 计算当前期间的收益
            if (record.prev_date !== null) {
              const moneyDiff = record.money - record.prev_money;

              // 计算在当前期间内的时间占比
              const periodStart = period.start;
              const periodEnd = period.end;
              const recordStart = Math.max(record.prev_date, periodStart);
              const recordEnd = Math.min(record.in_date, periodEnd);

              if (recordEnd > recordStart) {
                // 计算时间占比
                const totalDuration = record.in_date - record.prev_date;
                const effectiveDuration = recordEnd - recordStart;

                // 按时间比例计算收益
                const periodEarnings =
                  moneyDiff * (effectiveDuration / totalDuration);
                stats.earnings += periodEarnings;
              }
            }

            // 更新总金额（使用期间结束时的金额）
            if (record.in_date <= period.end) {
              stats.total_money = record.money;
            }
          }
        });

        // 只返回有数据的期间
        if (ownerStats.size === 0) {
          return [];
        }

        return Array.from(ownerStats.entries()).map(([owner, stats]) => {
          // 计算年化收益率
          const rate =
            stats.total_money > 0
              ? (stats.earnings * 365 * 100) /
                (stats.total_money *
                  ((period.end - period.start) / (24 * 60 * 60 * 1000)))
              : 0;

          return {
            period: period.period,
            owner,
            total_money: stats.total_money,
            earnings: stats.earnings,
            rate,
          };
        });
      })
      // 过滤掉没有数据的期间
      .filter((result) => result.total_money > 0);

    // 按期间和所有者排序
    return results.sort((a, b) => {
      const periodCompare = a.period.localeCompare(b.period);
      if (periodCompare !== 0) return periodCompare;
      return a.owner.localeCompare(b.owner);
    });
  }

  // 获取财务汇总报表
  public async getFinancialSummary(arg: any) {
    const { data } = arg;
    const { startDate, endDate, dimension } = data;

    try {
      // 获取存款和理财的原始数据
      const [savingsData, investmentData] = await Promise.all([
        // 存款查询
        new Promise((resolve, reject) => {
          this.db.all(
            `SELECT
              name,
              SUM(money) as total_money,
              rate,
              start_date,
              end_date
            FROM savings_record
            WHERE start_date < ? AND end_date > ?
            GROUP BY name, rate`,
            [endDate, startDate],
            (err, rows) => {
              if (err) reject(err);
              resolve(rows || []);
            },
          );
        }),
        // 理财查询
        new Promise((resolve, reject) => {
          this.db.all(
            `SELECT
              i.name,
              ir.money,
              ir.in_date,
              LAG(ir.money) OVER (PARTITION BY i.id ORDER BY ir.in_date) as prev_money,
              LAG(ir.in_date) OVER (PARTITION BY i.id ORDER BY ir.in_date) as prev_date
            FROM investment_record ir
            JOIN investment i ON ir.investment_id = i.id
            WHERE ir.in_date <= ?
            ORDER BY i.id, ir.in_date`,
            [endDate],
            (err, rows) => {
              if (err) reject(err);
              resolve(rows || []);
            },
          );
        }),
      ]);

      const periods = this.generateTimePeriods(startDate, endDate, dimension);
      const summary = new Map();
      const detail = new Map();

      // 处理每个时间段
      periods.forEach((period) => {
        // 计算存款收益
        savingsData.forEach((record: any) => {
          if (
            record.start_date < period.end &&
            record.end_date > period.start
          ) {
            const effectiveStartDate = Math.max(
              record.start_date,
              period.start,
            );
            const effectiveEndDate = Math.min(record.end_date, period.end);
            const daysInPeriod =
              (effectiveEndDate - effectiveStartDate) / (24 * 60 * 60 * 1000);

            const earnings =
              (record.total_money * record.rate * daysInPeriod) / (365 * 100);

            // 明细数据
            const detailKey = `${period.period}-存款-${record.name}(${record.rate}%)`;
            const detailItem = detail.get(detailKey) || {
              period: period.period,
              name: `存款-${record.name}(${record.rate}%)`,
              total_money: 0,
              earnings: 0,
              rate: record.rate,
            };
            detailItem.total_money += record.total_money;
            detailItem.earnings += earnings;
            detail.set(detailKey, detailItem);

            // 汇总数据
            const summaryKey = period.period;
            const summaryItem = summary.get(summaryKey) || {
              period: period.period,
              total_money: 0,
              earnings: 0,
              expected_total: 0,
              actual_total: 0,
            };
            summaryItem.total_money += record.total_money;
            summaryItem.earnings += earnings;
            summaryItem.expected_total += record.total_money + earnings;

            // 如果查询时间大于等于存款结束时间，则计入真实总金额
            if (period.end >= record.end_date) {
              summaryItem.actual_total += record.total_money + earnings;
            } else {
              summaryItem.actual_total += record.total_money; // 只计入本金
            }

            summary.set(summaryKey, summaryItem);
          }
        });

        // 计算理财收益
        const productStats = new Map();
        investmentData.forEach((record: any) => {
          if (record.in_date <= period.end && record.prev_date) {
            const recordStart = Math.max(record.prev_date, period.start);
            const recordEnd = Math.min(record.in_date, period.end);

            if (recordEnd > recordStart) {
              const totalDuration = record.in_date - record.prev_date;
              const moneyDiff = record.money - record.prev_money;

              const stats = productStats.get(record.name) || {
                earliestMoney: record.prev_money,
                earliestDate: record.prev_date,
                latestMoney: record.money,
                latestDate: record.in_date,
              };

              // 更新最早和最晚记录
              if (record.prev_date < stats.earliestDate) {
                stats.earliestMoney = record.prev_money;
                stats.earliestDate = record.prev_date;
              }
              if (record.in_date > stats.latestDate) {
                stats.latestMoney = record.money;
                stats.latestDate = record.in_date;
              }

              productStats.set(record.name, stats);
            }
          }
        });

        // 合并理财数据
        productStats.forEach((stats, name) => {
          // 计算收益金额和年化收益率
          const earnings = stats.latestMoney - stats.earliestMoney;
          const duration =
            (stats.latestDate - stats.earliestDate) / (24 * 60 * 60 * 1000);
          const rate =
            earnings > 0 && duration > 0
              ? (earnings * 365 * 100) / (stats.earliestMoney * duration)
              : 0;

          // 明细数据
          const detailKey = `${period.period}-理财-${name}`;
          const detailItem = detail.get(detailKey) || {
            period: period.period,
            name: `理财-${name}`,
            total_money: 0,
            earnings: 0,
            rate: 0,
          };
          detailItem.total_money += stats.earliestMoney;
          detailItem.earnings += earnings;
          detailItem.rate = rate;
          detail.set(detailKey, detailItem);

          // 汇总数据
          const summaryKey = period.period;
          const summaryItem = summary.get(summaryKey) || {
            period: period.period,
            total_money: 0,
            earnings: 0,
            expected_total: 0,
            actual_total: 0,
          };
          summaryItem.total_money += stats.earliestMoney;
          summaryItem.earnings += earnings;
          summaryItem.expected_total += stats.earliestMoney + earnings;
          summaryItem.actual_total += stats.earliestMoney + earnings;
          summary.set(summaryKey, summaryItem);
        });
      });

      // 处理汇总数据的年化率
      const summaryResult = Array.from(summary.values()).map((item) => ({
        ...item,
        rate:
          item.total_money > 0
            ? (item.earnings * 365 * 100) /
              (item.total_money *
                ((endDate - startDate) / (24 * 60 * 60 * 1000)))
            : 0,
      }));

      // 返回汇总和明细数据
      return {
        summary: summaryResult.sort((a, b) => a.period.localeCompare(b.period)),
        detail: Array.from(detail.values()).sort((a, b) => {
          const periodCompare = a.period.localeCompare(b.period);
          if (periodCompare !== 0) return periodCompare;
          return a.name.localeCompare(b.name);
        }),
      };
    } catch (error) {
      console.error('获取财务汇总失败:', error);
      throw error;
    }
  }
}

export default API;
