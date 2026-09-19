/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Modal,
  SideSheet,
  Form,
  Select,
  DatePicker,
  Breadcrumb,
  Row,
  Col,
  Typography,
  Toast,
  Popconfirm,
  Tag,
} from '@douyinfe/semi-ui';
import {
  IconPlusCircle,
  IconDelete,
  IconEdit,
} from '@douyinfe/semi-icons';
import dayjs from 'dayjs';

const { Text } = Typography;

// ---------- 主页面 ----------
function RecordAssets() {
  const [records, setRecords] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchLatestRecords = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      let result = window.electron.ipcRenderer.ipcSendSync(
        'getAssetsRecordByMonth',
        { year, month },
      );
      if (!result || result.length === 0) {
        // 当前月无数据，取最近有数据月份
        const inherited = window.electron.ipcRenderer.ipcSendSync(
          'getAssetsRecordLatestMonth',
          { year, month },
        );
        result = inherited && inherited.length > 0 ? inherited : [];
      }
      setRecords(result || []);
    } catch (error) {
      Toast.error('获取数据失败');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchLatestRecords();
  }, []);

  const totalAmount = records.reduce((sum, r) => sum + (r.amount || 0), 0);

  const columns = [
    { title: '类型', dataIndex: 'type', width: 150 },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 150,
      align: 'right',
      render: (text) => `¥${Number(text).toLocaleString('zh-CN')}`,
    },
    { title: '币种', dataIndex: 'currency', width: 100 },
    { title: '备注', dataIndex: 'memo' },
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
      <Breadcrumb style={{ marginBottom: '24px' }} routes={['财产记录']} />
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
            <Text strong style={{ fontSize: 18 }}>
              {`最新月份合计: ¥${totalAmount.toLocaleString('zh-CN')}`}
            </Text>
          </Col>
          <Col>
            <Button
              icon={<IconPlusCircle />}
              onClick={() => setModalVisible(true)}
              theme="solid"
            >
              更新资产
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={records}
          rowKey={(r) => r.id || r.type}
          pagination={false}
        />

        <AssetsEditModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            fetchLatestRecords();
          }}
        />
      </div>
    </div>
  );
}

