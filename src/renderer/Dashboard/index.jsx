import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Breadcrumb,
  Card,
  Select,
  Space,
  Table,
  Typography,
  DatePicker,
  Spin,
} from '@douyinfe/semi-ui';
import ReactECharts from 'echarts-for-react';

import baiduAnalyticsRenderer from './baiduAnalytics';

const { Text } = Typography;

function Dashboard() {
  const [dimension, setDimension] = useState('month');
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime(),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime(),
    };
  });
  const [summaryData, setSummaryData] = useState([]);
  const [detailData, setDetailData] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const getData = useCallback(async () => {
    setLoading(true);
    try {
      const { summary, detail } = window.electron.ipcRenderer.ipcSendSync(
        'getFinancialSummary',
        {
          startDate: dateRange.start,
          endDate: dateRange.end,
          dimension,
        },
      );
      setSummaryData(summary);
      setDetailData(detail);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, dimension]);

  useEffect(() => {
    getData();
  }, [dateRange, dimension]);

  useEffect(() => {
    baiduAnalytics();
  }, []);

  const summaryColumns = [
    {
      title: '时间',
      dataIndex: 'period',
      width: 120,
      sorter: (a, b) => a.period.localeCompare(b.period),
    },
    {
      title: '总本金',
      dataIndex: 'total_money',
      width: 150,
      sorter: (a, b) => a.total_money - b.total_money,
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
    {
      title: '总收益',
      dataIndex: 'earnings',
      width: 150,
      sorter: (a, b) => a.earnings - b.earnings,
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
    {
      title: '综合年化率',
      dataIndex: 'rate',
      width: 120,
      sorter: (a, b) => a.rate - b.rate,
      render: (text) => `${Number(text).toFixed(2)}%`,
    },
    {
      title: '家庭账户汇预期总金额',
      dataIndex: 'expected_total',
      width: 180,
      sorter: (a, b) => a.expected_total - b.expected_total,
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
    {
      title: '家庭账户汇真实总金额',
      dataIndex: 'actual_total',
      width: 180,
      sorter: (a, b) => a.actual_total - b.actual_total,
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
  ];

  const detailColumns = [
    {
      title: '时间',
      dataIndex: 'period',
      width: 120,
      sorter: (a, b) => a.period.localeCompare(b.period),
    },
    {
      title: '产品名称',
      dataIndex: 'name',
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '本金',
      dataIndex: 'total_money',
      width: 150,
      sorter: (a, b) => a.total_money - b.total_money,
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
    {
      title: '收益',
      dataIndex: 'earnings',
      width: 150,
      sorter: (a, b) => a.earnings - b.earnings,
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
    {
      title: '年化收益率',
      dataIndex: 'rate',
      width: 120,
      sorter: (a, b) => a.rate - b.rate,
      render: (text) => `${Number(text).toFixed(2)}%`,
    },
  ];

  // 添加一个正序排序的数据源，专门用于图表
  const chartSortedData = useMemo(() => {
    return [...summaryData].sort((a, b) => a.period.localeCompare(b.period));
  }, [summaryData]);

  const chartSortedDetailData = useMemo(() => {
    return [...detailData].sort((a, b) => a.period.localeCompare(b.period));
  }, [detailData]);

  // 表格保持倒序
  const sortedSummaryData = useMemo(() => {
    return [...summaryData].sort((a, b) => b.period.localeCompare(a.period));
  }, [summaryData]);

  const sortedDetailData = useMemo(() => {
    return [...detailData].sort((a, b) => b.period.localeCompare(a.period));
  }, [detailData]);

  // 分别创建两个图表的配置
  const earningsChartOptions = useMemo(() => {
    const periods = chartSortedData.map((item) => item.period);

    // 按产品分组处理数据
    const productEarnings = {};
    const productNames = new Set();
    const productTotalEarnings = new Map(); // 用于存储每个产品的总收益

    // 第一步：收集数据和计算每个产品的总收益
    chartSortedDetailData.forEach((item) => {
      if (!productEarnings[item.period]) {
        productEarnings[item.period] = {};
      }
      productEarnings[item.period][item.name] = Number(
        item.earnings.toFixed(2),
      );
      productNames.add(item.name);

      // 累计每个产品的总收益
      const currentTotal = productTotalEarnings.get(item.name) || 0;
      productTotalEarnings.set(
        item.name,
        currentTotal + Number(item.earnings.toFixed(2)),
      );
    });

    // 按总收益排序产品名称
    const sortedProductNames = Array.from(productNames).sort((a, b) => {
      const totalA = productTotalEarnings.get(a) || 0;
      const totalB = productTotalEarnings.get(b) || 0;
      return totalB - totalA; // 从大到小排序，这样收益大的会在底部
    });

    // 转换为图表数据
    const seriesData = sortedProductNames.map((name) => ({
      name,
      type: 'bar',
      stack: 'earnings',
      data: periods.map((period) => productEarnings[period]?.[name] || 0),
      label: {
        show: true,
        position: 'inside',
      },
    }));

    return {
      title: {
        text: '收益趋势',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      legend: {
        bottom: 0,
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: periods,
        axisLabel: {
          rotate: 30,
        },
      },
      yAxis: {
        type: 'value',
        name: '收益(元)',
        axisLabel: {
          formatter: (value) => value.toLocaleString('zh-CN'),
        },
      },
      series: [
        ...seriesData,
        {
          name: '总收益',
          type: 'line',
          data: periods.map((period) => {
            const total = seriesData.reduce(
              (sum, series) =>
                sum + (series.data[periods.indexOf(period)] || 0),
              0,
            );
            return Number(total.toFixed(2));
          }),
          label: {
            show: true,
            position: 'top',
            formatter: (params) => `${params.value.toLocaleString('zh-CN')} 元`,
          },
        },
      ],
    };
  }, [chartSortedData, chartSortedDetailData]);

  const rateChartOptions = useMemo(() => {
    const periods = chartSortedData.map((item) => item.period);
    const rates = chartSortedData.map((item) => Number(item.rate.toFixed(2)));

    return {
      title: {
        text: '年化率趋势',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '15%',
      },
      xAxis: {
        type: 'category',
        data: periods,
        axisLabel: {
          rotate: 30,
        },
      },
      yAxis: {
        type: 'value',
        name: '年化率(%)',
        position: 'left',
        axisLabel: {
          formatter: '{value}%',
        },
      },
      series: [
        {
          name: '综合年化率',
          type: 'line',
          data: rates,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 2,
          },
          itemStyle: {
            color: '#91CC75',
          },
          label: {
            show: true,
            position: 'top',
            formatter: (params) => `${params.value}%`,
            color: '#91CC75',
          },
        },
      ],
    };
  }, [chartSortedData]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      <Breadcrumb
        style={{
          marginBottom: '24px',
        }}
        routes={['首页']}
      />
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
        <Space
          vertical
          align="start"
          spacing="medium"
          style={{ width: '100%' }}
        >
          <Space>
            <Text>时间范围：</Text>
            <DatePicker
              type="dateRange"
              value={[dateRange.start, dateRange.end]}
              onChange={(val) => {
                if (val) {
                  setDateRange({
                    start: val[0],
                    end: val[1],
                  });
                }
              }}
              style={{ width: 260 }}
            />
            <Text>统计维度：</Text>
            <Select
              value={dimension}
              onChange={setDimension}
              style={{ width: 120 }}
            >
              <Select.Option value="month">月</Select.Option>
              <Select.Option value="week">周</Select.Option>
              <Select.Option value="year">年</Select.Option>
            </Select>
          </Space>

          {loading ? (
            <Spin tip="加载中..." size="large" />
          ) : (
            <>
              <Card title="收益趋势分析" style={{ width: '100%' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <ReactECharts
                      option={earningsChartOptions}
                      style={{ height: '400px' }}
                      opts={{ renderer: 'svg' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <ReactECharts
                      option={rateChartOptions}
                      style={{ height: '400px' }}
                      opts={{ renderer: 'svg' }}
                    />
                  </div>
                </div>
              </Card>

              <Card title="收益汇总" style={{ width: '100%' }}>
                <Table
                  columns={summaryColumns}
                  dataSource={sortedSummaryData}
                  pagination={false}
                  bordered
                />
              </Card>

              <Card title="收益明细" style={{ width: '100%' }}>
                <Table
                  columns={detailColumns}
                  dataSource={sortedDetailData}
                  pagination={false}
                  bordered
                />
              </Card>
            </>
          )}
        </Space>
      </div>
    </div>
  );
}

export default Dashboard;
