/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable promise/always-return */
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

  // 获取所有理财收益记录
  public async getInvestmentRecordAll() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM investment_record ORDER BY record_date DESC`,
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
    const { product_name, principal, earnings, days, record_date } = record;
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO investment_record (product_name, principal, earnings, days, record_date)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        [product_name, principal, earnings, days, record_date],
        (err) => {
          if (err) reject(err);
          resolve(record);
        },
      );
    });
  }

  // 更新理财收益记录
  public async editInvestmentRecord(arg: any) {
    const { data } = arg;
    const { record } = data;
    const { product_name, principal, earnings, days, record_date, id } = record;
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE investment_record
        SET product_name = ?, principal = ?, earnings = ?, days = ?, record_date = ?, updated_at = ?
        WHERE id = ?
      `);

      const now = Date.now();
      stmt.run(
        [product_name, principal, earnings, days, record_date, now, id],
        (err) => {
          if (err) reject(err);
          resolve({ ...record, updated_at: now });
        },
      );
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

  // 获取所有资产记录
  public async getAssetsRecordAll() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM assets_record ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        },
      );
    });
  }

  // 更新资产趋势记录
  private async updateAssetsTrend(date: number) {
    try {
      // 将日期转换为当月第一天
      const recordDate = new Date(date);
      const monthStart = new Date(
        recordDate.getFullYear(),
        recordDate.getMonth(),
        1,
      );
      const monthEnd = new Date(
        recordDate.getFullYear(),
        recordDate.getMonth() + 1,
        0,
      );
      monthStart.setHours(0, 0, 0, 0);
      monthEnd.setHours(23, 59, 59, 999);

      // 获取当月的所有资产记录总和
      const summary = await new Promise((resolve, reject) => {
        this.db.all(
          `SELECT
            COALESCE(SUM(amount), 0) as total_amount
          FROM assets_record
          WHERE date >= ? AND date <= ?`,
          [monthStart.getTime(), monthEnd.getTime()],
          (err, rows) => {
            if (err) reject(err);
            resolve(rows || []);
          },
        );
      });

      // 检查当月是否已有记录
      const existingRecord = await new Promise((resolve, reject) => {
        this.db.get(
          'SELECT id FROM assets_trend WHERE date = ?',
          [monthStart.getTime()],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          },
        );
      });

      const totalAmount = summary.length > 0 ? summary[0].total_amount || 0 : 0;

      if (existingRecord) {
        // 更新现有记录
        const stmt = this.db.prepare(`
          UPDATE assets_trend
          SET
            amount = ?,
            updated_at = ?
          WHERE date = ?
        `);

        const now = Date.now();
        await new Promise((resolve, reject) => {
          stmt.run([totalAmount, now, monthStart.getTime()], (err) => {
            if (err) reject(err);
            resolve(true);
          });
        });
      } else {
        // 插入新记录
        const stmt = this.db.prepare(`
          INSERT INTO assets_trend
          (date, amount)
          VALUES (?, ?)
        `);

        await new Promise((resolve, reject) => {
          stmt.run([monthStart.getTime(), totalAmount], (err) => {
            if (err) reject(err);
            resolve(true);
          });
        });
      }

      return true;
    } catch (error) {
      log.error('更新资产趋势失败:', error);
      throw error;
    }
  }

  // 添加资产记录
  public async addAssetsRecord(arg: any) {
    const { data } = arg;
    const { record } = data;
    const { type, amount, currency, date, memo } = record;
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO assets_record (type, amount, currency, date, memo)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run([type, amount, currency, date, memo], async (err) => {
        if (err) reject(err);
        // 更新资产趋势
        await this.updateAssetsTrend(date);
        resolve(record);
      });
    });
  }

  // 更新资产记录
  public async editAssetsRecord(arg: any) {
    const { data } = arg;
    const { record } = data;
    const { type, amount, currency, date, memo, id } = record;
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE assets_record
        SET type = ?, amount = ?, currency = ?, date = ?, memo = ?, updated_at = ?
        WHERE id = ?
      `);

      const now = Date.now();
      stmt.run([type, amount, currency, date, memo, now, id], async (err) => {
        if (err) reject(err);
        // 更新资产趋势
        await this.updateAssetsTrend(date);
        resolve({ ...record, updated_at: now });
      });
    });
  }

  // 删除资产记录
  public async deleteAssetsRecord(arg: any) {
    const { data } = arg;
    const { id } = data;
    // 获取记录的日期
    const record = await new Promise((resolve, reject) => {
      this.db.get(
        'SELECT date FROM assets_record WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        },
      );
    });

    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM assets_record WHERE id = ?',
        [id],
        async (err) => {
          if (err) reject(err);
          // 只在删除当月记录时更新资产趋势
          if (record) {
            const now = new Date();
            const recordDate = new Date(record.date);
            if (
              now.getFullYear() === recordDate.getFullYear() &&
              now.getMonth() === recordDate.getMonth()
            ) {
              console.log('更新资产趋势', record.date);
              await this.updateAssetsTrend(record.date);
            }
          }
          resolve({ success: true });
        },
      );
    });
  }

  // 获取资产汇总
  public async getAssetsSummary() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT
          SUM(amount) as total_amount
        FROM assets_record`,
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        },
      );
    });
  }

  // 获取资产趋势数据
  public async getAssetsTrend(arg: any) {
    const { data } = arg;
    const { startDate, endDate } = data;
    return new Promise((resolve, reject) => {
      this.db.all(
        `WITH monthly_assets AS (
          SELECT
            strftime('%Y-%m', datetime(date/1000, 'unixepoch')) as month,
            MAX(date) as max_date,
            amount
          FROM assets_trend
          WHERE date >= ? AND date <= ?
          GROUP BY strftime('%Y-%m', datetime(date/1000, 'unixepoch'))
        )
        SELECT
          max_date as date,
          amount
        FROM monthly_assets
        ORDER BY month DESC
        LIMIT 12`,
        [startDate, endDate],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows || []);
        },
      );
    });
  }

  // 获取所有账单记录
  public async getBillRecordAll(arg: any) {
    const { data } = arg;
    const { page = 1, pageSize = 10, account, month } = data;
    const offset = (page - 1) * pageSize;
    const params = [];
    let whereClause = '';

    if (account || month) {
      whereClause = 'WHERE ';
      const conditions = [];

      if (account) {
        conditions.push('account = ?');
        params.push(account);
      }

      if (month) {
        conditions.push('month = ?');
        params.push(month);
      }

      whereClause += conditions.join(' AND ');
    }

    params.push(pageSize, offset);

    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT
          *,
          (SELECT COUNT(*) FROM bill_record ${whereClause}) as total
        FROM bill_record
        ${whereClause}
        ORDER BY month DESC, created_at DESC, id DESC
        LIMIT ? OFFSET ?`,
        params,
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        },
      );
    });
  }

  // 添加账单记录
  public async addBillRecord(arg: any) {
    const { data } = arg;
    const { record } = data;
    const { account, amount, month, memo } = record;

    // 检查是否已存在该账户当月的记录
    const checkExisting = () => {
      return new Promise((resolve, reject) => {
        const monthStart = new Date(month);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);

        this.db.get(
          `SELECT id FROM bill_record
           WHERE account = ?
           AND month >= ?
           AND month <= ?`,
          [account, monthStart.getTime(), monthEnd.getTime()],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          },
        );
      });
    };

    return new Promise((resolve, reject) => {
      checkExisting()
        .then((existing) => {
          if (existing) {
            resolve({
              error: `${account}在${new Date(month).getFullYear()}年${new Date(month).getMonth() + 1}月已有账单记录`,
            });
            return;
          }

          const stmt = this.db.prepare(`
            INSERT INTO bill_record (account, amount, month, memo)
            VALUES (?, ?, ?, ?)
          `);

          stmt.run([account, amount, month, memo], (err) => {
            if (err) reject(err);
            resolve({ success: true });
          });
        })
        .catch(reject);
    });
  }

  // 更新账单记录
  public async editBillRecord(arg: any) {
    const { data } = arg;
    const { record } = data;
    const { account, amount, month, memo, id } = record;

    // 检查是否已存在该账户当月的其他记录
    const checkExisting = () => {
      return new Promise((resolve, reject) => {
        const monthStart = new Date(month);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);

        this.db.get(
          `SELECT id FROM bill_record
           WHERE account = ?
           AND month >= ?
           AND month <= ?
           AND id != ?`,
          [account, monthStart.getTime(), monthEnd.getTime(), id],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          },
        );
      });
    };

    return new Promise((resolve, reject) => {
      checkExisting()
        .then((existing) => {
          if (existing) {
            resolve({
              error: `${account}在${new Date(month).getFullYear()}年${new Date(month).getMonth() + 1}月已有账单记录`,
            });
            return;
          }

          const stmt = this.db.prepare(`
            UPDATE bill_record
            SET account = ?, amount = ?, month = ?, memo = ?, updated_at = ?
            WHERE id = ?
          `);

          const now = Date.now();
          stmt.run([account, amount, month, memo, now, id], (err) => {
            if (err) reject(err);
            resolve({ success: true });
          });
        })
        .catch(reject);
    });
  }

  // 删除账单记录
  public async deleteBillRecord(arg: any) {
    const { data } = arg;
    const { id } = data;

    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM bill_record WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        resolve({ success: true });
      });
    });
  }

  // 获取上月账单汇总
  public async getLastMonthBillSummary() {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      this.db.all(
        `SELECT
          SUM(amount) as total_amount
        FROM bill_record
        WHERE month >= ? AND month <= ?`,
        [lastMonth.getTime(), lastMonthEnd.getTime()],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows[0]?.total_amount || 0);
        },
      );
    });
  }

  // 获取银行理财产品历史数据
  public async getBankDataHistory() {
    try {
      // 并行获取所有银行数据
      const [commData, cmbData, abcData] = await Promise.all([
        this.fetchCommData(),
        this.fetchCmbData(),
        this.fetchAbcData(),
      ]);

      // 合并数据
      const allData = [
        ...commData.map((item) => ({ ...item, bank: 'COMM' })),
        ...cmbData.map((item) => ({ ...item, bank: 'CMB' })),
        ...abcData.map((item) => ({ ...item, bank: 'ABC' })),
      ];

      return {
        code: 200,
        message: '获取数据成功',
        data: allData,
      };
    } catch (error) {
      return {
        code: 500,
        message: error.message,
        data: [],
      };
    }
  }

  // 在 API 类中添加风险等级转换函数
  private convertRiskLevel(risk: string, bank: string): string {
    if (!risk) return '';

    // 交通银行
    if (bank === 'COMM') {
      const riskMap = {
        '1R': 'R1',
        '2R': 'R2',
        '3R': 'R3',
        '4R': 'R4',
        '5R': 'R5',
      };
      return riskMap[risk] || risk;
    }

    // 招商银行
    if (bank === 'CMB') {
      const riskMap = {
        低风险: 'R1',
        中低风险: 'R2',
        中等风险: 'R3',
        中高风险: 'R4',
        高风险: 'R5',
      };
      return riskMap[risk] || risk;
    }

    // 农业银行
    if (bank === 'ABC') {
      const riskMap = {
        低: 'R1',
        中低: 'R2',
        中: 'R3',
        中高: 'R4',
        高: 'R5',
      };
      return riskMap[risk] || risk;
    }

    return risk;
  }

  // 获取交通银行数据
  private async fetchCommData() {
    try {
      const response = await fetch(
        'https://www.bankcomm.com/SITE/queryFundInfoListNew.do',
        {
          method: 'POST',
          headers: {
            Accept: '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            Connection: 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            Origin: 'https://www.bankcomm.com',
            Referer:
              'https://www.bankcomm.com/BankCommSite/shtml/jyjr/cn/7226/7266/7281/7282/list.shtml?channelId=7226',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          body: 'channelId=7226',
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.RSP_BODY?.fundInfoList) {
        return [];
      }

      return data.RSP_BODY.fundInfoList
        .filter((item) => Number(item.investtime) > 0)
        .map((item) => ({
          fundname: item.fundname || '',
          fundcode: item.fundcode || '',
          fundlevel: this.convertRiskLevel(item.fundlevel, 'COMM'),
          investday: item.investday || '',
          registername: item.registername || '',
          displayrate: item.displayrate || '',
          investdaydesc: item.investdaydesc || '',
          currenttype: item.currenttype || '',
        }));
    } catch (error) {
      console.error('获取交通银行数据失败:', error);
      return [];
    }
  }

  // 获取招商银行数据
  private async fetchCmbData() {
    try {
      const response = await fetch(
        'https://www.cmbchina.com/cfweb/svrajax/product.ashx?op=search&type=m&pageindex=1&salestatus=&baoben=&currency=&term=&keyword=&series=01&risk=&city=&date=&pagesize=10000&orderby=ord1',
        {
          method: 'GET',
          headers: {
            Accept: '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            Connection: 'keep-alive',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: 'https://www.cmbchina.com/',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let text = await response.text();
      text = text
        .slice(1, -1)
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

      const data = JSON.parse(text);
      if (!Array.isArray(data.list)) {
        return [];
      }

      return data.list.map((item) => ({
        fundname: item.PrdName || '',
        fundcode: item.PrdCode || '',
        fundlevel: this.convertRiskLevel(item.Risk, 'CMB'),
        registername: item.PrdBrief || '',
        displayrate: item.ShowExpectedReturn || '',
        investdaydesc: item.Term || '',
      }));
    } catch (error) {
      console.error('获取招商银行数据失败:', error);
      return [];
    }
  }

  // 获取农业银行数据
  private async fetchAbcData() {
    try {
      const response = await fetch(
        'https://ewealth.abchina.com.cn/app/data/api/DataService/BoeProductV2?i=1&s=50&o=0&w=%25E5%258F%25AF%25E5%2594%25AE%257C%257C%257C%257C%257C%257C%257C1%257C%257C0%257C%257C0',
        {
          method: 'GET',
          headers: {
            Accept: '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            Connection: 'keep-alive',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: 'https://ewealth.abchina.com.cn/',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.Data?.Table) {
        return [];
      }

      // 获取总页数
      const total = data.Data.Table1?.[0]?.total || 0;
      const totalPages = Math.ceil(total / 50);

      // 获取所有页的数据
      const allProducts = [...data.Data.Table];

      // 获取剩余页的数据
      for (let page = 2; page <= totalPages; page++) {
        const pageResponse = await fetch(
          `https://ewealth.abchina.com.cn/app/data/api/DataService/BoeProductV2?i=${page}&s=50&o=0&w=%25E5%258F%25AF%25E5%2594%25AE%257C%257C%257C%257C%257C%257C%257C1%257C%257C0%257C%257C0`,
          {
            method: 'GET',
            headers: {
              Accept: '*/*',
              'Accept-Language': 'zh-CN,zh;q=0.9',
              Connection: 'keep-alive',
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Referer: 'https://ewealth.abchina.com.cn/',
            },
          },
        );

        if (!pageResponse.ok) {
          continue;
        }

        const pageData = await pageResponse.json();
        if (pageData.Data?.Table) {
          allProducts.push(...pageData.Data.Table);
        }
      }

      return allProducts.map((item) => ({
        fundname: item.ProdName || '',
        fundcode: item.ProductNo || '',
        fundlevel: this.convertRiskLevel(item.ProdYildType, 'ABC'),
        investday: item.ProdLimit || '',
        registername: item.issuingOffice || '',
        displayrate: item.ProdProfit || '',
        investdaydesc: item.ProdLimit || '',
      }));
    } catch (error) {
      console.error('获取农业银行数据失败:', error);
      return [];
    }
  }

  // 获取上月收益汇总
  public async getLastMonthEarningsSummary() {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      this.db.all(
        `SELECT
          SUM(earnings) as total_earnings
        FROM investment_record
        WHERE record_date >= ? AND record_date <= ?`,
        [startOfMonth.getTime(), endOfMonth.getTime()],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows[0]?.total_earnings || 0);
        },
      );
    });
  }

  // 获取年度收益汇总
  public async getYearlyEarningsSummary() {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      this.db.all(
        `SELECT
          SUM(earnings) as total_earnings
        FROM investment_record
        WHERE record_date >= ?`,
        [startOfYear.getTime()],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows[0]?.total_earnings || 0);
        },
      );
    });
  }

  // 获取账单趋势数据
  public async getBillTrend() {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      this.db.all(
        `SELECT
          strftime('%Y-%m', datetime(month/1000, 'unixepoch')) as month,
          account,
          SUM(amount) as total_amount
        FROM bill_record
        WHERE month >= ?
        GROUP BY account, strftime('%Y-%m', datetime(month/1000, 'unixepoch'))
        ORDER BY month ASC`,
        [startDate.getTime()],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        },
      );
    });
  }

  // 获取理财收益趋势数据
  public async getInvestmentEarningsTrend() {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      this.db.all(
        `SELECT
          strftime('%Y-%m', datetime(record_date/1000, 'unixepoch')) as month,
          SUM(earnings) as total_earnings
        FROM investment_record
        WHERE record_date >= ?
        GROUP BY strftime('%Y-%m', datetime(record_date/1000, 'unixepoch'))
        ORDER BY month ASC`,
        [startDate.getTime()],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        },
      );
    });
  }
}

export default API;
