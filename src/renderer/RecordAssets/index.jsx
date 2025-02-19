import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Breadcrumb,
  Row,
  Col,
  Typography,
  Toast,
  Popconfirm,
} from '@douyinfe/semi-ui';
import { IconPlusCircle, IconDelete, IconEdit } from '@douyinfe/semi-icons';
import dayjs from 'dayjs';

const { Text } = Typography;

function RecordAssets() {
  const [records, setRecords] = useState([]);
  const [visible, setVisible] = useState(false);
  const formApi = useRef(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchRecords = async () => {
    try {
      const result =
        window.electron.ipcRenderer.ipcSendSync('getAssetsRecordAll');
      setRecords(result);
    } catch (error) {
      Toast.error('获取数据失败');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleAdd = () => {
    setEditingRecord(null);
    formApi.current?.reset();
    formApi.current?.setValue('date', new Date());
    setVisible(true);
  };

  const handleEdit = (record) => {
    console.log(record);
    setEditingRecord(record);
    setVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      window.electron.ipcRenderer.ipcSendSync('deleteAssetsRecord', { id });
      Toast.success('删除成功');
      fetchRecords();
    } catch (error) {
      Toast.error('删除失败');
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await formApi.current?.validate();
      const record = {
        ...values,
        date: values.date.valueOf(),
        amount: Number(values.amount),
      };

      let operator = 'addAssetsRecord';
      if (editingRecord) {
        operator = 'editAssetsRecord';
        record.id = editingRecord.id;
        record.created_at = editingRecord.created_at;
      }

      const result = window.electron.ipcRenderer.ipcSendSync(operator, {
        record,
      });

      if (!result) {
        throw new Error('操作失败');
      }

      Toast.success(editingRecord ? '更新成功' : '添加成功');
      setVisible(false);
      fetchRecords();
    } catch (error) {
      Toast.error('操作失败');
      console.error(error);
    }
  };

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (text) => text.toLocaleString(),
      sorter: (a, b) => a.amount - b.amount,
      defaultSortOrder: 'descend',
    },
    {
      title: '币种',
      dataIndex: 'currency',
    },
    {
      title: '日期',
      dataIndex: 'date',
      render: (text) => dayjs(text).format('YYYY-MM-DD'),
    },
    {
      title: '备注',
      dataIndex: 'memo',
    },
    {
      title: '操作',
      dataIndex: 'operate',
      render: (_, record) => (
        <div>
          <Button
            theme="borderless"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
            style={{ marginRight: 8 }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            content="此操作不可恢复"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button theme="borderless" icon={<IconDelete />} type="danger">
              删除
            </Button>
          </Popconfirm>
        </div>
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
        routes={['财产记录']}
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
              icon={<IconPlusCircle />}
              onClick={handleAdd}
              theme="solid"
              style={{ marginRight: 10 }}
            >
              新增
            </Button>
          </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          pagination={false}
        />
        <Modal
          title={editingRecord ? '编辑资产' : '新增资产'}
          visible={visible}
          onOk={handleSubmit}
          onCancel={() => setVisible(false)}
          centered
        >
          <Form
            getFormApi={(api) => {
              formApi.current = api;
            }}
            style={{ padding: '16px 0' }}
            initValues={{
              ...editingRecord,
              date: editingRecord ? new Date(editingRecord.date) : new Date(),
              amount: editingRecord ? Number(editingRecord.amount) : undefined,
            }}
          >
            <Form.Input
              field="type"
              label="类型"
              rules={[{ required: true, message: '请输入类型' }]}
            />
            <Form.Input
              field="amount"
              label="金额"
              type="number"
              rules={[{ required: true, message: '请输入金额' }]}
            />
            <Row gutter={16}>
              <Col span={12}>
                <Form.Select
                  field="currency"
                  label="币种"
                  initValue="人民币"
                  rules={[{ required: true, message: '请选择币种' }]}
                >
                  <Select.Option value="人民币">人民币</Select.Option>
                  <Select.Option value="美元">美元</Select.Option>
                  <Select.Option value="港币">港币</Select.Option>
                </Form.Select>
              </Col>
              <Col span={12}>
                <Form.DatePicker
                  field="date"
                  label="日期"
                  rules={[{ required: true, message: '请选择日期' }]}
                />
              </Col>
            </Row>
            <Form.TextArea field="memo" label="备注" />
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default RecordAssets;
