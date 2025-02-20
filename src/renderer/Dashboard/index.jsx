import React, { useEffect, useState } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import ReactECharts from 'echarts-for-react';

import MetricCard from './MetricCard';

import baiduAnalyticsRenderer from './baiduAnalytics';

function Dashboard() {
  const [totalAssets, setTotalAssets] = useState(0);
  const [lastMonthBill, setLastMonthBill] = useState(0);
  const [assetsTrend, setAssetsTrend] = useState([]);
  const [assetsDistribution, setAssetsDistribution] = useState([]);
  const [lastMonthEarnings, setLastMonthEarnings] = useState(0);
  const [yearlyEarnings, setYearlyEarnings] = useState(0);
  const [billRecords, setBillRecords] = useState([]);
  const [investmentEarnings, setInvestmentEarnings] = useState([]);
  const [billTrend, setBillTrend] = useState([]);

  const baiduAnalytics = () => {
    try {
      console.log('baidu analytics');
      baiduAnalyticsRenderer('024ca774b3b9216529c7f13c2b471974', (_hmt) => {
        _hmt.push(['_trackPageview', '/']);
      });
    } catch (error) {
      console.error(error);
    }
  };

  // 获取资产总额
  const getAssetsSummary = () => {
    try {
      const res = window.electron.ipcRenderer.ipcSendSync('getAssetsSummary');
      if (res && res[0]) {
        setTotalAssets(res[0].total_amount || 0);
      }
    } catch (error) {
      Toast.error('获取汇总数据失败');
      console.error(error);
    }
  };

  // 获取上月账单汇总
  const getLastMonthBillSummary = () => {
    try {
      const amount = window.electron.ipcRenderer.ipcSendSync(
        'getLastMonthBillSummary',
      );
      setLastMonthBill(amount);
    } catch (error) {
      Toast.error('获取上月账单汇总失败');
      console.error(error);
    }
  };

  // 获取资产趋势数据
  const getAssetsTrend = () => {
    // 获取最近12个月的数据
    const endDate = new Date().getTime();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    try {
      const trendData = window.electron.ipcRenderer.ipcSendSync(
        'getAssetsTrend',
        { startDate: startDate.getTime(), endDate },
      );
      setAssetsTrend(trendData);
    } catch (error) {
      Toast.error('获取资产趋势数据失败');
      console.error(error);
    }
  };

  // 获取资产分布数据
  const getAssetsDistribution = () => {
    try {
      const records =
        window.electron.ipcRenderer.ipcSendSync('getAssetsRecordAll');

      // 按类型分组并计算总额
      const distribution = records.reduce((acc, record) => {
        if (!acc[record.type]) {
          acc[record.type] = 0;
        }
        acc[record.type] += record.amount;
        return acc;
      }, {});

      // 转换为饼图所需的数据格式
      const pieData = Object.entries(distribution).map(([type, value]) => ({
        name: type,
        value,
      }));

      setAssetsDistribution(pieData);
    } catch (error) {
      Toast.error('获取资产分布数据失败');
      console.error(error);
    }
  };

  // 获取上月收益汇总
  const getLastMonthEarningsSummary = () => {
    try {
      const earnings = window.electron.ipcRenderer.ipcSendSync(
        'getLastMonthEarningsSummary',
      );
      setLastMonthEarnings(earnings);
    } catch (error) {
      Toast.error('获取上月收益汇总失败');
      console.error(error);
    }
  };

  // 获取年度收益汇总
  const getYearlyEarningsSummary = () => {
    try {
      const earnings = window.electron.ipcRenderer.ipcSendSync(
        'getYearlyEarningsSummary',
      );
      setYearlyEarnings(earnings);
    } catch (error) {
      Toast.error('获取年度收益汇总失败');
      console.error(error);
    }
  };

  // 获取账单记录
  const getBillRecords = () => {
    try {
      const records = window.electron.ipcRenderer.ipcSendSync(
        'getBillRecordAll',
        {
          data: { page: 1, pageSize: 100, account: null, month: null },
        },
      );
      setBillRecords(records);
    } catch (error) {
      Toast.error('获取账单记录失败');
      console.error(error);
    }
  };

  // 获取理财收益
  const getInvestmentEarnings = () => {
    try {
      const earnings = window.electron.ipcRenderer.ipcSendSync(
        'getInvestmentRecordAll',
      );
      setInvestmentEarnings(earnings);
    } catch (error) {
      Toast.error('获取理财收益失败');
      console.error(error);
    }
  };

  // 获取账单趋势数据
  const getBillTrend = () => {
    try {
      const trendData = window.electron.ipcRenderer.ipcSendSync('getBillTrend');
      setBillTrend(trendData);
    } catch (error) {
      Toast.error('获取账单趋势数据失败');
      console.error(error);
    }
  };

  useEffect(() => {
    baiduAnalytics();
    // 获取资产总额
    getAssetsSummary();
    // 获取上月账单汇总
    getLastMonthBillSummary();
    // 获取资产趋势数据
    getAssetsTrend();
    // 获取资产分布数据
    getAssetsDistribution();
    getLastMonthEarningsSummary();
    getYearlyEarningsSummary();
    getBillRecords();
    getInvestmentEarnings();
    getBillTrend();
  }, []);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // 资产趋势图配置
  const getTrendOption = () => {
    const data = assetsTrend.sort((a, b) => a.date - b.date);

    // 计算时间范围
    const endDate = new Date().getTime();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const date = new Date(params[0].value[0]);
          return `${date.getFullYear()}年${date.getMonth() + 1}月<br/>
                  资产总额: ￥${formatNumber(params[0].value[1])}`;
        },
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: (value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}月`;
          },
        },
        min: startDate.getTime(),
        max: endDate,
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value) => `￥${formatNumber(value)}`,
        },
      },
      series: [
        {
          data: data.map((item) => [item.date, item.amount]),
          type: 'line',
          smooth: true,
          symbolSize: 8,
          lineStyle: {
            width: 2,
          },
        },
      ],
    };
  };

  // 资产分布饼图配置
  const getDistributionOption = () => ({
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `${params.name}<br/>
                金额: ${formatNumber(params.value)}<br/>
                占比: ${params.percent}%`;
      },
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: assetsDistribution,
        label: {
          show: true,
          formatter: (params) => {
            return [
              `${params.name}`,
              `￥${formatNumber(params.value)}`,
              `${params.percent}%`,
            ].join('\n');
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  });

  // 账单趋势柱状堆叠图配置
  const getBillStackedBarOption = () => {
    const months = Array.from(
      new Set(billTrend.map((record) => record.month)),
    ).sort();
    const accounts = Array.from(
      new Set(billTrend.map((record) => record.account)),
    );

    const series = accounts.map((account) => ({
      name: account,
      type: 'bar',
      stack: 'total',
      data: months.map((month) => {
        const record = billTrend.find(
          (r) => r.month === month && r.account === account,
        );
        return record ? record.total_amount : 0;
      }),
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: { data: accounts },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value' },
      series,
    };
  };

  // 理财收益折线图配置
  const getInvestmentEarningsLineOption = () => {
    const months = Array.from(
      new Set(investmentEarnings.map((record) => record.record_date)),
    ).sort();
    const data = months.map((month) => {
      const records = investmentEarnings.filter((r) => r.record_date === month);
      return records.reduce((sum, record) => sum + record.earnings, 0);
    });

    return {
      tooltip: {
        trigger: 'axis',
      },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value' },
      series: [
        {
          data,
          type: 'line',
          smooth: true,
        },
      ],
    };
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          borderRadius: '10px',
          border: '1px solid var(--semi-color-border)',
        }}
      >
        <MetricCard title="家庭总资产" value={formatNumber(totalAssets)} />
        <MetricCard
          title="上月账单汇总"
          value={formatNumber(lastMonthBill)}
          tooltip={`${new Date().getFullYear()}年${new Date().getMonth()}月账单总额`}
        />
        <MetricCard
          title="上月收益汇总"
          value={formatNumber(lastMonthEarnings)}
        />
        <MetricCard title="年度收益汇总" value={formatNumber(yearlyEarnings)} />
      </div>
      <div
        style={{
          borderRadius: '10px',
          border: '1px solid var(--semi-color-border)',
          flex: 1,
          padding: '32px',
          overflow: 'auto',
          minHeight: 0,
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', gap: '24px', height: '400px' }}>
          <div style={{ flex: 1, height: '100%' }}>
            <h3 style={{ marginBottom: '16px' }}>资产趋势</h3>
            <ReactECharts
              option={getTrendOption()}
              style={{ height: '100%' }}
            />
          </div>
          <div style={{ flex: 1, height: '100%' }}>
            <h3 style={{ marginBottom: '16px' }}>资产分布</h3>
            <ReactECharts
              option={getDistributionOption()}
              style={{ height: '100%' }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          borderRadius: '10px',
          border: '1px solid var(--semi-color-border)',
          flex: 1,
          padding: '32px',
          overflow: 'auto',
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '24px',
            height: '400px',
            marginTop: '24px',
          }}
        >
          <div style={{ flex: 1, height: '100%' }}>
            <h3 style={{ marginBottom: '16px' }}>账单趋势</h3>
            <ReactECharts
              option={getBillStackedBarOption()}
              style={{ height: '100%' }}
            />
          </div>
          <div style={{ flex: 1, height: '100%' }}>
            <h3 style={{ marginBottom: '16px' }}>理财收益</h3>
            <ReactECharts
              option={getInvestmentEarningsLineOption()}
              style={{ height: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
