import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useEffect,
} from 'react';
import { Modal, Form, Toast, Button } from '@douyinfe/semi-ui';
import PropTypes from 'prop-types';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';

const getLastMonth = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date;
};

const BatchBillRecordModal = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([
    { account: '老公', amount: '', month: getLastMonth() },
    { account: '妻子', amount: '', month: getLastMonth() },
  ]);
  const { reloadData } = props;
  const api = useRef();

  useEffect(() => {
    if (visible && api.current) {
      api.current.setValues({ records });
    }
  }, [records, visible]);

  useImperativeHandle(ref, () => ({
    showModal: () => {
      const initialRecords = [
        { account: '老公', amount: '', month: getLastMonth() },
        { account: '妻子', amount: '', month: getLastMonth() },
      ];
      setRecords(initialRecords);
      setVisible(true);
    },
  }));

  const handleAddRecord = () => {
    const newRecord = { account: '', amount: '', month: getLastMonth() };
    setRecords((prevRecords) => [...prevRecords, newRecord]);
    if (api.current) {
      const currentValues = api.current.getValues();
      api.current.setValues({
        records: [...currentValues.records, newRecord],
      });
    }
  };

  const handleRemoveRecord = (index) => {
    setRecords((prevRecords) => {
      const newRecords = [...prevRecords];
      newRecords.splice(index, 1);
      if (api.current) {
        const currentValues = api.current.getValues();
        currentValues.records.splice(index, 1);
        api.current.setValues(currentValues);
      }
      return newRecords;
    });
  };

  const handleOk = async () => {
    setLoading(true);
    try {
      const values = await api.current.validate();
      const recordsToSave = values.records;

      // 检查是否有重复账户
      const accounts = recordsToSave.map((record) => record.account);
      const uniqueAccounts = new Set(accounts);
      if (accounts.length !== uniqueAccounts.size) {
        Toast.error('每个账户只能添加一条记录');
        setLoading(false);
        return;
      }

      // 保存所有记录
      const savePromises = recordsToSave.map((record) =>
        window.electron.ipcRenderer.ipcSendSync('addBillRecord', { record }),
      );

      const results = await Promise.all(savePromises);
      const hasError = results.some((result) => result.error);

      if (hasError) {
        Toast.error('部分记录保存失败');
        setLoading(false);
        return;
      }

      Toast.success('保存成功');
      setVisible(false);
      reloadData();
    } catch (error) {
      Toast.error('保存失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const renderRecordForm = (record, index) => (
    <div
      key={`record-${index}`}
      style={{ marginBottom: 24, position: 'relative' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <h4>记录 {index + 1}</h4>
        {records.length > 1 && (
          <Button
            icon={<IconDelete />}
            type="danger"
            onClick={() => handleRemoveRecord(index)}
          />
        )}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Select
          field={`records[${index}].account`}
          label="账户"
          placeholder="请选择账户"
          style={{ width: '200px' }}
          rules={[{ required: true, message: '请选择账户' }]}
        >
          <Form.Select.Option value="老公">老公</Form.Select.Option>
          <Form.Select.Option value="妻子">妻子</Form.Select.Option>
          <Form.Select.Option value="孩子">孩子</Form.Select.Option>
          <Form.Select.Option value="成员1">成员1</Form.Select.Option>
          <Form.Select.Option value="成员2">成员2</Form.Select.Option>
          <Form.Select.Option value="成员3">成员3</Form.Select.Option>
        </Form.Select>
        <Form.InputNumber
          field={`records[${index}].amount`}
          label="金额"
          placeholder="请输入金额"
          style={{ width: '200px' }}
          rules={[{ required: true, message: '请输入金额' }]}
        />
        <Form.DatePicker
          field={`records[${index}].month`}
          label="月份"
          type="month"
          style={{ width: '200px' }}
          rules={[{ required: true, message: '请选择月份' }]}
        />
      </div>
    </div>
  );

  return (
    <Modal
      title="批量新增账单"
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      centered
      width={800}
    >
      <Form
        initValues={{ records }}
        getFormApi={(formApi) => {
          api.current = formApi;
        }}
      >
        {records.map((record, index) => renderRecordForm(record, index))}
        <Button
          icon={<IconPlus />}
          onClick={handleAddRecord}
          style={{ marginTop: 16 }}
        >
          添加记录
        </Button>
      </Form>
    </Modal>
  );
});

BatchBillRecordModal.propTypes = {
  reloadData: PropTypes.func.isRequired,
};

export default BatchBillRecordModal;
