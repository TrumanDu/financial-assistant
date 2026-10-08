import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as echartsMock from 'echarts-for-react';
import Dashboard from '../renderer/Dashboard';
import { createTestEnv, TestEnv } from './helpers/testEnv';

// 首页三处展示必须一致：家庭总资产卡片 / 资产分布饼图 / 资产趋势最新点

interface ChartOption {
  series: { type: string; data?: unknown }[];
}

interface PieDatum {
  name: string;
  value: number;
}

type TrendPoint = [number, number];

const capturedOptions = (): ChartOption[] =>
  (echartsMock as unknown as { capturedOptions: ChartOption[] })
    .capturedOptions;

describe('首页 Dashboard', () => {
  let env: TestEnv;

  const prevMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  };

  const currMonth = () => new Date();

  // 上月 35130、本月 34887，且本月把基金的备注从 REIT 改成了 REIT 42000
  const TOTAL_PREV = 35130;
  const TOTAL_CURR = 34887;

  beforeAll(async () => {
    env = await createTestEnv('dashboard');

    const prev = prevMonth();
    await env.api.saveAssetsForMonth({
      data: {
        year: prev.getFullYear(),
        month: prev.getMonth(),
        records: [
          { type: '基金', amount: 29130, currency: '人民币', memo: 'REIT' },
          { type: '现金', amount: 6000, currency: '人民币', memo: '' },
        ],
      },
    });

    const curr = currMonth();
    await env.api.saveAssetsForMonth({
      data: {
        year: curr.getFullYear(),
        month: curr.getMonth(),
        records: [
          {
            type: '基金',
            amount: 28887,
            currency: '人民币',
            memo: 'REIT 42000',
          },
          { type: '现金', amount: 6000, currency: '人民币', memo: '' },
        ],
      },
    });

    // ipcSendSync 是同步返回，这里先把每个接口的结果算好，渲染时直接取
    const endDate = new Date().getTime();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const results = new Map<string, unknown>([
      ['getAssetsSummary', await env.api.getAssetsSummary()],
      ['getLastMonthBillSummary', await env.api.getLastMonthBillSummary()],
      [
        'getAssetsTrend',
        await env.api.getAssetsTrend({ data: { startDate, endDate } }),
      ],
      ['getAssetsRecordAll', await env.api.getAssetsRecordAll()],
      [
        'getLastMonthEarningsSummary',
        await env.api.getLastMonthEarningsSummary(),
      ],
      ['getYearlyEarningsSummary', await env.api.getYearlyEarningsSummary()],
      [
        'getBillRecordAll',
        await env.api.getBillRecordAll({
          data: { page: 1, pageSize: 100, account: null, month: null },
        }),
      ],
      [
        'getInvestmentEarningsTrend',
        await env.api.getInvestmentEarningsTrend(),
      ],
      ['getBillTrend', await env.api.getBillTrend()],
    ]);

    window.electron = {
      ipcRenderer: {
        sendMessage: jest.fn(),
        on: jest.fn(() => () => {}),
        once: jest.fn(),
        ipcSend: jest.fn(),
        ipcSendSync: (type: string) => results.get(type),
      },
    };
  });

  beforeEach(() => {
    capturedOptions().length = 0;
  });

  afterAll(async () => {
    await env.destroy();
  });

  it('家庭总资产卡片展示最近一个月的合计', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('¥ 34,887')).toBeInTheDocument();
    });
    // 回归：旧实现把所有月份累加成 70018
    expect(screen.queryByText('¥ 70,018')).not.toBeInTheDocument();
  });

  it('资产分布饼图的合计与卡片一致', () => {
    render(<Dashboard />);

    const options = capturedOptions();
    expect(options.length % 4).toBe(0);

    const [trendOption, distributionOption] = options.slice(-4);
    expect(trendOption.series[0].type).toBe('line');
    expect(distributionOption.series[0].type).toBe('pie');

    const pieData = distributionOption.series[0].data as PieDatum[];
    const pieTotal = pieData.reduce((sum, d) => sum + d.value, 0);

    expect(pieTotal).toBe(TOTAL_CURR);
    expect(pieData.map((d) => d.name).sort()).toEqual(['基金', '现金']);
  });

  it('资产趋势最新点与卡片一致', () => {
    render(<Dashboard />);

    const options = capturedOptions();
    const [trendOption] = options.slice(-4);

    const points = trendOption.series[0].data as TrendPoint[];
    expect(points).toHaveLength(2);
    expect(points[points.length - 1][1]).toBe(TOTAL_CURR);
    // 回归：旧 carry-forward 把上月的 29130 残留进来会得到 64018
    expect(points[points.length - 1][1]).not.toBe(64018);
    expect(points[0][1]).toBe(TOTAL_PREV);
  });
});
