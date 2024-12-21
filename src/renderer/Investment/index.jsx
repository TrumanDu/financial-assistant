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
import { IconEdit, IconDelete, IconPlus } from '@douyinfe/semi-icons';
import InvestmentModal from './InvestmentModal';

function Investment() {
  const [dataSource, setData] = useState([]);
  const modalRef = useRef();

  const getData = useCallback(async () => {
    try {
      const records =
        window.electron.ipcRenderer.ipcSendSync('getInvestmentAll');
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
      window.electron.ipcRenderer.ipcSendSync('deleteInvestment', {
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
      title: '银行',
      dataIndex: 'bank',
      width: 200,
      sorter: (a, b) => a.bank.localeCompare(b.bank, 'zh-CN'),
    },
    {
      title: '产品名称',
      dataIndex: 'name',
      width: 400,
      sorter: (a, b) => a.name.localeCompare(b.name, 'zh-CN'),
    },
    {
      title: '账户',
      dataIndex: 'owner',
      width: 200,
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
        routes={['理财产品目录']}
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
        <InvestmentModal ref={modalRef} reloadData={getData} />
      </div>
    </div>
  );
}

export default Investment;