// ---------- 编辑弹窗 ----------
function AssetsEditModal({ visible, onClose }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [inheritedFrom, setInheritedFrom] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState({
    visible: false,
    editingIndex: null,
  });

  const loadMonth = async (date) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      let result = window.electron.ipcRenderer.ipcSendSync(
        'getAssetsRecordByMonth',
        { year, month },
      );
      if (result && result.length > 0) {
        setRecords(result);
        setInheritedFrom(null);
      } else {
        const inherited = window.electron.ipcRenderer.ipcSendSync(
          'getAssetsRecordLatestMonth',
          { year, month },
        );
        if (inherited && inherited.length > 0) {
          const sourceMonth = dayjs(inherited[0].date).format('YYYY年M月');
          setRecords(
            inherited.map((r) => ({
              type: r.type,
              amount: r.amount,
              currency: r.currency,
              memo: r.memo || '',
            })),
          );
          setInheritedFrom(sourceMonth);
        } else {
          setRecords([]);
          setInheritedFrom(null);
        }
      }
      setDirty(false);
    } catch (error) {
      Toast.error('获取数据失败');
      console.error(error);
    }
  };

  useEffect(() => {
    if (visible) {
      setSelectedDate(new Date());
      loadMonth(new Date());
    }
  }, [visible]);

  const handleMonthChange = (date) => {
    if (!date) return;
    setSelectedDate(date);
    loadMonth(date);
  };

  // 本地新增
  const handleLocalAdd = () => {
    setEditModal({ visible: true, editingIndex: null });
  };

  // 本地编辑
  const handleLocalEdit = (index) => {
    setEditModal({ visible: true, editingIndex: index });
  };

  // 本地删除
  const handleLocalDelete = (index) => {
    setRecords((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  // 子弹窗确认
  const handleEditConfirm = (values) => {
    const { editingIndex } = editModal;
    const newRecord = {
      type: values.type,
      amount: Number(values.amount),
      currency: values.currency,
      memo: values.memo || '',
    };
    setRecords((prev) => {
      const updated = [...prev];
      if (editingIndex !== null) {
        updated[editingIndex] = newRecord;
      } else {
        updated.push(newRecord);
      }
      return updated;
    });
    setDirty(true);
    setEditModal({ visible: false, editingIndex: null });
  };

  // 批量保存
  const handleSave = async () => {
    if (records.length === 0) {
      Toast.warning('请至少添加一条资产记录');
      return;
    }
    setSaving(true);
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const result = window.electron.ipcRenderer.ipcSendSync(
        'saveAssetsForMonth',
        { records, year, month },
      );
      if (result?.success) {
        Toast.success(`已保存 ${result.count} 条记录`);
        setDirty(false);
        onClose();
      }
    } catch (error) {
      Toast.error('保存失败');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = records.reduce((sum, r) => sum + (r.amount || 0), 0);

  const modalColumns = [
    { title: '类型', dataIndex: 'type', width: 130 },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 130,
      align: 'right',
      render: (text) => `¥${Number(text).toLocaleString('zh-CN')}`,
    },
    { title: '币种', dataIndex: 'currency', width: 90 },
    { title: '备注', dataIndex: 'memo' },
    {
      title: '操作',
      width: 100,
      render: (_, __, index) => (
        <>
          <Button
            theme="borderless"
            icon={<IconEdit />}
            onClick={() => handleLocalEdit(index)}
            style={{ marginRight: 4 }}
          />
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleLocalDelete(index)}
          >
            <Button theme="borderless" icon={<IconDelete />} type="danger" />
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <SideSheet
      title="更新资产"
      visible={visible}
      onCancel={onClose}
      width={700}
      footer={
        <Row type="flex" justify="space-between" align="middle">
          <Col>
            <Text strong>{`合计: ¥${totalAmount.toLocaleString('zh-CN')}`}</Text>
          </Col>
          <Col>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button
              theme="solid"
              onClick={handleSave}
              loading={saving}
              disabled={!dirty}
            >
              保存
            </Button>
          </Col>
        </Row>
      }
    >
      {/* 月份选择器 */}
      <div style={{ marginBottom: 12 }}>
        <DatePicker
          type="month"
          value={selectedDate}
          onChange={handleMonthChange}
          style={{ width: 160 }}
        />
      </div>

      {/* 继承提示 */}
      {inheritedFrom && (
        <Tag color="orange" style={{ marginBottom: 12, padding: '4px 12px' }}>
          {`已从${inheritedFrom}继承数据，修改后点保存生效`}
        </Tag>
      )}

      {/* 明细列表 - 内容区自动滚动 */}
      <Table
        columns={modalColumns}
        dataSource={records}
        rowKey={(_, index) => `row-${index}`}
        pagination={false}
        size="small"
      />

      <Button
        icon={<IconPlusCircle />}
        onClick={handleLocalAdd}
        theme="borderless"
        style={{ marginTop: 12 }}
      >
        新增资产
      </Button>

      {/* 新增/编辑子弹窗 */}
      <RecordEditModal
        visible={editModal.visible}
        record={
          editModal.editingIndex !== null
            ? records[editModal.editingIndex]
            : null
        }
        onConfirm={handleEditConfirm}
        onCancel={() => setEditModal({ visible: false, editingIndex: null })}
      />
    </SideSheet>
  );
}

// ---------- 新增/编辑子弹窗 ----------
function RecordEditModal({ visible, record, onConfirm, onCancel }) {
  const formApi = useRef(null);

  useEffect(() => {
    if (visible && formApi.current) {
      if (record) {
        formApi.current.setValues({
          type: record.type,
          amount: record.amount,
          currency: record.currency,
          memo: record.memo || '',
        });
      } else {
        formApi.current.reset();
        formApi.current.setValue('currency', '人民币');
      }
    }
  }, [visible, record]);

  const handleOk = async () => {
    try {
      const values = await formApi.current?.validate();
      onConfirm(values);
    } catch (error) {
      // 表单校验失败，不处理
    }
  };

  return (
    <Modal
      title={record ? '编辑资产' : '新增资产'}
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
      centered
      width={420}
    >
      <Form
        key={record ? 'edit' : 'add'}
        getFormApi={(api) => {
          formApi.current = api;
        }}
        style={{ padding: '16px 0' }}
        initValues={
          record
            ? {
                type: record.type,
                amount: Number(record.amount),
                currency: record.currency,
                memo: record.memo || '',
              }
            : { currency: '人民币' }
        }
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
        <Form.Select
          field="currency"
          label="币种"
          rules={[{ required: true, message: '请选择币种' }]}
        >
          <Select.Option value="人民币">人民币</Select.Option>
          <Select.Option value="美元">美元</Select.Option>
          <Select.Option value="港币">港币</Select.Option>
        </Form.Select>
        <Form.TextArea field="memo" label="备注" />
      </Form>
    </Modal>
  );
}

export default RecordAssets;