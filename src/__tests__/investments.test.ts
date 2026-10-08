/* eslint-disable camelcase */
import { createTestEnv, TestEnv } from './helpers/testEnv';

// 理财收益模块（字段名沿用数据库列名 product_name / record_date）

interface InvestmentRecord {
  id: number;
  product_name: string;
  principal: number;
  earnings: number;
  days: number;
  record_date: number;
}

const buildRecord = (
  product_name: string,
  earnings: number,
  record_date: number,
) => ({
  product_name,
  principal: 100000,
  earnings,
  days: 30,
  record_date,
});

const dayOf = (offsetMonths: number, day = 15) => {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth() + offsetMonths,
    day,
    12,
  ).getTime();
};

// 期望按本地自然月分组，与实现口径一致
const localMonthKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

describe('理财收益模块', () => {
  let env: TestEnv;

  const add = (product: string, earnings: number, recordDate: number) =>
    env.api.addInvestmentRecord({
      data: { record: buildRecord(product, earnings, recordDate) },
    });

  const all = async () =>
    (await env.api.getInvestmentRecordAll()) as InvestmentRecord[];

  beforeAll(async () => {
    env = await createTestEnv('investments');
  });

  beforeEach(async () => {
    await env.reset();
  });

  afterAll(async () => {
    await env.destroy();
  });

  describe('增删改查', () => {
    it('新增后可以查询到', async () => {
      const record = buildRecord('稳健理财A', 320, dayOf(0));
      const saved = (await env.api.addInvestmentRecord({
        data: { record },
      })) as InvestmentRecord;

      expect(saved.product_name).toBe('稳健理财A');

      const rows = await all();
      expect(rows).toHaveLength(1);
      expect(rows[0].earnings).toBe(320);
      expect(rows[0].record_date).toBe(record.record_date);
    });

    it('编辑会更新收益金额', async () => {
      await add('稳健理财A', 320, dayOf(0));
      const [record] = await all();

      const result = (await env.api.editInvestmentRecord({
        data: { record: { ...record, earnings: 500 } },
      })) as InvestmentRecord;

      expect(result.earnings).toBe(500);
      const rows = await all();
      expect(rows).toHaveLength(1);
      expect(rows[0].earnings).toBe(500);
    });

    it('删除记录', async () => {
      await add('稳健理财A', 320, dayOf(0));
      const [record] = await all();

      const result = await env.api.deleteInvestmentRecord({
        data: { id: record.id },
      });

      expect(result).toEqual({ success: true });
      expect(await all()).toHaveLength(0);
    });
  });

  describe('getYearlyEarningsSummary', () => {
    it('只统计今年的收益', async () => {
      const now = new Date();
      await add('今年产品A', 100, new Date(now.getFullYear(), 0, 15).getTime());
      await add('今年产品B', 200, dayOf(0));
      await add(
        '去年产品',
        9999,
        new Date(now.getFullYear() - 1, 11, 15).getTime(),
      );

      const total = (await env.api.getYearlyEarningsSummary()) as number;

      expect(total).toBe(300);
    });

    it('没有记录时返回 0', async () => {
      expect(await env.api.getYearlyEarningsSummary()).toBe(0);
    });
  });

  describe('getLastMonthEarningsSummary', () => {
    it('统计上一个自然月的收益', async () => {
      await add('上月产品', 700, dayOf(-1));
      await add('当月产品', 9999, dayOf(0));

      const total = (await env.api.getLastMonthEarningsSummary()) as number;

      expect(total).toBe(700);
    });

    it('上月最后一天录入的收益不会被漏掉', async () => {
      const now = new Date();
      const lastDayOfPrevMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        0,
      );
      await add('月末产品', 321, lastDayOfPrevMonth.getTime());

      const total = (await env.api.getLastMonthEarningsSummary()) as number;

      expect(total).toBe(321);
    });

    it('没有上月记录时返回 0', async () => {
      await add('当月产品', 500, dayOf(0));

      expect(await env.api.getLastMonthEarningsSummary()).toBe(0);
    });
  });

  describe('getInvestmentEarningsTrend', () => {
    it('按本地自然月汇总收益', async () => {
      await add('产品A', 100, dayOf(0));
      await add('产品B', 250, dayOf(0));
      await add('产品C', 600, dayOf(-1));

      const rows = (await env.api.getInvestmentEarningsTrend()) as {
        month: string;
        total_earnings: number;
      }[];

      expect(rows).toHaveLength(2);

      const byMonth = new Map(rows.map((r) => [r.month, r.total_earnings]));
      expect(byMonth.get(localMonthKey(dayOf(0)))).toBe(350);
      expect(byMonth.get(localMonthKey(dayOf(-1)))).toBe(600);
    });

    it('月初凌晨录入的记录按本地月份归组，不能串到上个月', async () => {
      const now = new Date();
      // 本地本月 1 号 02:00，在东八区对应的 UTC 时间还落在上个月
      const monthStartEarly = new Date(now.getFullYear(), now.getMonth(), 1, 2);
      await add('月初产品', 88, monthStartEarly.getTime());

      const rows = (await env.api.getInvestmentEarningsTrend()) as {
        month: string;
        total_earnings: number;
      }[];

      expect(rows).toHaveLength(1);
      expect(rows[0].month).toBe(localMonthKey(monthStartEarly.getTime()));
      expect(rows[0].total_earnings).toBe(88);
    });

    it('没有记录时返回空数组', async () => {
      expect(await env.api.getInvestmentEarningsTrend()).toEqual([]);
    });
  });
});
