/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Breadcrumb,
  Table,
  Popconfirm,
  Toast,
  Button,
  Col,
  Row,
  Pagination,
  Select,
  DatePicker,
  Dropdown,
} from '@douyinfe/semi-ui';
import {
  IconEdit,
  IconDelete,
  IconPlus,
  IconRefresh,
} from '@douyinfe/semi-icons';
import * as dateFns from 'date-fns';
import BillRecordModal from './BillRecordModal';
import BatchBillRecordModal from './BatchBillRecordModal';

function BillRecord() {
  const [dataSource, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filterAccount, setFilterAccount] = useState('');
  const [filterMonth, setFilterMonth] = useState(null);
  const modalRef = useRef();
  const batchModalRef = useRef();

  const getData = async (currentPage = 1) => {
    try {
      const records = window.electron.ipcRenderer.ipcSendSync(
        'getBillRecordAll',
        {
          page: currentPage,
          pageSize,
        },
      );
      if (records && records.length > 0) {
        const filteredRecords = records.filter((record) => {
          let match = true;

          if (filterAccount) {
            match = match && record.account === filterAccount;
          }

          if (filterMonth) {
            const recordMonth = new Date(record.month);
            const filterMonthDate = new Date(filterMonth);
            match =
              match &&
              recordMonth.getFullYear() === filterMonthDate.getFullYear() &&
              recordMonth.getMonth() === filterMonthDate.getMonth();
          }

          return match;
        });

        setTotal(filteredRecords.length);
        // 计算当前页的数据
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        setData(filteredRecords.slice(start, end));
      }
    } catch (error) {
      Toast.error('获取数据失败');
      console.error(error);
    }
  };

  const add = () => {
    if (modalRef.current) {
      modalRef.current.showModal(null);
    }
  };

  const batchAdd = () => {
    if (batchModalRef.current) {
      batchModalRef.current.showModal();
    }
  };

  const edit = (value) => {
    if (modalRef.current) {
      modalRef.current.showModal(value);
    }
  };

  const handleDelete = async (id) => {
    try {
      window.electron.ipcRenderer.ipcSendSync('deleteBillRecord', {
        id,
      });
      await getData(page);
      Toast.success('删除成功');
    } catch (error) {
      Toast.error('删除失败');
      console.error(error);
    }
  };

  const handlePageChange = (currentPage) => {
    setPage(currentPage);
    getData(currentPage);
  };

  const handleFilterChange = useCallback(() => {
    setPage(1);
    getData(1);
  }, [filterAccount, filterMonth]);

  useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  const handleClearFilters = () => {
    setFilterAccount('');
    setFilterMonth(null);
    setPage(1);
    getData(1);
  };

  const columns = [
    {
      title: '账户',
      dataIndex: 'account',
      width: 120,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 150,
      align: 'right',
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
    {
      title: '月份',
      dataIndex: 'month',
      width: 120,
      sorter: (a, b) => a.month - b.month,
      defaultSortOrder: 'descend',
      render: (value) => dateFns.format(new Date(value), 'yyyy-MM'),
    },
    {
      title: '备注',
      dataIndex: 'memo',
      width: 300,
    },
    {
      title: '操作',
      dataIndex: 'operate',
      width: 120,
      render: (text, record) => (
        <>
          <a href="#" onClick={() => edit(record)}>
            <IconEdit style={{ color: '#0062d6' }} />
          </a>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <Popconfirm
            title="确定是否要删除？"
            content="此操作不可逆"
            onConfirm={() => handleDelete(record.id)}
          >
            <a href="#">
              <IconDelete style={{ color: '#d52515' }} />
            </a>
          </Popconfirm>
        </>
      ),
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
        routes={['账单记录']}
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
        <Row
          type="flex"
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Row type="flex" align="middle" style={{ gap: 16 }}>
              <Col>
                <Select
                  placeholder="选择账户"
                  style={{ width: 120 }}
                  value={filterAccount}
                  onChange={setFilterAccount}
                  allowClear
                >
                  <Select.Option value="老公">老公</Select.Option>
                  <Select.Option value="妻子">妻子</Select.Option>
                  <Select.Option value="孩子">孩子</Select.Option>
                  <Select.Option value="成员1">成员1</Select.Option>
                  <Select.Option value="成员2">成员2</Select.Option>
                  <Select.Option value="成员3">成员3</Select.Option>
                </Select>
              </Col>
              <Col>
                <DatePicker
                  type="month"
                  placeholder="选择月份"
                  value={filterMonth}
                  onChange={setFilterMonth}
                  style={{ width: 120 }}
                />
              </Col>
              <Button
                icon={<IconRefresh />}
                onClick={handleClearFilters}
                disabled={!filterAccount && !filterMonth}
              >
                清空过滤
              </Button>
            </Row>
          </Col>
          <Col>
            <Dropdown
              render={
                <Dropdown.Menu>
                  <Dropdown.Item onClick={add}>单条添加</Dropdown.Item>
                  <Dropdown.Item onClick={batchAdd}>批量添加</Dropdown.Item>
                </Dropdown.Menu>
              }
            >
              <Button icon={<IconPlus />} theme="solid">
                新增
              </Button>
            </Dropdown>
          </Col>
        </Row>
        <Table columns={columns} dataSource={dataSource} pagination={false} />
        <div
          style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}
        >
          <Pagination
            total={total}
            pageSize={pageSize}
            currentPage={page}
            onPageChange={handlePageChange}
          />
        </div>
        <BillRecordModal ref={modalRef} reloadData={() => getData(page)} />
        <BatchBillRecordModal
          ref={batchModalRef}
          reloadData={() => getData(page)}
        />
      </div>
    </div>
  );
}

export default BillRecord;
