import { createTestEnv, TestEnv } from './helpers/testEnv';

// 资产模块：月度快照模型（saveAssetsForMonth 写明细，首页读汇总/趋势/分布）

interface AssetRecord {
  type: string;
  amount: number;
  currency: string;
  memo: string;
}

interface StoredAsset extends AssetRecord {
  date: number;
}

const rec = (type: string, amount: number, memo = ''): AssetRecord => ({
  type,
  amount,
  currency: '人民币',
  memo,
});

const monthStart = (year: number, month: number) =>
  new Date(year, month, 1).getTime();

describe('资产模块', () => {
  let env: TestEnv;

  const save = (year: number, month: number, records: AssetRecord[]) =>
    env.api.saveAssetsForMonth({ data: { year, month, records } });

  const allRecords = async () =>
    (await env.api.getAssetsRecordAll()) as StoredAsset[];

  const summary = async () => {
    const rows = (await env.api.getAssetsSummary()) as {
      total_amount: number;
    }[];
    return rows[0].total_amount;
  };

  const trend = async (startDate = 0, endDate = Date.now()) =>
    (await env.api.getAssetsTrend({ data: { startDate, endDate } })) as {
      date: number;
      amount: number;
    }[];

  beforeAll(async () => {
    env = await createTestEnv('assets');
  });

  beforeEach(async () => {
    await env.reset();
  });

  afterAll(async () => {
    await env.destroy();
  });

  describe('saveAssetsForMonth', () => {
    it('写入的日期固定为该月 1 号 0 点（本地时区）', async () => {
      const result = await save(2026, 8, [
        rec('现金', 6000),
        rec('定期存款', 500000),
      ]);

      expect(result).toEqual({ success: true, count: 2 });

      const rows = await allRecords();
      expect(rows).toHaveLength(2);
      rows.forEach((r) => expect(r.date).toBe(monthStart(2026, 8)));
    });

    it('同月重复保存是整月替换，不会累加', async () => {
      await save(2026, 8, [rec('现金', 6000), rec('基金', 1000)]);
      await save(2026, 8, [rec('现金', 7000)]);

      const rows = await allRecords();
      expect(rows).toHaveLength(1);
      expect(rows[0].amount).toBe(7000);
    });

    it('不同月份各自独立保存', async () => {
      await save(2026, 7, [rec('现金', 100)]);
      await save(2026, 8, [rec('现金', 200)]);

      const rows = await allRecords();
      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.amount).sort()).toEqual([100, 200]);
    });
  });

  describe('getAssetsRecordByMonth', () => {
    it('只返回指定本地年月的记录', async () => {
      await save(2026, 7, [rec('现金', 100), rec('基金', 200)]);
      await save(2026, 8, [rec('现金', 300)]);

      const rows = (await env.api.getAssetsRecordByMonth({
        data: { year: 2026, month: 7 },
      })) as AssetRecord[];

      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.amount).sort()).toEqual([100, 200]);
    });

    it('没有该月记录时返回空数组', async () => {
      await save(2026, 7, [rec('现金', 100)]);

      const rows = (await env.api.getAssetsRecordByMonth({
        data: { year: 2026, month: 8 },
      })) as AssetRecord[];

      expect(rows).toEqual([]);
    });
  });

  describe('getAssetsRecordLatestMonth', () => {
    it('目标月还没有数据时返回最近月份的记录用于继承', async () => {
      await save(2026, 7, [
        rec('招行理财', 629726, '老婆'),
        rec('招行理财', 94846, '老公(包含黄金)'),
      ]);

      const rows = (await env.api.getAssetsRecordLatestMonth({
        data: { year: 2026, month: 8 },
      })) as AssetRecord[];

      // 同类型不同账户必须都保留
      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.memo).sort()).toEqual([
        '老公(包含黄金)',
        '老婆',
      ]);
    });

    it('同类型同备注只保留最新一条', async () => {
      await save(2026, 6, [rec('现金', 100)]);
      await save(2026, 7, [rec('现金', 250)]);

      const rows = (await env.api.getAssetsRecordLatestMonth({
        data: { year: 2026, month: 8 },
      })) as AssetRecord[];

      expect(rows).toHaveLength(1);
      expect(rows[0].amount).toBe(250);
    });

    it('之前没有任何记录时返回空数组', async () => {
      const rows = (await env.api.getAssetsRecordLatestMonth({
        data: { year: 2026, month: 8 },
      })) as AssetRecord[];

      expect(rows).toEqual([]);
    });
  });

  describe('getAssetsSummary（家庭总资产）', () => {
    it('空库返回 0', async () => {
      expect(await summary()).toBe(0);
    });

    it('只统计最近有数据的月份，不能把所有月份累加', async () => {
      await save(2026, 7, [rec('现金', 1000000), rec('基金', 300000)]);
      await save(2026, 8, [rec('现金', 1200000), rec('基金', 135581)]);

      // 回归：重构为月度快照后，全表 SUM 会得到 2635581（两月累加）
      expect(await summary()).toBe(1335581);
    });

    it('当前月没有记录时取最近一个有数据的月份', async () => {
      await save(2026, 6, [rec('现金', 4242)]);

      expect(await summary()).toBe(4242);
    });
  });

  describe('getAssetsTrend（资产趋势）', () => {
    it('每个点是该月全部记录的合计，不是单条记录的金额', async () => {
      await save(2026, 7, [rec('现金', 100), rec('基金', 200)]);
      await save(2026, 8, [rec('现金', 300), rec('基金', 400)]);

      const points = await trend();

      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({ date: monthStart(2026, 8), amount: 700 });
      expect(points[1]).toEqual({ date: monthStart(2026, 7), amount: 300 });
    });

    it('只返回时间范围内的月份', async () => {
      await save(2026, 7, [rec('现金', 100)]);
      await save(2026, 8, [rec('现金', 200)]);
      await save(2026, 9, [rec('现金', 300)]);

      const points = await trend(monthStart(2026, 8), Date.now());

      expect(points.map((p) => p.date)).toEqual([
        monthStart(2026, 9),
        monthStart(2026, 8),
      ]);
    });

    it('最多返回 12 个月，且按日期倒序', async () => {
      const now = new Date();
      for (let i = 0; i < 14; i += 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        // eslint-disable-next-line no-await-in-loop
        await save(d.getFullYear(), d.getMonth(), [rec('现金', i + 1)]);
      }

      const points = await trend();

      expect(points).toHaveLength(12);
      expect(points[0].date).toBe(
        monthStart(now.getFullYear(), now.getMonth()),
      );
      expect(points[0].amount).toBe(1);
      expect(points[11].amount).toBe(12);

      const dates = points.map((p) => p.date);
      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });

    it('最新点与家庭总资产一致：备注改名不会产生残留金额', async () => {
      // 复刻真实数据：9 月是 基金|REIT，10 月改名成 基金|REIT 42000
      await save(2026, 8, [rec('基金', 29130, 'REIT'), rec('现金', 6000)]);
      await save(2026, 9, [
        rec('基金', 28887, 'REIT 42000'),
        rec('现金', 6000),
      ]);

      const total = await summary();
      const points = await trend();

      expect(total).toBe(34887);
      expect(points).toHaveLength(2);
      expect(points[0].amount).toBe(total);
      // 回归：旧 carry-forward 算法会得到 34887 + 29130
      expect(points[1].amount).toBe(35130);
    });

    it('没有任何记录时返回空数组', async () => {
      expect(await trend()).toEqual([]);
    });
  });
});
