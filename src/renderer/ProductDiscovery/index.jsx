import React, { useState, useEffect } from 'react';
import {
  Breadcrumb,
  Table,
  Toast,
  Select,
  Input,
  Row,
  Col,
  Spin,
  Button,
  Typography,
} from '@douyinfe/semi-ui';
import { IconRefresh } from '@douyinfe/semi-icons';
import * as dateFns from 'date-fns';

function ProductDiscovery() {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [sortOrder, setSortOrder] = useState('descend');
  const [initialized, setInitialized] = useState(false);
  const [fullScreenLoading, setFullScreenLoading] = useState(false);
  const [filters, setFilters] = useState({
    bank: '',
    productName: '',
    productCode: '',
    currency: '',
    startDate: null,
    endDate: null,
    term: '',
    risk: '',
    isNew: '',
  });

  const handleTableChange = (data) => {
    const nextSortOrder = data.sorter.sortOrder;
    if (nextSortOrder !== sortOrder) {
      // 你在这里可以随便按你自己想要的顺序去控制怎么切换
      console.log(`from ${sortOrder} to ${nextSortOrder}`);
      setSortOrder(sortOrder === 'descend' ? 'ascend' : 'descend');
    }
  };

  // 获取所有银行数据
  const fetchAllBankData = async (isRefresh = false) => {
    if (isRefresh) {
      setFullScreenLoading(true);
    } else {
      setLoading(true);
      setInitialized(false);
    }

    try {
      const response =
        await window.electron.ipcRenderer.ipcSendSync('getBankDataHistory');
      if (response.code === 200) {
        setDataSource(response.data);
        Toast.success('数据已更新');
      } else {
        Toast.error(response.message || '获取数据失败');
      }
    } catch (error) {
      Toast.error('获取数据失败');
      console.error(error);
    } finally {
      if (isRefresh) {
        setFullScreenLoading(false);
      } else {
        setLoading(false);
        setInitialized(true);
      }
    }
  };

  // 首次加载时获取数据
  useEffect(() => {
    // 延迟加载数据，让页面先渲染
    setTimeout(() => {
      fetchAllBankData();
    }, 100);
  }, []);

  // 过滤数据
  const getFilteredData = () => {
    return dataSource.filter((item) => {
      let match = true;

      if (filters.bank) {
        match = match && item.bank === filters.bank;
      }
      if (filters.productName) {
        match =
          match &&
          item.fundname
            .toLowerCase()
            .includes(filters.productName.toLowerCase());
      }
      if (filters.productCode) {
        match = match && item.fundcode.includes(filters.productCode);
      }
      if (filters.risk) {
        match = match && item.fundlevel === filters.risk;
      }
      // ... 其他过滤条件

      return match;
    });
  };

  // 添加银行代码到中文名称的映射
  const bankNameMap = {
    COMM: '交通银行',
    CMB: '招商银行',
    ABC: '农业银行',
  };

  const parseRate = (rate) => {
    // 如果rate为空或者包含中文字符，返回-Infinity使其排在最后
    if (!rate || /[\u4e00-\u9fa5]/.test(rate)) {
      return -Infinity;
    }
    // 提取数字部分，去除百分号等字符
    const number = parseFloat(rate.replace(/[^0-9.-]/g, ''));
    return isNaN(number) ? -Infinity : number;
  };

  const columns = [
    {
      title: '银行',
      dataIndex: 'bank',
      width: 100,
      render: (text) => bankNameMap[text] || text,
    },
    { title: '产品名称', dataIndex: 'fundname', width: 200 },
    { title: '产品代码', dataIndex: 'fundcode', width: 120 },
    {
      title: '收益率',
      dataIndex: 'displayrate',
      width: 100,
      sorter: (a, b) => {
        const rateA = parseRate(a.displayrate);
        const rateB = parseRate(b.displayrate);
        return rateA - rateB; // 默认降序
      },
      sortOrder,
    },
    { title: '投资期限', dataIndex: 'investdaydesc', width: 120 },
    { title: '风险等级', dataIndex: 'fundlevel', width: 100 },
    { title: '发行机构', dataIndex: 'registername', width: 150 },
  ];

  const handleRefresh = () => {
    fetchAllBankData(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {fullScreenLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--semi-color-overlay-bg)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <Spin size="large" />
          <Typography.Text style={{ color: 'var(--semi-color-text-0)' }}>
            正在获取最新数据...
          </Typography.Text>
        </div>
      )}
      <Breadcrumb style={{ marginBottom: '24px' }} routes={['理财产品发现']} />
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
        <Row
          gutter={[16, 16]}
          style={{ marginBottom: 16 }}
          type="flex"
          justify="start"
        >
          <Col>
            <Select
              placeholder="选择银行"
              style={{ width: 160 }}
              value={filters.bank}
              onChange={(value) => handleFilterChange('bank', value)}
              allowClear
              disabled={!initialized || loading || fullScreenLoading}
            >
              <Select.Option value="">所有银行</Select.Option>
              <Select.Option value="COMM">交通银行</Select.Option>
              <Select.Option value="CMB">招商银行</Select.Option>
              <Select.Option value="ABC">农业银行</Select.Option>
            </Select>
          </Col>
          <Col>
            <Input
              placeholder="产品名称"
              style={{ width: 200 }}
              value={filters.productName}
              onChange={(value) => handleFilterChange('productName', value)}
              disabled={!initialized || loading || fullScreenLoading}
            />
          </Col>
          <Col>
            <Input
              placeholder="产品代码"
              style={{ width: 160 }}
              value={filters.productCode}
              onChange={(value) => handleFilterChange('productCode', value)}
              disabled={!initialized || loading || fullScreenLoading}
            />
          </Col>
          <Col>
            <Select
              placeholder="风险等级"
              style={{ width: 160 }}
              value={filters.risk}
              onChange={(value) => handleFilterChange('risk', value)}
              disabled={!initialized || loading || fullScreenLoading}
            >
              <Select.Option value="1">低风险</Select.Option>
              <Select.Option value="2">中低风险</Select.Option>
              <Select.Option value="3">中等风险</Select.Option>
              <Select.Option value="4">中高风险</Select.Option>
              <Select.Option value="5">高风险</Select.Option>
            </Select>
          </Col>
          <Col>
            <Button
              icon={<IconRefresh />}
              onClick={handleRefresh}
              disabled={loading || fullScreenLoading}
            >
              刷新数据
            </Button>
          </Col>
        </Row>

        <Spin
          spinning={loading}
          tip={initialized ? '加载中...' : '正在获取最新数据...'}
        >
          <Table
            columns={columns}
            onChange={(data) => handleTableChange(data)}
            dataSource={getFilteredData()}
            pagination={{
              pageSize: 10,
            }}
            scroll={{ y: 'calc(100vh - 450px)' }}
            empty={
              initialized ? (
                <div>暂无数据</div>
              ) : (
                <div>数据加载中，请稍候...</div>
              )
            }
          />
        </Spin>
      </div>
    </div>
  );
}

export default ProductDiscovery;
