import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Breadcrumb,
  Table,
  Popconfirm,
  Toast,
  Button,
  Col,
  Row,
} from '@douyinfe/semi-ui';
import * as dateFns from 'date-fns';
import { IconEdit, IconDelete, IconPlus } from '@douyinfe/semi-icons';
import InvestmentRecordModal from './InvestmentRecordModal';

function InvestmentRecord() {
  const [dataSource, setData] = useState([]);
  const modalRef = useRef();

  const getData = useCallback(async () => {
    try {
      const records = window.electron.ipcRenderer.ipcSendSync(
        'getInvestmentRecordAll',
      );
      setData(records);
    } catch (error) {
      Toast.error('获取数据失败');
      console.error(error);
    }
  }, []);

  const add = () => {
    if (modalRef.current) {
      modalRef.current.showModal(null);
    }
  };

  const edit = (value) => {
    if (modalRef.current) {
      modalRef.current.showModal(value);
    }
  };

  const handleDelete = async (id) => {
    try {
      window.electron.ipcRenderer.ipcSendSync('deleteInvestmentRecord', {
        id,
      });
      await getData();
      Toast.success('删除成功');
    } catch (error) {
      Toast.error('删除失败');
      console.error(error);
    }
  };

  const columns = [
    {
      title: '产品名',
      dataIndex: 'product_name',
      width: 200,
    },
    {
      title: '本金',
      dataIndex: 'principal',
      align: 'right',
      width: 150,
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
    {
      title: '收益',
      dataIndex: 'earnings',
      align: 'right',
      width: 150,
      render: (text) => `${Number(text).toLocaleString('zh-CN')} 元`,
    },
    {
      title: '天数',
      dataIndex: 'days',
      align: 'right',
      width: 100,
    },
    {
      title: '记录日期',
      dataIndex: 'record_date',
      width: 150,
      render: (value) => dateFns.format(new Date(value), 'yyyy-MM-dd'),
    },
    {
      title: '年化收益',
      dataIndex: 'annualized_return',
      align: 'right',
      width: 150,
      render: (text, record) => {
        const { principal, earnings, days } = record;
        if (principal > 0 && days > 0) {
          const annualizedReturn = (
            (earnings / principal) *
            (365 / days) *
            100
          ).toFixed(2);
          return `${annualizedReturn}%`;
        }
        return 'N/A';
      },
    },
    {
      title: '',
      dataIndex: 'operate',
      render: (text, record) => {
        return (
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
        );
      },
    },
  ];

  useEffect(() => {
    getData();
  }, []);

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
        routes={['理财收益记录']}
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
        <Row type="flex" justify="end">
          <Col>
            <Button
              icon={<IconPlus />}
              theme="solid"
              style={{ marginRight: 10 }}
              onClick={add}
            >
              新增
            </Button>
          </Col>
        </Row>
        <Table columns={columns} dataSource={dataSource} />
        <InvestmentRecordModal ref={modalRef} reloadData={getData} />
      </div>
    </div>
  );
}

export default InvestmentRecord;
