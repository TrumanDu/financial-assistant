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
    },
    {
      title: '总本金',
      dataIndex: 'total_money',
      width: 150,
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
    {
      title: '总收益',
      dataIndex: 'earnings',
      width: 150,
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
    {
      title: '综合年化率',
      dataIndex: 'rate',
      width: 120,
      render: (text) => `${Number(text).toFixed(2)}%`,
    },
    {
      title: '家庭账户汇预期总金额',
      dataIndex: 'expected_total',
      width: 180,
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
    {
      title: '家庭账户汇真实总金额',
      dataIndex: 'actual_total',
      width: 180,
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
  ];

  const detailColumns = [
    {
      title: '时间',
      dataIndex: 'period',
      width: 120,
    },
    {
      title: '产品名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '本金',
      dataIndex: 'total_money',
      width: 150,
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
    {
      title: '收益',
      dataIndex: 'earnings',
      width: 150,
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
    {
      title: '年化收益率',
      dataIndex: 'rate',
      width: 120,
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

  // 修改 chartOptions 使用正序数据
  const chartOptions = useMemo(() => {
    const periods = chartSortedData.map((item) => item.period);
    const rates = chartSortedData.map((item) => Number(item.rate.toFixed(2)));

    // 按产品分组处理数据
    const productEarnings = {};
    const productNames = new Set();

    chartSortedDetailData.forEach((item) => {
      if (!productEarnings[item.period]) {
        productEarnings[item.period] = {};
      }
      productEarnings[item.period][item.name] = Number(
        item.earnings.toFixed(2),
      );
      productNames.add(item.name);
    });

    // 转换为图表数据
    const seriesData = Array.from(productNames).map((name) => ({
      name,
      type: 'bar',
      stack: 'earnings',
      data: periods.map((period) => productEarnings[period]?.[name] || 0),
      itemStyle: {
        borderRadius: [0, 0, 0, 0],
      },
      label: {
        show: true,
        position: 'top',
        formatter: (params) => {
          const periodTotal = periods.map((_, index) => {
            return seriesData.reduce(
              (sum, series) => sum + (series.data[index] || 0),
              0,
            );
          })[params.dataIndex];

          const isLastBar = params.seriesIndex === seriesData.length - 1;
          if (isLastBar) {
            return periodTotal > 0
              ? `${periodTotal.toLocaleString('zh-CN')} 元`
              : '';
          }
          return '';
        },
      },
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params) => {
          let result = `${params[0].axisValue}<br/>`;
          let total = 0;

          // 先显示各产品收益
          params.forEach((param) => {
            if (param.seriesType === 'bar') {
              result += `${param.marker}${param.seriesName}: ${param.value.toLocaleString('zh-CN')} 元<br/>`;
              total += param.value;
            }
          });

          // 显示总收益和年化率
          result += `<br/>总收益: ${total.toLocaleString('zh-CN')} 元<br/>`;
          const rateParam = params.find(
            (param) => param.seriesName === '综合年化率',
          );
          if (rateParam) {
            result += `综合年化率: ${rateParam.value}%`;
          }
          return result;
        },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        left: 'center',
        height: 30,
      },
      grid: {
        right: '15%',
        top: '40px',
        bottom: '40px',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: periods,
      },
      yAxis: [
        {
          type: 'value',
          name: '收益(元)',
          position: 'left',
          axisLabel: {
            formatter: (value) => value.toLocaleString('zh-CN'),
          },
        },
        {
          type: 'value',
          name: '年化率(%)',
          position: 'right',
          offset: 40,
          axisLine: {
            show: true,
            lineStyle: {
              color: '#91CC75',
            },
          },
          axisLabel: {
            formatter: '{value}%',
          },
        },
      ],
      series: [
        ...seriesData.map((series) => ({
          ...series,
          label: {
            show: true,
            position: 'bottom',
            formatter: (params) => {
              const periodTotal = periods.map((_, index) => {
                return seriesData.reduce(
                  (sum, series) => sum + (series.data[index] || 0),
                  0,
                );
              })[params.dataIndex];

              const isLastBar = params.seriesIndex === seriesData.length - 1;
              if (isLastBar) {
                return periodTotal > 0
                  ? `${periodTotal.toLocaleString('zh-CN')} 元`
                  : '';
              }
              return '';
            },
            offset: [0, 10],
            color: '#000',
          },
        })),
        {
          name: '综合年化率',
          type: 'line',
          yAxisIndex: 1,
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
  }, [chartSortedData, chartSortedDetailData]);

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
              <Card title="收益趋势" style={{ width: '100%' }}>
                <ReactECharts
                  option={chartOptions}
                  style={{ height: '400px' }}
                  opts={{ renderer: 'svg' }}
                />
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
