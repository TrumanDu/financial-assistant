import React, { useState, useEffect, useCallback } from 'react';
import {
  Breadcrumb,
  Card,
  Select,
  Space,
  Table,
  Typography,
  DatePicker,
} from '@douyinfe/semi-ui';
import * as dateFns from 'date-fns';

const { Text } = Typography;

function Dashboard() {
  const [dimension, setDimension] = useState('year');
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    return {
      start: new Date(currentYear, 0, 1).getTime(),
      end: new Date(currentYear + 1, 11, 31).getTime(),
    };
  });
  const [summary, setSummary] = useState([]);

  const getSummary = useCallback(async () => {
    try {
      const data = window.electron.ipcRenderer.ipcSendSync(
        'getFinancialSummary',
        {
          data: {
            startDate: dateRange.start,
            endDate: dateRange.end,
            dimension,
          },
        },
      );
      console.log(data);
      setSummary(data);
    } catch (error) {
      console.error('获取汇总数据失败:', error);
    }
  }, [dateRange, dimension]);

  useEffect(() => {
    getSummary();
  }, [dateRange, dimension]);

  const columns = [
    {
      title: '时间',
      dataIndex: 'period',
      width: 120,
      fixed: 'left',
    },
    {
      title: '账户',
      dataIndex: 'owner',
      width: 100,
      fixed: 'left',
    },
    {
      title: '存款',
      children: [
        {
          title: '本金',
          dataIndex: 'savings_money',
          width: 150,
          render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
        },
        {
          title: '收益',
          dataIndex: 'savings_earnings',
          width: 150,
          render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
        },
        {
          title: '年化率',
          dataIndex: 'savings_rate',
          width: 100,
          render: (text) => `${Number(text).toFixed(2)}%`,
        },
      ],
    },
    {
      title: '理财',
      children: [
        {
          title: '本金',
          dataIndex: 'investment_money',
          width: 150,
          render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
        },
        {
          title: '收益',
          dataIndex: 'investment_earnings',
          width: 150,
          render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
        },
        {
          title: '年化率',
          dataIndex: 'investment_rate',
          width: 100,
          render: (text) => `${Number(text).toFixed(2)}%`,
        },
      ],
    },
    {
      title: '总计',
      children: [
        {
          title: '本金',
          width: 150,
          render: (_, record) =>
            `${Number(
              record.savings_money + record.investment_money,
            ).toLocaleString('zh-CN')} 元`,
        },
        {
          title: '收益',
          width: 150,
          render: (_, record) =>
            `${Number(
              record.savings_earnings + record.investment_earnings,
            ).toLocaleString('zh-CN')} 元`,
        },
        {
          title: '年化率',
          width: 100,
          render: (_, record) => {
            const totalMoney = record.savings_money + record.investment_money;
            if (totalMoney === 0) return '0.00%';
            const weightedRate =
              (record.savings_money * record.savings_rate +
                record.investment_money * record.investment_rate) /
              totalMoney;
            return `${Number(weightedRate).toFixed(2)}%`;
          },
        },
      ],
    },
  ];

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
              <Select.Option value="year">年</Select.Option>
              <Select.Option value="month">月</Select.Option>
              <Select.Option value="week">周</Select.Option>
            </Select>
          </Space>
          <Card>
            <Table
              columns={columns}
              dataSource={summary}
              pagination={false}
              bordered
              scroll={{ x: 1500 }}
            />
          </Card>
        </Space>
      </div>
    </div>
  );
}

export default Dashboard;
