import { createTestEnv, TestEnv } from './helpers/testEnv';

// 账单模块

interface BillRecord {
  id: number;
  account: string;
  amount: number;
  month: number;
  memo: string;
  total?: number;
}

const monthStart = (offset: number) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1).getTime();
};

// 期望按本地自然月分组，与实现口径一致
const localMonthKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

describe('账单模块', () => {
  let env: TestEnv;

  const addBill = (account: string, amount: number, month: number, memo = '') =>
    env.api.addBillRecord({
      data: { record: { account, amount, month, memo } },
    });

  const list = async (data: Record<string, unknown> = {}) =>
    (await env.api.getBillRecordAll({
      data: { page: 1, pageSize: 10, account: null, month: null, ...data },
    })) as BillRecord[];

  beforeAll(async () => {
    env = await createTestEnv('bills');
  });

  beforeEach(async () => {
    await env.reset();
  });

  afterAll(async () => {
    await env.destroy();
  });

  describe('新增 / 编辑 / 删除', () => {
    it('新增账单成功', async () => {
      const result = await addBill('老公', 1000, monthStart(0), '午饭');

      expect(result).toEqual({ success: true });
      expect(await list()).toHaveLength(1);
    });

    it('同账户同月不允许重复新增', async () => {
      await addBill('老公', 1000, monthStart(0));
      const second = await addBill('老公', 2000, monthStart(0));

      expect(second).toHaveProperty('error');
      expect(await list()).toHaveLength(1);
    });

    it('同月不同账户可以分别新增', async () => {
      await addBill('老公', 1000, monthStart(0));
      await addBill('妻子', 2000, monthStart(0));

      expect(await list()).toHaveLength(2);
    });

    it('同账户不同月份可以分别新增', async () => {
      await addBill('老公', 1000, monthStart(0));
      await addBill('老公', 2000, monthStart(-1));

      expect(await list()).toHaveLength(2);
    });

    it('编辑账单会更新金额', async () => {
      await addBill('老公', 1000, monthStart(0));
      const [record] = await list();

      const result = await env.api.editBillRecord({
        data: {
          record: { ...record, amount: 3500 },
        },
      });

      expect(result).toEqual({ success: true });
      const [updated] = await list();
      expect(updated.amount).toBe(3500);
    });

    it('编辑成同账户同月的其他记录会冲突', async () => {
      await addBill('老公', 1000, monthStart(0));
      await addBill('妻子', 2000, monthStart(0));
      const [husband] = await list({ account: '老公' });

      const result = await env.api.editBillRecord({
        data: {
          record: { ...husband, account: '妻子' },
        },
      });

      expect(result).toHaveProperty('error');
    });

    it('删除账单', async () => {
      await addBill('老公', 1000, monthStart(0));
      const [record] = await list();

      const result = await env.api.deleteBillRecord({
        data: { id: record.id },
      });

      expect(result).toEqual({ success: true });
      expect(await list()).toHaveLength(0);
    });
  });

  describe('getBillRecordAll', () => {
    const seed = async () => {
      await addBill('老公', 1000, monthStart(0));
      await addBill('妻子', 2000, monthStart(0));
      await addBill('老公', 3000, monthStart(-1));
    };

    it('分页并返回总数 total', async () => {
      await seed();

      const page1 = await list({ page: 1, pageSize: 2 });
      const page2 = await list({ page: 2, pageSize: 2 });

      expect(page1).toHaveLength(2);
      expect(page1.every((r) => r.total === 3)).toBe(true);
      expect(page2).toHaveLength(1);
      expect(page2[0].total).toBe(3);
    });

    it('按账户过滤', async () => {
      await seed();

      const rows = await list({ account: '老公' });

      expect(rows).toHaveLength(2);
      expect(rows.every((r) => r.account === '老公')).toBe(true);
      expect(rows[0].total).toBe(2);
    });

    it('按月份过滤', async () => {
      await seed();

      const rows = await list({ month: monthStart(-1) });

      expect(rows).toHaveLength(1);
      expect(rows[0].amount).toBe(3000);
      expect(rows[0].total).toBe(1);
    });

    it('账户和月份可以组合过滤', async () => {
      await seed();

      const rows = await list({ account: '老公', month: monthStart(0) });

      expect(rows).toHaveLength(1);
      expect(rows[0].amount).toBe(1000);
    });
  });

  describe('getLastMonthBillSummary', () => {
    it('只统计上一个自然月的账单', async () => {
      await addBill('老公', 1000, monthStart(-1));
      await addBill('妻子', 500, monthStart(-1));
      await addBill('老公', 99999, monthStart(0));
      await addBill('老公', 88888, monthStart(-2));

      const total = (await env.api.getLastMonthBillSummary()) as number;

      expect(total).toBe(1500);
    });

    it('没有上月账单时返回 0', async () => {
      expect(await env.api.getLastMonthBillSummary()).toBe(0);
    });

    it('上月最后一天的账单不会被漏掉', async () => {
      const now = new Date();
      const lastDayOfPrevMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        0,
      );
      await addBill('老公', 777, lastDayOfPrevMonth.getTime());

      expect(await env.api.getLastMonthBillSummary()).toBe(777);
    });
  });

  describe('getBillTrend', () => {
    it('按账户和本地月份汇总金额', async () => {
      await addBill('老公', 1000, monthStart(-1));
      await addBill('妻子', 2000, monthStart(-1));
      await addBill('老公', 3000, monthStart(0));

      const rows = (await env.api.getBillTrend()) as {
        month: string;
        account: string;
        total_amount: number;
      }[];

      expect(rows).toHaveLength(3);

      const byKey = new Map(
        rows.map((r) => [`${r.account}|${r.month}`, r.total_amount]),
      );
      expect(byKey.get(`老公|${localMonthKey(monthStart(-1))}`)).toBe(1000);
      expect(byKey.get(`妻子|${localMonthKey(monthStart(-1))}`)).toBe(2000);
      expect(byKey.get(`老公|${localMonthKey(monthStart(0))}`)).toBe(3000);
    });

    it('月初凌晨录入的账单按本地月份归组', async () => {
      const now = new Date();
      // 本地本月 1 号 02:00，在东八区对应的 UTC 时间还落在上个月
      const monthStartEarly = new Date(now.getFullYear(), now.getMonth(), 1, 2);
      await addBill('老公', 888, monthStartEarly.getTime());

      const rows = (await env.api.getBillTrend()) as {
        month: string;
        account: string;
        total_amount: number;
      }[];

      expect(rows).toHaveLength(1);
      expect(rows[0].month).toBe(localMonthKey(monthStartEarly.getTime()));
      expect(rows[0].total_amount).toBe(888);
    });

    it('没有记录时返回空数组', async () => {
      expect(await env.api.getBillTrend()).toEqual([]);
    });
  });
});
