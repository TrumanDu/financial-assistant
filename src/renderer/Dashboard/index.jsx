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
        <MetricCard title="上月收益汇总" value="*****" />
        <MetricCard title="年度收益汇总" value="*****" />
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
    </div>
  );
}

export default Dashboard;
